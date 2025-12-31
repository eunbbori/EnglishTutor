# Project Context: AI English Tutor

이 문서는 AI English Tutor 프로젝트의 기술적 경계, 아키텍처, 데이터베이스 스키마, API 계약을 정의합니다. 모든 작업을 시작하기 전에 이 파일을 읽어주세요.

---

## 1. Tech Stack & Versions

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript (Strict mode)
- **AI SDK**: Vercel AI SDK 5.0+ (Core)
  - `ai`
  - `@ai-sdk/google` (Google Gemini Provider)
- **Database**:
  - Neon (Serverless Postgres)
  - Drizzle ORM (`drizzle-orm`, `drizzle-kit`)
- **UI/Styling**:
  - Shadcn UI (Radix UI based)
  - Tailwind CSS
  - Lucide React
- **Validation**: Zod (Schema validation)
- **Package Manager**: npm

---

## 2. System Architecture

### Overview

```
[User Input]
    ↓
[Next.js Client Component (useChat)]
    ↓
[API Route Handler (/api/chat)]
    ↓
[AI SDK streamObject + Zod Schema]
    ↓
[Google Gemini (gemini-1.5-flash)]
    ↓
[Structured JSON Response]
    ↓
[Drizzle ORM → Neon Postgres]
    ↓
[UI Rendering (CorrectionCard)]
```

### Key Components

1. **Frontend**: Next.js 15 Client Components (App Router)
2. **Backend**: Next.js Route Handlers (`/api/chat`)
3. **AI Layer**: Vercel AI SDK Core + Google Gemini
   - **핵심**: `streamObject`를 사용하여 구조화된 JSON 응답 강제
   - 응답 구조: Correction, Explanation, Alternatives
4. **Database**: Neon (Serverless Postgres) via Drizzle ORM
5. **Styling**: Tailwind CSS + Shadcn UI

---

## 3. Database Schema (Drizzle ORM)

### Location

`db/schema.ts`

### Schema Definition

```typescript
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

// 1. Chat Sessions
export const chats = pgTable("chats", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(), // MVP: simple string ID (or generic 'user')
  title: text("title").notNull(), // Conversation summary
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// 2. Chat Messages
export const messages = pgTable("messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  chatId: uuid("chat_id")
    .references(() => chats.id, { onDelete: "cascade" })
    .notNull(),
  role: text("role", { enum: ["user", "assistant"] }).notNull(),
  content: text("content").notNull(), // User: raw text | Assistant: JSON string
  createdAt: timestamp("created_at").defaultNow().notNull()
});
```

### Key Points

- **Chat Sessions**: 각 대화 세션을 추적 (title은 대화 요약)
- **Messages**:
  - User messages: `content`에 일반 텍스트 저장
  - Assistant messages: `content`에 JSON string 저장 (구조화된 응답)
- **Cascade Delete**: Chat 삭제 시 관련 messages 자동 삭제

### Migration Commands

```bash
# Generate migration
npx drizzle-kit generate

# Run migration
npx drizzle-kit migrate

# Push to database (dev)
npx drizzle-kit push
```

---

## 4. AI Implementation Strategy (Structured Output)

### The Challenge

표준 LLM 응답은 비구조화된 텍스트입니다. Tutor UI를 위해서는 구분된 필드가 필요합니다:

1. **Corrected Text**: 교정된 문장 (강조 표시)
2. **Explanation**: 문법/문화적 설명 (한국어, 다른 색상/크기)
3. **Alternatives**: 대체 표현 리스트 (격식/캐주얼/관용적)

### The Solution: `streamObject`

#### Zod Schema Definition

**Location**: `lib/ai/schema.ts`

```typescript
import { z } from "zod";

export const correctionSchema = z.object({
  originalText: z.string().describe("The user's original input"),
  correctedText: z.string().describe("The natural, native-like English correction"),
  koreanExplanation: z.string().describe("Grammatical or cultural explanation in Korean"),
  alternatives: z
    .array(z.string())
    .describe("3 alternative expressions (Formal, Casual, Idiomatic)")
});

export type CorrectionResponse = z.infer<typeof correctionSchema>;
```

#### API Handler Implementation

**Location**: `app/api/chat/route.ts`

```typescript
import { google } from "@ai-sdk/google";
import { streamObject } from "ai";
import { correctionSchema } from "@/lib/ai/schema";

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = await streamObject({
    model: google("gemini-1.5-flash"),
    schema: correctionSchema,
    messages,
    system: `You are an expert English tutor for Korean speakers. 
    Analyze the user's English input and provide:
    1. A natural, native-like correction
    2. A detailed explanation in Korean
    3. Three alternative expressions (Formal, Casual, Idiomatic)`
  });

  return result.toTextStreamResponse();
}
```

#### Key Benefits

- **Type Safety**: Zod schema ensures response structure
- **Streaming**: Partial JSON updates as they arrive
- **Validation**: Automatic validation of AI output

---

## 5. File Structure Convention

```text
/ (Root)
├── .dev.log                  # [CRITICAL] Error & console logs
├── claude.md                 # Project rules & context
├── .env.local                # Environment variables
├── drizzle.config.ts         # Drizzle Kit configuration
├── next.config.mjs           # Next.js configuration
├── db/
│   ├── index.ts              # Neon + Drizzle connection setup
│   └── schema.ts             # Database table definitions
├── lib/
│   ├── utils.ts              # Shared utilities (clsx, tw-merge)
│   └── ai/
│       └── schema.ts         # Zod schemas for AI responses
├── components/
│   ├── ui/                   # Shadcn UI primitives
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── badge.tsx
│   │   └── input.tsx
│   └── chat/                 # Chat-specific components
│       ├── chat-list.tsx     # Message list container
│       ├── message-bubble.tsx # Individual message renderer
│       ├── correction-card.tsx # Structured correction display
│       └── chat-input.tsx    # User input component
└── app/
    ├── layout.tsx            # Root layout
    ├── page.tsx              # Main chat interface
    └── api/
        └── chat/
            └── route.ts      # AI SDK handler (streamObject)
```

### Key Placement Rules

1. **AI Logic**: `app/api/chat/route.ts`에 API handler 집중
2. **AI Schemas**: `lib/ai/schema.ts`에 Zod schemas 관리
3. **Database**: 모든 DB 로직은 `db/` 디렉토리
4. **UI Components**:
   - Generic UI (Shadcn): `components/ui/`
   - Feature UI (Chat): `components/chat/`

---

## 6. Component Architecture

### Component Hierarchy

```
app/page.tsx (Main Chat Interface)
  └── ChatList
      └── MessageBubble
          ├── [User Message] → Simple blue bubble
          └── [Assistant Message] → CorrectionCard
              ├── Header: correctedText (bold/large)
              ├── Body: koreanExplanation
              └── Footer: alternatives (badges)
```

### Component Responsibilities

#### 1. `components/chat/chat-list.tsx`

- Messages 배열 순회
- 각 메시지를 `MessageBubble`에 전달

```typescript
interface ChatListProps {
  messages: Message[];
}

export function ChatList({ messages }: ChatListProps) {
  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
    </div>
  );
}
```

#### 2. `components/chat/message-bubble.tsx`

- `role`에 따라 렌더링 분기
- User: 간단한 텍스트 bubble
- Assistant: JSON parsing → `CorrectionCard`

```typescript
interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  if (message.role === "user") {
    return <UserMessage content={message.content} />;
  }

  // Parse JSON for assistant messages
  const correction = JSON.parse(message.content) as CorrectionResponse;
  return <CorrectionCard correction={correction} />;
}
```

#### 3. `components/chat/correction-card.tsx`

- Shadcn Card 사용
- 구조화된 correction 데이터 표시

```typescript
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { CorrectionResponse } from "@/lib/ai/schema";

interface CorrectionCardProps {
  correction: CorrectionResponse;
}

export function CorrectionCard({ correction }: CorrectionCardProps) {
  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-bold text-green-600">{correction.correctedText}</h3>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{correction.koreanExplanation}</p>
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2">
        {correction.alternatives.map((alt, idx) => (
          <Badge key={idx} variant="secondary">
            {alt}
          </Badge>
        ))}
      </CardFooter>
    </Card>
  );
}
```

---

## 7. Environment Variables

### `.env.local`

```bash
# Google Gemini API
GOOGLE_GENERATIVE_AI_API_KEY=AIzaSy...

# Neon Database (Drizzle)
DATABASE_URL=postgresql://neondb_owner:...@...neon.tech/neondb?sslmode=require
```

### `.env.example` (Template)

```bash
# Google Gemini API
GOOGLE_GENERATIVE_AI_API_KEY=your_api_key_here

# Neon Database
DATABASE_URL=your_database_url_here
```

### Security Rules

- `.env.local`은 절대 git에 커밋하지 않음
- `.env.example`은 템플릿으로 제공
- Production 환경에서는 Vercel Environment Variables 사용

---

## 8. Operational Rules (CRITICAL)

### A. Error Logging & Debugging Strategy

1. **실행 방법**:

   ```bash
   npm run dev > .dev.log 2>&1
   ```

2. **디버깅 워크플로우**:
   - 에러 발생 시 **먼저 `.dev.log` 읽기**
   - Stack trace 분석 후 수정안 제시
   - 에러를 물어보지 말고 파일에서 직접 확인

### B. Port Management

```bash
# Port 3000 kill script
"dev:clean": "npx kill-port 3000 && npm run dev"
```

### C. Database Migration Workflow

```bash
# 1. Schema 변경 후
npx drizzle-kit generate

# 2. Migration 실행
npx drizzle-kit migrate

# 3. Dev 환경에서 빠른 적용
npx drizzle-kit push
```

---

## 9. Development Checklist

### Phase 1: Setup

- [ ] Next.js 프로젝트 초기화
- [ ] Neon DB 연결 및 Drizzle 설정
- [ ] Environment variables 설정
- [ ] Shadcn UI 설치 및 기본 컴포넌트 추가

### Phase 2: Database

- [ ] `db/schema.ts` 작성 (chats, messages)
- [ ] Migration 생성 및 실행
- [ ] DB connection test

### Phase 3: AI Integration

- [ ] `lib/ai/schema.ts`에 Zod schema 정의
- [ ] `app/api/chat/route.ts`에 `streamObject` 구현
- [ ] System prompt 최적화

### Phase 4: UI Components

- [ ] `CorrectionCard` 컴포넌트 생성 (Shadcn Card)
- [ ] `MessageBubble` 컴포넌트 생성 (role 분기 처리)
- [ ] `ChatList` 컴포넌트 생성
- [ ] `ChatInput` 컴포넌트 생성

### Phase 5: Integration

- [ ] `useChat` hook 연결 (또는 custom logic for object parsing)
- [ ] JSON parsing 및 error handling
- [ ] Streaming UI updates 구현

### Phase 6: Testing

- [ ] User input → AI response 플로우 테스트
- [ ] Database persistence 테스트
- [ ] Edge cases 처리 (empty input, API errors)

---

## 10. Coding Standards

### TypeScript Rules

- **No `any`**: `unknown` 또는 Zod schemas 사용
- **Explicit Types**: 모든 함수 파라미터와 반환 타입 명시
- **Type Inference**: Zod의 `z.infer<>` 적극 활용

### Component Patterns

- **Server Components First**: 기본적으로 Server Component 사용
- **Client Components**: 상태 관리 필요 시에만 `'use client'`
- **Props Interface**: 모든 컴포넌트에 명시적 Props interface 정의

### Error Handling

```typescript
// API Route
try {
  const result = await streamObject({ ... });
  return result.toTextStreamResponse();
} catch (error) {
  console.error('[API Error]', error);
  return new Response('Internal Server Error', { status: 500 });
}

// Component
try {
  const correction = JSON.parse(message.content);
  return <CorrectionCard correction={correction} />;
} catch {
  return <ErrorMessage>Invalid response format</ErrorMessage>;
}
```

---

## 11. AI Prompt Engineering

### System Prompt Template

```typescript
const SYSTEM_PROMPT = `You are an expert English tutor for Korean speakers.

Your role:
1. Analyze the user's English input for grammatical errors, awkward phrasing, and unnatural expressions
2. Provide a natural, native-like correction
3. Explain the corrections in Korean, focusing on:
   - Grammar rules
   - Cultural nuances
   - Common mistakes Korean speakers make
4. Offer three alternative expressions:
   - Formal: For business or academic contexts
   - Casual: For everyday conversation
   - Idiomatic: Using native English idioms

Be encouraging and constructive. Focus on helping the user improve naturally.`;
```

### Response Quality Guidelines

- **Corrected Text**: 자연스럽고 원어민다운 표현
- **Korean Explanation**: 명확하고 이해하기 쉬운 한국어 설명
- **Alternatives**: 실제 사용 가능한 현실적인 대안 제시

---

## 12. Development Memory

### Known Issues & Solutions

#### Issue 1: JSON Parsing Errors

- **문제**: Assistant message의 `content`가 valid JSON이 아닐 수 있음
- **해결**: Try-catch로 parsing error 처리 + fallback UI
- **예방**: `streamObject`의 schema validation 엄격히 적용

#### Issue 2: Streaming UI Updates

- **문제**: Partial object stream 처리 복잡
- **해결**: AI SDK의 `useObject` hook 사용 고려
- **대안**: `onFinish` callback에서 complete object 처리

#### Issue 3: Database Connection Pooling

- **문제**: Serverless 환경에서 connection limit 도달
- **해결**: Neon의 connection pooling 사용 (`?sslmode=require`)
- **예방**: Drizzle connection을 singleton pattern으로 관리

---

## 13. Communication Protocol

### Language

- 설명: 한국어
- 기술 용어: 영어 유지
- 예시: "`streamObject`를 사용해서 structured JSON response를 받습니다."

### Response Format

- Solution-First: 코드 먼저, 설명 나중
- Conciseness: 기본 설명 생략, *why*와 _how_ 집중
- Trade-offs: 성능/가독성 트레이드오프 언급

### Code Review Focus

- Type safety 확인
- Error handling 완비
- Component 책임 분리
- Schema validation 적용

---

**Last Updated**: 2025-12-16  
**Maintainer**: 은뽀리  
**Version**: v1.0.0
