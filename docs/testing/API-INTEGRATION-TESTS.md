# API Integration Tests Specification

| 항목 | 값 |
|------|-----|
| **버전** | 1.0.0 |
| **상태** | `완료` |
| **최종 수정일** | 2026-02-12 |
| **관련 문서** | [TESTING-STRATEGY.md](./TESTING-STRATEGY.md) · [API-SPEC.md](../architecture/API-SPEC.md) · [CHAT-SEQUENCE.md](../architecture/CHAT-SEQUENCE.md) · [DATA-FLOW-SPEC.md](../spec/system/DATA-FLOW-SPEC.md) |

---

## 목차

1. [개요](#1-개요)
2. [테스트 인프라](#2-테스트-인프라)
3. [POST /api/chat — 일기 교정](#3-post-apichat--일기-교정)
4. [GET /api/history — 히스토리](#4-get-apihistory--히스토리)
5. [GET /api/history/[id] — 일기 상세](#5-get-apihistoryid--일기-상세)
6. [GET /api/calendar/[year]/[month] — 캘린더](#6-get-apicalendaryearmonth--캘린더)
7. [표현노트 API — /api/vocabulary](#7-표현노트-api--apivocabulary)
8. [GET /api/streak — 스트릭](#8-get-apistreak--스트릭)
9. [GET /api/usage — 사용량](#9-get-apiusage--사용량)
10. [GET /api/user/xp — XP/레벨](#10-get-apiuserxp--xp레벨)
11. [사용자 프로필 API — /api/user/profile](#11-사용자-프로필-api--apiuserprofile)
12. [보물상자 API — /api/treasure-chest](#12-보물상자-api--apitreasure-chest)
13. [POST /api/payment/confirm — 결제](#13-post-apipaymentconfirm--결제)

---

## 1. 개요

### 범위 정의

API 통합 테스트는 Next.js API Route Handler를 **실제 HTTP 요청 없이** 함수 단위로 호출하여, 다음을 검증한다:

- 인증 (Auth) 처리: 로그인/비로그인/Guest 분기
- 요청 유효성 검사 (Request Validation)
- 서비스 레이어 연동 (Orchestration)
- HTTP 상태 코드 및 응답 구조
- 에러 핸들링 및 Graceful Degradation

### 격리 수준

```
┌──────────────────────────────────────────┐
│            Integration Test               │
├──────────────────────────────────────────┤
│  ✅ 실제 호출: Route Handler 함수         │
│  ✅ 실제 호출: 서비스 레이어 (일부)        │
│  🔶 Mock:     DB (Drizzle)               │
│  🔶 Mock:     외부 API (Gemini, Toss)     │
│  🔶 Mock:     NextAuth (auth())          │
│  ❌ 미사용:   실제 DB 연결                │
│  ❌ 미사용:   실제 LLM API 호출           │
└──────────────────────────────────────────┘
```

---

## 2. 테스트 인프라

### 2.1 API 테스트 유틸리티

```typescript
// __tests__/integration/helpers/api-test-utils.ts

import { NextRequest } from 'next/server';

/**
 * Next.js Route Handler 테스트용 Request 빌더.
 * 실제 HTTP 서버 없이 Route Handler 함수를 직접 호출.
 */
export function createMockRequest(
  method: string,
  url: string,
  options?: {
    body?: Record<string, unknown>;
    headers?: Record<string, string>;
    searchParams?: Record<string, string>;
  }
): NextRequest {
  const fullUrl = new URL(url, 'http://localhost:3000');
  if (options?.searchParams) {
    Object.entries(options.searchParams).forEach(([k, v]) =>
      fullUrl.searchParams.set(k, v)
    );
  }

  return new NextRequest(fullUrl, {
    method,
    headers: new Headers(options?.headers ?? {}),
    body: options?.body ? JSON.stringify(options.body) : undefined,
  });
}

/**
 * Response 파싱 헬퍼
 */
export async function parseResponse<T>(response: Response): Promise<{
  status: number;
  data: T;
  headers: Headers;
}> {
  return {
    status: response.status,
    data: await response.json() as T,
    headers: response.headers,
  };
}
```

### 2.2 MSW 핸들러 (외부 API Mock)

```typescript
// __tests__/integration/helpers/msw-handlers.ts

import { http, HttpResponse } from 'msw';

/** Gemini API Mock — 고정 교정 결과 반환 */
export const geminiHandler = http.post(
  'https://generativelanguage.googleapis.com/*',
  () => {
    return HttpResponse.json({
      candidates: [{
        content: {
          parts: [{ text: JSON.stringify({
            originalText: 'Today I eat food.',
            correctedText: 'Today I ate food.',
            koreanExplanation: '과거 시제로 바꿔야 해요.',
            alternatives: [
              { type: 'Casual', text: 'I had food today.' },
              { type: 'Expressive', text: 'I savored a meal today.' },
              { type: 'Simple', text: 'I ate food today.' },
            ],
            mistakeType: 'grammar:tense',
            mistakePattern: 'tense-confusion',
          })}],
        },
      }],
    });
  }
);

/** Toss Payments API Mock — 결제 확인 */
export const tossPaymentHandler = http.post(
  'https://api.tosspayments.com/v1/payments/confirm',
  () => {
    return HttpResponse.json({
      paymentKey: 'test-payment-key',
      orderId: 'test-order-id',
      status: 'DONE',
      totalAmount: 6900,
    });
  }
);

/** Toss 결제 실패 Mock */
export const tossPaymentFailHandler = http.post(
  'https://api.tosspayments.com/v1/payments/confirm',
  () => {
    return HttpResponse.json(
      { code: 'INVALID_PAYMENT', message: 'Invalid payment' },
      { status: 400 }
    );
  }
);
```

---

## 3. POST `/api/chat` — 일기 교정

> **파일**: `app/api/chat/route.ts`
> **참조**: [CHAT-SEQUENCE.md](../architecture/CHAT-SEQUENCE.md), [API-SPEC.md](../architecture/API-SPEC.md) §1

### 3.1 처리 흐름 (테스트 관점)

```
Request → Auth → Usage Check → LangGraph → Save → Streak → XP → Response
            │        │            │          │       │       │
        Mock auth  Mock DB    Mock LLM   Mock DB  Mock DB  Mock DB
```

### 3.2 테스트 케이스 명세

#### 정상 흐름

| ID | 시나리오 | 요청 | Mock 설정 | 기대 응답 |
|----|----------|------|-----------|-----------|
| CH-01 | 로그인 사용자, 새 세션 | `chatId: null, messages: [유효]` | 인증 O, 사용량 여유 | 200, `X-Chat-Id` 헤더, 교정 결과 |
| CH-02 | 로그인 사용자, 기존 세션 | `chatId: "uuid"` | 인증 O, 기존 채팅 | 200, 같은 `chatId` 반환 |
| CH-03 | 비로그인 사용자 (Guest) | 세션 없음 | `auth() → null` | 200, `"default-user"` 폴백 |
| CH-04 | 응답에 mood 포함 | `mood: "happy"` | — | 200, `object.mood: "happy"` |

#### 에러 흐름

| ID | 시나리오 | 요청 | Mock 설정 | 기대 응답 |
|----|----------|------|-----------|-----------|
| CH-05 | 메시지 누락 | `messages: []` | — | 400, Bad Request |
| CH-06 | 잘못된 메시지 형식 | `messages: "문자열"` | — | 400 |
| CH-07 | 사용량 초과 (Free) | 정상 요청 | 사용량 3/3 | 429, `USAGE_LIMIT_EXCEEDED` |
| CH-08 | Premium 사용자, 무제한 | 정상 요청 | Premium 구독 | 200 (한도 없음) |
| CH-09 | AI 응답 파싱 실패 | 정상 요청 | LLM → 잘못된 JSON | 200, 폴백 응답 또는 500 |
| CH-10 | AI 서비스 다운 | 정상 요청 | LLM → 네트워크 에러 | 500 |

#### 부수 효과 검증

| ID | 시나리오 | 검증 대상 | 카테고리 |
|----|----------|-----------|----------|
| CH-11 | 메시지 저장 확인 | `messages` 테이블 INSERT 2회 (user + assistant) | 데이터 |
| CH-12 | 사용량 증가 확인 | `dailyUsage.count += 1` | 데이터 |
| CH-13 | 스트릭 기록 확인 | `recordDiaryEntry()` 호출 | 부수효과 |
| CH-14 | XP 부여 확인 | `grantDiaryXp()` 호출 | 부수효과 |
| CH-15 | 스트릭/XP 실패 시 교정 결과 반환 | 스트릭 에러 | 200 (Graceful) |

#### 응답 구조 검증

| ID | 검증 항목 | 기대 구조 |
|----|-----------|-----------|
| CH-16 | `object.originalText` | 원본 텍스트 (string) |
| CH-17 | `object.correctedText` | 교정 텍스트 (string) |
| CH-18 | `object.koreanExplanation` | 한국어 설명 (string) |
| CH-19 | `object.alternatives` | 3개 대안 배열 |
| CH-20 | `object.xpMessages` | XP 메시지 배열 |
| CH-21 | `X-Chat-Id` 헤더 | UUID 형식 |

---

## 4. GET `/api/history` — 히스토리

> **파일**: `app/api/history/route.ts`
> **참조**: [API-SPEC.md](../architecture/API-SPEC.md) §2

### 테스트 케이스 명세

| ID | 시나리오 | Mock 설정 | 기대 응답 |
|----|----------|-----------|-----------|
| HI-01 | 인증 사용자, 데이터 있음 | 채팅 5개, 메시지 각 2개 | 200, `entries` 배열 (길이 5) |
| HI-02 | 인증 사용자, 데이터 없음 | 빈 결과 | 200, `entries: []` |
| HI-03 | 비로그인 (Guest) | `auth() → null` | 200, `{ entries: [], isGuest: true }` |
| HI-04 | 50개 제한 확인 | 채팅 60개 | 200, `entries.length ≤ 50` |
| HI-05 | 최신순 정렬 | 다양한 createdAt | `entries[0]`이 가장 최신 |
| HI-06 | 채팅당 메시지 10개 제한 | 메시지 15개 채팅 | 메시지 10개만 반환 |
| HI-07 | 응답 구조 검증 | — | `{ id, chatId, originalText, correctedText, createdAt }` |

---

## 5. GET `/api/history/[id]` — 일기 상세

> **파일**: `app/api/history/[id]/route.ts`
> **참조**: [API-SPEC.md](../architecture/API-SPEC.md) §3

### 테스트 케이스 명세

| ID | 시나리오 | Mock 설정 | 기대 응답 |
|----|----------|-----------|-----------|
| HD-01 | 본인 일기 조회 | userId 일치 | 200, 일기 상세 |
| HD-02 | 타인 일기 접근 | userId 불일치 | 404 |
| HD-03 | 존재하지 않는 ID | DB 결과 없음 | 404 |
| HD-04 | 비로그인 | `auth() → null` | 401 |
| HD-05 | 응답에 alternatives 포함 | — | `entry.alternatives` 배열 |
| HD-06 | 응답에 mistakeType 포함 | — | `entry.mistakeType` 문자열 또는 null |

---

## 6. GET `/api/calendar/[year]/[month]` — 캘린더

> **파일**: `app/api/calendar/[year]/[month]/route.ts`
> **참조**: [API-SPEC.md](../architecture/API-SPEC.md) §4

### 테스트 케이스 명세

| ID | 시나리오 | 파라미터 | Mock 설정 | 기대 응답 |
|----|----------|----------|-----------|-----------|
| CA-01 | 정상 조회 | `2026/2` | 2월 일기 3건 | 200, `entries` 객체 (3개 키) |
| CA-02 | 빈 월 | `2026/1` | 일기 없음 | 200, `entries: {}` |
| CA-03 | Guest | — | `auth() → null` | 200, 빈 결과 또는 Guest 처리 |
| CA-04 | KST 날짜 기준 확인 | — | UTC 15:00 저장 일기 | KST 다음 날짜로 분류 |
| CA-05 | 같은 날 복수 일기 → 마지막만 | 같은 날 2건 | 마지막 일기만 표시 |
| CA-06 | 응답 구조 | — | `{ year, month, entries: { "YYYY-MM-DD": { chatId, mood, keywords, wordCount, preview } } }` |
| CA-07 | 잘못된 파라미터 | `2026/13` | — | 400 또는 빈 결과 |

---

## 7. 표현노트 API — `/api/vocabulary`

> **파일**: `app/api/vocabulary/route.ts`, `app/api/vocabulary/[id]/route.ts`
> **참조**: [API-SPEC.md](../architecture/API-SPEC.md) §5

### 7.1 GET `/api/vocabulary`

| ID | 시나리오 | Mock 설정 | 기대 응답 |
|----|----------|-----------|-----------|
| VO-01 | 표현 목록 조회 | 단어 5개 | 200, `words` 배열 (길이 5) |
| VO-02 | 빈 목록 | 단어 없음 | 200, `words: []` |
| VO-03 | 비로그인 | `auth() → null` | 401 |
| VO-04 | 정렬 (최신순) | 다양한 createdAt | 최신 단어 우선 |

### 7.2 POST `/api/vocabulary`

| ID | 시나리오 | 요청 본문 | Mock 설정 | 기대 응답 |
|----|----------|-----------|-----------|-----------|
| VO-05 | 기본 저장 (AI 보강 없음) | `{ word, meaning }` | — | 201, 저장된 단어 |
| VO-06 | AI 보강 포함 | `{ word, meaning, context }` | Gemini Mock | 201, `enrichmentFailed: false` |
| VO-07 | AI 보강 실패 (Graceful) | `{ word, meaning, context }` | Gemini → 에러 | 201, `enrichmentFailed: true` |
| VO-08 | XP 부여 확인 (+5) | — | 일일 5회 미달 | `xpGranted: true` |
| VO-09 | XP 일일 캡 (5회/일) | — | 이미 5회 저장 | `dailyCapReached: true` |
| VO-10 | 비로그인 | — | `auth() → null` | 401 |
| VO-11 | 단어 누락 | `{ meaning: "..." }` | — | 400 |

### 7.3 DELETE `/api/vocabulary/[id]`

| ID | 시나리오 | Mock 설정 | 기대 응답 |
|----|----------|-----------|-----------|
| VO-12 | 본인 단어 삭제 | userId 일치 | 200, `{ success: true }` |
| VO-13 | 타인 단어 삭제 | userId 불일치 | 404 |
| VO-14 | 존재하지 않는 ID | — | 404 |
| VO-15 | 비로그인 | — | 401 |

### 7.4 PATCH `/api/vocabulary/[id]`

| ID | 시나리오 | 요청 | 기대 응답 |
|----|----------|------|-----------|
| VO-16 | 메모 수정 | `{ memo: "새 메모" }` | 200, 수정된 단어 |
| VO-17 | 다중 필드 수정 | `{ word, meaning, example }` | 200 |
| VO-18 | 소유권 불일치 | userId 다름 | 404 |

---

## 8. GET `/api/streak` — 스트릭

> **파일**: `app/api/streak/route.ts`
> **참조**: [API-SPEC.md](../architecture/API-SPEC.md) §6

### 테스트 케이스 명세

| ID | 시나리오 | Mock 설정 | 기대 응답 |
|----|----------|-----------|-----------|
| ST-01 | 활성 스트릭 | 7일 연속 | 200, `{ currentStreak: 7, wroteToday: true }` |
| ST-02 | 스트릭 없음 (신규) | DB 결과 없음 | 200, 기본값 `{ currentStreak: 0 }` |
| ST-03 | Guest | `auth() → null` | 200, `{ isGuest: true, currentStreak: 0 }` |
| ST-04 | 컴백 상태 포함 | comebackDays > 0 | `comebackStatus` 객체 포함 |
| ST-05 | 프리즈 정보 포함 | freezeCount: 1 | `{ freezeCount: 1, freezeUsedToday: false }` |
| ST-06 | 응답 구조 완전성 | — | 모든 필드 존재 확인 |

---

## 9. GET `/api/usage` — 사용량

> **파일**: `app/api/usage/route.ts`
> **참조**: [API-SPEC.md](../architecture/API-SPEC.md) §7

### 테스트 케이스 명세

| ID | 시나리오 | Mock 설정 | 기대 응답 |
|----|----------|-----------|-----------|
| US-01 | Free, 미사용 | 사용량 0, 구독 없음 | 200, `{ isPremium: false, remaining: 3, canUse: true }` |
| US-02 | Free, 일부 사용 | 사용량 2 | 200, `{ remaining: 1 }` |
| US-03 | Free, 한도 도달 | 사용량 3 | 200, `{ remaining: 0, canUse: false }` |
| US-04 | Premium | 활성 구독 | 200, `{ isPremium: true, canUse: true }` |
| US-05 | Guest | `auth() → null` | 200, `{ isGuest: true }` |

---

## 10. GET `/api/user/xp` — XP/레벨

> **파일**: `app/api/user/xp/route.ts`
> **참조**: [API-SPEC.md](../architecture/API-SPEC.md) §8

### 테스트 케이스 명세

| ID | 시나리오 | Mock 설정 | 기대 응답 |
|----|----------|-----------|-----------|
| XP-01 | Free 사용자 XP 상태 | Lv.5, XP 500 | 200, `{ level: 5, title: "...", potentialLevel: null }` |
| XP-02 | Free 캡 사용자 | Lv.10, XP 5000 | 200, `{ level: 10, potentialLevel: 12 }` |
| XP-03 | Premium 사용자 | Lv.15, XP 8000 | 200, `{ level: 15, potentialLevel: null }` |
| XP-04 | 부스터 활성 | `boosterExpiresAt > now` | `{ booster: { active: true } }` |
| XP-05 | 진행도 포함 | — | `{ progress: { current, required, percentage } }` |
| XP-06 | Guest | `auth() → null` | 200, 기본값 |

---

## 11. 사용자 프로필 API — `/api/user/profile`

> **파일**: `app/api/user/profile/route.ts`
> **참조**: [API-SPEC.md](../architecture/API-SPEC.md) §9

### GET

| ID | 시나리오 | Mock 설정 | 기대 응답 |
|----|----------|-----------|-----------|
| UP-01 | 프로필 조회 | 프로필 존재 | 200, `{ explanationStyle, learningGoal }` |
| UP-02 | 프로필 미존재 | DB 결과 없음 | 200, 기본값 |
| UP-03 | Guest | — | 200, Guest 기본값 |

### POST

| ID | 시나리오 | 요청 | 기대 응답 |
|----|----------|------|-----------|
| UP-04 | 설명 스타일 변경 | `{ explanationStyle: "concise" }` | 200, 갱신 확인 |
| UP-05 | 학습 목표 설정 | `{ learningGoal: "비즈니스 영어" }` | 200, 갱신 확인 |
| UP-06 | 잘못된 스타일 값 | `{ explanationStyle: "invalid" }` | 400 |

---

## 12. 보물상자 API — `/api/treasure-chest`

> **파일**: `app/api/treasure-chest/open/route.ts` 등
> **참조**: [API-SPEC.md](../architecture/API-SPEC.md) §10

### POST `/api/treasure-chest/open` (일일 무료)

| ID | 시나리오 | Mock 설정 | 기대 응답 |
|----|----------|-----------|-----------|
| TR-01 | Premium, 오늘 미열기 | 활성 구독, 미열기 | 200, `{ success: true, reward: {...} }` |
| TR-02 | Premium, 이미 열기 | 오늘 이미 열었음 | 400, 이미 열었음 |
| TR-03 | Free 사용자 | 구독 없음 | 403, Premium 필요 |
| TR-04 | 비로그인 | `auth() → null` | 401 |

### POST `/api/treasure-chest/open-with-key`

| ID | 시나리오 | Mock 설정 | 기대 응답 |
|----|----------|-----------|-----------|
| TR-05 | 열쇠 보유 (1+) | `keyCount: 3` | 200, `{ remainingKeys: 2 }` |
| TR-06 | 열쇠 없음 | `keyCount: 0` | 400, 열쇠 부족 |
| TR-07 | 비로그인 | — | 401 |

### GET `/api/treasure-chest/history`

| ID | 시나리오 | Mock 설정 | 기대 응답 |
|----|----------|-----------|-----------|
| TR-08 | 히스토리 조회 | 보상 10건 | 200, 배열 (길이 10) |
| TR-09 | 20건 제한 | 보상 25건 | 200, 배열 (길이 ≤ 20) |
| TR-10 | 비로그인 | — | 401 |

---

## 13. POST `/api/payment/confirm` — 결제

> **파일**: `app/api/payment/confirm/route.ts`
> **참조**: [API-SPEC.md](../architecture/API-SPEC.md) §11

### 테스트 케이스 명세

| ID | 시나리오 | 요청 | Mock 설정 | 기대 응답 |
|----|----------|------|-----------|-----------|
| PM-01 | 정상 결제 | `{ paymentKey, orderId, amount: 6900 }` | Toss → 성공 | 200, `{ success: true }` |
| PM-02 | 금액 불일치 | `{ amount: 5000 }` | — | 400, 금액 검증 실패 |
| PM-03 | Toss API 실패 | 정상 요청 | Toss → 400 | 500, 결제 실패 |
| PM-04 | 구독 생성 확인 | — | 결제 성공 | `subscriptions` INSERT 확인 |
| PM-05 | 만료일 = 현재 + 1개월 | — | 결제 성공 | `endDate` 검증 |
| PM-06 | 비로그인 | — | `auth() → null` | 401 |
| PM-07 | 필수 필드 누락 | `{ paymentKey }` | — | 400 |
| PM-08 | 기존 구독 갱신 | 이미 활성 구독 | — | 200, `endDate` 연장 |

---

## 부록: 공통 검증 패턴

### A. 인증 검증 매트릭스

각 API Route의 인증 동작을 체계적으로 검증:

| Endpoint | Auth Required | 비로그인 동작 | 테스트 ID |
|----------|:------------:|---------------|-----------|
| POST /api/chat | Optional | `"default-user"` 폴백 | CH-03 |
| GET /api/history | Required | 401 | — |
| GET /api/history/[id] | Required | 401 | HD-04 |
| GET /api/calendar | Optional | 빈 결과 | CA-03 |
| GET /api/vocabulary | Required | 401 | VO-03 |
| POST /api/vocabulary | Required | 401 | VO-10 |
| DELETE /api/vocabulary/[id] | Required | 401 | VO-15 |
| GET /api/streak | Optional | Guest 기본값 | ST-03 |
| GET /api/usage | Optional | Guest 기본값 | US-05 |
| GET /api/user/xp | Optional | 기본값 | XP-06 |
| POST /api/treasure-chest/* | Required | 401 | TR-04, TR-07 |
| POST /api/payment/confirm | Required | 401 | PM-06 |

### B. 에러 응답 형식 검증

모든 에러 응답이 일관된 구조를 따르는지 확인:

```typescript
// 기대 에러 응답 구조
interface ErrorResponse {
  error?: string;
  code?: string;    // e.g., 'USAGE_LIMIT_EXCEEDED'
  message?: string;
}
```

### C. 실행 명령

```bash
# 전체 통합 테스트
npx vitest run --config vitest.integration.config.ts

# 특정 API만
npx vitest run --config vitest.integration.config.ts __tests__/integration/api/chat.test.ts

# 특정 시나리오
npx vitest run --config vitest.integration.config.ts -t "CH-07"
```
