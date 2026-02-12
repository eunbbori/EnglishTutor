# Chat Sequence — 일기 교정 흐름 상세

> **Last Updated**: 2026-02-12

이 문서는 사용자 일기 제출부터 교정 결과 반환까지의 전체 시퀀스를 상세히 기술한다.

---

## 1. 전체 시퀀스 다이어그램

```
┌──────────┐     ┌─────────────┐     ┌──────────────┐     ┌──────────┐
│  Client   │     │  API Route   │     │  LangGraph    │     │  Gemini   │
│ (Browser) │     │ /api/chat    │     │  (graph.ts)   │     │  API      │
└─────┬─────┘     └──────┬──────┘     └──────┬───────┘     └────┬─────┘
      │                  │                    │                   │
      │  POST /api/chat  │                    │                   │
      │ {messages, mood} │                    │                   │
      ├─────────────────►│                    │                   │
      │                  │                    │                   │
      │                  │ [1] auth()         │                   │
      │                  │ [2] getUsageStatus │                   │
      │                  │ [3] getOrCreate    │                   │
      │                  │     UserProfile    │                   │
      │                  │ [4] Load existing  │                   │
      │                  │     messages from  │                   │
      │                  │     DB             │                   │
      │                  │                    │                   │
      │                  │ graph.invoke()     │                   │
      │                  ├───────────────────►│                   │
      │                  │                    │                   │
      │                  │                    │ buildAdaptive     │
      │                  │                    │ Context()         │
      │                  │                    │  ├ user level     │
      │                  │                    │  └ recent mistakes│
      │                  │                    │                   │
      │                  │                    │ model.invoke()    │
      │                  │                    ├──────────────────►│
      │                  │                    │                   │
      │                  │                    │  JSON correction  │
      │                  │                    │◄──────────────────┤
      │                  │                    │                   │
      │                  │                    │ Zod validation    │
      │                  │                    │ Quality check     │
      │                  │                    │                   │
      │                  │                    │ update_memory()   │
      │                  │                    │  └ save mistake   │
      │                  │                    │    pattern to DB  │
      │                  │                    │                   │
      │                  │ correctionResult   │                   │
      │                  │◄───────────────────┤                   │
      │                  │                    │                   │
      │                  │ [5] Save messages  │                   │
      │                  │     to DB          │                   │
      │                  │ [6] incrementUsage │                   │
      │                  │ [7] recordDiary    │                   │
      │                  │     Entry (streak) │                   │
      │                  │ [8] grantDiaryXp   │                   │
      │                  │ [9] saveOrUpdate   │                   │
      │                  │     Mistake        │                   │
      │                  │ [10] checkRecurring│                   │
      │                  │      Pattern →     │                   │
      │                  │      insight       │                   │
      │                  │                    │                   │
      │  JSON Response   │                    │                   │
      │  + X-Chat-Id     │                    │                   │
      │◄─────────────────┤                    │                   │
      │                  │                    │                   │
```

---

## 2. 단계별 상세

### [1] 인증 확인

```typescript
const session = await auth();
const userId = session?.user?.id || "default-user";
const isAuthenticated = !!session?.user?.id;
```

- 비로그인도 교정 가능 (단, 기록 미저장, XP 미부여)

### [2] 사용량 확인

```typescript
if (isAuthenticated) {
  const usageStatus = await getUsageStatus(userId);
  if (!usageStatus.canUse) {
    return Response(429, { code: "USAGE_LIMIT_EXCEEDED" });
  }
}
```

- Free: 3회/일, Premium: 무제한
- 429 응답 시 클라이언트에서 업그레이드 모달 표시

### [3] 사용자 프로필 로드

```typescript
const userProfile = await getOrCreateUserProfile(userId);
const explanationStyle = getExplanationStyle(userProfile);
```

- 프로필 없으면 자동 생성
- 레벨 기반 설명 스타일 결정 (detailed/concise)

### [4] 기존 메시지 로드

```typescript
const existingMessages = await db.select()
  .from(messages).where(eq(messages.chatId, currentChatId));
```

- 새 chatId가 없으면 새 채팅 세션 생성
- 기존 메시지를 LangChain `BaseMessage` 형식으로 변환

### [5] LangGraph 실행

```
initialState → graph.invoke(state)
  ├─ generate_response 노드
  │   ├─ buildAdaptiveContext(userId)
  │   │   ├─ getOrCreateUserProfile → 레벨 조회
  │   │   ├─ getRecentTopMistakes(userId, 3) → 최근 7일 오답 TOP 3
  │   │   └─ 레벨별 프롬프트 가이드라인 생성
  │   ├─ SystemMessage(systemPrompt + adaptiveContext) 구성
  │   ├─ model.invoke([SystemMessage, ...contextMessages])
  │   ├─ JSON 파싱 (regex + JSON.parse)
  │   ├─ correctionSchema.safeParse() — Zod 검증
  │   └─ validateResponseForLevel() — 품질 검증 (로그만)
  └─ update_memory 노드
      └─ UserProfileManager.addRecurringMistake() — DB 저장
```

### [6] 후처리 (DB 저장)

```typescript
// 사용자 메시지 저장
await db.insert(messages).values({ chatId, role: "user", content });

// AI 응답 저장 (JSON)
await db.insert(messages).values({ chatId, role: "assistant", content: JSON.stringify(result) });
```

### [7] 스트릭 업데이트

```typescript
const streakInfo = await recordDiaryEntry(userId);
```

- 연속 작성 일수 계산 → Freeze 처리 → 마일스톤 XP 지급
- 상세 로직은 [COMMON-SYSTEMS.md](./COMMON-SYSTEMS.md#3-스트릭-시스템-streak) 참조

### [8] XP 부여

```typescript
const xpResult = await grantDiaryXp(userId, diaryText, mistakePattern, chatId);
```

- **일기 제출**: +30 XP (일 3회 상한)
- **분량 보너스**: TTR ≥ 0.4 시 30/60/100단어별 +5/+10/+20 XP
- **약점 극복**: 최근 7일 TOP 1 패턴 미발생 시 +20 XP (일 1회)
- 상세는 [COMMON-SYSTEMS.md](./COMMON-SYSTEMS.md#4-xp--레벨-시스템-gamification) 참조

### [9] 오답 패턴 저장

```typescript
await saveOrUpdateMistake(userId, mistakeType, mistakePattern, originalText);
```

- `user_mistakes` 테이블에 패턴 저장/빈도 업데이트
- 3회+ 반복 시 인사이트 메시지 생성

### [10] 응답 반환

```typescript
return Response.json({ object: responseObject }, {
  headers: { "X-Chat-Id": currentChatId },
});
```

- `X-Chat-Id` 헤더로 클라이언트에 chatId 전달
- 이후 같은 세션에서 chatId를 재사용

---

## 3. 에러 처리 전략

| 단계 | 실패 시 동작 |
|------|------------|
| 인증 | 폴백 ("default-user") — 교정은 진행 |
| 사용량 확인 | 429 반환 — 요청 차단 |
| LangGraph | 500 반환 — 전체 실패 |
| JSON 파싱 | 폴백 응답 생성 (원문 그대로) |
| Zod 검증 | 경고 로그 — 파싱된 JSON 사용 |
| 메시지 저장 | 로그만 — 교정 결과는 반환 |
| 스트릭 업데이트 | 로그만 — 교정 결과는 반환 |
| XP 부여 | 로그만 — 교정 결과는 반환 |
| 오답 저장 | 로그만 — 교정 결과는 반환 |

**원칙**: AI 교정 결과는 가능한 한 항상 반환한다. 부가 기능(XP, 스트릭, 오답 저장)은 실패해도 핵심 기능을 차단하지 않는다.

---

## 4. 클라이언트 사이드 흐름

```
[사용자 입력 (diary-editor.tsx)]
    │
    ├─ 클라이언트 검증 (최소 20자, 5단어, 반복 문자/단어)
    │   └─ 미충족 시 제출 버튼 비활성화 + 안내 메시지
    │
    ├─ 기분 선택 (mood-selector.tsx) — optional
    │
    ▼
[POST /api/chat 호출]
    │
    ├─ Loading UI (loading-message.tsx)
    │
    ▼
[응답 수신]
    ├─ CorrectionCard 표시 (교정 결과)
    ├─ XP 피드백 표시 (xp-feedback.tsx / xp-toast.tsx)
    ├─ 인사이트 표시 (반복 오답 시)
    └─ chatId 저장 (다음 요청에 재사용)
```

---

## 5. 데이터 흐름 요약 (테이블 영향)

하나의 일기 교정 요청이 영향을 미치는 테이블:

| 테이블 | 작업 | 조건 |
|--------|------|------|
| `chats` | INSERT | 새 세션일 때 |
| `messages` | INSERT (×2) | user + assistant 메시지 |
| `daily_usage` | INSERT/UPDATE | 인증된 사용자 |
| `diary_streaks` | UPDATE | 인증된 사용자 |
| `user_profiles` | UPDATE | 오답 패턴 감지 시 |
| `user_mistakes` | INSERT/UPDATE | 오답 패턴 감지 시 |
| `daily_xp_tracking` | INSERT/UPDATE | XP 부여 시 |
| `xp_history` | INSERT (×N) | XP 부여 시 (일기+분량+약점) |
