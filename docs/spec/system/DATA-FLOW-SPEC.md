# 데이터 흐름 명세 (Data Flow Specification)

| 항목 | 값 |
|------|-----|
| **버전** | 1.0.0 |
| **상태** | `완료` |
| **최종 수정일** | 2026-02-12 |
| **관련 문서** | [SYSTEM-ARCHITECTURE.md](./SYSTEM-ARCHITECTURE.md) · [DATA-MODEL.md](../../architecture/DATA-MODEL.md) · [API-SPEC.md](../../architecture/API-SPEC.md) |

---

## 목차

1. [데이터 흐름 개요](#1-데이터-흐름-개요)
2. [핵심 플로우: 일기 교정](#2-핵심-플로우-일기-교정)
3. [인증 데이터 흐름](#3-인증-데이터-흐름)
4. [게이미피케이션 데이터 흐름](#4-게이미피케이션-데이터-흐름)
5. [표현노트 데이터 흐름](#5-표현노트-데이터-흐름)
6. [결제 데이터 흐름](#6-결제-데이터-흐름)
7. [클라이언트 상태 관리](#7-클라이언트-상태-관리)
8. [데이터 무결성 보장](#8-데이터-무결성-보장)

---

## 1. 데이터 흐름 개요

### 1.1 전체 데이터 흐름 맵

```mermaid
flowchart TB
    subgraph Client["클라이언트 (Browser)"]
        UI["React Components"]
        HOOKS["Custom Hooks<br/>useChat, useXpToast"]
        FETCH["fetch API"]
    end

    subgraph API["API Routes (Vercel Functions)"]
        CHAT_RT["/api/chat"]
        HIST_RT["/api/history"]
        VOCAB_RT["/api/vocabulary"]
        XP_RT["/api/user/xp"]
        STREAK_RT["/api/streak"]
        USAGE_RT["/api/usage"]
        CHEST_RT["/api/treasure-chest"]
        PAY_RT["/api/payment"]
    end

    subgraph Logic["Business Logic (lib/)"]
        AI["ai/ (LangGraph)"]
        GAME["gamification/ (XP)"]
        STRK["streak/ (Streak)"]
        SUB["subscription/ (Usage)"]
        PAY["payment/ (Toss)"]
    end

    subgraph DB["PostgreSQL (Neon)"]
        CORE_T["Core Tables<br/>chats, messages, vocabulary"]
        USER_T["User Tables<br/>users, userProfiles"]
        GAME_T["Game Tables<br/>xpHistory, diaryStreaks"]
        BILL_T["Billing Tables<br/>subscriptions, dailyUsage"]
    end

    subgraph External["External Services"]
        GEMINI["Google Gemini"]
        GOOGLE["Google OAuth"]
        TOSS["Toss Payments"]
    end

    UI --> HOOKS --> FETCH
    FETCH --> API
    API --> Logic
    Logic --> DB
    AI --> GEMINI
    PAY --> TOSS
    CHAT_RT --> AI
    CHAT_RT --> GAME
    CHAT_RT --> STRK
    CHAT_RT --> SUB

    style Client fill:#e3f2fd,stroke:#2196f3
    style API fill:#fff3e0,stroke:#ff9800
    style Logic fill:#fce4ec,stroke:#e91e63
    style DB fill:#e8f5e9,stroke:#4caf50
    style External fill:#f3e5f5,stroke:#9c27b0
```

### 1.2 데이터 흐름 방향 원칙

| 원칙 | 설명 |
|------|------|
| **단방향 흐름** | Client → API → Logic → DB (쓰기) / DB → Logic → API → Client (읽기) |
| **서버 권위** | 모든 비즈니스 로직은 서버에서 실행, 클라이언트는 결과만 표시 |
| **DB 단일 원천** | PostgreSQL이 유일한 데이터 원천 (클라이언트 캐시 없음) |
| **Stateless API** | 각 요청은 독립적, 서버 측 인메모리 상태 없음 |

---

## 2. 핵심 플로우: 일기 교정

### 2.1 전체 시퀀스

```mermaid
sequenceDiagram
    participant C as Client
    participant R as POST /api/chat
    participant U as check-usage.ts
    participant G as graph.ts (LangGraph)
    participant AI as Gemini 2.5 Pro
    participant S as streak-manager.ts
    participant X as xp-service.ts
    participant M as user-profile.ts
    participant DB as PostgreSQL

    C->>R: { messages, chatId, mood }

    %% Phase 1: 사전 검증
    rect rgb(240, 248, 255)
    note over R,DB: Phase 1 — 사전 검증
    R->>DB: auth() → session.user.id
    R->>U: getUsageStatus(userId)
    U->>DB: SELECT dailyUsage, subscriptions
    U-->>R: { canUse, isPremium, remaining }
    alt 한도 초과
        R-->>C: 429 USAGE_LIMIT_EXCEEDED
    end
    end

    %% Phase 2: AI 교정
    rect rgb(255, 248, 240)
    note over R,AI: Phase 2 — AI 교정
    R->>DB: chat 세션 조회/생성
    R->>M: getProfile(userId)
    M->>DB: SELECT userProfiles
    R->>DB: 최근 7일 오답 TOP 3
    R->>G: invoke({ messages, userProfile, mistakes })
    G->>AI: 적응형 프롬프트 + Gemini 호출
    AI-->>G: CorrectionResponse (JSON)
    G->>G: Zod 검증 + 품질 검증
    G-->>R: correctionResult
    end

    %% Phase 3: 데이터 영속화
    rect rgb(240, 255, 240)
    note over R,DB: Phase 3 — 데이터 영속화
    R->>DB: INSERT messages (user + assistant)
    R->>U: incrementUsage(userId)
    U->>DB: UPSERT dailyUsage
    end

    %% Phase 4: 후처리 (Non-blocking)
    rect rgb(255, 240, 255)
    note over R,DB: Phase 4 — 후처리 (Graceful)
    R->>S: recordDiaryEntry(userId)
    S->>DB: UPDATE diaryStreaks
    S-->>R: streakResult

    R->>X: grantDiaryXp(userId, text, pattern)
    X->>DB: SELECT dailyXpTracking
    X->>DB: INSERT xpHistory + UPDATE userProfiles
    X-->>R: { messages, total }

    R->>M: addRecurringMistake(pattern, example)
    M->>DB: UPDATE userProfiles.recurringMistakes
    R->>DB: UPSERT userMistakes
    R->>DB: 인사이트 생성 (빈도 ≥ 3)
    end

    R-->>C: { object: CorrectionResponse }
```

### 2.2 Phase별 데이터 읽기/쓰기

| Phase | 읽기 (SELECT) | 쓰기 (INSERT/UPDATE) | 실패 시 |
|-------|-------------|---------------------|--------|
| 1. 사전 검증 | dailyUsage, subscriptions | - | 429 반환 |
| 2. AI 교정 | userProfiles, userMistakes, chats, messages | - | 500 반환 |
| 3. 영속화 | - | messages(×2), dailyUsage | 500 반환 |
| 4. 후처리 | diaryStreaks, dailyXpTracking, xpHistory | diaryStreaks, xpHistory, userProfiles, userMistakes | 로그만 (Graceful) |

### 2.3 데이터 변환 파이프라인

```
사용자 입력                    DB 저장                     클라이언트 표시
─────────────────────────────────────────────────────────────────────────
"Today I eat food"     →     messages.content        →     originalText
        │                         │                            │
   [Gemini 교정]             messages.content(asst)  →     correctedText
        │                         │
   [Zod 검증]              userMistakes.pattern      →     mistakeType
        │                         │
   [품질 검증]             userProfiles.xp            →     xpMessages[]
        │                         │
   [후처리]                 diaryStreaks.current       →     streakCount
```

---

## 3. 인증 데이터 흐름

### 3.1 세션 기반 인증 흐름

```mermaid
flowchart TD
    subgraph Login["로그인 흐름"]
        A["Google OAuth 리다이렉트"] --> B["Authorization Code"]
        B --> C["NextAuth: Code → Token 교환"]
        C --> D["DB: users + accounts UPSERT"]
        D --> E["DB: sessions INSERT"]
        E --> F["Cookie: sessionToken (HttpOnly)"]
    end

    subgraph Request["요청별 인증"]
        G["API 요청 + Cookie"] --> H["auth() 호출"]
        H --> I["DB: sessions SELECT"]
        I --> J{세션 유효?}
        J -->|Yes| K["session.user.id 반환"]
        J -->|No| L{Auth Required?}
        L -->|Yes| M["401 반환"]
        L -->|No| N["'default-user' 폴백"]
    end

    style Login fill:#e3f2fd,stroke:#2196f3
    style Request fill:#e8f5e9,stroke:#4caf50
```

### 3.2 사용자 데이터 생성 순서

```
1. users 생성          ← NextAuth 최초 로그인
2. accounts 생성       ← Google OAuth 연결
3. sessions 생성       ← 세션 시작
4. userProfiles 생성   ← 첫 AI 교정 요청 시 (lazy)
5. diaryStreaks 생성   ← 첫 스트릭 조회 시 (lazy)
```

---

## 4. 게이미피케이션 데이터 흐름

### 4.1 XP 부여 데이터 흐름

```mermaid
flowchart TD
    A["grantDiaryXp 호출"] --> B["dailyXpTracking SELECT<br/>(userId + today)"]
    B --> C{diaryCount < 3?}

    C -->|Yes| D["기본 XP +30"]
    C -->|No| E["diary XP 미지급"]

    D --> F{wordCount ≥ 50<br/>& TTR ≥ 0.4?}
    F -->|Yes| G["length_50 +10"]
    F -->|No| H["길이 보너스 없음"]

    G --> I{wordCount ≥ 100?}
    I -->|Yes| J["length_100 +20 추가"]
    I -->|No| K[continue]

    D --> L["checkWeaknessOvercome"]
    L --> M{TOP1 패턴 ≠ 현재?}
    M -->|Yes| N{weaknessCount < 1?}
    N -->|Yes| O["weakness +20"]
    N -->|No| P["약점 XP 미지급"]
    M -->|No| P

    D & G & J & O --> Q["총 XP 계산"]
    Q --> R{XP 부스터 활성?}
    R -->|Yes| S["XP × 2"]
    R -->|No| T["XP × 1"]

    S & T --> U["DB WRITES"]
    U --> U1["userProfiles.xp += total"]
    U --> U2["xpHistory INSERT (각 액션별)"]
    U --> U3["dailyXpTracking UPSERT"]
    U --> U4["레벨 재계산"]

    U4 --> V{레벨업?}
    V -->|Yes| W["xpMessages에 레벨업 추가"]
    V -->|No| X["메시지 반환"]

    style Q fill:#fff3e0,stroke:#ff9800
    style U fill:#e8f5e9,stroke:#4caf50
```

### 4.2 XP 관련 테이블 쓰기 순서

| 순서 | 테이블 | 작업 | 데이터 |
|------|--------|------|--------|
| 1 | `dailyXpTracking` | SELECT | 일일 카운트 확인 |
| 2 | `userMistakes` | SELECT | TOP1 패턴 (7일) |
| 3 | `userProfiles` | UPDATE | xp += amount, xpLevel 재계산 |
| 4 | `xpHistory` | INSERT | 액션별 개별 기록 |
| 5 | `dailyXpTracking` | UPSERT | diaryCount++, weaknessCount++ |

### 4.3 스트릭 데이터 흐름

```mermaid
sequenceDiagram
    participant API as /api/chat
    participant SM as streak-manager
    participant DB as PostgreSQL

    API->>SM: recordDiaryEntry(userId)
    SM->>DB: SELECT diaryStreaks WHERE userId
    alt 레코드 없음
        SM->>DB: INSERT diaryStreaks (streak=1)
        SM-->>API: { currentStreak: 1 }
    else 오늘 이미 작성
        SM-->>API: { currentStreak: N } (변동 없음)
    else 어제 작성
        SM->>DB: UPDATE streak += 1
        SM->>SM: 마일스톤 확인 (7/14/30/...)
        opt 마일스톤 도달
            SM->>DB: SELECT xpHistory (중복 확인)
            SM->>DB: INSERT xpHistory + UPDATE userProfiles.xp
        end
        SM-->>API: { currentStreak: N+1, milestone? }
    else 2일 공백 + 프리즈 보유
        SM->>DB: UPDATE streakFreezeCount -= 1
        SM-->>API: { currentStreak: N, freezeUsed: true }
    else 2일+ 공백
        SM->>DB: UPDATE previousStreak = current, current = 1
        opt previousStreak ≥ 3
            SM->>DB: INSERT xpHistory (welcome_back +50)
        end
        SM-->>API: { currentStreak: 1, welcomeBack: true }
    end
```

---

## 5. 표현노트 데이터 흐름

### 5.1 저장 흐름

```mermaid
sequenceDiagram
    participant C as Client
    participant API as /api/vocabulary
    participant AI as Gemini Flash Lite
    participant XP as xp-service
    participant DB as PostgreSQL

    C->>API: POST { word, meaning, context }
    API->>DB: auth() → userId

    alt context 제공
        API->>AI: 표현 보강 요청
        AI-->>API: { pronunciation, synonyms, difficulty, partOfSpeech }
        API->>DB: INSERT vocabulary (보강 데이터 포함)
    else context 없음
        API->>DB: INSERT vocabulary (기본 데이터만)
    end

    API->>XP: canEarnVocabXpToday(userId)
    XP->>DB: SELECT dailyXpTracking
    alt 상한 미달 (< 5)
        XP->>DB: UPDATE userProfiles.xp += 5
        XP->>DB: INSERT xpHistory (expression_save)
        XP->>DB: UPSERT dailyXpTracking.vocabCount++
        API-->>C: { word, xpGranted: true }
    else 상한 초과
        API-->>C: { word, xpGranted: false, dailyCapReached: true }
    end
```

### 5.2 CRUD 테이블 접근

| 작업 | 엔드포인트 | DB 읽기 | DB 쓰기 |
|------|-----------|--------|--------|
| 목록 조회 | `GET /api/vocabulary` | vocabulary (userId) | - |
| 저장 | `POST /api/vocabulary` | dailyXpTracking | vocabulary, xpHistory, dailyXpTracking, userProfiles |
| 수정 | `PATCH /api/vocabulary/[id]` | vocabulary (소유권) | vocabulary |
| 삭제 | `DELETE /api/vocabulary/[id]` | vocabulary (소유권) | vocabulary (DELETE) |

---

## 6. 결제 데이터 흐름

### 6.1 구독 결제 흐름

```mermaid
sequenceDiagram
    participant C as Client
    participant T as Toss Widget
    participant API as /api/payment/confirm
    participant TOSS as Toss Payments API
    participant DB as PostgreSQL

    C->>T: 결제 위젯 호출
    T->>T: 사용자 결제 진행
    T-->>C: { paymentKey, orderId, amount }

    C->>API: POST { paymentKey, orderId, amount }

    %% 검증 단계
    rect rgb(255, 240, 240)
    note over API: 서버 측 검증
    API->>API: amount === 6900 확인
    API->>TOSS: POST /payments/confirm
    TOSS-->>API: { status: "DONE" }
    end

    %% 구독 활성화
    rect rgb(240, 255, 240)
    note over API,DB: 구독 활성화
    API->>DB: UPSERT subscriptions<br/>(plan: premium, endDate: +1 month)
    API-->>C: { success: true }
    end

    C->>C: /payment/success 리다이렉트
```

### 6.2 구독 만료 처리

```mermaid
flowchart TD
    A["API 요청 수신"] --> B["checkSubscription(userId)"]
    B --> C["SELECT subscriptions<br/>WHERE plan = 'premium'<br/>AND status = 'active'"]
    C --> D{endDate > now?}
    D -->|Yes| E["isPremium = true"]
    D -->|No| F["UPDATE status = 'expired'"]
    F --> G["isPremium = false"]

    style E fill:#e8f5e9,stroke:#4caf50
    style G fill:#fce4ec,stroke:#e91e63
```

### 6.3 결제 관련 테이블

| 테이블 | 시점 | 작업 |
|--------|------|------|
| `subscriptions` | 결제 성공 | UPSERT (plan=premium, endDate=+1mo) |
| `subscriptions` | 만료 확인 | UPDATE (status=expired) |
| `dailyUsage` | 매 교정 | SELECT (canUse 확인), UPSERT (count++) |
| `iapPurchases` | IAP 구매 | INSERT (상품 기록) |

---

## 7. 클라이언트 상태 관리

### 7.1 상태 관리 전략

```mermaid
graph TB
    subgraph Global["전역 상태"]
        SESSION["useSession()<br/>NextAuth SessionProvider"]
    end

    subgraph Page["페이지 상태"]
        VIEW["viewMode<br/>calendar | write | result"]
        DIARY["diaryText, mood"]
        RESULT["correctionResult"]
    end

    subgraph Fetch["서버 상태 (fetch)"]
        USAGE["usageStatus<br/>/api/usage"]
        STREAK["streakInfo<br/>/api/streak"]
        XP["xpStatus<br/>/api/user/xp"]
        HIST["historyEntries<br/>/api/history"]
    end

    subgraph Hook["Custom Hooks"]
        CHAT_HOOK["useChat<br/>(Vercel AI SDK)"]
        XP_HOOK["useXpToast<br/>(XP 알림)"]
    end

    SESSION --> Page
    Page --> Hook
    Hook --> Fetch

    style Global fill:#f3e5f5,stroke:#9c27b0
    style Page fill:#e3f2fd,stroke:#2196f3
    style Fetch fill:#e8f5e9,stroke:#4caf50
    style Hook fill:#fff3e0,stroke:#ff9800
```

### 7.2 상태 갱신 타이밍

| 상태 | 초기 로드 | 갱신 트리거 | 소스 |
|------|----------|-----------|------|
| `session` | 앱 시작 | 로그인/로그아웃 | NextAuth |
| `usageStatus` | 페이지 마운트 | 교정 완료 후 | `GET /api/usage` |
| `streakInfo` | 페이지 마운트 | 교정 완료 후 | `GET /api/streak` |
| `xpStatus` | 페이지 마운트 | 교정/표현 저장 후 | `GET /api/user/xp` |
| `correctionResult` | - | 교정 응답 수신 시 | `POST /api/chat` 응답 |
| `viewMode` | "calendar" | 사용자 액션 | useState |

### 7.3 교정 완료 후 갱신 순서

```
POST /api/chat 응답 수신
    │
    ├─ 1. correctionResult 상태 업데이트
    ├─ 2. viewMode → "result"
    ├─ 3. XP 토스트 메시지 표시 (500ms 간격)
    ├─ 4. fetch /api/usage → usageStatus 갱신
    ├─ 5. fetch /api/streak → streakInfo 갱신
    └─ 6. fetch /api/user/xp → xpStatus 갱신 (레벨업 확인)
```

### 7.4 데이터 미캐싱 전략

| 결정 | 근거 |
|------|------|
| 클라이언트 캐시 없음 | 실시간 정확성 우선 (XP, 스트릭, 사용량) |
| SWR/React Query 미사용 | 상태 단순성 유지, 복잡도 최소화 |
| 매 액션 후 재조회 | 서버 상태와 동기화 보장 |
| 낙관적 업데이트 없음 | 데이터 불일치 방지 |

---

## 8. 데이터 무결성 보장

### 8.1 무결성 전략

```mermaid
flowchart TD
    subgraph Compile["컴파일 타임"]
        TS["TypeScript strict<br/>타입 안전성"]
        DZ["Drizzle ORM<br/>쿼리 타입 검증"]
    end

    subgraph Runtime["런타임"]
        ZOD["Zod 스키마<br/>AI 응답 검증"]
        VAL["입력 검증<br/>5단계 + TTR"]
        AUTH["소유권 검증<br/>userId 매칭"]
    end

    subgraph DB_Level["DB 레벨"]
        FK["FK Constraints<br/>CASCADE DELETE"]
        IDX["복합 인덱스<br/>유니크 제약"]
        ENUM["ENUM 타입<br/>유효값 제한"]
    end

    Compile --> Runtime --> DB_Level

    style Compile fill:#e3f2fd,stroke:#2196f3
    style Runtime fill:#fff3e0,stroke:#ff9800
    style DB_Level fill:#e8f5e9,stroke:#4caf50
```

### 8.2 트랜잭션 범위

| 작업 | 트랜잭션 범위 | 실패 시 |
|------|-------------|--------|
| 메시지 저장 (user + assistant) | 단일 트랜잭션 | 500 반환 |
| XP 부여 (profile + history + tracking) | 개별 쿼리 | 로그만 (Graceful) |
| 스트릭 업데이트 | 단일 쿼리 | 로그만 (Graceful) |
| 구독 활성화 | 단일 쿼리 | 결제 실패 처리 |
| 보물상자 열기 (reward + log + side-effect) | 개별 쿼리 | 부분 적용 가능 |

### 8.3 데이터 일관성 복구

| 불일치 시나리오 | 발생 조건 | 자동 복구 |
|---------------|----------|----------|
| XP 미반영 | 후처리 실패 | 다음 교정 시 정상 적립 |
| 스트릭 미갱신 | 후처리 실패 | 다음 교정 시 정상 갱신 |
| 오답 미기록 | 후처리 실패 | 다음 교정 시 새로 기록 |
| 구독 만료 미처리 | 타이밍 이슈 | 다음 API 호출 시 자동 만료 |
| 사용량 카운트 오차 | UPSERT 경합 | KST 자정 리셋으로 해소 |

### 8.4 데이터 삭제 정책

| 삭제 트리거 | 영향 테이블 | CASCADE 동작 |
|-----------|-----------|-------------|
| 사용자 삭제 | accounts, sessions | CASCADE |
| 채팅 삭제 | messages | CASCADE |
| 표현 삭제 | vocabulary (단일 행) | 직접 DELETE |

> **참고**: 현재 사용자 계정 삭제 기능은 미구현. 향후 GDPR/개인정보보호법 대응 시 구현 필요.

### 8.5 시간대 일관성

| 데이터 | 저장 형식 | 표시 형식 | 일일 리셋 |
|--------|----------|----------|----------|
| `createdAt` (메시지, 채팅) | UTC (ISO 8601) | KST 변환 표시 | - |
| `lastWrittenAt` (스트릭) | KST 날짜 (`YYYY-MM-DD`) | 그대로 표시 | KST 00:00 |
| `date` (dailyUsage, dailyXpTracking) | KST 날짜 | - | KST 00:00 |
| `endDate` (subscriptions) | UTC | KST 변환 비교 | - |

**KST 변환 규칙**: `new Date().toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' })`
