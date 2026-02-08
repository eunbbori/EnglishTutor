# Daily English - 상세 기능 명세서

> **문서 버전**: 1.0
> **최종 갱신일**: 2026-01-30
> **작성 기준**: 코드베이스 역설계 기반 (추측 없이 구현된 로직만 기술)

---

## 목차

1. [시스템 개요](#1-시스템-개요)
2. [인증 및 사용자 관리](#2-인증-및-사용자-관리)
3. [일기 작성 및 AI 교정](#3-일기-작성-및-ai-교정)
4. [캘린더 뷰](#4-캘린더-뷰)
5. [일기 기록 조회](#5-일기-기록-조회)
6. [표현노트 (단어/구문 저장)](#6-표현노트)
7. [오답 패턴 분석](#7-오답-패턴-분석)
8. [연속 작성 (스트릭) 시스템](#8-연속-작성-스트릭-시스템)
9. [일기 보상 시스템](#9-일기-보상-시스템)
10. [사용량 제한 및 구독 관리](#10-사용량-제한-및-구독-관리)
11. [결제 시스템](#11-결제-시스템)
12. [대화 메모리 관리](#12-대화-메모리-관리)
13. [데이터 모델](#13-데이터-모델)
14. [API 명세](#14-api-명세)

---

## 1. 시스템 개요

### 1.1 서비스 명칭
- **Daily English** (서비스명)
- **Politely** (결제/구독 시 사용되는 브랜드명)

### 1.2 서비스 목적
한국어 화자를 대상으로 영어 일기 작성 → AI 교정 → 오답 분석 → 표현 저장의 순환 학습을 지원하는 웹 애플리케이션.

### 1.3 기술 아키텍처

| 레이어 | 기술 |
|--------|------|
| 프레임워크 | Next.js 15 (App Router) |
| 언어 | TypeScript (Strict mode) |
| AI 엔진 | Google Gemini 2.5 Pro (교정), Gemini 2.0 Flash Lite (어휘 보강), Gemini 2.0 Flash Exp (요약) |
| AI 오케스트레이션 | LangGraph (상태 기계 기반 대화 흐름) |
| 데이터베이스 | Neon (Serverless PostgreSQL) + Drizzle ORM |
| 인증 | NextAuth.js 5.0 (Google OAuth) |
| 결제 | Toss Payments API |
| UI | Shadcn UI (Radix), Tailwind CSS, Lucide Icons |

### 1.4 화면 구성 (라우팅)

| 경로 | 화면명 | 설명 |
|------|--------|------|
| `/` | 메인 화면 | 캘린더, 일기 작성, 교정 결과를 전환하여 표시 |
| `/history` | 일기 기록 목록 | 과거 일기 목록 (최대 50건) |
| `/history/[id]` | 일기 상세 | 특정 일기의 교정 결과 상세 |
| `/vocabulary` | 표현노트 | 저장한 단어/표현 관리 |
| `/pricing` | 가격 안내 | 구독 플랜 소개 |
| `/payment/success` | 결제 성공 | 결제 완료 처리 |
| `/payment/fail` | 결제 실패 | 결제 실패 안내 |

---

## 2. 인증 및 사용자 관리

### FN-AUTH-001: Google OAuth 로그인

#### 입력 조건
- 사용자가 로그인 버튼 클릭

#### 처리 로직
1. NextAuth.js가 Google OAuth 2.0 인증 플로우를 시작한다.
2. 인증 성공 시 `users` 테이블에 사용자 정보(이름, 이메일, 프로필 이미지)를 저장한다.
3. `accounts` 테이블에 OAuth 연결 정보(provider, access_token, refresh_token 등)를 저장한다.
4. `sessions` 테이블에 세션을 생성한다.
5. 콜백에서 `session.user.id`에 사용자 고유 ID를 주입한다.

#### 출력 결과
- 인증된 세션 (user.id, user.name, user.email, user.image 포함)
- 로그인 실패 시 `/` (홈)으로 리다이렉트

#### 예외 처리
- OAuth 인증 실패: 홈 페이지로 리다이렉트 (별도 에러 페이지 없음)
- 세션 만료: 자동으로 로그아웃 처리

### FN-AUTH-002: 비로그인 게스트 접근

#### 입력 조건
- 인증 없이 서비스에 접근

#### 처리 로직
1. API 호출 시 세션이 없으면 `default-user` ID를 부여한다.
2. 사용량 API에서 게스트 사용자를 위해 `isGuest: true`로 응답한다.
3. 네비게이션의 기록/표현노트 링크는 노출하지 않는다.

#### 출력 결과
- 일기 작성 및 교정 기능 사용 가능 (제한적)
- 기록/표현노트/연속작성 기능은 로그인 필요

#### 예외 처리
- 없음 (게스트도 기본 기능 사용 가능)

---

## 3. 일기 작성 및 AI 교정

### FN-DIARY-001: 일기 작성

#### 입력 조건
- 사용자가 일기 본문 텍스트를 입력
- (선택) 기분 선택: 6종 중 하나 (`happy`, `neutral`, `sad`, `excited`, `tired`, `anxious`)
- (선택) 작성 모드: 쓰기 모드(`free`) 또는 챌린지 모드(`challenge`)
- (쓰기 모드) 오늘의 주제 힌트: 10종의 정적 프롬프트 중 날짜 기반으로 선택됨
- (챌린지 모드) 오늘의 단어: 20종의 정적 단어 목록에서 일자 기반 순환

#### 처리 로직
1. 텍스트 입력 후 `교정받기` 버튼 클릭 또는 `⌘+Enter` 단축키로 제출한다.
2. 빈 텍스트 제출은 차단한다 (`text.trim()` 검증).
3. 제출 시 프론트엔드에서 `POST /api/chat`을 호출한다.
4. 요청 본문에 메시지, 모드(`diary`), 기분, 주제 ID를 포함한다.

#### 출력 결과
- 화면이 `write` → `result` 뷰로 전환된다.
- 교정 결과 데이터를 수신하여 표시한다.

#### 예외 처리
- 사용량 초과 (HTTP 429): 업그레이드 모달을 표시한다.
- API 오류: "오류가 발생했습니다. 다시 시도해주세요." 메시지와 함께 결과 뷰를 표시한다.

### FN-DIARY-002: AI 교정 처리 (서버)

#### 입력 조건
- `POST /api/chat` 요청 수신
- 필수: 사용자 메시지 (마지막 메시지가 `user` 역할이어야 함)
- 선택: `chatId` (기존 대화 이어쓰기 시), `mode`, `mood`

#### 처리 로직

**1단계: 인증 및 사전 검증**
1. 환경 변수 검증 (`GOOGLE_GENERATIVE_AI_API_KEY`, `DATABASE_URL` 존재 여부).
2. 세션에서 사용자 ID를 추출한다 (미인증 시 `default-user`).
3. 인증된 사용자는 사용량 상태를 확인한다 (`getUsageStatus`).
4. 사용 불가(`canUse === false`) 시 429 응답과 함께 `USAGE_LIMIT_EXCEEDED` 코드를 반환한다.

**2단계: 대화 세션 관리**
1. `chatId`가 없으면 `chats` 테이블에 새 채팅 세션을 생성한다.
2. 채팅 제목은 사용자 메시지의 처음 50자로 설정한다.
3. 기존 메시지를 DB에서 로드하여 LangChain 메시지 형식으로 변환한다.

**3단계: LangGraph 실행**
1. 사용자 프로필을 조회/생성한다 (설명 수준, 학습 목표).
2. LangGraph 상태 기계를 초기화한다.
3. 초기 상태: 메시지 목록, 요약, 사용자 프로필(반복 오답), 메시지 수, 일기 컨텍스트.
4. `generate_response` 노드 → `update_memory` 노드 순서로 실행한다.

**3-1단계: 응답 생성 (`generate_response` 노드)**
1. 사용자 수준 및 최근 오답(7일 이내 TOP 3)으로 적응형 컨텍스트를 구축한다.
2. 시스템 프롬프트에 사용자 프로필 컨텍스트를 삽입한다.
3. 기존 요약이 있으면 메시지 앞에 추가한다.
4. Gemini 2.5 Pro 모델을 호출한다 (temperature: 0.9).
5. 응답에서 JSON을 추출하고 Zod 스키마로 검증한다.
6. 검증 실패 시 파싱된 JSON을 그대로 사용한다.
7. JSON 파싱 실패 시 폴백 응답을 생성한다.
8. 응답 품질을 사용자 수준에 맞게 검증한다.

**3-2단계: 메모리 갱신 (`update_memory` 노드)**
1. 오답 패턴이 감지되었으면 사용자 프로필에 기록한다.
2. 메시지 수가 5개를 초과하면 대화 요약을 트리거한다.
3. 요약 시 오래된 메시지를 압축하고 최근 3개만 유지한다.

**4단계: 후처리**
1. 사용자 메시지와 AI 응답(JSON 문자열)을 `messages` 테이블에 저장한다.
2. 기분이 제공되었으면 응답 JSON에 기분 정보를 병합한다.
3. 인증된 사용자의 사용량을 1 증가시킨다.
4. 일기 스트릭을 갱신한다.
5. 오답 패턴을 `user_mistakes` 테이블에 저장/갱신한다.
6. 반복 패턴(7일 내 3회 이상) 감지 시 인사이트 메시지를 생성한다.

#### 출력 결과

교정 결과 JSON 구조:

| 필드 | 타입 | 설명 |
|------|------|------|
| `originalText` | `string` | 사용자 원문 |
| `correctedText` | `string` | 교정된 영어 텍스트 |
| `koreanExplanation` | `string` | 한국어 교정 설명 (격려 → 수정 설명 순) |
| `alternatives` | `Array<{type, text}>` | 3가지 대안 표현 (Casual, Expressive, Simple) |
| `mistakeType` | `string \| null` | 오답 분류 ("category:subcategory" 형식) |
| `mistakePattern` | `string \| null` | 오답 패턴 (kebab-case, 예: "tense-confusion") |
| `insight` | `string \| undefined` | 반복 오답 인사이트 (3회 이상 시 생성) |
| `keywords` | `string[] \| undefined` | 일기 주제 키워드 (최대 3개) |
| `mood` | `string \| undefined` | 사용자 선택 기분 |

응답 헤더에 `X-Chat-Id`로 채팅 세션 ID를 포함한다.

#### 예외 처리

| 조건 | HTTP 상태 | 응답 |
|------|-----------|------|
| API 키 미설정 | 500 | `"Server configuration error"` |
| DB URL 미설정 | 500 | `"Server configuration error"` |
| 사용량 초과 | 429 | `"USAGE_LIMIT_EXCEEDED"` 코드 + 사용 현황 |
| 잘못된 메시지 형식 | 400 | `"Invalid message format"` |
| 내부 오류 | 500 | `"Internal Server Error"` + 상세 내용 |

### FN-DIARY-003: 적응형 설명 수준

#### 입력 조건
- 사용자 프로필의 설명 수준 설정

#### 처리 로직

| 수준 | 설명 스타일 | 한국어 비율 |
|------|-------------|-------------|
| `detailed` (상세) | 간단한 어휘, 짧은 문장, 단계별 분석, 친근한 톤 | 70-90% |
| `concise` (간결) | 핵심 교정 포인트만, 효율적인 설명 | 40-60% |

#### 출력 결과
- 사용자 수준에 맞춘 한국어 교정 설명

#### 예외 처리
- 프로필 조회 실패 시 빈 컨텍스트로 기본 프롬프트 사용

### FN-DIARY-004: 오답 분류 체계

#### 입력 조건
- AI 교정 결과에서 추출된 오답 정보

#### 처리 로직

**오답 유형 분류 (`mistakeType`)**:

| 카테고리 | 하위 분류 | 설명 |
|----------|-----------|------|
| `grammar` | `tense` | 시제 오류 (특히 과거 시제) |
| `grammar` | `subject_verb_agreement` | 주어-동사 수 일치 |
| `grammar` | `preposition` | 전치사 오용/누락 |
| `grammar` | `article` | 관사 오용/누락 |
| `grammar` | `word_order` | 어순 오류 |
| `grammar` | `plural` | 단수/복수 오류 |
| `expression` | `unnatural` | 문법적으로 맞지만 부자연스러운 표현 |
| `expression` | `too_formal` | 일기에 비해 지나치게 격식체 |
| `expression` | `direct_translation` | 한국어 직역 |
| `vocabulary` | `word_choice` | 부적절한 단어 선택 |
| `vocabulary` | `collocation` | 부자연스러운 단어 조합 |

**오답 패턴 (`mistakePattern`)**:
- `tense-confusion`, `subject-verb-agreement`, `preposition-usage`, `article-usage`
- `direct-translation`, `word-order`, `collocation`, `vocabulary-choice`
- 오류가 없으면 `null`

#### 출력 결과
- 구조화된 오답 분류 정보 (카테고리:하위분류 형식)

#### 예외 처리
- 입력이 이미 자연스러운 영어인 경우 `null` 반환

### FN-DIARY-005: 반복 오답 인사이트 생성

#### 입력 조건
- 7일 이내 동일 오답 패턴이 3회 이상 감지됨

#### 처리 로직
1. `checkRecurringPattern`으로 반복 여부를 확인한다.
2. 패턴별 사전 정의된 인사이트 메시지를 선택한다.

| 패턴 | 인사이트 내용 |
|------|--------------|
| `tense-confusion` | 과거 시제(불규칙 과거형) 외우기 권장 |
| `subject-verb-agreement` | 3인칭 단수 동사 -s 규칙 안내 |
| `preposition-usage` | 전치사 표현 통째로 외우기 권장 |
| `article-usage` | the/a/an 사용법 안내 |
| `word-order` | 영어 어순(SVO) 안내 |
| `direct-translation` | 영어식 표현 익히기 권장 |
| 기타 | "{패턴명} 부분을 조금만 더 연습하면 금방 늘어요!" |

#### 출력 결과
- `insight` 필드에 한국어 인사이트 메시지 (격려 포함)
- 형식: "📝 **자주 틀리는 부분이에요** ({횟수}회)\n\n{인사이트}\n\n매일 일기 쓰면서 자연스럽게 실력이 늘거에요! 오늘도 수고했어요 ✨"

#### 예외 처리
- 인사이트 생성 실패 시 교정 요청 자체는 실패하지 않음 (비차단)

### FN-DIARY-006: 오늘의 주제 (쓰기 모드)

#### 입력 조건
- 쓰기 모드(`free`) 선택 상태

#### 처리 로직
1. 10종의 정적 주제 목록에서 날짜 기반으로 기본 주제를 선택한다.
   - 선택 공식: `dayOfYear % 10` (연중 일수를 주제 수로 나눈 나머지)
2. "다른 주제 찾기" 버튼으로 랜덤 변경 가능 (횟수 무제한).
3. 변경 시 300ms 애니메이션과 함께 전환된다.

**주제 목록**:

| ID | 주제 |
|----|------|
| `how-was-day` | 오늘 하루 어땠나요? |
| `food` | 오늘 먹은 음식 중 가장 맛있었던 것은? |
| `memorable-moment` | 오늘 가장 기억에 남는 순간은? |
| `weekend-plans` | 주말에 뭘 하고 싶나요? |
| `hobby` | 요즘 빠져있는 취미가 있나요? |
| `learned-today` | 오늘 새로 배운 것이 있나요? |
| `movie-drama` | 최근에 본 영화나 드라마는? |
| `grateful` | 오늘 감사한 일 세 가지는? |
| `tomorrow` | 내일 가장 기대되는 일은? |
| `worry` | 요즘 고민이 있다면? |

#### 출력 결과
- 주제 제목과 영어 플레이스홀더 텍스트를 표시한다.

#### 예외 처리
- 주제 선택 해제 가능 (자유 작성)

---

## 4. 캘린더 뷰

### FN-CAL-001: 월별 캘린더 표시

#### 입력 조건
- `GET /api/calendar/{year}/{month}` 호출
- `year`: 숫자 (예: 2026), `month`: 1~12

#### 처리 로직
1. 요청된 월의 시작일~종료일 범위를 계산한다.
2. 해당 기간 내 사용자의 채팅 세션을 조회한다.
3. 각 채팅에서 사용자 메시지(원문)와 AI 응답(교정 결과)을 추출한다.
4. AI 응답 JSON에서 기분(`mood`)과 키워드(`keywords`)를 파싱한다.
5. 사용자 메시지의 단어 수를 계산한다.
6. 날짜 키를 KST(UTC+9) 기준 `YYYY-MM-DD` 형식으로 변환한다.
7. 같은 날 여러 항목이 있으면 마지막 항목을 유지한다.

#### 출력 결과

```json
{
  "year": 2026,
  "month": 1,
  "entries": {
    "2026-01-15": {
      "chatId": "uuid",
      "mood": "happy",
      "keywords": ["work", "coffee"],
      "wordCount": 42,
      "preview": "Today I went to..."
    }
  }
}
```

- 각 날짜별: 채팅 ID, 기분, 키워드, 단어 수, 미리보기(100자)

#### 예외 처리

| 조건 | 처리 |
|------|------|
| 잘못된 연/월 파라미터 | 400 "Invalid year or month parameter" |
| 비인증 사용자 | `default-user` ID로 조회 |
| JSON 파싱 실패 | 기분/키워드 없이 항목 생성 |
| 서버 오류 | 500 "Failed to fetch calendar data" |

---

## 5. 일기 기록 조회

### FN-HIST-001: 일기 목록 조회

#### 입력 조건
- `GET /api/history` 호출
- 인증된 사용자

#### 처리 로직
1. 사용자의 채팅 세션을 최신순으로 최대 50건 조회한다.
2. 각 채팅에서 사용자 메시지와 AI 응답을 추출한다.
3. AI 응답 JSON에서 원문, 교정문, 한국어 설명을 파싱한다.
4. 채팅당 첫 번째 교환만 추출한다 (1채팅 = 1일기).

#### 출력 결과
```json
{
  "entries": [
    {
      "id": "message-uuid",
      "chatId": "chat-uuid",
      "originalText": "Today I eat...",
      "correctedText": "Today I ate...",
      "koreanExplanation": "...",
      "createdAt": "2026-01-15T09:00:00.000Z"
    }
  ],
  "isGuest": false
}
```

#### 예외 처리

| 조건 | 처리 |
|------|------|
| 비인증 사용자 | `entries: [], isGuest: true` 반환 |
| 항목 없음 | `entries: [], isGuest: false` 반환 |
| JSON 파싱 실패 | 해당 항목 건너뛰기 |
| 서버 오류 | 500 "Failed to fetch history" |

### FN-HIST-002: 일기 상세 조회

#### 입력 조건
- `GET /api/history/{id}` 호출
- 경로 파라미터: 채팅 ID

#### 처리 로직
1. 지정된 채팅 ID의 메시지들을 조회한다.
2. 사용자 메시지와 AI 응답을 추출/파싱한다.
3. 소유권 확인: 해당 채팅이 요청 사용자의 것인지 검증한다.

#### 출력 결과
- 원문, 교정문, 설명, 대안 표현, 기분, 키워드 등 전체 교정 데이터

#### 예외 처리
- 존재하지 않는 ID: 404 응답
- 권한 없음: 401 응답

---

## 6. 표현노트

### FN-VOCAB-001: 표현 목록 조회

#### 입력 조건
- `GET /api/vocabulary` 호출
- 인증 필수

#### 처리 로직
1. 사용자의 저장된 표현을 최신순으로 전체 조회한다.

#### 출력 결과
- 표현 배열 (단어, 뜻, 예문, 메모, 발음, 품사, 동의어, 원문 컨텍스트, 난이도, 출처 유형)

#### 예외 처리
- 비인증: 401 "Unauthorized"
- 서버 오류: 500 "Failed to fetch vocabulary"

### FN-VOCAB-002: 표현 저장 (AI 보강 포함)

#### 입력 조건
- `POST /api/vocabulary` 호출
- 필수: `word` (단어/구문, 빈 문자열 불가)
- 선택: `meaning`, `example`, `memo`, `sourceType`, `sourceId`, `context`

#### 처리 로직

**1단계: 입력 검증**
- `word`가 비어있거나 공백만 있으면 400 응답.

**2단계: AI 보강 (선택적)**
- `context`가 제공되면 Gemini 2.0 Flash Lite 모델로 AI 보강을 시도한다.
- AI 보강 요청 사항:
  - 한국어 뜻 (문맥 고려)
  - IPA 발음 기호
  - 품사
  - 동의어 (최대 3개)
  - 새로운 예문 (원문과 다른 문장)
  - 난이도 (beginner/intermediate/advanced)
- 타임아웃: 5초. 초과 시 보강 없이 저장 진행.

**3단계: 데이터 병합 및 저장**
- AI 보강 결과를 우선 사용하고, 실패 시 사용자 입력값을 사용한다.
- `vocabulary` 테이블에 삽입한다.

#### 출력 결과
```json
{
  "word": { /* 저장된 표현 전체 데이터 */ },
  "enrichmentFailed": false
}
```
- HTTP 201 Created
- `enrichmentFailed`: AI 보강 실패 여부 (클라이언트에서 참고)

#### 예외 처리

| 조건 | 처리 |
|------|------|
| `word` 비어있음 | 400 "Word is required" |
| AI 보강 타임아웃 (5초) | 보강 없이 저장 계속 |
| AI 보강 실패 | `enrichmentFailed: true`로 표시, 저장은 진행 |
| 비인증 | 401 "Unauthorized" |
| 서버 오류 | 500 "Failed to save word" |

### FN-VOCAB-003: 표현 삭제

#### 입력 조건
- `DELETE /api/vocabulary/{id}` 호출
- 경로 파라미터: 표현 레코드 ID

#### 처리 로직
1. 해당 ID의 레코드를 삭제한다.
2. 삭제 전 사용자 소유권 확인은 API 레벨에서 수행한다.

#### 출력 결과
- 성공 시 200 OK

#### 예외 처리
- 비인증: 401

### FN-VOCAB-004: 텍스트 선택으로 표현 저장

#### 입력 조건
- 교정 결과 페이지에서 텍스트를 드래그하여 선택
- `SelectableText` 컴포넌트 내에서 동작

#### 처리 로직
1. 사용자가 텍스트를 선택하면 툴팁이 표시된다.
2. "표현노트에 저장" 버튼을 누르면 선택된 텍스트와 전체 문맥을 서버에 전송한다.
3. 서버에서 AI 보강 후 저장한다.

#### 출력 결과
- 토스트 알림으로 저장 성공/실패 안내

#### 예외 처리
- 이미 저장된 표현: 중복 저장 가능 (별도 중복 검증 없음)

### FN-VOCAB-005: 저장된 표현 하이라이트

#### 입력 조건
- 교정 결과 텍스트에 저장된 표현이 포함된 경우

#### 처리 로직
1. `/api/vocabulary`에서 사용자의 전체 단어 목록을 조회한다.
2. 단어를 길이 내림차순으로 정렬한다 (긴 구문 우선 매칭).
3. 정규식으로 텍스트에서 매칭되는 부분을 찾는다 (대소문자 무시, 단어 경계 매칭).
4. 매칭된 텍스트를 `<mark>` 요소로 래핑한다.

#### 출력 결과
- 노란색 배경의 하이라이트 처리된 텍스트

#### 예외 처리
- 빈 단어 목록: 하이라이트 없이 원본 표시
- 특수문자 포함 단어: 정규식 이스케이프 처리

### FN-VOCAB-006: 표현노트 XP 보상

#### 입력 조건
- 표현 저장 완료 후 자동 호출 (`POST /api/vocabulary`)
- 일일 제한: 5회/일

#### 처리 로직

**1단계: 일일 상한 확인**
1. 오늘 날짜(KST 기준 YYYY-MM-DD)의 표현노트 저장 횟수를 확인한다.
2. 이미 5회 저장한 경우 XP 부여를 건너뛴다.

**2단계: XP 부여**
1. 5회 이내인 경우 +5 XP를 부여한다.
2. 오늘 날짜의 표현노트 저장 횟수를 1 증가시킨다.

#### 출력 결과
- XP 부여 후 사용자 프로필 갱신
- 저장 성공 토스트와 함께 "+5 XP" 표시
- 일일 상한 도달 시 안내 메시지 (예: "오늘 표현노트 XP는 5회까지 지급됩니다")

#### 예외 처리
- XP 부여 실패: 표현 저장 자체는 정상 동작 (비차단)

---

## 7. 오답 패턴 분석

### FN-MISTAKE-001: 오답 저장/갱신

#### 입력 조건
- AI 교정 결과에서 `mistakeType`과 `mistakePattern`이 존재

#### 처리 로직
1. `mistakeType`에서 카테고리를 추출한다 (`:` 기준 앞부분).
2. 카테고리를 DB 열거형에 매핑한다:
   - `grammar`, `vocabulary`, `pronunciation`, `fluency`, `comprehension` → 직접 매핑
   - `expression`, `style` → `grammar`로 매핑
3. 동일 사용자/패턴의 기존 레코드를 조회한다.
4. 기존 레코드 있음: 빈도 +1, 예시 목록 갱신 (FIFO, 최대 5개), 마지막 발생일 갱신.
5. 기존 레코드 없음: 새 레코드 생성 (빈도 1).

#### 출력 결과
- 저장/갱신된 오답 레코드

#### 예외 처리
- 저장 실패 시 교정 요청 자체는 실패하지 않음 (비차단)

### FN-MISTAKE-002: 반복 패턴 감지

#### 입력 조건
- 오답 저장 후 자동 호출

#### 처리 로직
1. 사용자의 해당 패턴을 조회한다.
2. 최근 7일 이내 + 빈도 3회 이상이면 반복 패턴으로 판정한다.

#### 출력 결과
- 반복 패턴 레코드 (빈도 포함) 또는 `null`

#### 예외 처리
- 조회 실패 시 `null` 반환 (에러를 상위로 전파)

### FN-MISTAKE-003: 최근 주요 오답 조회

#### 입력 조건
- `getRecentTopMistakes(userId, limit)` 호출

#### 처리 로직
1. 최근 7일 이내의 오답을 빈도 내림차순으로 조회한다.
2. 상위 `limit`개 (기본 3개)를 반환한다.

#### 출력 결과
- 최근 빈번 오답 목록 (AI 프롬프트 컨텍스트에 활용됨)

#### 예외 처리
- 조회 실패 시 에러 전파

---

## 8. 연속 작성 (스트릭) 시스템

### FN-STREAK-001: 스트릭 조회

#### 입력 조건
- `GET /api/streak` 호출 또는 내부 함수 호출

#### 처리 로직
1. 사용자의 스트릭 레코드를 조회한다.
2. 레코드가 없으면 초기값(0일)으로 생성한다.
3. 마지막 작성일이 오늘이면 `wroteToday: true`.

#### 출력 결과

| 필드 | 타입 | 설명 |
|------|------|------|
| `currentStreak` | `number` | 현재 연속 작성 일수 |
| `longestStreak` | `number` | 최장 연속 작성 일수 |
| `lastWrittenAt` | `string \| null` | 마지막 작성일 (YYYY-MM-DD) |
| `totalEntries` | `number` | 총 작성 일기 수 |
| `wroteToday` | `boolean` | 오늘 작성 여부 |

#### 예외 처리
- 레코드 미존재: 자동 생성 (0일)

### FN-STREAK-002: 스트릭 갱신

#### 입력 조건
- 일기 교정 완료 후 자동 호출

#### 처리 로직
1. **오늘 이미 작성**: 변경 없이 현재 값 반환 (중복 증가 방지).
2. **어제 작성**: 연속 기록 +1, 최장 기록 갱신 여부 확인.
3. **그 외 (2일 이상 공백)**: 연속 기록 1로 초기화.
4. 총 작성 수 +1.
5. 마지막 작성일을 오늘(KST 기준)로 갱신한다.

**날짜 계산**: KST(UTC+9) 기준으로 "오늘"과 "어제"를 판정한다.

#### 출력 결과
- 갱신된 스트릭 정보

#### 예외 처리
- 최초 작성: 새 레코드 생성 (연속 1일, 최장 1일, 총 1건)
- 갱신 실패 시 교정 요청 자체는 실패하지 않음 (비차단)

---

## 9. 일기 보상 시스템

### FN-REWARD-001: 분량 기반 XP 보상

#### 입력 조건
- 일기 교정 완료 후 자동 호출
- 일일 제출 횟수 3회 이내 (하루 상한)

#### 처리 로직

**1단계: 일일 상한 확인**
1. 오늘 날짜(KST 기준 YYYY-MM-DD)의 일기 제출 횟수를 확인한다.
2. 이미 3회 제출한 경우 XP 부여를 건너뛴다 (분량 보너스 미지급).

**2단계: 단어 수 및 TTR 계산**
1. 사용자가 작성한 일기의 단어 수를 계산한다 (공백 기준 분리).
2. TTR (Type-Token Ratio)을 계산한다:
   - TTR = 고유 단어 수 (unique words) / 전체 단어 수 (total words)
   - 예시: "I love love you" → TTR = 3/4 = 0.75

**3단계: 분량 보너스 부여**
1. TTR < 0.4인 경우 분량 보너스를 부여하지 않는다 (반복 단어 남용 방지).
2. TTR ≥ 0.4인 경우에만 단어 수에 따라 XP를 부여한다:
   - 30단어 이상: +5 XP
   - 60단어 이상: +10 XP
   - 100단어 이상: +20 XP
3. 여러 조건을 만족하면 각각의 XP를 부여한다 (100단어 시 총 +35 XP).

**4단계: 제출 횟수 기록**
1. 오늘 날짜의 일기 제출 횟수를 1 증가시킨다.

#### 출력 결과
- XP 부여 후 사용자 프로필 갱신
- 클라이언트에게 획득 XP 정보 반환 (분량 보너스 포함)
- 일일 상한 도달 시 안내 메시지 (예: "오늘 일기 XP는 3회까지 지급됩니다")

#### 예외 처리
- TTR 계산 실패: 분량 보너스 미지급, 기본 일기 XP만 부여
- XP 부여 실패: 교정 요청 자체는 정상 동작 (비차단)

### FN-REWARD-002: 약점 극복 보상

#### 입력 조건
- 일기 교정 완료 후 자동 호출
- 하루 1회 제한

#### 처리 로직

**1단계: 하루 1회 확인**
1. 오늘 날짜(KST 기준)에 이미 약점 극복 보상을 받았는지 확인한다.
2. 이미 받았으면 보상을 건너뛴다.

**2단계: 최근 주요 오답 조회**
1. `user_mistakes` 테이블에서 최근 7일 이내 가장 빈번한 오답 패턴(TOP 1)을 조회한다.
2. 조회 조건: `lastOccurredAt` ≤ 7일 전, `frequency` 내림차순 정렬.

**3단계: 약점 극복 판정**
1. 이번 일기 교정 결과의 `mistakePattern`을 확인한다.
2. `mistakePattern`이 `null`이거나 최근 TOP 1 오답 패턴과 다르면 "약점 극복"으로 판정한다.
3. 판정 기준:
   - 최근 자주 틀리던 패턴이 이번 일기에서 발생하지 않음
   - 또는 오류가 전혀 없음 (`mistakePattern === null`)

**4단계: XP 부여**
1. 약점 극복 판정 시 +20 XP를 부여한다.
2. 오늘 날짜에 약점 극복 보상 수령 기록을 남긴다.

#### 출력 결과
- XP 부여 후 사용자 프로필 갱신
- 클라이언트에게 약점 극복 메시지 표시:
  - "🎉 **약점 극복!** 최근 자주 틀리던 '{패턴명}' 오류가 없어요! +20 XP"

#### 예외 처리
- 최근 오답 패턴이 없는 경우 (신규 사용자): 보상 미지급
- XP 부여 실패: 교정 요청 자체는 정상 동작 (비차단)

---

### FN-REWARD-003: 사후 발견형 보상 (향후 구현)

> **v3.0 범위 외**: Sprint 5.5에서 구현 예정

#### 입력 조건
- 일기 교정 완료 후 자동 분석

#### 처리 로직 (계획)
1. AI가 교정 결과를 분석하여 사용자가 자연스럽게 잘 쓴 부분을 발견한다.
2. 발견 항목 예시:
   - 새로운 표현 사용 (표현노트에 없던 고급 어휘)
   - 다양한 시제 사용 (과거/현재/미래/완료 등)
   - 복문 구조 사용 (접속사, 관계절 등)
   - 자연스러운 연결어 사용 (however, therefore 등)
3. 각 발견 항목마다 XP를 부여한다.
4. "오늘의 작성 분석" 카드로 결과를 표시한다.

#### 출력 결과
- discoveries 배열: 발견된 항목 목록
- 각 항목: 제목, 설명, 획득 XP
- 예시:
  ```json
  {
    "discoveries": [
      {
        "type": "new_expression",
        "title": "새로운 표현 발견!",
        "description": "even though - 양보절을 잘 썼어요",
        "xp": 15
      },
      {
        "type": "diverse_tenses",
        "title": "다양한 시제 사용!",
        "description": "과거형 3개, 과거진행형 1개",
        "xp": 10
      }
    ]
  }
  ```

#### 예외 처리
- 분석 실패 시 교정 요청은 정상 동작 (비차단)

---

## 10. 사용량 제한 및 구독 관리

### FN-USAGE-001: 사용량 상태 조회

#### 입력 조건
- `GET /api/usage` 호출

#### 처리 로직
1. 비인증 사용자: 게스트 응답을 즉시 반환한다.
   - `isPremium: false`, `dailyLimit: 3`, `remaining: 3`, `canUse: true`, `isGuest: true`
2. 인증 사용자:
   a. 구독 상태를 확인한다 (`subscriptions` 테이블).
   b. 오늘 사용량을 조회한다 (`daily_usage` 테이블).
   c. 프리미엄: 무제한 (`remaining: Infinity`).
   d. 무료: 잔여 = 3 - 사용량 (최소 0).

#### 출력 결과

| 필드 | 타입 | 설명 |
|------|------|------|
| `isPremium` | `boolean` | 프리미엄 구독 여부 |
| `dailyLimit` | `number` | 일일 한도 (무료: 3, 프리미엄: Infinity) |
| `usedToday` | `number` | 오늘 사용한 횟수 |
| `remaining` | `number` | 잔여 사용 가능 횟수 |
| `canUse` | `boolean` | 사용 가능 여부 |
| `isGuest` | `boolean` | 게스트 여부 |

#### 예외 처리
- 조회 실패: 500 "Failed to get usage status"

### FN-USAGE-002: 사용량 증가

#### 입력 조건
- 교정 완료 후 자동 호출

#### 처리 로직
1. 오늘 날짜(YYYY-MM-DD)의 기존 레코드를 조회한다.
2. 기존 레코드 있음: 카운트 +1 업데이트.
3. 기존 레코드 없음: 새 레코드 생성 (카운트 1).

#### 출력 결과
- 갱신된 사용 횟수

#### 예외 처리
- 갱신 실패 시 교정 요청 자체는 실패하지 않음 (비차단)

### FN-USAGE-003: 구독 상태 확인

#### 입력 조건
- `checkSubscription(userId)` 호출

#### 처리 로직
1. `subscriptions` 테이블에서 `plan: "premium"`, `status: "active"` 조건으로 조회한다.
2. 레코드가 없으면 무료 사용자.
3. 만료일(`endDate`)이 현재보다 이전이면:
   - 상태를 `expired`로 갱신한다.
   - 무료 사용자로 처리한다.

#### 출력 결과
- `true` (프리미엄) 또는 `false` (무료/만료)

#### 예외 처리
- DB 조회 실패 시 에러 전파

---

## 11. 결제 시스템

### FN-PAY-001: 결제 승인

#### 입력 조건
- `POST /api/payment/confirm` 호출
- 필수: `paymentKey`, `orderId`, `amount`
- 인증 필수

#### 처리 로직
1. 금액 검증: `amount === 9,900`(원) 이어야 한다.
2. Toss Payments API(`/v1/payments/confirm`)에 결제 승인을 요청한다.
   - 인증: Base64 인코딩된 시크릿 키로 Basic Auth.
3. 승인 성공 시 구독 정보를 처리한다:
   - 구독 종료일: 현재로부터 1개월 후.
   - 기존 구독 있음: `premium`/`active`로 업데이트.
   - 기존 구독 없음: 새 구독 레코드 생성.

#### 출력 결과
```json
{
  "success": true,
  "payment": { /* Toss Payments 응답 */ }
}
```

#### 예외 처리

| 조건 | 처리 |
|------|------|
| 비인증 | 401 "Unauthorized" |
| 금액 불일치 | 400 "Invalid amount" |
| Toss API 오류 | 500 에러 메시지 전달 |

### FN-PAY-002: 결제 조회

#### 입력 조건
- `getPayment(paymentKey)` 호출

#### 처리 로직
1. Toss Payments API(`/v1/payments/{paymentKey}`)에 조회 요청.

#### 출력 결과
- 결제 상세 정보 (결제 키, 주문 ID, 상태, 총액, 결제 수단, 승인 일시)

#### 예외 처리
- API 오류: 에러 메시지 throw

### FN-PAY-003: 결제 취소

#### 입력 조건
- `cancelPayment(paymentKey, reason)` 호출

#### 처리 로직
1. Toss Payments API(`/v1/payments/{paymentKey}/cancel`)에 취소 요청.
2. 취소 사유를 `cancelReason` 필드로 전달.

#### 출력 결과
- 취소된 결제 정보

#### 예외 처리
- API 오류: 에러 메시지 throw

### FN-PAY-004: 결제 상수

| 상수 | 값 |
|------|-----|
| 월 구독료 | ₩9,900 |
| 구독 상품명 | "Politely Premium 월 구독" |
| 구독 기간 | 1개월 |

---

## 12. 대화 메모리 관리

### FN-MEM-001: 대화 요약

#### 입력 조건
- 메시지 수가 5개를 초과

#### 처리 로직
1. 오래된 메시지를 LLM(Gemini 2.0 Flash Exp)으로 요약한다.
   - 요약 항목: 주요 토픽, 교정 내용, 반복 오답, 설명된 문법 규칙.
   - 요약 길이: 200자 이내.
   - 설명 언어: 한국어.
2. 최근 3개 메시지만 유지한다.
3. 요약을 `chats.summary` 필드에 저장한다.

#### 출력 결과
- 압축된 대화 요약 + 최근 메시지 3개

#### 예외 처리
- LLM 요약 실패: 간단한 폴백 요약 생성
  - 형식: "대화 {N}개 메시지 요약: {처음 두 메시지 앞 50자}..."

### FN-MEM-002: 체크포인트 (상태 스냅샷)

#### 입력 조건
- LangGraph 실행 시 자동

#### 처리 로직
1. Neon DB 기반 커스텀 체크포인터가 대화 상태를 `checkpoints` 테이블에 저장한다.
2. 스레드 ID(chatId)와 체크포인트 ID를 기반으로 상태를 식별한다.

#### 출력 결과
- 대화 상태 스냅샷 (메시지, 요약, 프로필 등)

#### 예외 처리
- 저장 실패 시 로그만 기록 (대화 계속 가능)

### FN-MEM-003: 사실 메모리 (사용자 프로필)

#### 입력 조건
- 교정 시 오답 감지

#### 처리 로직
1. `user_profiles.recurringMistakes` JSONB 필드에 반복 오답 패턴을 누적한다.
2. 다음 교정 요청 시 이 정보가 AI 프롬프트 컨텍스트에 포함된다.

#### 출력 결과
- 반복 오답이 반영된 적응형 교정

#### 예외 처리
- 프로필 갱신 실패 시 교정 자체는 진행 (비차단)

---

## 13. 데이터 모델

### 13.1 인증 테이블

#### `users`
| 컬럼 | 타입 | 제약 조건 | 설명 |
|------|------|-----------|------|
| `id` | text | PK, UUID 자동생성 | 사용자 고유 ID |
| `name` | text | nullable | 이름 |
| `email` | text | unique, nullable | 이메일 |
| `emailVerified` | timestamp | nullable | 이메일 인증 일시 |
| `image` | text | nullable | 프로필 이미지 URL |
| `createdAt` | timestamp | NOT NULL, 자동 | 생성 일시 |
| `updatedAt` | timestamp | NOT NULL, 자동 | 수정 일시 |

#### `accounts`
| 컬럼 | 타입 | 제약 조건 | 설명 |
|------|------|-----------|------|
| `userId` | text | FK→users(cascade) | 사용자 ID |
| `type` | text | NOT NULL | 계정 유형 |
| `provider` | text | PK (복합) | OAuth 제공자 |
| `providerAccountId` | text | PK (복합) | 제공자 계정 ID |
| `refresh_token` | text | nullable | 갱신 토큰 |
| `access_token` | text | nullable | 접근 토큰 |
| `expires_at` | integer | nullable | 만료 시각 |
| `token_type` | text | nullable | 토큰 유형 |
| `scope` | text | nullable | 범위 |
| `id_token` | text | nullable | ID 토큰 |
| `session_state` | text | nullable | 세션 상태 |

#### `sessions`
| 컬럼 | 타입 | 제약 조건 | 설명 |
|------|------|-----------|------|
| `sessionToken` | text | PK | 세션 토큰 |
| `userId` | text | FK→users(cascade) | 사용자 ID |
| `expires` | timestamp | NOT NULL | 만료 일시 |

#### `verification_tokens`
| 컬럼 | 타입 | 제약 조건 | 설명 |
|------|------|-----------|------|
| `identifier` | text | PK (복합) | 식별자 |
| `token` | text | PK (복합) | 토큰 |
| `expires` | timestamp | NOT NULL | 만료 일시 |

### 13.2 구독/사용량 테이블

#### `subscriptions`
| 컬럼 | 타입 | 제약 조건 | 설명 |
|------|------|-----------|------|
| `id` | uuid | PK, 자동생성 | 구독 ID |
| `userId` | text | FK→users(cascade), 인덱스 | 사용자 ID |
| `plan` | text (enum) | NOT NULL, 기본 "free" | 플랜 ("free" / "premium") |
| `status` | text (enum) | NOT NULL, 기본 "active" | 상태 ("active" / "cancelled" / "expired") |
| `paymentKey` | text | nullable | Toss 결제 키 |
| `startDate` | timestamp | NOT NULL, 자동 | 구독 시작일 |
| `endDate` | timestamp | nullable | 구독 종료일 |
| `createdAt` | timestamp | NOT NULL, 자동 | 생성 일시 |
| `updatedAt` | timestamp | NOT NULL, 자동 | 수정 일시 |

#### `daily_usage`
| 컬럼 | 타입 | 제약 조건 | 설명 |
|------|------|-----------|------|
| `id` | uuid | PK, 자동생성 | 레코드 ID |
| `userId` | text | FK→users(cascade), 복합 인덱스 | 사용자 ID |
| `date` | date | NOT NULL, 복합 인덱스 | 날짜 (YYYY-MM-DD) |
| `count` | integer | NOT NULL, 기본 0 | 사용 횟수 |
| `createdAt` | timestamp | NOT NULL, 자동 | 생성 일시 |
| `updatedAt` | timestamp | NOT NULL, 자동 | 수정 일시 |

### 13.3 애플리케이션 테이블

#### `chats`
| 컬럼 | 타입 | 제약 조건 | 설명 |
|------|------|-----------|------|
| `id` | uuid | PK, 자동생성 | 채팅 세션 ID |
| `userId` | text | NOT NULL | 사용자 ID |
| `title` | text | NOT NULL | 대화 제목 (사용자 메시지 앞 50자) |
| `summary` | text | nullable | LLM 생성 요약 |
| `createdAt` | timestamp | NOT NULL, 자동 | 생성 일시 |
| `updatedAt` | timestamp | NOT NULL, 자동 | 수정 일시 |

#### `messages`
| 컬럼 | 타입 | 제약 조건 | 설명 |
|------|------|-----------|------|
| `id` | uuid | PK, 자동생성 | 메시지 ID |
| `chatId` | uuid | FK→chats(cascade) | 소속 채팅 ID |
| `role` | text (enum) | NOT NULL | 역할 ("user" / "assistant") |
| `content` | text | NOT NULL | 내용 (user: 원문, assistant: JSON 문자열) |
| `createdAt` | timestamp | NOT NULL, 자동 | 생성 일시 |

#### `user_profiles`
| 컬럼 | 타입 | 제약 조건 | 설명 |
|------|------|-----------|------|
| `id` | uuid | PK, 자동생성 | 프로필 ID |
| `userId` | text | NOT NULL, unique, 인덱스 | 사용자 ID |
| `level` | text (enum) | NOT NULL, 기본 "detailed" | 설명 수준 ("detailed" / "concise") |
| `learningGoal` | text | nullable | 학습 목표 |
| `recurringMistakes` | jsonb | NOT NULL, 기본 '[]' | 반복 오답 패턴 배열 |
| `learningPreferences` | jsonb | NOT NULL, 기본 '{}' | 학습 설정 |
| `createdAt` | timestamp | NOT NULL, 자동 | 생성 일시 |
| `updatedAt` | timestamp | NOT NULL, 자동 | 수정 일시 |

#### `checkpoints`
| 컬럼 | 타입 | 제약 조건 | 설명 |
|------|------|-----------|------|
| `id` | uuid | PK, 자동생성 | 체크포인트 ID |
| `chatId` | uuid | FK→chats(cascade) | 소속 채팅 ID |
| `threadId` | text | NOT NULL | LangGraph 스레드 ID |
| `checkpointId` | text | NOT NULL | LangGraph 체크포인트 ID |
| `state` | jsonb | NOT NULL | 전체 대화 상태 |
| `metadata` | jsonb | NOT NULL, 기본 '{}' | 메타데이터 |
| `messageCount` | integer | NOT NULL, 기본 0 | 메시지 수 |
| `createdAt` | timestamp | NOT NULL, 자동 | 생성 일시 |

#### `user_mistakes`
| 컬럼 | 타입 | 제약 조건 | 설명 |
|------|------|-----------|------|
| `id` | uuid | PK, 자동생성 | 레코드 ID |
| `userId` | text | NOT NULL, 인덱스 | 사용자 ID |
| `mistakeType` | text (enum) | NOT NULL, 인덱스 | 오답 유형 (grammar/vocabulary/pronunciation/fluency/comprehension) |
| `pattern` | text | NOT NULL, 복합 인덱스 | 오답 패턴 |
| `frequency` | integer | NOT NULL, 기본 1 | 발생 빈도 |
| `examples` | jsonb | NOT NULL, 기본 '[]' | 예시 문장 (최대 5개, FIFO) |
| `lastOccurredAt` | timestamp | NOT NULL, 자동 | 마지막 발생일 |
| `createdAt` | timestamp | NOT NULL, 자동 | 생성 일시 |
| `updatedAt` | timestamp | NOT NULL, 자동 | 수정 일시 |

#### `diary_streaks`
| 컬럼 | 타입 | 제약 조건 | 설명 |
|------|------|-----------|------|
| `id` | uuid | PK, 자동생성 | 레코드 ID |
| `userId` | text | FK→users(cascade), unique, 인덱스 | 사용자 ID |
| `currentStreak` | integer | NOT NULL, 기본 0 | 현재 연속 일수 |
| `longestStreak` | integer | NOT NULL, 기본 0 | 최장 연속 일수 |
| `lastWrittenAt` | date | nullable | 마지막 작성일 |
| `totalEntries` | integer | NOT NULL, 기본 0 | 총 작성 수 |
| `createdAt` | timestamp | NOT NULL, 자동 | 생성 일시 |
| `updatedAt` | timestamp | NOT NULL, 자동 | 수정 일시 |

#### `learning_stats`
| 컬럼 | 타입 | 제약 조건 | 설명 |
|------|------|-----------|------|
| `id` | uuid | PK, 자동생성 | 레코드 ID |
| `userId` | text | NOT NULL, 인덱스 | 사용자 ID |
| `date` | date | NOT NULL, 인덱스, 복합 인덱스 | 통계 날짜 |
| `mistakeRate` | decimal(5,2) | nullable | 오답률 (0.00~100.00) |
| `mistakeBreakdown` | jsonb | NOT NULL, 기본 '{}' | 유형별 오답 수 |
| `totalMessages` | integer | NOT NULL, 기본 0 | 총 메시지 수 |
| `totalMistakes` | integer | NOT NULL, 기본 0 | 총 오답 수 |
| `createdAt` | timestamp | NOT NULL, 자동 | 생성 일시 |
| `updatedAt` | timestamp | NOT NULL, 자동 | 수정 일시 |

#### `vocabulary`
| 컬럼 | 타입 | 제약 조건 | 설명 |
|------|------|-----------|------|
| `id` | uuid | PK, 자동생성 | 레코드 ID |
| `userId` | text | FK→users(cascade), 인덱스 | 사용자 ID |
| `word` | text | NOT NULL | 단어/구문 |
| `meaning` | text | nullable | 뜻 (한국어) |
| `example` | text | nullable | 예문 |
| `memo` | text | nullable | 사용자 메모 |
| `sourceType` | text (enum) | NOT NULL, 기본 "manual" | 출처 ("diary" / "chat" / "manual") |
| `sourceId` | uuid | nullable | 출처 채팅/일기 ID |
| `pronunciation` | text | nullable | IPA 발음 기호 |
| `partOfSpeech` | text | nullable | 품사 |
| `synonyms` | text[] | nullable | 동의어 배열 (최대 3개) |
| `context` | text | nullable | 원문 컨텍스트 |
| `difficulty` | text (enum) | nullable | 난이도 (beginner/intermediate/advanced) |
| `createdAt` | timestamp | NOT NULL, 자동, 인덱스 | 생성 일시 |
| `updatedAt` | timestamp | NOT NULL, 자동 | 수정 일시 |

---

## 14. API 명세

### 14.1 교정 API

| 메서드 | 경로 | 인증 | 설명 |
|--------|------|------|------|
| POST | `/api/chat` | 선택 | 일기 교정 요청 |

**요청 본문**:
```json
{
  "messages": [{"role": "user", "content": "Today I eat delicious food."}],
  "chatId": null,
  "mode": "diary",
  "mood": "happy"
}
```

**응답 본문**:
```json
{
  "object": {
    "originalText": "Today I eat delicious food.",
    "correctedText": "Today I ate delicious food.",
    "koreanExplanation": "잘 쓰셨어요! ...",
    "alternatives": [
      {"type": "Casual", "text": "..."},
      {"type": "Expressive", "text": "..."},
      {"type": "Simple", "text": "..."}
    ],
    "mistakeType": "grammar:tense",
    "mistakePattern": "tense-confusion",
    "keywords": ["food"],
    "mood": "happy"
  }
}
```

### 14.2 캘린더 API

| 메서드 | 경로 | 인증 | 설명 |
|--------|------|------|------|
| GET | `/api/calendar/{year}/{month}` | 선택 | 월별 일기 데이터 |

### 14.3 기록 API

| 메서드 | 경로 | 인증 | 설명 |
|--------|------|------|------|
| GET | `/api/history` | 필수 | 일기 목록 (최대 50건) |
| GET | `/api/history/{id}` | 필수 | 일기 상세 |

### 14.4 표현노트 API

| 메서드 | 경로 | 인증 | 설명 |
|--------|------|------|------|
| GET | `/api/vocabulary` | 필수 | 표현 목록 |
| POST | `/api/vocabulary` | 필수 | 표현 저장 (AI 보강) |
| DELETE | `/api/vocabulary/{id}` | 필수 | 표현 삭제 |

### 14.5 사용자 API

| 메서드 | 경로 | 인증 | 설명 |
|--------|------|------|------|
| GET | `/api/user/profile` | 선택 | 프로필 조회 |
| POST | `/api/user/profile` | 선택 | 프로필 수정 (설명 수준, 학습 목표) |
| GET | `/api/usage` | 선택 | 사용량 상태 |
| GET | `/api/streak` | 선택 | 스트릭 조회 |

### 14.6 인증 API

| 메서드 | 경로 | 인증 | 설명 |
|--------|------|------|------|
| GET/POST | `/api/auth/[...nextauth]` | - | NextAuth.js OAuth 핸들러 |

### 14.7 결제 API

| 메서드 | 경로 | 인증 | 설명 |
|--------|------|------|------|
| POST | `/api/payment/confirm` | 필수 | Toss 결제 승인 |

---

## 부록: 기분 선택지

| ID | 이모지 | 한국어 라벨 |
|----|--------|-------------|
| `happy` | 😊 | 좋음 |
| `neutral` | 😐 | 보통 |
| `sad` | 😢 | 슬픔 |
| `excited` | 🤩 | 신남 |
| `tired` | 😴 | 피곤 |
| `anxious` | 😰 | 불안 |
