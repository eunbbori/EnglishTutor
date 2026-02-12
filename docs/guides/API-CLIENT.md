# API 클라이언트 가이드

> **Last Updated**: 2026-02-12

---

## 개요

클라이언트에서 API를 호출할 때 **vanilla `fetch`** 를 사용한다. SWR, React Query 등 별도 데이터 페칭 라이브러리는 사용하지 않으며, `useState`로 응답 상태를 관리한다.

---

## 1. 기본 패턴

### POST 요청

```typescript
const response = await fetch("/api/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    messages: [{ role: "user", content: userMessage }],
    chatId,
    mode: "diary",
    promptId,
    mood,
  }),
});

if (!response.ok) {
  // 에러 처리
  throw new Error(`HTTP ${response.status}`);
}

const data = await response.json();
```

### GET 요청

```typescript
const response = await fetch("/api/user/profile");
const data = await response.json();
```

---

## 2. 에러 핸들링

### HTTP 상태 코드별 처리

```typescript
const response = await fetch("/api/chat", { ... });

switch (response.status) {
  case 200:
    const data = await response.json();
    // 정상 처리
    break;

  case 401:
    // 미인증 → 로그인 유도
    router.push("/?login=required");
    break;

  case 429:
    // 사용 제한 초과 → 업그레이드 모달
    setShowUpgradeModal(true);
    break;

  case 500:
    // 서버 오류
    setError("서버 오류가 발생했습니다.");
    break;
}
```

### 공통 상태 코드

| 코드 | 의미 | 클라이언트 처리 |
|------|------|----------------|
| 200 | 성공 | 데이터 표시 |
| 401 | 미인증 | 로그인 페이지 이동 |
| 404 | 리소스 없음 | 빈 상태 표시 |
| 429 | 일일 제한 초과 | 업그레이드 모달 표시 |
| 500 | 서버 오류 | 오류 메시지 표시 |

---

## 3. 커스텀 헤더

### 응답 헤더

일부 API는 커스텀 헤더로 메타데이터를 반환한다:

```typescript
// 채팅 API - 새로 생성된 chatId를 헤더로 반환
const chatId = response.headers.get("X-Chat-Id");
```

| 헤더 | API | 설명 |
|------|-----|------|
| `X-Chat-Id` | `POST /api/chat` | 생성/사용된 채팅 세션 ID |

---

## 4. 주요 API 호출 패턴

### 4.1 일기 교정 (메인 플로우)

**소스**: `app/page.tsx`

```typescript
const handleSubmit = async (userMessage: string, promptId: string | null, mood: string | null) => {
  setIsLoading(true);

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: userMessage }],
        chatId: currentChatId,
        mode: "diary",
        promptId,
        mood,
      }),
    });

    if (response.status === 429) {
      setShowUpgradeModal(true);
      return;
    }

    const newChatId = response.headers.get("X-Chat-Id");
    if (newChatId) setCurrentChatId(newChatId);

    const data = await response.json();
    setCorrection(data.object);
  } catch (error) {
    console.error("Submit error:", error);
  } finally {
    setIsLoading(false);
  }
};
```

### 4.2 사용량 조회

```typescript
const fetchUsage = async () => {
  const response = await fetch("/api/usage");
  if (response.ok) {
    const data: UsageStatus = await response.json();
    setUsage(data);
  }
};
```

**응답 타입**:

```typescript
interface UsageStatus {
  isPremium: boolean;
  dailyLimit: number;
  usedToday: number;
  remaining: number;
  canUse: boolean;
}
```

### 4.3 스트릭 정보 조회

```typescript
const fetchStreak = async () => {
  const response = await fetch("/api/streak");
  if (response.ok) {
    const data = await response.json();
    setStreak(data);
  }
};
```

### 4.4 사용자 프로필

```typescript
// GET - 프로필 조회
const response = await fetch("/api/user/profile");
const profile = await response.json();

// POST - 프로필 업데이트
await fetch("/api/user/profile", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    learningGoal: "일상 표현 마스터",
    explanationStyle: "detailed",
  }),
});
```

### 4.5 히스토리

```typescript
// 목록 조회
const response = await fetch("/api/history", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ page: 1, limit: 20 }),
});

// 상세 조회
const response = await fetch(`/api/history/${chatId}`);
```

### 4.6 표현노트

```typescript
// 조회
const response = await fetch("/api/vocabulary");
const words = await response.json();

// 저장
await fetch("/api/vocabulary", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    word: "piece of cake",
    meaning: "아주 쉬운 일",
    example: "The test was a piece of cake!",
    context: "일기 교정에서 학습",
  }),
});
```

### 4.7 캘린더

```typescript
const response = await fetch(`/api/calendar/${year}/${month}`);
const calendarData = await response.json();
```

### 4.8 보물상자

```typescript
const response = await fetch("/api/treasure-chest/open", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ source: "daily" }),
});
const reward = await response.json();
```

### 4.9 결제

```typescript
// Toss Payments 결과 확인
await fetch("/api/payment/confirm", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    orderId,
    paymentKey,
    amount: 6900,
  }),
});
```

---

## 5. 상태 관리 패턴

### Loading / Error / Data 패턴

```typescript
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
const [data, setData] = useState<DataType | null>(null);

const fetchData = async () => {
  setIsLoading(true);
  setError(null);

  try {
    const response = await fetch("/api/endpoint");
    if (!response.ok) throw new Error("Failed");
    const result = await response.json();
    setData(result);
  } catch (err) {
    setError("데이터를 불러오는데 실패했습니다.");
  } finally {
    setIsLoading(false);
  }
};
```

### useEffect 데이터 페칭

```typescript
useEffect(() => {
  if (status === "authenticated") {
    fetchUsage();
    fetchStreak();
  }
}, [status]);
```

---

## 6. 인증과 API 호출

### 자동 인증

`SessionProvider`를 통해 쿠키 기반 세션이 자동으로 전송되므로, API 호출 시 별도의 Authorization 헤더가 불필요하다.

```typescript
// 인증 헤더 불필요 - 쿠키가 자동 전송됨
const response = await fetch("/api/user/profile");
```

### 인증 상태 확인 후 호출

```typescript
const { data: session, status } = useSession();

useEffect(() => {
  if (status === "authenticated") {
    // 인증된 경우에만 API 호출
    fetchUserProfile();
  }
}, [status]);
```

---

## 7. API 엔드포인트 목록

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `POST` | `/api/chat` | 일기 교정 (메인) |
| `GET` | `/api/usage` | 일일 사용량 조회 |
| `GET` | `/api/user/profile` | 프로필 조회 |
| `POST` | `/api/user/profile` | 프로필 업데이트 |
| `GET` | `/api/user/xp` | XP/레벨 조회 |
| `GET` | `/api/streak` | 스트릭 조회 |
| `POST` | `/api/streak` | 스트릭 갱신 |
| `POST` | `/api/history` | 히스토리 목록 |
| `GET` | `/api/history/[id]` | 히스토리 상세 |
| `GET` | `/api/vocabulary` | 표현노트 목록 |
| `POST` | `/api/vocabulary` | 표현 저장 |
| `DELETE` | `/api/vocabulary` | 표현 삭제 |
| `GET` | `/api/calendar/[year]/[month]` | 캘린더 데이터 |
| `POST` | `/api/payment/confirm` | 결제 확인 |
| `POST` | `/api/treasure-chest/open` | 보물상자 열기 |

> 상세 요청/응답 형식은 [API-SPEC.md](../architecture/API-SPEC.md) 참조.
