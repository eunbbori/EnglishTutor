# Test Environment Setup

| 항목 | 값 |
|------|-----|
| **버전** | 1.0.0 |
| **상태** | `완료` |
| **최종 수정일** | 2026-02-12 |
| **관련 문서** | [TESTING-STRATEGY.md](./TESTING-STRATEGY.md) · [UNIT-TESTS.md](./UNIT-TESTS.md) · [SETUP.md](../guides/SETUP.md) · [CONVENTIONS.md](../guides/CONVENTIONS.md) |

---

## 목차

1. [사전 요구사항](#1-사전-요구사항)
2. [패키지 설치](#2-패키지-설치)
3. [Vitest 설정](#3-vitest-설정)
4. [Playwright 설정](#4-playwright-설정)
5. [디렉토리 구조](#5-디렉토리-구조)
6. [공용 Mock 모듈](#6-공용-mock-모듈)
7. [테스트 Fixture](#7-테스트-fixture)
8. [npm 스크립트](#8-npm-스크립트)
9. [환경 변수](#9-환경-변수)
10. [IDE 설정](#10-ide-설정)
11. [트러블슈팅](#11-트러블슈팅)

---

## 1. 사전 요구사항

| 항목 | 최소 버전 | 비고 |
|------|-----------|------|
| Node.js | 18.17+ | ESM 네이티브 지원 |
| npm | 9+ | — |
| TypeScript | 5.7+ | Strict mode |
| 프로젝트 빌드 | `npm run build` 통과 | 타입 에러 없는 상태 필수 |

---

## 2. 패키지 설치

### 2.1 단위 + 통합 테스트

```bash
npm install -D vitest @vitest/coverage-v8 @vitest/ui
npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event
npm install -D jsdom
npm install -D msw
```

| 패키지 | 용도 |
|--------|------|
| `vitest` | 테스트 러너 + 어설션 |
| `@vitest/coverage-v8` | V8 기반 커버리지 수집 |
| `@vitest/ui` | 브라우저 기반 테스트 UI (`--ui` 플래그) |
| `@testing-library/react` | React 컴포넌트 렌더링 테스트 |
| `@testing-library/jest-dom` | DOM 어설션 확장 (`toBeInTheDocument` 등) |
| `@testing-library/user-event` | 사용자 이벤트 시뮬레이션 |
| `jsdom` | 브라우저 DOM 에뮬레이션 (컴포넌트 테스트용) |
| `msw` | 네트워크 레벨 API Mock |

### 2.2 E2E 테스트

```bash
npm install -D @playwright/test
npx playwright install chromium
```

| 패키지 | 용도 |
|--------|------|
| `@playwright/test` | E2E 테스트 러너 |
| Chromium | 헤드리스 브라우저 (CI 환경) |

---

## 3. Vitest 설정

### 3.1 기본 설정 (`vitest.config.ts`)

```typescript
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
      'db': path.resolve(__dirname, './__tests__/unit/helpers/db-mock'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['__tests__/unit/**/*.test.ts'],
    exclude: ['node_modules', '.next', 'e2e'],
    setupFiles: ['__tests__/unit/helpers/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'lcov', 'html'],
      reportsDirectory: './coverage',
      include: [
        'lib/**/*.ts',
        'app/api/**/*.ts',
      ],
      exclude: [
        'lib/design-system/**',
        '**/*.d.ts',
        '**/types/**',
        '**/__tests__/**',
      ],
      thresholds: {
        lines: 80,
        branches: 75,
        functions: 85,
        statements: 80,
      },
    },
    mockReset: true,
    restoreMocks: true,
  },
});
```

### 3.2 통합 테스트 설정 (`vitest.integration.config.ts`)

```typescript
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['__tests__/integration/**/*.test.ts'],
    setupFiles: ['__tests__/integration/helpers/setup.ts'],
    testTimeout: 30000,
    hookTimeout: 10000,
    mockReset: true,
    restoreMocks: true,
  },
});
```

### 3.3 전역 셋업 파일 (`__tests__/unit/helpers/setup.ts`)

```typescript
import { vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';

// 모든 테스트 전 Mock 초기화
beforeEach(() => {
  vi.clearAllMocks();
});

// 모든 테스트 후 타이머 복원
afterEach(() => {
  vi.useRealTimers();
});

// 환경 변수 기본값
vi.stubEnv('DATABASE_URL', 'postgresql://test:test@localhost:5432/test');
vi.stubEnv('GOOGLE_GENERATIVE_AI_API_KEY', 'test-api-key');
vi.stubEnv('AUTH_SECRET', 'test-auth-secret');
```

---

## 4. Playwright 설정

### 4.1 설정 파일 (`playwright.config.ts`)

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
```

---

## 5. 디렉토리 구조

```
EnglishTutor/
├── __tests__/
│   ├── unit/
│   │   ├── helpers/
│   │   │   ├── setup.ts              ← 전역 셋업
│   │   │   ├── db-mock.ts            ← Drizzle DB Mock
│   │   │   ├── auth-mock.ts          ← NextAuth Mock
│   │   │   ├── time-mock.ts          ← KST 시간 Mock 유틸
│   │   │   └── fixtures.ts           ← 공용 테스트 데이터
│   │   └── lib/
│   │       ├── gamification/
│   │       │   ├── xp-constants.test.ts
│   │       │   ├── xp-service.test.ts
│   │       │   └── treasure-chest.test.ts
│   │       ├── validation/
│   │       │   └── ttr.test.ts
│   │       ├── ai/
│   │       │   ├── schema.test.ts
│   │       │   └── response-validator.test.ts
│   │       ├── streak/
│   │       │   └── streak-manager.test.ts
│   │       ├── subscription/
│   │       │   └── check-usage.test.ts
│   │       └── calendar/
│   │           └── utils.test.ts
│   │
│   └── integration/
│       ├── helpers/
│       │   ├── setup.ts              ← 통합 테스트 셋업
│       │   ├── api-test-utils.ts     ← Request/Response 빌더
│       │   └── msw-handlers.ts       ← MSW 핸들러 정의
│       └── api/
│           ├── chat.test.ts
│           ├── history.test.ts
│           ├── vocabulary.test.ts
│           ├── streak.test.ts
│           ├── usage.test.ts
│           ├── treasure-chest.test.ts
│           └── payment.test.ts
│
├── e2e/
│   ├── fixtures/
│   │   └── auth.ts                   ← 인증 상태 Fixture
│   ├── diary-correction.spec.ts
│   ├── usage-limit.spec.ts
│   ├── vocabulary.spec.ts
│   ├── calendar.spec.ts
│   └── payment.spec.ts
│
├── vitest.config.ts                  ← 단위 테스트 설정
├── vitest.integration.config.ts      ← 통합 테스트 설정
└── playwright.config.ts              ← E2E 설정
```

---

## 6. 공용 Mock 모듈

### 6.1 DB Mock (`__tests__/unit/helpers/db-mock.ts`)

```typescript
import { vi } from 'vitest';

/**
 * Drizzle ORM 체이닝 패턴을 모사하는 Mock 객체.
 *
 * 사용법:
 *   vi.mock('db', () => import('../helpers/db-mock'));
 *
 * 쿼리 결과 주입:
 *   db.select.mockReturnValueOnce(chainableWith([{ id: '1', xp: 100 }]));
 */

const chainable = (result: unknown[] = []) => ({
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  innerJoin: vi.fn().mockReturnThis(),
  leftJoin: vi.fn().mockReturnThis(),
  then: vi.fn().mockResolvedValue(result),
  // Promise-like
  [Symbol.toStringTag]: 'Promise',
});

export const db = {
  select: vi.fn(() => chainable()),
  insert: vi.fn(() => ({
    values: vi.fn(() => ({
      returning: vi.fn().mockResolvedValue([]),
      onConflictDoUpdate: vi.fn(() => ({
        returning: vi.fn().mockResolvedValue([]),
      })),
    })),
  })),
  update: vi.fn(() => ({
    set: vi.fn(() => ({
      where: vi.fn(() => ({
        returning: vi.fn().mockResolvedValue([]),
      })),
    })),
  })),
  delete: vi.fn(() => ({
    where: vi.fn().mockResolvedValue(undefined),
  })),
};

export default db;
```

### 6.2 Auth Mock (`__tests__/unit/helpers/auth-mock.ts`)

```typescript
import { vi } from 'vitest';

/** 인증된 사용자 세션 */
export const mockAuthenticatedSession = {
  user: {
    id: 'test-user-001',
    email: 'test@example.com',
    name: 'Test User',
    image: null,
  },
  expires: '2026-12-31T23:59:59.999Z',
};

/** 비로그인 (null 세션) */
export const mockGuestSession = null;

/** Premium 사용자 세션 */
export const mockPremiumSession = {
  ...mockAuthenticatedSession,
  user: {
    ...mockAuthenticatedSession.user,
    id: 'premium-user-001',
    email: 'premium@example.com',
  },
};

/** auth() 함수 Mock Factory */
export function createAuthMock(session = mockAuthenticatedSession) {
  return vi.fn().mockResolvedValue(session);
}
```

### 6.3 시간 Mock (`__tests__/unit/helpers/time-mock.ts`)

```typescript
import { vi } from 'vitest';

/**
 * KST 기반 시간 고정 유틸리티.
 *
 * KST = UTC + 9시간
 * 예: KST 2026-02-12 15:00 = UTC 2026-02-12 06:00
 */

/** KST 날짜 문자열로 시스템 시간 고정 */
export function setKSTTime(kstDateStr: string) {
  const kstDate = new Date(kstDateStr);
  // KST → UTC 변환 (9시간 빼기)
  const utcDate = new Date(kstDate.getTime() - 9 * 60 * 60 * 1000);
  vi.useFakeTimers();
  vi.setSystemTime(utcDate);
}

/** 자주 사용하는 시간 프리셋 */
export const TIME_PRESETS = {
  /** KST 2026-02-12 00:01 (자정 직후) */
  MIDNIGHT_JUST_AFTER: '2026-02-12T00:01:00',
  /** KST 2026-02-12 23:59 (자정 직전) */
  MIDNIGHT_JUST_BEFORE: '2026-02-12T23:59:00',
  /** KST 2026-02-12 15:00 (오후) */
  AFTERNOON: '2026-02-12T15:00:00',
  /** KST 2026-02-11 15:00 (어제 오후) */
  YESTERDAY_AFTERNOON: '2026-02-11T15:00:00',
  /** KST 2026-02-10 15:00 (그저께 오후) */
  DAY_BEFORE_YESTERDAY: '2026-02-10T15:00:00',
} as const;

/** 시간 복원 */
export function restoreTime() {
  vi.useRealTimers();
}
```

---

## 7. 테스트 Fixture

### 7.1 공용 Fixture (`__tests__/unit/helpers/fixtures.ts`)

```typescript
/**
 * 테스트 전용 데이터 Fixture.
 * 실제 DB 스키마(db/schema.ts)와 동일한 구조.
 */

// ─── User Profiles ────────────────────────────────────

export const FREE_USER_PROFILE = {
  id: 'profile-001',
  userId: 'test-user-001',
  xp: 500,
  level: 5,
  currentTitle: 'Diary Beginner',
  equippedTitle: null,
  earnedTitles: ['Diary Beginner'],
  explanationStyle: 'detailed',
  learningGoal: null,
  recurringMistakes: null,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-02-12T00:00:00Z'),
};

export const PREMIUM_USER_PROFILE = {
  ...FREE_USER_PROFILE,
  id: 'profile-002',
  userId: 'premium-user-001',
  xp: 5000,
  level: 15,
  currentTitle: 'Expression Collector',
};

export const LEVEL_CAP_USER_PROFILE = {
  ...FREE_USER_PROFILE,
  id: 'profile-003',
  userId: 'capped-user-001',
  xp: 4008,
  level: 10,
  currentTitle: 'Daily Writer',
};

// ─── Subscriptions ────────────────────────────────────

export const ACTIVE_SUBSCRIPTION = {
  id: 'sub-001',
  userId: 'premium-user-001',
  plan: 'premium',
  status: 'active',
  startDate: new Date('2026-01-01'),
  endDate: new Date('2026-03-01'),
  createdAt: new Date('2026-01-01'),
};

export const EXPIRED_SUBSCRIPTION = {
  ...ACTIVE_SUBSCRIPTION,
  id: 'sub-002',
  status: 'expired',
  endDate: new Date('2026-01-31'),
};

// ─── Diary Streaks ────────────────────────────────────

export const ACTIVE_STREAK = {
  id: 'streak-001',
  userId: 'test-user-001',
  currentStreak: 7,
  longestStreak: 14,
  lastWrittenAt: '2026-02-11',
  totalEntries: 42,
  freezeCount: 1,
  comebackDays: 0,
  previousStreak: 0,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-02-11'),
};

export const BROKEN_STREAK = {
  ...ACTIVE_STREAK,
  id: 'streak-002',
  currentStreak: 0,
  lastWrittenAt: '2026-02-05',
  freezeCount: 0,
};

// ─── Chat & Messages ─────────────────────────────────

export const SAMPLE_CHAT = {
  id: 'chat-001',
  userId: 'test-user-001',
  title: 'Test Diary',
  mood: 'happy',
  wordCount: 45,
  createdAt: new Date('2026-02-12T06:00:00Z'),
  updatedAt: new Date('2026-02-12T06:00:00Z'),
};

export const SAMPLE_USER_MESSAGE = {
  id: 'msg-001',
  chatId: 'chat-001',
  role: 'user',
  content: 'Today I eat delicious food with my friend.',
  createdAt: new Date('2026-02-12T06:00:00Z'),
};

export const SAMPLE_CORRECTION_RESULT = {
  originalText: 'Today I eat delicious food with my friend.',
  correctedText: 'Today I ate delicious food with my friend.',
  koreanExplanation: '잘 쓰셨어요! 일기는 과거 일을 쓰는 거라서 eat → ate로 바꿔야 해요.',
  alternatives: [
    { type: 'Casual', text: 'I had some great food with my friend today.' },
    { type: 'Expressive', text: 'I savored a delightful meal with my friend today.' },
    { type: 'Simple', text: 'I ate good food with my friend today.' },
  ],
  mistakeType: 'grammar:tense',
  mistakePattern: 'tense-confusion',
  insight: null,
  keywords: ['food', 'friend'],
  mood: 'happy',
  xpMessages: [],
  cappedByDailyLimit: false,
};

// ─── Daily Usage ──────────────────────────────────────

export const FREE_USAGE_FRESH = {
  id: 'usage-001',
  userId: 'test-user-001',
  date: '2026-02-12',
  count: 0,
  bonusCount: 0,
};

export const FREE_USAGE_EXHAUSTED = {
  ...FREE_USAGE_FRESH,
  id: 'usage-002',
  count: 3,
};

// ─── Vocabulary ───────────────────────────────────────

export const SAMPLE_VOCABULARY = {
  id: 'vocab-001',
  userId: 'test-user-001',
  word: 'grateful',
  meaning: '감사하는',
  pronunciation: '/ˈɡreɪtfəl/',
  partOfSpeech: 'adjective',
  synonyms: ['thankful', 'appreciative'],
  difficulty: 'intermediate',
  example: "I'm grateful for your help.",
  memo: '교정에서 배운 표현',
  sourceType: 'diary',
  sourceId: 'chat-001',
  createdAt: new Date('2026-02-12T06:00:00Z'),
};

// ─── XP History ───────────────────────────────────────

export const SAMPLE_XP_HISTORY = {
  id: 'xp-001',
  userId: 'test-user-001',
  action: 'diary_submit',
  xpAmount: 30,
  metadata: { chatId: 'chat-001' },
  createdAt: new Date('2026-02-12T06:00:00Z'),
};
```

---

## 8. npm 스크립트

`package.json`에 추가할 스크립트:

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "test:integration": "vitest run --config vitest.integration.config.ts",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:report": "playwright show-report",
    "test:all": "vitest run && vitest run --config vitest.integration.config.ts"
  }
}
```

| 명령어 | 설명 |
|--------|------|
| `npm test` | 단위 테스트 1회 실행 |
| `npm run test:watch` | 파일 변경 시 자동 재실행 |
| `npm run test:ui` | Vitest UI (브라우저) 실행 |
| `npm run test:coverage` | 커버리지 리포트 포함 실행 |
| `npm run test:integration` | 통합 테스트 실행 |
| `npm run test:e2e` | E2E 테스트 실행 |
| `npm run test:e2e:ui` | Playwright UI 모드 |
| `npm run test:e2e:report` | 최근 E2E 리포트 열기 |
| `npm run test:all` | 단위 + 통합 전체 실행 |

---

## 9. 환경 변수

### 9.1 테스트 전용 `.env.test`

```bash
# Database — 테스트 전용 (실제 연결 불필요, Mock 사용)
DATABASE_URL="postgresql://test:test@localhost:5432/english_tutor_test"

# AI — Mock 대상 (실제 호출 없음)
GOOGLE_GENERATIVE_AI_API_KEY="test-gemini-api-key"
GOOGLE_API_KEY="test-google-api-key"

# Auth
AUTH_SECRET="test-auth-secret-must-be-32-chars-long"
NEXTAUTH_URL="http://localhost:3000"
GOOGLE_CLIENT_ID="test-client-id"
GOOGLE_CLIENT_SECRET="test-client-secret"

# Payment — Mock 대상
TOSS_SECRET_KEY="test_sk_000000000000"

# Test flags
NODE_ENV="test"
```

### 9.2 환경 변수 로딩 순서

```
1. vitest.config.ts → setupFiles → __tests__/unit/helpers/setup.ts
2. setup.ts → vi.stubEnv() 호출
3. 개별 테스트 → vi.stubEnv() 오버라이드 가능
```

> **주의**: `.env.test` 파일은 `.gitignore`에 포함하지 않는다 (테스트 전용 더미 값이므로 커밋 가능).

---

## 10. IDE 설정

### 10.1 VS Code 확장

| 확장 | 용도 |
|------|------|
| `vitest.explorer` | Vitest 테스트 탐색기 |
| `ms-playwright.playwright` | Playwright 테스트 러너 |

### 10.2 VS Code 설정 (`.vscode/settings.json`)

```json
{
  "vitest.commandLine": "npx vitest",
  "vitest.include": ["__tests__/**/*.test.ts"],
  "testing.automaticallyOpenPeekView": "failureVisible"
}
```

---

## 11. 트러블슈팅

### 11.1 자주 발생하는 문제

| 증상 | 원인 | 해결 |
|------|------|------|
| `Cannot find module '@/lib/...'` | Path alias 미설정 | `vitest.config.ts`의 `resolve.alias` 확인 |
| `ReferenceError: vi is not defined` | globals 미활성화 | `test.globals: true` 설정 확인 |
| `TypeError: fetch is not a function` | Node 18 fetch polyfill | `vi.stubGlobal('fetch', vi.fn())` 추가 |
| 타이머 Mock 후 테스트 행 (hang) | `afterEach`에서 복원 누락 | `afterEach(() => vi.useRealTimers())` 추가 |
| DB Mock이 다른 테스트에 누출 | `mockReset` 미설정 | `vitest.config.ts`에 `mockReset: true` 확인 |
| Playwright 타임아웃 | 개발 서버 미시작 | `webServer` 설정 확인, `reuseExistingServer` 활용 |
| `Error: listen EADDRINUSE :::3000` | 포트 충돌 | `npm run dev:clean` 또는 `npx kill-port 3000` |
| ESM import 에러 | CJS/ESM 혼용 | `vitest.config.ts`에서 변환 대상 확인 |

### 11.2 디버깅 팁

```bash
# 단일 테스트 파일 실행
npx vitest run __tests__/unit/lib/gamification/xp-constants.test.ts

# 특정 테스트 이름으로 필터
npx vitest run -t "should return level 1"

# 디버그 모드 (Node Inspector 연결)
npx vitest --inspect-brk --single-thread

# Playwright 디버그 모드 (브라우저 표시)
npx playwright test --headed --debug
```
