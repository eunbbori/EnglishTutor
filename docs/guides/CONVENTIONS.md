# 코딩 컨벤션

> **Last Updated**: 2026-02-12

---

## 1. TypeScript 설정

### Strict 모드

`tsconfig.json`에서 `"strict": true`가 활성화되어 있다. 모든 코드는 strict 타입 체크를 통과해야 한다.

- `noImplicitAny`: 암묵적 any 금지
- `strictNullChecks`: null/undefined 타입 체크
- `strictFunctionTypes`: 함수 타입 엄격 체크

### 경로 별칭

모든 import는 `@/` 별칭을 사용한다:

```typescript
// Good
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { db } from "@/db";

// Bad
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
```

**별칭 매핑**:

| 별칭 | 경로 | 용도 |
|------|------|------|
| `@/components` | `./components` | React 컴포넌트 |
| `@/components/ui` | `./components/ui` | Shadcn UI 기본 컴포넌트 |
| `@/lib` | `./lib` | 유틸리티, 비즈니스 로직 |
| `@/hooks` | `./hooks` | 커스텀 React 훅 |
| `@/db` | `./db` | Drizzle ORM 스키마/연결 |
| `@/types` | `./types` | 타입 정의 |

---

## 2. 파일/디렉토리 네이밍

### 규칙

| 대상 | 규칙 | 예시 |
|------|------|------|
| 디렉토리 | kebab-case | `diary-editor/`, `xp-service/` |
| 컴포넌트 파일 | kebab-case | `level-badge.tsx`, `mood-selector.tsx` |
| 유틸리티 파일 | kebab-case | `xp-constants.ts`, `check-usage.ts` |
| 타입 파일 | kebab-case | `next-auth.d.ts` |
| 설정 파일 | 관례 따름 | `tailwind.config.ts`, `drizzle.config.ts` |

### 컴포넌트 디렉토리 구조

기능별로 그룹핑:

```
components/
├── ui/              # Shadcn UI 기본 (button, card, dialog...)
├── auth/            # 인증 관련
├── calendar/        # 캘린더 기능
├── chat/            # 채팅 인터페이스
├── diary/           # 일기 에디터
├── gamification/    # XP/레벨 UI
├── payment/         # 결제 관련
├── usage/           # 사용량 표시
└── vocabulary/      # 표현노트
```

---

## 3. 컴포넌트 패턴

### Client vs Server 컴포넌트

- **Server Component** (기본): 데이터 fetch, 레이아웃에 사용
- **Client Component**: `"use client"` 지시문을 파일 상단에 선언

```typescript
// Client Component 예시
"use client";

import { useState } from "react";

export function DiaryEditor() {
  const [text, setText] = useState("");
  // ...
}
```

### 컴포넌트 export 패턴

- Named export 사용 (default export 지양)
- 페이지 컴포넌트만 default export

```typescript
// components - Named export
export function LevelBadge({ level, xp }: LevelBadgeProps) { ... }

// pages - Default export
export default function HistoryPage() { ... }
```

### Props 인터페이스

컴포넌트 Props는 `interface`로 정의하며, 컴포넌트 파일 내에 선언한다:

```typescript
interface CorrectionCardProps {
  originalText: string;
  correctedText: string;
  explanation: string;
}

export function CorrectionCard({ originalText, correctedText, explanation }: CorrectionCardProps) {
  // ...
}
```

### Shadcn UI 컴포넌트

- `class-variance-authority` (CVA)로 variant 관리
- `React.forwardRef` 패턴 사용
- `cn()` 유틸리티로 클래스 병합

```typescript
// cn() - clsx + tailwind-merge
import { cn } from "@/lib/utils";

<div className={cn("base-class", isActive && "active-class", className)} />
```

---

## 4. 스타일링 규칙

### Tailwind CSS 사용

- 인라인 `className`으로 스타일 적용
- 디자인 시스템 색상은 `ds-` 접두사 사용
- 반응형: `xs:` → `sm:` → `md:` → `lg:` 순서

```typescript
// 디자인 시스템 색상
<div className="bg-ds-bg-primary text-ds-text-primary" />

// 반응형 예시
<div className="p-4 sm:p-6 lg:p-8" />
```

### CSS 변수

Shadcn UI 색상은 HSL CSS 변수를 사용한다 (`app/globals.css`):

```css
:root {
  --background: 35 28% 88%;    /* 빈티지 베이지 */
  --primary: 20 29% 49%;       /* 브라운 강조 */
  --radius: 0.75rem;           /* 기본 12px */
}
```

### 커스텀 유틸리티 클래스

`globals.css`에 정의된 빈티지 스크랩북 스타일:

- `.card-diary` - 일기 카드 스타일
- `.card-elevated` - 부유 카드 스타일
- `.torn-paper` - 찢어진 종이 효과
- `.masking-tape` - 마스킹 테이프 장식
- `.notebook-lines` - 노트 줄무늬 배경
- `.vintage-bg` - 빈티지 그라데이션 배경
- `.safe-top/bottom/left/right` - iOS Safe Area 패딩

---

## 5. API 라우트 패턴

### 파일 위치

`app/api/[endpoint]/route.ts` 형태로 정의.

### 핸들러 구조

```typescript
// Vercel Function timeout
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    // 1. 인증 확인
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. 요청 파싱
    const body = await req.json();

    // 3. 비즈니스 로직
    const result = await processRequest(body);

    // 4. 응답
    return Response.json(result);
  } catch (error) {
    console.error("[API Error]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

### 응답 규칙

- JSON 응답: `Response.json()`
- HTTP 상태 코드: 200 (성공), 401 (미인증), 429 (사용 제한), 500 (서버 오류)
- 커스텀 헤더: `X-Chat-Id` 등 필요 시 사용

---

## 6. 데이터베이스 패턴

### Drizzle ORM 쿼리

```typescript
import { db } from "@/db";
import { users, chats } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";

// SELECT
const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);

// INSERT
await db.insert(chats).values({ userId, title, mood });

// UPDATE
await db.update(chats).set({ wordCount: 100 }).where(eq(chats.id, chatId));
```

### 스키마 정의 규칙

- **UUID PK**: `.defaultRandom()` 사용
- **타임스탬프**: `.defaultNow()` 사용
- **Enum**: 문자열 배열로 정의
- **JSONB**: 유연한 데이터 저장
- **인덱스**: 조회 빈도 높은 컬럼에 설정
- **FK**: CASCADE 삭제 설정

```typescript
export const chats = pgTable("chats", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  mood: text("mood", { enum: ["happy", "neutral", "sad", "excited", "tired", "anxious"] }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

---

## 7. 로깅 패턴

구조화된 로그를 `[컴포넌트]` 접두사와 함께 출력한다:

```typescript
// 성공
console.log("[Streak] ✓ Recorded diary entry for user:", userId);

// 오류
console.error("[Treasure Chest] ✗ Error opening chest:", error);

// 정보
console.log("[Profile API] GET request - Fetching user profile");
```

### 로그 레벨

| 레벨 | 메서드 | 용도 |
|------|--------|------|
| INFO | `console.log` | 정상 흐름, 상태 변화 |
| ERROR | `console.error` | 예외, 실패 |

---

## 8. 상태 관리

### 클라이언트 상태

- `useState`를 직접 사용 (별도 상태 관리 라이브러리 없음)
- 전역 상태가 필요하면 `SessionProvider` (NextAuth)를 통해 관리

```typescript
const [isLoading, setIsLoading] = useState(false);
const [correction, setCorrection] = useState<CorrectionData | null>(null);
```

### 서버 상태

- API 호출은 `fetch`를 직접 사용 (SWR/React Query 미사용)
- 데이터는 호출 시점에 가져와서 `useState`로 관리

---

## 9. 인증 패턴

### 서버 사이드

```typescript
import { auth } from "@/lib/auth";

const session = await auth();
const userId = session?.user?.id;
```

### 클라이언트 사이드

```typescript
import { useSession } from "next-auth/react";

const { data: session, status } = useSession();

if (status === "authenticated") {
  // 인증된 사용자 UI
}
```

### Provider 설정

`components/providers.tsx`에서 `SessionProvider`를 래핑:

```typescript
"use client";
import { SessionProvider } from "next-auth/react";

export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
```

---

## 10. 네이밍 요약

| 대상 | 규칙 | 예시 |
|------|------|------|
| 컴포넌트 | PascalCase | `LevelBadge`, `DiaryEditor` |
| 함수 | camelCase | `calculateLevel()`, `grantXp()` |
| 상수 | SCREAMING_SNAKE | `XP_REWARDS`, `DAILY_CAPS` |
| 타입/인터페이스 | PascalCase | `CorrectionData`, `RewardResult` |
| 파일명 | kebab-case | `xp-constants.ts`, `level-badge.tsx` |
| DB 테이블 | snake_case (JS: camelCase) | `diary_streaks` → `diaryStreaks` |
| DB 컬럼 | snake_case | `user_id`, `created_at` |
| CSS 클래스 | kebab-case | `card-diary`, `torn-paper` |
| 환경 변수 | SCREAMING_SNAKE | `DATABASE_URL`, `GOOGLE_CLIENT_ID` |
