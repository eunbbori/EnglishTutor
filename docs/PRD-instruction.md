# PRD Writing Instructions: Personalized AI English Tutor

**Purpose**: Transform the current correction-only chatbot into a **personalized, adaptive English learning companion** that remembers user patterns, tracks progress, and provides tailored guidance.

---

## 1. Problem Definition (문제 정의)

### Current State (AS-IS)
현재 영어 회화 교정봇은 **stateless correction tool**로 동작합니다:
- 사용자가 입력한 문장을 교정
- 문법 설명과 대안 표현 제공
- 각 요청은 **독립적**이며, 이전 대화를 학습에 활용하지 않음

### Problems Identified
1. **No Learning Context**
   - 사용자가 같은 실수를 반복해도 인지하지 못함
   - 예: "I go to school yesterday" → 매번 새롭게 과거형 설명

2. **Generic Feedback**
   - 모든 사용자에게 동일한 설명 방식
   - 개인의 학습 레벨, 약점, 목표를 고려하지 않음

3. **No Progress Tracking**
   - 사용자가 얼마나 발전했는지 알 수 없음
   - 학습 동기 부여 부족

4. **Reactive Only (능동적이지 않음)**
   - 사용자가 질문해야만 응답
   - 약점 기반 연습 문제나 복습 제안 없음

### Pain Points (사용자 불편사항)
- **반복 학습의 어려움**: "내가 자주 틀리는 게 뭐지?" 를 직접 기억해야 함
- **진도 파악 불가**: "나 요즘 늘고 있나?" 확인할 방법 없음
- **일관성 없는 경험**: 매번 처음 만난 튜터처럼 동일한 수준의 설명 반복

---

## 2. Target Users & Use Cases (타겟 사용자 및 사용 사례)

### Primary Persona: "영어 중급 학습자 지민"
- **Profile**:
  - 직장인, 28세
  - 해외 팀과 협업하며 이메일/슬랙 메시지 영작 필요
  - 기본 문법은 알지만 **자연스러운 표현**을 고민
  - 시간이 부족해서 체계적인 강의 수강은 어려움

- **Current Workflow**:
  1. 영어 메시지 작성
  2. 챗봇에 붙여넣어 교정 요청
  3. 교정 결과를 복사해서 사용
  4. (문제: 같은 실수를 내일 또 함)

- **Desired Workflow** (목표):
  1. 영어 메시지 작성
  2. 챗봇이 교정하며 **"지난주에도 이 전치사를 틀렸어요"** 알림
  3. 주말에 **"이번 주 자주 틀린 5가지 패턴 복습해볼까요?"** 제안받음
  4. 한 달 후 **"전치사 실수가 70% → 30%로 줄었어요!"** 피드백

### Use Cases

#### UC-1: 반복 실수 패턴 인식
- **Scenario**: 사용자가 3일 연속 "in/on/at" 전치사를 혼동
- **Expected Behavior**:
  - 챗봇: "전치사 사용이 헷갈리는 것 같아요. 이 부분을 집중적으로 연습해볼까요?"
  - 관련 예제 3개 제시

#### UC-2: 개인화된 난이도 조절
- **Scenario**: 초급 사용자 vs 고급 사용자
- **Expected Behavior**:
  - 초급: "주어-동사 일치 규칙은..."처럼 기초부터 설명
  - 고급: "이 표현은 격식 있는 상황에서 부적절합니다. 대신..."처럼 뉘앙스 중심

#### UC-3: 학습 진도 대시보드
- **Scenario**: 사용자가 "내 실력이 늘고 있나?" 궁금
- **Expected Behavior**:
  - 대시보드에서 주간/월간 통계 확인
  - "이번 달 가장 많이 향상된 영역: 관사 사용 (+40%)"

#### UC-4: 능동적 학습 제안
- **Scenario**: 사용자가 5일간 챗봇을 사용하지 않음
- **Expected Behavior**:
  - 이메일/앱 알림: "지난주 배운 'would vs used to' 복습해볼까요?"

---

## 3. Goals for Using This Feature (이 기능을 사용하는 목표)

### User Goals (사용자 목표)
1. **학습 효율 향상**
   - 같은 실수를 반복하지 않기
   - 약점에 집중하여 빠르게 개선

2. **동기 부여 유지**
   - 진도를 가시적으로 확인
   - 성취감을 느끼며 지속적인 학습

3. **맞춤형 학습 경험**
   - 내 레벨에 맞는 설명과 예제
   - 내 목표(비즈니스 영어, 여행 회화 등)에 맞춘 콘텐츠

### Business Goals (비즈니스 목표)
1. **사용자 Retention 증가**
   - 개인화 → 더 오래 사용 → 구독 전환율 상승

2. **Differentiation (차별화)**
   - 단순 번역/교정 도구가 아닌 **"나만의 AI 튜터"** 포지셔닝

3. **Data-Driven Insights**
   - 사용자 학습 패턴 분석 → 더 나은 프롬프트/기능 개발

---

## 4. Proposed Solution (제안 해결책)

### High-Level Approach
**"Memory-Augmented Conversational AI"** 아키텍처 도입:
- **Short-term Memory**: 최근 대화 맥락 유지 (기존 기능)
- **Long-term Memory**: 사용자의 실수 패턴, 학습 히스토리 저장
- **Adaptive Prompting**: 메모리 기반으로 프롬프트 동적 생성

### Key Features to Build

#### Feature 1: 학습 패턴 추적 (Learning Pattern Tracker)
- **What**: 사용자가 반복하는 실수를 자동으로 감지
- **How**:
  - 교정 시 실수 유형을 분류 (문법, 어휘, 스타일 등)
  - DB에 `user_mistakes` 테이블 생성
  - 동일 패턴이 3회 이상 반복되면 "약점" 태그

**Example**:
```
User Mistake DB:
- user_id: 123
- mistake_type: "preposition_usage"
- pattern: "in/at/on 혼동"
- frequency: 5 (최근 7일)
- last_occurred: 2025-01-15
```

#### Feature 2: 개인화된 피드백 (Personalized Feedback)
- **What**: 사용자 레벨과 과거 이력에 맞춘 설명
- **How**:
  - AI 프롬프트에 사용자 컨텍스트 주입
  - "이 사용자는 전치사를 자주 틀림" → 더 상세한 전치사 설명

**Prompt Example**:
```
System: You are tutoring a user who frequently makes mistakes with:
- Prepositions (5 times this week)
- Past tense irregular verbs (3 times)

Adjust your explanation depth accordingly.
```

#### Feature 3: 진도 대시보드 (Progress Dashboard)
- **What**: 사용자의 학습 통계를 시각화
- **Metrics**:
  - 총 교정 횟수
  - 실수율 추이 (주간/월간)
  - 가장 많이 향상된 영역
  - 약점 TOP 3

**UI Components**:
- Chart.js/Recharts로 그래프
- Shadcn Badge로 강점/약점 태그 표시

#### Feature 4: 능동적 복습 제안 (Proactive Review)
- **What**: 사용자가 요청하지 않아도 복습 자료 제공
- **When**:
  - 특정 패턴이 5회 이상 반복될 때
  - 일주일 이상 사용하지 않을 때
  - 월말 요약 리포트

**Example Message**:
```
💡 Tip: 이번 주 "관사(a/an/the)" 실수가 7번 있었어요.
아래 문장들을 다시 한번 연습해보세요:

1. I saw ___ elephant at the zoo. (정답: an)
2. She is ___ doctor. (정답: a)
```

#### Feature 5: 학습 레벨 자동 조정 (Adaptive Difficulty)
- **What**: 사용자 실력에 따라 설명 깊이 조절
- **How**:
  - 초기: 간단한 퀴즈로 레벨 테스트
  - 이후: 실수 빈도로 레벨 재조정
  - 레벨에 따라 AI 응답 톤 변경

**Levels**:
- Beginner: 기초 문법 규칙부터 설명
- Intermediate: 뉘앙스와 대안 표현 중심
- Advanced: 관용구, 문화적 맥락 설명

---

## 5. Goals & Success Metrics (목표 및 성공 지표)

### Product Goals (제품 목표)

#### Goal 1: 사용자 재방문율 증가
- **Baseline**: 현재 주간 재방문율 30%
- **Target**: 6개월 내 50% 달성
- **Metric**: WAU (Weekly Active Users) / MAU (Monthly Active Users)

#### Goal 2: 학습 효과 입증
- **Baseline**: 없음 (신규 기능)
- **Target**: 사용자의 실수율이 한 달 사용 후 평균 30% 감소
- **Metric**:
  - `(이번 주 실수 횟수 / 총 교정 횟수) - (첫 주 실수율)`
  - NPS (Net Promoter Score): "친구에게 추천하겠습니까?" 설문

#### Goal 3: 개인화 기능 사용률
- **Target**: 활성 사용자의 70%가 대시보드를 1회 이상 방문
- **Metric**: Dashboard Page Views / Total Active Users

### Success Metrics (성공 지표)

#### Quantitative (정량적)
| Metric | Current | Target (3개월) | Target (6개월) |
|--------|---------|----------------|----------------|
| 주간 재방문율 (WAU/MAU) | 30% | 40% | 50% |
| 평균 세션 길이 | 5분 | 8분 | 10분 |
| 사용자당 월간 교정 횟수 | 20회 | 35회 | 50회 |
| 실수율 감소 | N/A | 20% | 30% |
| 프리미엄 전환율 | N/A | 5% | 10% |

#### Qualitative (정성적)
- 사용자 인터뷰: "챗봇이 나를 이해한다고 느끼나요?"
- 리뷰 분석: "personalized", "helpful", "improving" 키워드 증가
- 이탈 사유 설문: "기능 부족" 응답 감소

---

## 6. PRD Writing Guidelines (PRD 작성 가이드)

### PRD Structure (구조)
실제 PRD를 작성할 때는 다음 구조를 따르세요:

```markdown
# PRD: [Feature Name]

## 1. Executive Summary
- 한 문단으로 전체 요약

## 2. Problem & Opportunity
- 1장의 내용 활용

## 3. User Personas & Use Cases
- 2장의 내용 활용

## 4. Goals & Metrics
- 5장의 내용 활용

## 5. Proposed Solution
- 4장의 내용을 상세화
- Wireframes/Mockups 포함

## 6. Technical Architecture
- System Design
- Database Schema
- API Endpoints

## 7. User Stories & Acceptance Criteria
- Epic → User Stories → Tasks 로 분해
- 각 Story마다 AC 정의

## 8. Timeline & Milestones
- Phase 1 (MVP): 핵심 기능
- Phase 2: 부가 기능
- Phase 3: 최적화

## 9. Risks & Mitigation
- 기술적 리스크
- 비즈니스 리스크

## 10. Open Questions
- 아직 결정되지 않은 사항
```

### Writing Principles
1. **Be Specific**: "사용자 경험 개선" ❌ → "재방문율 30% → 50%" ✅
2. **Data-Driven**: 주장마다 근거 제시 (사용자 인터뷰, 분석 데이터)
3. **User-Centric**: 기술이 아닌 사용자 가치에 집중
4. **Actionable**: 개발팀이 바로 구현 계획을 세울 수 있을 정도로 구체적

---

## 7. Next Steps (다음 단계)

1. **Stakeholder Alignment**
   - 이 instruction을 기반으로 팀과 방향성 논의
   - 우선순위 합의 (어떤 기능부터 개발?)

2. **User Research**
   - 현재 사용자 5명 인터뷰
   - "개인화된 튜터" 니즈 검증

3. **Technical Spike**
   - LangChain Memory 구현 가능성 조사
   - DB 스키마 설계 (user_mistakes, learning_stats)

4. **Write PRD**
   - 이 가이드라인을 따라 정식 PRD 문서 작성
   - Figma 목업 추가

5. **Create Issues**
   - PRD를 기반으로 GitHub Issues 생성
   - `decompose-issue.md` 커맨드 활용

---

**Document Owner**: Product Manager
**Last Updated**: 2025-01-15
**Status**: Draft - Awaiting PRD Creation
