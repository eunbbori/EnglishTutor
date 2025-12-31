# Project Context: Next.js AI Chatbot (Gemini + Neon)

이 문서는 프로젝트의 기술적 경계, 코딩 표준, 운영 규칙을 정의합니다. 모든 작업을 시작하기 전에 이 파일을 읽어주세요.

## 1. Tech Stack & Versions
최신 안정 버전을 사용합니다. 아래 라이브러리를 엄격히 준수하세요.

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
- **Package Manager**: npm

## 2. Operational Rules (CRITICAL)

### A. Error Logging & Debugging Strategy (.dev.log)
**목표**: 모든 백그라운드 에러와 런타임 예외를 분석을 위해 캡처해야 합니다.

1. **실행 방법**: dev server 실행 시, **반드시** stderr/stdout을 `.dev.log`로 파이프하는 명령어를 사용하세요.
   - 권장: `npm run dev > .dev.log 2>&1` (콘솔에서도 보려면 `tee` 사용)

2. **디버깅 워크플로우**:
   - 에러가 발생하거나 버그 수정 요청 시, **먼저 `.dev.log`를 읽으세요**.
   - 로그 파일의 stack trace를 분석한 후 수정안을 제시하세요.
   - 에러가 무엇인지 물어보지 말고, 파일에서 직접 확인하세요.

### B. Port Management (Port Kill)
**목표**: `EADDRINUSE: address already in use :::3000` 에러를 방지합니다.

1. **사전 체크**: 서버 시작 전, port 3000이 사용 중인지 확인하세요.
2. **조치**: port 3000을 점유한 프로세스를 자동으로 종료하세요.
   - 명령어 참고: `lsof -ti:3000 | xargs kill -9` (Windows는 해당 환경에 맞게)
   - `package.json` 스크립트 생성 권장: `"dev:clean": "npx kill-port 3000 && next dev"`

## 3. Architecture & Patterns

### AI SDK Implementation (Gemini)
- **Route Handler**: `app/api/chat/route.ts` 사용
- **Core Functions**: `ai`에서 `streamText` 또는 `generateText` 사용
- **Provider**:
  ```typescript
  import { google } from '@ai-sdk/google';
  // 사용법: model: google('gemini-1.5-flash')
  ```
- **Client**: UI에서 `ai/react`의 `useChat` hook 사용

### Database (Drizzle + Neon)
- **Connection**: `neon-http` 또는 `neon-serverless` driver 사용
- **Environment**: `.env.local`에 `DATABASE_URL` 설정 필수
- **Migration**: 스키마 변경 후 항상 `drizzle-kit generate`와 `drizzle-kit migrate` 실행

### UI Components (Shadcn)
- **컴포넌트 추가**: `npx shadcn@latest add [component-name]` 사용
- **스타일링**: Tailwind CSS classes 사용. inline styles 지양
- **아이콘**: `lucide-react` 사용

## 4. File Structure Convention
일관성 유지를 위해 이 디렉토리 구조를 엄격히 따르세요.
**`pages/` 디렉토리를 생성하지 마세요.** Next.js App Router 구조를 사용합니다.

```text
/ (Root)
├── .dev.log                  # [CRITICAL] 백그라운드 프로세스 에러 & 콘솔 로그 저장
├── claude.md                 # 프로젝트 규칙 & 컨텍스트
├── .env.local                # 환경 변수 (GOOGLE_GENERATIVE_AI_API_KEY, DATABASE_URL)
├── drizzle.config.ts         # Drizzle Kit 설정
├── next.config.mjs           # Next.js 설정
├── db/
│   ├── index.ts              # Neon + Drizzle connection setup
│   └── schema.ts             # Database table definitions
├── lib/
│   └── utils.ts              # 공유 유틸리티 (clsx, tw-merge)
├── components/
│   ├── ui/                   # Shadcn UI primitives (e.g., button.tsx, input.tsx)
│   └── chat/                 # Chat 전용 컴포넌트 (e.g., chat-message.tsx, chat-input.tsx)
└── app/
    ├── layout.tsx            # Root layout (Fonts, Providers)
    ├── page.tsx              # Main Chat Interface (Client Component, useChat 호출)
    └── api/
        └── chat/
            └── route.ts      # [AI SDK] Google Gemini API Handler
```

### 핵심 배치 규칙:
1. **AI Logic**: API handler는 `app/api/chat/route.ts`에 유지. 필요하지 않으면 여러 파일로 분리하지 마세요.
2. **Database**: 모든 DB 스키마와 connection 로직은 `db/`에 위치.
3. **UI Components**:
   - Generic UI (Shadcn): `components/ui/`
   - Feature UI (Chat): `components/chat/`

## 5. Coding Standards

### TypeScript Rules
- **Strict Type Safety**: `any` 사용 금지. `unknown` 또는 Zod schemas 사용.
- **Modern Syntax**: ES6+ features, Async/Await 사용.
- **Naming**: 명시적이고 verbose한 변수명 선호. clever oneliner 지양.

### Code Quality Principles
- **DRY & SOLID**: 반복 제거, 단일 책임 원칙 준수.
- **Functional Programming**: Classes보다 Immutability, Pure functions 선호.
- **Error Handling**: Happy path뿐만 아니라 edge cases와 에러 처리 전략 항상 고려.

### Component Patterns
- **Server Components**: 기본적으로 Server Component 사용 (App Router).
- **Client Components**: 상태 관리나 브라우저 API 필요 시에만 `'use client'` 선언.
- **Separation**: UI 로직과 비즈니스 로직 분리.

## 6. Development Memory (Lessons Learned)
*반복되는 이슈 발생 시 이 섹션을 업데이트하세요.*

- **Hydration Errors**: 브라우저 API(`window` 등) 사용하는 UI 컴포넌트는 `useEffect`로 래핑하거나 `ssr: false`로 dynamic import.
- **Gemini Limits**: API 에러 발생 시 rate limits를 UI에서 gracefully하게 처리.
- **Environment Variables**: `.env.local`은 git에 커밋하지 않음. `.env.example` 템플릿 제공.

## 7. Communication Protocol

### Language
- **설명**: 한국어로 설명하되, 기술 용어는 영어 유지.
- **예시**: "이 함수는 `streamText`를 사용해서 Gemini API로부터 streaming response를 받습니다."

### Response Format
- **Solution-First**: 코드 블록을 먼저 제공한 후, 로직이나 주의사항 설명.
- **Conciseness**: 기본적인 설명("import하는 방법은...") 생략. *why*와 *how*에 집중.
- **Trade-offs**: 솔루션에 trade-off가 있으면(e.g., Performance vs. Readability) 간단히 언급하거나 선호도 질문.

### Interactive Mode
- Tech stack이 모호한 경우: 코드 생성 전 명확히 질문.
- 여러 접근 방법 존재 시: 옵션 제시 후 선택 요청.

---
