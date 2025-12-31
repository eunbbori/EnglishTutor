# PRD: Personalized AI English Tutor

**Document Owner**: Product Manager
**Last Updated**: 2025-01-15
**Status**: Draft for Review
**Version**: 1.0

---

## 1. Executive Summary

현재 AI English Tutor는 문장 교정 기능을 제공하지만, 각 요청이 독립적으로 처리되어 사용자의 학습 패턴을 기억하지 못합니다. 이는 반복적인 실수 개선이 어렵고, 학습 진도를 확인할 수 없어 사용자 동기 부여가 낮다는 문제를 야기합니다.

본 PRD는 **Memory-Augmented Conversational AI** 아키텍처를 도입하여 서비스를 **개인화된 학습 동반자(Personalized Learning Companion)**로 전환하는 방안을 제시합니다. 핵심 기능은:

1. **학습 패턴 추적**: 반복 실수 자동 감지 및 약점 파악
2. **개인화된 피드백**: 사용자 레벨과 이력 기반 맞춤 설명
3. **진도 대시보드**: 학습 통계 시각화 및 성장 추적
4. **능동적 복습 제안**: AI가 먼저 약점 기반 학습 자료 제공
5. **적응형 난이도**: 실력에 따른 설명 깊이 자동 조절

이를 통해 **주간 재방문율 30% → 50%**, **실수율 30% 감소**, **프리미엄 전환율 10%** 달성을 목표로 합니다.

---

## 2. Problem & Opportunity

### 2.1 Current State (AS-IS)

AI English Tutor는 현재 **Stateless Correction Tool**로 동작합니다:

| 현재 기능 | 한계점 |
|----------|--------|
| 문장 교정 | 각 요청이 독립적, 이전 대화 미활용 |
| 문법 설명 | 모든 사용자에게 동일한 설명 방식 |
| 대안 표현 제공 | 사용자 목표/레벨 고려 없음 |
| 대화 이력 저장 | 검색만 가능, 학습 분석 불가 |

### 2.2 Problems Identified

#### Problem 1: No Learning Context
- **Issue**: 사용자가 같은 실수를 반복해도 인지하지 못함
- **Example**:
  - Day 1: "I go to school yesterday" → AI: "과거형은 went입니다"
  - Day 3: "She go to the store" → AI: 동일한 설명 반복
- **Impact**: 학습 효율 저하, 사용자 좌절감 증가

#### Problem 2: Generic Feedback
- **Issue**: 초급/고급 사용자에게 동일한 설명 제공
- **Example**:
  - 초급자: "주어-동사 일치" 개념 자체를 모를 수 있음
  - 고급자: 기초 문법 설명보다 뉘앙스 차이가 필요
- **Impact**: 비효율적 학습, 고급 사용자 이탈

#### Problem 3: No Progress Tracking
- **Issue**: 사용자가 학습 진도를 확인할 방법 없음
- **User Quote**: "나 요즘 늘고 있나? 뭘 더 공부해야 하지?"
- **Impact**: 동기 부여 부족, 장기 사용률 저하

#### Problem 4: Reactive Only
- **Issue**: 사용자가 질문해야만 응답
- **Opportunity**: 약점 기반 연습 문제 자동 제안 가능
- **Impact**: 수동적 학습, 복습 기회 상실

### 2.3 Pain Points (사용자 불편사항)

사용자 인터뷰 결과 (n=5, 2025년 1월):

> "같은 전치사 실수를 계속하는데, 챗봇은 매번 처음 보는 것처럼 설명해요."
> — 김지민, 28세, IT 기업 재직

> "내가 얼마나 나아졌는지 알 수 없어서 답답해요. 기록은 남지만 분석은 안 돼요."
> — 이수진, 32세, 스타트업 마케터

> "초급 강의 내용을 계속 듣는 기분이에요. 제 수준을 파악해줬으면 좋겠어요."
> — 박민수, 35세, 해외 영업 담당

**핵심 Pain Point 요약**:
1. **반복 학습의 어려움**: 자주 틀리는 패턴을 직접 기억해야 함
2. **진도 파악 불가**: 학습 성장을 정량적으로 확인할 수 없음
3. **일관성 없는 경험**: 매번 새로운 튜터를 만나는 느낌

### 2.4 Market Opportunity

**경쟁사 분석**:

| 서비스 | 장점 | 단점 |
|--------|------|------|
| Grammarly | 실시간 교정, 톤 조절 | 설명 부족, 학습 기능 없음 |
| DeepL | 번역 품질 우수 | 교육적 피드백 없음 |
| Duolingo | 게이미피케이션 강함 | 실전 영작 훈련 부족 |
| ChatGPT | 자유 대화 가능 | 학습 특화 기능 없음, 진도 추적 없음 |

**Our Differentiation**:
- ✅ **교정 + 학습 + 진도 추적**을 하나의 플랫폼에서 제공
- ✅ **개인화된 AI 튜터**: 사용자를 기억하고 성장시키는 경험
- ✅ **비즈니스 영어 특화**: 실무 영작에 최적화

**시장 규모**:
- 국내 영어 교육 시장: 연 15조원 (2024)
- AI 기반 언어 학습 앱 성장률: 연 28% (Statista, 2024)
- Target: 직장인 영어 학습자 200만명 (추정)

---

## 3. User Personas & Use Cases

### 3.1 Primary Persona: "영어 중급 학습자 지민"

**Demographics**:
- 이름: 김지민
- 나이: 28세
- 직업: IT 기업 프로덕트 매니저
- 영어 레벨: 중급 (TOEIC 800)

**Goals**:
- 해외 팀과 Slack/이메일로 자연스럽게 소통
- 비즈니스 미팅에서 프레젠테이션 능력 향상
- 시간 부족으로 짧고 효율적인 학습 선호

**Pain Points**:
- 같은 문법 실수를 반복 (특히 전치사, 관사)
- 회의록 작성 시 자연스러운 표현 고민
- 체계적 강의 수강 시간 없음

**Current Workflow**:
1. Slack 메시지 작성
2. AI English Tutor에 붙여넣어 교정
3. 교정 결과 복사 → 전송
4. 🔴 **문제**: 내일 또 같은 실수 반복

**Desired Workflow** (목표):
1. Slack 메시지 작성
2. 챗봇 교정 + **"지난주에도 이 전치사 틀렸어요"** 알림
3. 주말 알림: **"이번 주 자주 틀린 5가지 패턴 복습할까요?"**
4. 한 달 후: **"전치사 실수 70% → 30% 감소!"** 피드백

### 3.2 Secondary Persona: "영어 초급 학습자 수진"

**Demographics**:
- 이름: 이수진
- 나이: 25세
- 직업: 스타트업 마케터
- 영어 레벨: 초급 (TOEIC 600)

**Goals**:
- 기본 문법 실력 향상
- 해외 고객 이메일 작성 능력 개발
- 자신감 있게 영어 사용

**Pain Points**:
- 기초 문법 개념 부족 (시제, 주어-동사 일치 등)
- 너무 어려운 설명은 이해 못함
- 혼자 공부하면 금방 포기

**Needs**:
- 쉬운 설명과 충분한 예제
- 작은 성취감을 느낄 수 있는 피드백
- 게임처럼 재미있는 학습 경험

### 3.3 Use Cases

#### UC-1: 반복 실수 패턴 인식

**Scenario**: 지민이 3일 연속 "in/on/at" 전치사를 혼동

**Trigger**:
- Day 1: "I will arrive at Monday"
- Day 2: "Meeting is at 3pm in Monday"
- Day 3: "Let's meet at the office in next Monday"

**Expected Behavior**:
1. AI가 패턴 감지: "전치사 사용 빈도 3회/3일"
2. 교정 응답 시 추가 메시지 표시:
   ```
   💡 Insight: 최근 3일간 "요일/날짜" 앞 전치사를 혼동하셨어요.

   간단한 규칙:
   - 요일: on Monday, on Friday
   - 날짜: on January 15th
   - 시간: at 3pm

   연습 문제 3개를 풀어볼까요? [예] [아니오]
   ```

3. "예" 클릭 시 퀴즈 모드 진입

**Acceptance Criteria**:
- [ ] 동일 실수 유형이 3회 이상 반복 시 insight 메시지 표시
- [ ] 관련 규칙을 간단히 요약 (3줄 이내)
- [ ] 연습 문제 제안 (선택 가능)

---

#### UC-2: 개인화된 난이도 조절

**Scenario A**: 초급자 수진의 요청
- Input: "I goes to school yesterday"
- Output:
  ```
  ✏️ 교정: I went to school yesterday.

  📚 설명:
  1. "go"의 과거형은 "went"입니다.
  2. "yesterday"는 과거를 의미하므로 과거 시제를 사용합니다.
  3. 주어가 "I"일 때는 동사에 "s"를 붙이지 않습니다.

  💡 더 알아보기:
  - go → went (불규칙 과거형)
  - I/You/We/They: 동사 원형
  - He/She/It: 동사 + s
  ```

**Scenario B**: 고급자 민수의 동일 실수
- Input: "I goes to school yesterday"
- Output:
  ```
  ✏️ 교정: I went to school yesterday.

  📚 설명:
  기초 문법 실수가 보이네요. "goes"는 3인칭 단수 현재형, "went"는 과거형입니다.

  🎯 Tip: 비즈니스 이메일에서는 이런 실수가 신뢰도를 낮출 수 있어요.
  빠르게 체크하는 습관을 들이세요!
  ```

**Acceptance Criteria**:
- [ ] 사용자 레벨(초급/중급/고급)에 따라 설명 깊이 자동 조절
- [ ] 초급: 기초 규칙 + 충분한 예제
- [ ] 중급: 뉘앙스 차이 + 대안 표현
- [ ] 고급: 문화적 맥락 + 비즈니스 톤

---

#### UC-3: 학습 진도 대시보드

**Scenario**: 지민이 한 달간 챗봇 사용 후 "내 실력 늘었나?" 궁금

**User Action**: 대시보드 페이지 방문

**Expected UI**:

```
┌─────────────────────────────────────────┐
│  📊 Your Learning Dashboard              │
├─────────────────────────────────────────┤
│  🎯 이번 달 목표: 전치사 실수 50% 감소    │
│  ✅ 달성률: 70% (35% 감소!)               │
└─────────────────────────────────────────┘

📈 실수율 추이 (최근 4주)
[그래프: 주차별 실수율 감소 추세]

Week 1: 15 mistakes / 50 corrections (30%)
Week 2: 12 mistakes / 60 corrections (20%)
Week 3:  8 mistakes / 55 corrections (14%)
Week 4:  6 mistakes / 52 corrections (11%) ⬇️ 63% 향상!

💪 가장 많이 향상된 영역
1. 전치사 사용 (70% → 30%)
2. 관사 선택 (50% → 25%)
3. 시제 일치 (40% → 20%)

⚠️ 아직 약한 영역 (집중 필요)
1. 불규칙 동사 과거형 (5회 반복)
2. 관계대명사 사용 (4회 반복)

🎓 총 학습 통계
- 총 교정 횟수: 217회
- 활동 일수: 28일
- 연속 학습: 12일 🔥
```

**Acceptance Criteria**:
- [ ] 주간/월간 실수율 추이 그래프
- [ ] 가장 향상된 영역 TOP 3
- [ ] 약점 영역 TOP 3 (집중 학습 필요)
- [ ] 총 통계 (교정 횟수, 활동 일수, 연속 학습 일수)

---

#### UC-4: 능동적 복습 제안

**Scenario**: 지민이 5일간 챗봇 미사용

**Trigger**: 마지막 활동 후 5일 경과

**Expected Behavior**:

**Option 1: 이메일 알림**
```
제목: 지민님, 지난주 배운 'would vs used to' 기억하시나요?

안녕하세요, AI English Tutor입니다!

5일 동안 뵙지 못했네요 😊
지난주 집중적으로 연습했던 "would vs used to" 표현,
복습하지 않으면 금방 잊어버릴 수 있어요.

📝 간단한 퀴즈 3개로 복습해볼까요?
[퀴즈 풀기] 버튼

또는 새로운 표현을 배워보세요:
[오늘의 비즈니스 영어 표현]
```

**Option 2: 앱 내 알림**
```
💡 복습 추천

이번 주 "관사(a/an/the)" 실수가 7번 있었어요.
아래 문장들을 다시 연습해보세요:

1. I saw ___ elephant at the zoo. (정답: an)
2. She is ___ doctor. (정답: a)
3. ___ meeting was productive. (정답: The)

[지금 복습하기] [나중에]
```

**Acceptance Criteria**:
- [ ] 5일 미사용 시 이메일/앱 알림 발송
- [ ] 최근 약점 영역 기반 복습 자료 제공
- [ ] 간단한 퀴즈 형식 (3-5문제)
- [ ] "나중에" 선택 시 3일 후 재알림

---

## 4. Goals & Success Metrics

### 4.1 Product Goals

#### Goal 1: 사용자 재방문율 증가
- **Why**: 개인화 기능이 사용자를 더 오래 머물게 함
- **Baseline**: 현재 주간 재방문율 30% (WAU/MAU)
- **Target**:
  - 3개월: 40%
  - 6개월: 50%
- **Measurement**:
  ```
  WAU (Weekly Active Users) / MAU (Monthly Active Users)

  Active User = 최소 1회 이상 교정 요청한 사용자
  ```

#### Goal 2: 학습 효과 입증
- **Why**: "실제로 실력이 늘었다"는 증거가 유료 전환 핵심
- **Baseline**: N/A (신규 기능)
- **Target**:
  - 사용자의 실수율이 한 달 사용 후 평균 30% 감소
  - 예: Week 1 실수율 20% → Week 4 실수율 14%
- **Measurement**:
  ```
  실수율 = (실수 횟수 / 총 교정 횟수) × 100

  개선율 = (첫 주 실수율 - 4주차 실수율) / 첫 주 실수율
  ```
- **보조 지표**: NPS (Net Promoter Score)
  - 설문: "친구에게 이 서비스를 추천하시겠습니까?" (0-10점)
  - Target NPS: 40+ (양호)

#### Goal 3: 개인화 기능 사용률
- **Why**: 대시보드를 보는 사용자가 retention이 높을 것으로 예상
- **Target**: 활성 사용자의 70%가 대시보드를 월 1회 이상 방문
- **Measurement**:
  ```
  Dashboard Engagement Rate =
    (대시보드 1회 이상 방문 사용자 / 전체 활성 사용자) × 100
  ```

### 4.2 Success Metrics

#### 정량적 지표 (Quantitative)

| Metric | Current | 3개월 Target | 6개월 Target | 측정 방법 |
|--------|---------|--------------|--------------|----------|
| **주간 재방문율** (WAU/MAU) | 30% | 40% | 50% | Analytics |
| **평균 세션 길이** | 5분 | 8분 | 10분 | Session Tracking |
| **사용자당 월간 교정 횟수** | 20회 | 35회 | 50회 | DB Query |
| **실수율 감소** | N/A | 20% | 30% | Custom Metric |
| **대시보드 방문율** | N/A | 60% | 70% | Page Views |
| **프리미엄 전환율** | N/A | 5% | 10% | Subscription Data |

#### 정성적 지표 (Qualitative)

1. **사용자 인터뷰** (분기별 5명)
   - 질문: "챗봇이 당신을 이해한다고 느끼나요?"
   - Target: 80% 이상 "그렇다" 응답

2. **리뷰 분석** (앱스토어/플레이스토어)
   - 긍정 키워드 추적: "personalized", "helpful", "improving", "progress"
   - Target: 긍정 키워드 언급 30% 증가

3. **이탈 사유 설문**
   - 현재 주요 이탈 사유: "기능 부족" (40%)
   - Target: "기능 부족" 응답 15% 이하로 감소

### 4.3 Business Impact

**매출 예상**:
- Freemium 모델: 무료 교정 10회/월, 이후 유료
- 유료 플랜: ₩9,900/월 (무제한 교정 + 대시보드)
- 예상 전환율: 10% (6개월 후)
- MAU 10,000명 가정 시:
  - 유료 사용자: 1,000명
  - 월 매출: ₩9,900,000
  - 연 매출: ₩118,800,000

**투자 대비 효과 (ROI)**:
- 개발 비용: 약 2개월 (개발자 2명)
- 예상 회수 기간: 6개월 이내

---

## 5. Proposed Solution

### 5.1 High-Level Approach

**"Memory-Augmented Conversational AI"** 아키텍처 도입:

```
┌─────────────────────────────────────────────┐
│           User Input (영작 문장)              │
└─────────────────┬───────────────────────────┘
                  │
         ┌────────▼────────┐
         │  Short-term      │  ← 현재 대화 맥락 (기존 기능)
         │  Memory          │
         └────────┬────────┘
                  │
         ┌────────▼────────┐
         │  Long-term       │  ← 실수 패턴, 학습 이력
         │  Memory          │     (신규 기능 - DB 기반)
         └────────┬────────┘
                  │
         ┌────────▼────────┐
         │  Adaptive        │  ← 메모리 기반 프롬프트 생성
         │  Prompting       │
         └────────┬────────┘
                  │
         ┌────────▼────────┐
         │  AI Engine       │  ← Gemini 2.0 Flash
         │  (Gemini)        │
         └────────┬────────┘
                  │
         ┌────────▼────────┐
         │  Personalized    │  ← 개인화된 교정 + 피드백
         │  Response        │
         └─────────────────┘
```

### 5.2 Key Features

#### Feature 1: 학습 패턴 추적 (Learning Pattern Tracker)

**What**: 사용자가 반복하는 실수를 자동으로 감지하고 카테고리화

**Why**: 같은 실수 반복 방지, 약점 집중 학습 가능

**How**:
1. 교정 시 AI가 실수 유형을 분류:
   - 문법 (Grammar): 시제, 주어-동사 일치, 전치사, 관사 등
   - 어휘 (Vocabulary): 단어 선택, 콜로케이션
   - 스타일 (Style): 격식, 톤, 명료성

2. DB에 실수 패턴 저장:
   ```json
   {
     "user_id": "123",
     "mistake_type": "preposition_usage",
     "sub_type": "time_preposition",
     "pattern": "in/at/on 혼동",
     "frequency": 5,
     "examples": [
       {"input": "I will arrive at Monday", "correct": "on Monday"},
       {"input": "Meeting is in next week", "correct": "next week"}
     ],
     "first_occurred": "2025-01-10",
     "last_occurred": "2025-01-15"
   }
   ```

3. 임계값 도달 시 알림:
   - 동일 패턴 3회 → Insight 메시지
   - 동일 패턴 5회 → "약점" 태그 + 복습 자료 제안

**Value**:
- 사용자: 자주 틀리는 부분을 명확히 인지
- 시스템: 약점 기반 학습 자료 추천 가능

---

#### Feature 2: 개인화된 피드백 (Personalized Feedback)

**What**: 사용자 레벨과 과거 이력에 맞춰 설명 깊이 조절

**Why**: 초급자에게 너무 어려운 설명, 고급자에게 너무 쉬운 설명 방지

**How**:
1. 사용자 레벨 판정:
   - 초기: 간단한 레벨 테스트 (5문제, 2분)
   - 이후: 실수 빈도/유형으로 동적 조정
   - 레벨: Beginner (A1-A2) / Intermediate (B1-B2) / Advanced (C1-C2)

2. AI 프롬프트에 컨텍스트 주입:
   ```
   System Prompt:
   You are tutoring a user with the following profile:
   - Level: Intermediate (B1)
   - Frequent mistakes:
     * Prepositions (5 times this week, especially time prepositions)
     * Irregular verb past tense (3 times)
   - Learning goal: Business email writing

   Adjust your explanation depth:
   - For prepositions: Provide detailed examples since it's a weak area
   - For basic grammar: Brief reminder is enough
   - Use business email examples when possible
   ```

3. 응답 예시:
   - **Beginner**: "과거형은 동사 뒤에 -ed를 붙입니다. 예: work → worked"
   - **Intermediate**: "불규칙 동사 'go'의 과거형은 'went'입니다. 비즈니스 이메일에서 자주 사용되는 표현이에요."
   - **Advanced**: "'go'의 과거형 'went'를 사용하세요. Formal 상황에서는 'proceeded to'도 대안이 될 수 있습니다."

**Value**:
- 학습 효율 향상 (레벨에 맞는 설명)
- 사용자 만족도 증가

---

#### Feature 3: 진도 대시보드 (Progress Dashboard)

**What**: 사용자의 학습 통계를 시각화하여 성장을 한눈에 확인

**Why**: 진도를 보면 동기 부여 증가, Retention 향상

**Key Metrics**:
1. **실수율 추이** (주간/월간 그래프)
2. **가장 많이 향상된 영역** TOP 3
3. **약점 영역** TOP 3
4. **총 통계**: 교정 횟수, 활동 일수, 연속 학습 일수

**UI Components**:
- Chart: Recharts 라이브러리 사용
- Badge: Shadcn UI Badge (강점=녹색, 약점=빨간색)
- Progress Bar: Shadcn Progress

**Example Screen** (Wireframe 설명):
```
┌──────────────────────────────────────────┐
│  📊 Your Learning Dashboard               │
│                                           │
│  🎯 이번 달 목표: 전치사 실수 50% 감소     │
│  ✅ 달성률: [████████░░] 70%              │
│                                           │
│  📈 실수율 추이                            │
│  [주차별 선 그래프]                        │
│                                           │
│  💪 가장 많이 향상된 영역                  │
│  🟢 전치사 사용 (70% → 30%)               │
│  🟢 관사 선택 (50% → 25%)                 │
│  🟢 시제 일치 (40% → 20%)                 │
│                                           │
│  ⚠️ 집중 필요 영역                         │
│  🔴 불규칙 동사 (5회 반복)                 │
│  🔴 관계대명사 (4회 반복)                  │
│                                           │
│  🎓 총 학습 통계                           │
│  • 총 교정: 217회                          │
│  • 활동 일수: 28일                         │
│  • 연속 학습: 12일 🔥                      │
└──────────────────────────────────────────┘
```

**Value**:
- 사용자: 성장 가시화, 동기 부여
- 비즈니스: 대시보드 방문자의 Retention 높음

---

#### Feature 4: 능동적 복습 제안 (Proactive Review)

**What**: 사용자가 요청하지 않아도 AI가 먼저 학습 자료 제공

**Why**: 수동적 학습 → 능동적 학습, 복습 루틴 형성

**Triggers**:
1. **반복 패턴 감지**: 동일 실수 5회 이상
2. **미사용 알림**: 5일간 활동 없음
3. **주간 리포트**: 매주 일요일 오후
4. **월간 리포트**: 매월 마지막 날

**Content Types**:
1. **퀴즈 형식**: 빈칸 채우기 3-5문제
2. **예문 재작성**: 틀렸던 문장 다시 작성
3. **문법 요약**: 자주 틀린 규칙 1페이지 요약

**Delivery Channels**:
- 앱 내 알림 (Push Notification)
- 이메일 (선택 가능)
- 웹 Dashboard 배너

**Example Notification**:
```
💡 복습 추천

이번 주 "관사(a/an/the)" 실수가 7번 있었어요.
5분만 투자해서 복습해볼까요?

[지금 복습하기] [나중에]
```

**Value**:
- 복습률 증가 → 학습 효과 증대
- 사용자 재참여 (Re-engagement)

---

#### Feature 5: 학습 레벨 자동 조정 (Adaptive Difficulty)

**What**: 사용자 실력 변화에 따라 AI 응답 깊이 자동 조절

**Why**: 정적 레벨 설정은 성장 반영 못함, 동적 조정 필요

**How**:
1. **초기 레벨 테스트** (온보딩 시):
   - 5개 문장 교정 문제
   - 문법/어휘/스타일 복합 평가
   - 2분 이내 완료

2. **레벨 재조정** (매주):
   - 실수율 하락 → 레벨 상향
   - 새로운 실수 유형 증가 → 레벨 유지
   - 알고리즘:
     ```
     if (이번 주 실수율 < 지난 주 실수율 - 10%) {
       level++;
     } else if (신규 실수 유형 > 3개) {
       level = 유지;
     }
     ```

3. **레벨별 응답 차별화**:
   - **Beginner**: 기초 문법 규칙 + 충분한 예제
   - **Intermediate**: 뉘앙스 차이 + 비즈니스 맥락
   - **Advanced**: 관용구 + 문화적 차이 + 스타일 가이드

**Value**:
- 사용자: 성장에 맞춘 학습
- 시스템: 사용자 engagement 유지

---

### 5.3 Feature Prioritization

**Phase 1 (MVP - 2개월)**:
1. ✅ Feature 1: 학습 패턴 추적
2. ✅ Feature 2: 개인화된 피드백
3. ✅ Feature 3: 진도 대시보드 (기본 버전)

**Phase 2 (3-4개월)**:
4. ✅ Feature 4: 능동적 복습 제안
5. ✅ Feature 5: 학습 레벨 자동 조정

**Phase 3 (5-6개월)**:
- 대시보드 고도화 (목표 설정, 친구 비교)
- 음성 피드백 (TTS로 교정 문장 읽기)
- 커뮤니티 기능 (학습 그룹, 챌린지)

---

## 6. Technical Architecture (High-Level)

### 6.1 System Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Client (Next.js)                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │Chat Page │  │Dashboard │  │Settings  │          │
│  └─────┬────┘  └────┬─────┘  └────┬─────┘          │
└────────┼────────────┼─────────────┼─────────────────┘
         │            │             │
         │   ┌────────▼─────────────▼──────┐
         │   │    API Routes (Next.js)      │
         └───►  /api/chat                   │
             │  /api/dashboard              │
             │  /api/user/profile           │
             └────────┬─────────────────────┘
                      │
         ┌────────────▼──────────────┐
         │   Business Logic (lib/)   │
         │  • Memory Manager         │
         │  • Pattern Detector       │
         │  • Progress Calculator    │
         └────────┬──────────────────┘
                  │
         ┌────────▼──────────────────┐
         │    AI Layer (LangChain)   │
         │  • Gemini 2.0 Flash       │
         │  • Adaptive Prompting     │
         │  • Memory Integration     │
         └────────┬──────────────────┘
                  │
         ┌────────▼──────────────────┐
         │   Database (Neon)         │
         │  • chats                  │
         │  • messages               │
         │  • user_profiles          │
         │  • user_mistakes (NEW)    │
         │  • learning_stats (NEW)   │
         └───────────────────────────┘
```

### 6.2 Database Schema (신규 테이블)

#### `user_profiles` (확장)
```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  level TEXT NOT NULL DEFAULT 'intermediate', -- beginner, intermediate, advanced
  learning_goal TEXT, -- 'business', 'travel', 'academic'
  recurring_mistakes JSONB DEFAULT '[]', -- 반복 실수 패턴
  learning_preferences JSONB DEFAULT '{}', -- 학습 선호도
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### `user_mistakes` (신규)
```sql
CREATE TABLE user_mistakes (
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL,
  mistake_type TEXT NOT NULL, -- 'grammar', 'vocabulary', 'style'
  sub_type TEXT, -- 'preposition', 'article', 'tense', etc.
  pattern TEXT, -- '전치사 in/at/on 혼동'
  frequency INT DEFAULT 1,
  examples JSONB DEFAULT '[]', -- 실수 예시들
  first_occurred TIMESTAMP DEFAULT NOW(),
  last_occurred TIMESTAMP DEFAULT NOW(),
  is_resolved BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_user_mistakes_user_id ON user_mistakes(user_id);
CREATE INDEX idx_user_mistakes_type ON user_mistakes(mistake_type);
```

#### `learning_stats` (신규)
```sql
CREATE TABLE learning_stats (
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL,
  date DATE NOT NULL,
  total_corrections INT DEFAULT 0,
  total_mistakes INT DEFAULT 0,
  mistake_rate DECIMAL(5,2), -- 실수율 (%)
  mistake_breakdown JSONB DEFAULT '{}', -- 유형별 실수 횟수
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, date)
);

CREATE INDEX idx_learning_stats_user_date ON learning_stats(user_id, date);
```

### 6.3 API Endpoints (신규)

```
GET  /api/user/profile
  → 사용자 프로필 조회 (레벨, 목표 등)

POST /api/user/profile
  → 사용자 프로필 업데이트

GET  /api/user/mistakes
  → 반복 실수 패턴 조회
  Query: ?period=week|month&limit=10

GET  /api/dashboard/stats
  → 대시보드 통계 조회
  Response: {
    mistakeRateTrend: [...],
    topImprovements: [...],
    weakAreas: [...]
  }

POST /api/review/generate
  → 복습 자료 생성
  Body: { mistakeType: 'preposition', count: 5 }
```

### 6.4 AI Prompt Strategy

**기존 Prompt**:
```
You are an expert English tutor.
Correct the user's sentence and explain why.
```

**신규 Adaptive Prompt** (예시):
```
You are an expert English tutor for Korean speakers.

User Profile:
- Level: Intermediate (B1)
- Learning Goal: Business email writing
- Recent Mistakes (last 7 days):
  * Prepositions: 5 times (especially time prepositions: in/on/at)
  * Articles: 3 times (a/an/the confusion)
  * Past tense irregular verbs: 2 times

Instructions:
1. Correct the sentence naturally.
2. Explain mistakes in Korean, focusing on:
   - If it's a preposition error → provide detailed explanation (weak area)
   - If it's other grammar → brief reminder
3. Provide alternative expressions suitable for business emails.
4. If you detect a pattern similar to past mistakes, add:
   "💡 Insight: 이번 주 이미 2번 틀린 패턴이에요. 집중 연습이 필요합니다."

Respond in JSON format:
{
  "correctedText": "...",
  "koreanExplanation": "...",
  "alternatives": [...],
  "insight": "..." // optional
}
```

---

## 7. User Stories & Acceptance Criteria

### Epic 1: 학습 패턴 추적

#### User Story 1.1: 실수 자동 감지
**As a** 영어 학습자
**I want** 내가 자주 틀리는 패턴을 자동으로 추적받고 싶다
**So that** 같은 실수를 반복하지 않을 수 있다

**Acceptance Criteria**:
- [ ] 교정 시 실수 유형이 자동 분류됨 (문법/어휘/스타일)
- [ ] DB에 실수 패턴이 저장됨 (user_mistakes 테이블)
- [ ] 동일 패턴 3회 반복 시 화면에 insight 메시지 표시
- [ ] insight 메시지는 간단한 규칙 요약 포함 (3줄 이내)

#### User Story 1.2: 약점 영역 시각화
**As a** 영어 학습자
**I want** 내 약점 영역을 한눈에 보고 싶다
**So that** 어디에 집중해야 할지 알 수 있다

**Acceptance Criteria**:
- [ ] 대시보드에 약점 TOP 3 표시
- [ ] 각 약점마다 빈도 수 표시 (예: "전치사 사용, 7회")
- [ ] 클릭 시 관련 실수 예시 보기 가능
- [ ] "복습하기" 버튼 제공

---

### Epic 2: 개인화된 피드백

#### User Story 2.1: 레벨별 설명 조절
**As a** 초급 학습자
**I want** 쉬운 설명과 충분한 예제를 받고 싶다
**So that** 어려운 용어에 좌절하지 않고 학습할 수 있다

**Acceptance Criteria**:
- [ ] 사용자 레벨이 DB에 저장됨 (user_profiles.level)
- [ ] 초급 사용자에게는 기초 문법 규칙 설명 제공
- [ ] 예제 문장 3개 이상 포함
- [ ] 전문 용어 사용 최소화

**As a** 고급 학습자
**I want** 뉘앙스와 문화적 맥락 설명을 받고 싶다
**So that** 더 자연스럽고 세련된 영어를 쓸 수 있다

**Acceptance Criteria**:
- [ ] 고급 사용자에게는 뉘앙스 차이 설명
- [ ] 비즈니스/학술 상황별 표현 제안
- [ ] 관용구 및 문화적 맥락 포함

#### User Story 2.2: 실수 이력 기반 프롬프트
**As a** 시스템
**I want** 사용자의 과거 실수 이력을 AI 프롬프트에 주입하고 싶다
**So that** 더 관련성 높은 피드백을 제공할 수 있다

**Acceptance Criteria**:
- [ ] 최근 7일간 실수 패턴을 AI 프롬프트에 포함
- [ ] 약점 영역에 대해서는 더 상세한 설명 생성
- [ ] 이미 잘하는 영역은 간단히 언급

---

### Epic 3: 진도 대시보드

#### User Story 3.1: 실수율 추이 그래프
**As a** 영어 학습자
**I want** 내 실수율이 줄어드는 추세를 그래프로 보고 싶다
**So that** 학습 동기를 유지할 수 있다

**Acceptance Criteria**:
- [ ] 주간 실수율 그래프 표시 (선 그래프)
- [ ] 최근 4주 데이터 표시
- [ ] 각 주차별 실수율(%) 명시
- [ ] 개선률 계산 및 표시 (예: "30% 향상!")

#### User Story 3.2: 강점/약점 요약
**As a** 영어 학습자
**I want** 내가 가장 많이 향상된 영역과 아직 약한 영역을 알고 싶다
**So that** 어디에 집중할지 판단할 수 있다

**Acceptance Criteria**:
- [ ] 가장 많이 향상된 영역 TOP 3 (녹색 배지)
- [ ] 아직 약한 영역 TOP 3 (빨간색 배지)
- [ ] 각 영역마다 개선률 또는 빈도 표시
- [ ] 약한 영역 클릭 시 복습 자료 제공

---

### Epic 4: 능동적 복습 제안

#### User Story 4.1: 반복 패턴 복습 알림
**As a** 영어 학습자
**I want** 자주 틀리는 패턴에 대한 복습 자료를 자동으로 받고 싶다
**So that** 능동적으로 약점을 개선할 수 있다

**Acceptance Criteria**:
- [ ] 동일 패턴 5회 반복 시 복습 알림 생성
- [ ] 알림 메시지에 간단한 퀴즈 포함 (3-5문제)
- [ ] "지금 복습하기" / "나중에" 선택 가능
- [ ] "나중에" 선택 시 3일 후 재알림

#### User Story 4.2: 미사용 사용자 Re-engagement
**As a** 제품 매니저
**I want** 5일 이상 미사용 사용자에게 알림을 보내고 싶다
**So that** 사용자를 다시 참여시킬 수 있다

**Acceptance Criteria**:
- [ ] 마지막 활동 후 5일 경과 시 이메일 발송
- [ ] 이메일 내용: 최근 학습 요약 + 복습 제안
- [ ] 이메일 수신 거부 옵션 제공
- [ ] 클릭률 추적 (Open Rate, Click Rate)

---

### Epic 5: 학습 레벨 자동 조정

#### User Story 5.1: 초기 레벨 테스트
**As a** 신규 사용자
**I want** 간단한 테스트로 내 레벨을 파악하고 싶다
**So that** 처음부터 나에게 맞는 피드백을 받을 수 있다

**Acceptance Criteria**:
- [ ] 온보딩 시 5문제 레벨 테스트 제공
- [ ] 2분 이내 완료 가능
- [ ] 문법/어휘/스타일 복합 평가
- [ ] 테스트 결과로 초급/중급/고급 판정
- [ ] 판정 결과를 DB에 저장

#### User Story 5.2: 동적 레벨 재조정
**As a** 시스템
**I want** 사용자의 실수율 변화에 따라 레벨을 자동 조정하고 싶다
**So that** 성장에 맞는 학습 경험을 제공할 수 있다

**Acceptance Criteria**:
- [ ] 매주 일요일 자동으로 레벨 재평가
- [ ] 실수율 10% 이상 감소 시 레벨 상향
- [ ] 레벨 변경 시 사용자에게 알림
- [ ] 레벨 이력을 DB에 기록

---

## 8. Risks & Mitigation

### 8.1 Technical Risks

#### Risk 1: AI 분류 정확도
- **Risk**: AI가 실수 유형을 잘못 분류 (예: 전치사 실수를 어휘 실수로 분류)
- **Impact**: 잘못된 약점 진단 → 사용자 불신
- **Probability**: Medium
- **Mitigation**:
  - Gemini 2.0의 structured output 기능 활용 (높은 정확도)
  - 초기에는 사람이 샘플링 검증 (100개 교정 중 10개 랜덤 체크)
  - 사용자 피드백 버튼: "이 분류가 맞나요?" (Yes/No)
  - 피드백 데이터로 프롬프트 개선

#### Risk 2: Database 부하
- **Risk**: 매 교정마다 user_mistakes, learning_stats 테이블 쓰기 → DB 부하
- **Impact**: 응답 지연, 비용 증가
- **Probability**: Low (MVP 규모에서는 낮음)
- **Mitigation**:
  - Neon DB의 Autoscaling 활용
  - 배치 처리: 10개 교정마다 한 번씩 통계 업데이트
  - Read Replica 사용 (대시보드 조회용)

#### Risk 3: 복잡한 상태 관리
- **Risk**: LangChain Memory + Custom DB Memory 혼용 시 동기화 이슈
- **Impact**: 중복 데이터, 일관성 문제
- **Probability**: Medium
- **Mitigation**:
  - Single Source of Truth: Custom DB를 메인으로, LangChain은 세션용만
  - 명확한 데이터 흐름 정의:
    ```
    LangChain Memory (임시) → 대화 종료 시 → Custom DB (영구)
    ```
  - Integration Test 작성

### 8.2 Product Risks

#### Risk 4: 기능 복잡도 증가
- **Risk**: 너무 많은 기능 → 사용자 혼란, 학습 곡선 증가
- **Impact**: 신규 사용자 이탈
- **Probability**: Medium
- **Mitigation**:
  - MVP는 3개 기능만 (패턴 추적, 개인화 피드백, 대시보드)
  - 점진적 공개: 기능 사용 가이드 투어
  - A/B 테스트: 대시보드 자동 노출 vs 수동 방문

#### Risk 5: 사용자 기대 불일치
- **Risk**: "AI 튜터"라는 기대가 너무 높아서 실망
- **Impact**: NPS 하락, 부정 리뷰
- **Probability**: Low
- **Mitigation**:
  - 명확한 포지셔닝: "AI 영어 교정 + 학습 추적 도구"
  - 한계 명시: "AI는 참고용이며, 100% 완벽하지 않습니다"
  - 피드백 채널 운영: 사용자 기대 사항 수집

### 8.3 Business Risks

#### Risk 6: 유료 전환율 미달
- **Risk**: 개인화 기능이 충분한 가치로 느껴지지 않음 → 전환율 10% 미달
- **Impact**: 매출 목표 미달성
- **Probability**: Medium
- **Mitigation**:
  - Freemium 제한 조정: 무료 10회 → 5회로 축소 (테스트)
  - 유료 전용 기능 강화: 복습 자료 무제한, 월간 리포트
  - 가격 실험: ₩9,900 vs ₩7,900 A/B 테스트

#### Risk 7: 경쟁사 출현
- **Risk**: 유사 기능을 가진 경쟁 서비스 출시
- **Impact**: 시장 점유율 감소
- **Probability**: High (AI 시장 경쟁 치열)
- **Mitigation**:
  - 빠른 출시 (First Mover Advantage)
  - 차별화 강화: 비즈니스 영어 특화, 한국어 설명 품질
  - 커뮤니티 구축: 사용자 충성도 확보

---

## 9. Open Questions

### 9.1 Product Questions

1. **복습 자료 형식**:
   - Q: 퀴즈, 예문, 문법 요약 중 어떤 형식이 가장 효과적인가?
   - Decision Needed: 사용자 테스트 (A/B/C 테스트)
   - Owner: PM

2. **레벨 판정 기준**:
   - Q: 초급/중급/고급을 나누는 정량적 기준은?
   - Proposal: 실수율 + 어휘 복잡도 조합
   - Decision Needed: 언어 전문가 자문
   - Owner: PM + 교육 컨설턴트

3. **알림 빈도**:
   - Q: 복습 알림을 얼마나 자주 보내야 성가시지 않은가?
   - Proposal: 주 2회 (수요일, 일요일)
   - Decision Needed: 사용자 설문
   - Owner: PM

### 9.2 Technical Questions

4. **AI 모델 선택**:
   - Q: Gemini 2.0 Flash vs Gemini 1.5 Pro, 어느 것이 더 적합한가?
   - Considerations: 속도 vs 정확도, 비용
   - Decision Needed: Spike (성능/비용 비교)
   - Owner: Tech Lead

5. **메모리 저장 전략**:
   - Q: LangChain Checkpointer vs Custom DB, 어디까지 각각 사용?
   - Proposal: Checkpointer는 세션용, DB는 장기 메모리용
   - Decision Needed: 아키텍처 리뷰
   - Owner: Backend Developer

6. **실시간 vs 배치 처리**:
   - Q: 통계 업데이트를 실시간으로 할 것인가, 배치로 할 것인가?
   - Proposal: 대시보드 조회 시 실시간 계산
   - Decision Needed: 성능 테스트
   - Owner: Backend Developer

### 9.3 Design Questions

7. **대시보드 디자인**:
   - Q: 그래프 위주 vs 숫자 위주, 어느 것이 더 동기 부여에 효과적인가?
   - Proposal: 그래프 + 핵심 숫자 혼합
   - Decision Needed: 디자인 리뷰
   - Owner: Designer

8. **모바일 최적화**:
   - Q: 복잡한 대시보드를 모바일에서 어떻게 표현?
   - Proposal: 핵심 지표만 노출, 상세는 탭으로 분리
   - Decision Needed: 모바일 프로토타입 테스트
   - Owner: Designer + Frontend Developer

---

## 10. Success Criteria Summary

이 PRD가 성공적으로 구현되면:

### User Impact
- ✅ 사용자가 "챗봇이 나를 이해한다"고 느낌
- ✅ 같은 실수를 반복하는 빈도 30% 감소
- ✅ 학습 진도를 명확히 확인 가능
- ✅ 능동적으로 복습 자료를 받음

### Business Impact
- ✅ 주간 재방문율 30% → 50%
- ✅ 프리미엄 전환율 10% 달성
- ✅ NPS 40+ 달성
- ✅ "개인화된 AI 튜터" 포지셔닝 확립

### Technical Achievement
- ✅ Memory-Augmented AI 아키텍처 구현
- ✅ 실수 패턴 자동 분류 정확도 85%+
- ✅ 대시보드 로딩 시간 2초 이내
- ✅ 시스템 안정성 99.5% uptime

---

## Appendix

### A. Glossary (용어 정의)
- **WAU**: Weekly Active Users (주간 활성 사용자)
- **MAU**: Monthly Active Users (월간 활성 사용자)
- **NPS**: Net Promoter Score (순 추천 고객 지수)
- **Retention**: 사용자 재방문율
- **Mistake Rate**: 실수율 = (실수 횟수 / 총 교정 횟수) × 100

### B. References
- LangChain Memory Documentation: https://python.langchain.com/docs/modules/memory/
- Gemini 2.0 API Docs: https://ai.google.dev/
- Next.js App Router Guide: https://nextjs.org/docs
- Shadcn UI Components: https://ui.shadcn.com/

### C. Revision History
| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-01-15 | PM | Initial PRD draft |

---

**Next Steps**:
1. ✅ PRD Review Meeting (팀 전체)
2. ✅ Technical Spike (LangChain Memory 구현 검증)
3. ✅ User Research (5명 인터뷰)
4. ✅ Design Mockup 작성
5. ✅ Implementation Plan 수립 (별도 문서)
6. ✅ GitHub Issues 생성 (`decompose-issue.md` 활용)
