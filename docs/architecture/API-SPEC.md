# API Specification

> **Last Updated**: 2026-02-12
> **Base URL**: `/api`

---

## 인증 규칙

- **Session 기반**: NextAuth v5 세션으로 인증
- `auth()` 호출 → `session.user.id` 추출
- 비로그인 시 일부 API는 `"default-user"` 폴백, 일부는 401 반환
- 아래 표의 "Auth" 열: `Required` = 401 반환, `Optional` = 폴백 처리

---

## 엔드포인트 목록

| Method | Path | Auth | 설명 |
|--------|------|------|------|
| POST | `/api/chat` | Optional | AI 일기 교정 (핵심) |
| GET | `/api/history` | Required | 일기 히스토리 목록 |
| GET | `/api/history/[id]` | Required | 개별 일기 상세 |
| GET | `/api/calendar/[year]/[month]` | Optional | 월별 캘린더 데이터 |
| GET | `/api/vocabulary` | Required | 표현노트 목록 |
| POST | `/api/vocabulary` | Required | 표현노트 저장 |
| DELETE | `/api/vocabulary/[id]` | Required | 표현노트 삭제 |
| PATCH | `/api/vocabulary/[id]` | Required | 표현노트 수정 |
| GET | `/api/streak` | Optional | 스트릭 정보 |
| GET | `/api/usage` | Optional | 사용량/구독 상태 |
| GET | `/api/user/xp` | Optional | XP/레벨 정보 |
| GET | `/api/user/profile` | Optional | 사용자 프로필 |
| POST | `/api/user/profile` | Optional | 프로필 업데이트 |
| POST | `/api/treasure-chest/open` | Required | 일일 보물상자 열기 |
| POST | `/api/treasure-chest/open-with-key` | Required | 열쇠로 보물상자 열기 |
| GET | `/api/treasure-chest/history` | Required | 보물상자 히스토리 |
| POST | `/api/payment/confirm` | Required | 결제 확인 |

---

## 1. POST `/api/chat` — AI 일기 교정

핵심 엔드포인트. 사용자 일기를 받아 AI 교정 결과를 반환한다.

### Request

```json
{
  "messages": [
    { "role": "user", "content": "Today I eat delicious food with my friend." }
  ],
  "chatId": "uuid | null",       // null이면 새 세션 생성
  "mood": "happy | neutral | sad | excited | tired | anxious | null"
}
```

### Response (200)

**Header**: `X-Chat-Id: <chatId>`

```json
{
  "object": {
    "originalText": "Today I eat delicious food with my friend.",
    "correctedText": "Today I ate delicious food with my friend.",
    "koreanExplanation": "잘 쓰셨어요! 일기는 과거 일을 쓰는 거라서 'eat' → 'ate'로...",
    "alternatives": [
      { "type": "Casual", "text": "I had some great food with my friend today." },
      { "type": "Expressive", "text": "I savored a delightful meal with my friend today." },
      { "type": "Simple", "text": "I ate good food with my friend today." }
    ],
    "mistakeType": "grammar:tense",
    "mistakePattern": "tense-confusion",
    "insight": "📝 자주 틀리는 부분이에요 (3회)...",
    "keywords": ["food", "friend"],
    "mood": "happy",
    "xpMessages": ["📝 일기 제출 +30 XP", "📏 50단어 이상 +10 XP"],
    "cappedByDailyLimit": false
  }
}
```

### Error Responses

| Status | Code | 설명 |
|--------|------|------|
| 400 | — | 잘못된 메시지 형식 |
| 429 | `USAGE_LIMIT_EXCEEDED` | 무료 일일 사용량 초과 |
| 500 | — | 서버/AI 오류 |

### 내부 처리 순서

1. 인증 확인 → 사용량 확인 → LangGraph 실행 → 메시지 저장
2. 스트릭 업데이트 → XP 부여 (TTR 검증) → 오답 인사이트 생성
3. `maxDuration = 60` (Vercel timeout)

---

## 2. GET `/api/history` — 일기 히스토리

### Response (200)

```json
{
  "entries": [
    {
      "id": "message-uuid",
      "chatId": "chat-uuid",
      "originalText": "...",
      "correctedText": "...",
      "koreanExplanation": "...",
      "createdAt": "2026-02-12T10:00:00Z"
    }
  ],
  "isGuest": false
}
```

- 최근 50개 채팅, 채팅당 최대 10개 메시지
- 비로그인 시 `isGuest: true`, 빈 배열

---

## 3. GET `/api/history/[id]` — 일기 상세

### Response (200)

```json
{
  "entry": {
    "id": "message-uuid",
    "chatId": "chat-uuid",
    "originalText": "...",
    "correctedText": "...",
    "koreanExplanation": "...",
    "alternatives": [{ "type": "Casual", "text": "..." }],
    "mistakeType": "grammar:tense",
    "insight": "...",
    "createdAt": "2026-02-12T10:00:00Z"
  }
}
```

- 소유권 검증: 다른 사용자의 일기 접근 시 404

---

## 4. GET `/api/calendar/[year]/[month]` — 캘린더

### Response (200)

```json
{
  "year": 2026,
  "month": 2,
  "entries": {
    "2026-02-01": {
      "chatId": "uuid",
      "mood": "happy",
      "keywords": ["work", "coffee"],
      "wordCount": 85,
      "preview": "Today I went to..."
    },
    "2026-02-03": { ... }
  }
}
```

- KST(UTC+9) 기준 날짜
- 날짜별 마지막 일기만 표시

---

## 5. 표현노트 (`/api/vocabulary`)

### GET `/api/vocabulary`

```json
{
  "words": [
    {
      "id": "uuid",
      "word": "grateful",
      "meaning": "감사하는",
      "pronunciation": "/ˈɡreɪtfəl/",
      "partOfSpeech": "adjective",
      "synonyms": ["thankful", "appreciative"],
      "difficulty": "intermediate",
      "example": "I'm grateful for your help.",
      "memo": "...",
      "sourceType": "diary",
      "createdAt": "..."
    }
  ]
}
```

### POST `/api/vocabulary`

**Request:**

```json
{
  "word": "grateful",
  "meaning": "감사하는",
  "example": "I'm grateful for your help.",
  "memo": "교정에서 배운 표현",
  "sourceType": "diary",
  "sourceId": "chat-uuid",
  "context": "I am very grateful that you helped me."
}
```

**Response (201):**

```json
{
  "word": { ... },
  "enrichmentFailed": false,
  "xpGranted": true,
  "dailyCapReached": false
}
```

- `context` 제공 시 AI 보강 (발음, 유의어, 난이도)
- 표현 저장 시 +5 XP (일일 5회 상한)

### DELETE `/api/vocabulary/[id]`

소유권 검증 후 삭제. Response: `{ "success": true }`

### PATCH `/api/vocabulary/[id]`

```json
{ "word": "...", "meaning": "...", "example": "...", "memo": "..." }
```

---

## 6. GET `/api/streak` — 스트릭

### Response (200)

```json
{
  "currentStreak": 7,
  "longestStreak": 14,
  "lastWrittenAt": "2026-02-12",
  "totalEntries": 42,
  "wroteToday": true,
  "freezeCount": 1,
  "freezeUsedToday": false,
  "comebackStatus": {
    "isComeback": false,
    "comebackDays": 0,
    "previousStreak": 0
  },
  "welcomeBackBonus": false,
  "isGuest": false
}
```

---

## 7. GET `/api/usage` — 사용량

### Response (200)

```json
{
  "isPremium": false,
  "dailyLimit": 3,
  "usedToday": 1,
  "remaining": 2,
  "canUse": true,
  "isGuest": false
}
```

---

## 8. GET `/api/user/xp` — XP/레벨

### Response (200)

```json
{
  "success": true,
  "data": {
    "xp": 1250,
    "level": 7,
    "title": "Daily Writer",
    "equippedTitle": null,
    "earnedTitles": ["Diary Beginner"],
    "progress": {
      "current": 250,
      "required": 517,
      "percentage": 48
    },
    "booster": {
      "active": false,
      "expiresAt": null
    },
    "isPremium": false,
    "potentialLevel": null
  }
}
```

- Free 사용자에게는 `potentialLevel` (Premium 시 레벨) 표시

---

## 9. 사용자 프로필 (`/api/user/profile`)

### GET

```json
{
  "success": true,
  "data": {
    "userId": "...",
    "explanationStyle": "detailed",
    "learningGoal": "...",
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

### POST

**Request:**

```json
{
  "explanationStyle": "concise",
  "learningGoal": "비즈니스 영어 실력 향상"
}
```

---

## 10. 보물상자 (`/api/treasure-chest`)

### POST `/api/treasure-chest/open` — 일일 무료 열기

- **조건**: Premium 구독 필수 (403), 당일 미열기 (400)
- **Response**: `{ "success": true, "reward": { ... } }`

### POST `/api/treasure-chest/open-with-key` — 열쇠 사용

- **조건**: 열쇠 1개 이상 보유
- **Response**: `{ "success": true, "reward": { ... }, "remainingKeys": 4 }`

### GET `/api/treasure-chest/history`

- 최근 20개 보상 히스토리

---

## 11. POST `/api/payment/confirm` — 결제 확인

### Request

```json
{
  "paymentKey": "toss-payment-key",
  "orderId": "order-uuid",
  "amount": 6900
}
```

### Response (200)

```json
{
  "success": true,
  "payment": { ... }
}
```

- 금액 검증 → 토스페이먼츠 API 확인 → 구독 생성/갱신
- 만료일: 현재 + 1개월
