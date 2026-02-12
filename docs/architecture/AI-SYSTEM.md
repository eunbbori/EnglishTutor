# AI System

> **Last Updated**: 2026-02-12

---

## 1. 개요

Daily English의 AI 시스템은 **LangGraph 기반 상태 머신**으로 구현되며, Google Gemini(`gemini-2.5-pro`)를 LLM으로 사용한다. 사용자 레벨에 따라 설명 깊이를 자동 조절하는 **적응형 프롬프트**와, 반복 오답 패턴을 추적하는 **Fact Memory**가 핵심 특징이다.

### 기술 스택

| 구성 요소 | 기술 | 용도 |
|-----------|------|------|
| LLM | Google Gemini 2.5 Pro | 일기 교정 (메인) |
| LLM (경량) | Gemini 2.0 Flash Lite | 어휘 보강 (vocabulary enrichment) |
| 오케스트레이션 | LangGraph (`@langchain/langgraph`) | 상태 머신 기반 워크플로우 |
| 메시지 처리 | LangChain Core (`@langchain/core`) | BaseMessage 변환 |
| 스키마 검증 | Zod | AI 응답 구조 강제 |

---

## 2. LangGraph 워크플로우

### State 정의 (`lib/ai/graph.ts`)

```typescript
ConversationState = {
  messages: BaseMessage[],        // 대화 메시지 배열
  summary: string,                // 이전 대화 요약
  userProfile: RecurringMistake[], // 사용자 반복 오답 패턴
  messageCount: number,           // 메시지 수
  chatId: string,                 // 채팅 세션 ID
  userId: string,                 // 사용자 ID
  correctionResult: any,          // AI 교정 결과
  diaryContext: DiaryContext,      // 일기 모드 컨텍스트
}
```

### Graph 구조

```
[START]
    ↓
[generate_response]
    │  1. 사용자 레벨 기반 적응형 프롬프트 구성
    │  2. 최근 오답 패턴(7일) 컨텍스트 포함
    │  3. Gemini API 호출
    │  4. JSON 파싱 + Zod 스키마 검증
    │  5. 레벨별 응답 품질 검증
    ↓
[update_memory]
    │  1. 교정 결과에서 오답 패턴 감지 시 DB 저장
    ↓
[END]
```

### 노드 상세

#### `generate_response`

1. **적응형 컨텍스트 구성** (`buildAdaptiveContext`)
   - `getOrCreateUserProfile(userId)` → 사용자 레벨 조회
   - `getRecentTopMistakes(userId, 3)` → 최근 7일 TOP 3 오답 패턴
   - 레벨별 설명 가이드라인 생성 (Beginner/Intermediate/Advanced)

2. **LLM 호출**
   - System 프롬프트 + 적응형 컨텍스트를 SystemMessage로 전달
   - 기존 대화 summary + 최근 메시지를 컨텍스트로 포함
   - `ChatGoogleGenerativeAI` (`gemini-2.5-pro`, temperature: 0.9)

3. **응답 처리**
   - JSON 추출 (정규식 `\{[\s\S]*\}` 매치)
   - `correctionSchema.safeParse()` 로 Zod 검증
   - 실패 시 파싱된 JSON을 그대로 사용 (디버깅 목적)

4. **품질 검증** (`response-validator.ts`)
   - 한국어 비율, 설명 길이, 어휘 복잡도 검증
   - 경고만 로그 (요청 차단하지 않음)

#### `update_memory`

- 교정 결과에 `mistakePattern`이 있으면 `UserProfileManager.addRecurringMistake()` 호출
- 비동기 처리 — 사용자 응답 속도에 영향 없음

---

## 3. AI 응답 스키마 (`lib/ai/schema.ts`)

```typescript
correctionSchema = z.object({
  originalText: string,            // 사용자 원문
  correctedText: string,           // 교정된 문장
  koreanExplanation: string,       // 한국어 설명
  alternatives: [                  // 대안 표현 3개
    { type: "Casual" | "Expressive" | "Simple", text: string }
  ],
  mistakeType: string | null,      // 오답 분류 (category:subcategory)
  mistakePattern: string | null,   // 오답 패턴 (kebab-case)
  insight: string?,                // 반복 오답 인사이트 (3회+ 시)
  keywords: string[]?,             // 주제 키워드 (최대 3개)
  xpMessages: string[]?,           // XP 획득 메시지 (서버에서 추가)
  cappedByDailyLimit: boolean?,    // 일일 XP 상한 도달 여부
})
```

### 오답 분류 체계 (`mistakeType`)

| 카테고리 | 서브카테고리 | 예시 |
|----------|-------------|------|
| `grammar` | `tense`, `subject_verb_agreement`, `preposition`, `article`, `word_order`, `plural` | "grammar:tense" |
| `expression` | `unnatural`, `too_formal`, `direct_translation` | "expression:direct_translation" |
| `vocabulary` | `word_choice`, `collocation` | "vocabulary:word_choice" |

### 오답 패턴 (`mistakePattern`)

kebab-case 형식: `tense-confusion`, `preposition-usage`, `article-usage`, `subject-verb-agreement`, `direct-translation`, `word-order`, `collocation`, `vocabulary-choice`

---

## 4. 적응형 프롬프트 (Level-Based)

사용자 XP 레벨에 따라 AI 설명 스타일이 자동 조절된다.

### 레벨별 설명 전략

| 레벨 | 스타일 | 한국어 비율 | 특징 |
|------|--------|-----------|------|
| Lv.1~10 (Beginner) | `detailed` | 70-90% | 간단한 어휘, 단계별 분석, 격려 톤 |
| Lv.11~20 (Intermediate) | `concise` | 50-70% | 핵심 교정 포인트 위주, 일부 영어 설명 |
| Lv.21+ (Advanced) | `concise` | 30-50% | 핵심만 간결하게, 영어 중심, 고급 표현 도전 |

### 응답 품질 검증 (`lib/ai/response-validator.ts`)

레벨별 기대치와 실제 응답 품질을 비교한다:

| 지표 | `detailed` 기대값 | `concise` 기대값 |
|------|-------------------|-----------------|
| 어휘 복잡도 | 0~40 | 30~70 |
| 설명 길이 | 150~600자 | 60~300자 |
| 한국어 비율 | 70~100% | 40~70% |

검증 실패 시 경고 로그만 남기고 요청은 정상 처리한다.

---

## 5. Fact Memory (반복 오답 추적)

### `UserProfileManager` (`lib/ai/user-profile.ts`)

모든 대화에서 사용자의 반복 실수 패턴을 추적하는 싱글톤 메모리이다.

```typescript
interface RecurringMistake {
  pattern: string;      // "subject-verb agreement"
  examples: string[];   // ["he go", "she have"] (최근 5개)
  count: number;        // 발생 횟수
  lastSeen: string;     // ISO 타임스탬프
}
```

### 주요 메서드

| 메서드 | 역할 |
|--------|------|
| `getProfile()` | 프로필 조회 또는 생성 |
| `addRecurringMistake(pattern, example)` | 반복 오답 추가/업데이트 |
| `getRecurringMistakesSummary()` | LLM 컨텍스트용 요약 (TOP 5) |
| `updatePreferences(preferences)` | 학습 선호도 업데이트 |

### 데이터 흐름

```
[교정 완료] → mistakePattern 감지
    ↓
[update_memory 노드]
    ↓
UserProfileManager.addRecurringMistake()
    ├─ 기존 패턴 있음: count +1, examples 업데이트 (최근 5개)
    └─ 새 패턴: 신규 추가
    ↓
userProfiles.recurringMistakes 업데이트 (JSONB)
```

---

## 6. 어휘 보강 (Vocabulary Enrichment)

### `enrichVocabulary` (`lib/ai/vocabulary-enricher.ts`)

표현노트에 단어를 저장할 때 AI가 자동으로 부가 정보를 보강한다.

| 필드 | 설명 | 예시 |
|------|------|------|
| `meaning` | 한국어 뜻 (문맥 기반) | "감사하는" |
| `pronunciation` | IPA 발음 | "/ˈɡreɪtfəl/" |
| `partOfSpeech` | 품사 | "adjective" |
| `synonyms` | 유의어 (최대 3개) | ["thankful", "appreciative"] |
| `example` | 새 예문 | "I'm grateful for your help." |
| `difficulty` | 난이도 | "intermediate" |

### 구현 세부

- **모델**: `gemini-2.0-flash-lite` (경량, 빠른 응답)
- **Temperature**: 0.3 (일관성 중시)
- **Timeout**: 5초 (실패 시 기본값 없이 저장 — 보강 없는 상태)
- **Structured Output**: LangChain의 `withStructuredOutput(vocabularyEnrichmentSchema)` 사용

---

## 7. 인사이트 생성 (Recurring Mistake Insight)

3회 이상 반복되는 오답 패턴이 감지되면 사용자에게 학습 인사이트를 제공한다.

### 동작 흐름 (`app/api/chat/route.ts`)

```
[교정 결과에 mistakeType + mistakePattern 존재]
    ↓
saveOrUpdateMistake(userId, type, pattern, text)
    ↓
checkRecurringPattern(userId, pattern)
    ├─ frequency < 3: 인사이트 미생성
    └─ frequency ≥ 3: generateInsightMessage() 호출
        ↓
correctionResult.insight에 추가하여 응답 반환
```

### 인사이트 예시

```
📝 자주 틀리는 부분이에요 (5회)

일기는 보통 과거에 있었던 일을 쓰는 거라서, 과거 시제를 자주 써요.
'go → went', 'eat → ate' 같은 불규칙 과거형을 틈틈이 외워보세요!

매일 일기 쓰면서 자연스럽게 실력이 늘거에요! 오늘도 수고했어요 ✨
```

패턴별 맞춤형 인사이트: `tense-confusion`, `subject-verb-agreement`, `preposition-usage`, `article-usage`, `word-order`, `direct-translation` 등

---

## 8. 시스템 프롬프트 요약

시스템 프롬프트의 핵심 지침:

1. **역할**: Daily English — 한국인을 위한 영어 일기 교정 튜터
2. **톤**: 따뜻하고 격려하는 톤 (잘한 점 칭찬 → 교정 설명)
3. **응답 포맷**: JSON (`correctionSchema` 구조)
4. **교정 포커스**: 과거 시제, 감정 표현, 일상 어휘, 문장 구조, 한영 직역 패턴
5. **적응형 컨텍스트**: `{USER_PROFILE_CONTEXT}` 플레이스홀더에 레벨별 가이드라인 삽입
6. **오답 분류**: `mistakeType` (category:subcategory) + `mistakePattern` (kebab-case)

---

## 9. 관련 파일 참조

| 파일 | 역할 |
|------|------|
| `lib/ai/graph.ts` | LangGraph StateGraph (메인 워크플로우) |
| `lib/ai/schema.ts` | Zod 스키마 (`CorrectionResponse`) |
| `lib/ai/response-validator.ts` | 레벨별 응답 품질 검증 |
| `lib/ai/user-profile.ts` | `UserProfileManager` (Fact Memory) |
| `lib/ai/vocabulary-enricher.ts` | 어휘 보강 AI |
| `lib/db/user-profile.ts` | 프로필 DB 쿼리 |
| `lib/db/mistakes.ts` | 오답 패턴 DB 쿼리 |
| `app/api/chat/route.ts` | API 핸들러 (LangGraph 호출, 인사이트 생성) |
