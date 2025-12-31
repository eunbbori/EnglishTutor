# Execution Plan: Personalized AI English Tutor

**Based on**: PRD v1.0
**Created**: 2025-01-15
**Owner**: Product Manager & Tech Lead
**Status**: Ready for Implementation

---

## Overview

이 실행 계획은 PRD에 정의된 5가지 핵심 기능을 **3개 Phase**로 나누어 구현합니다.
각 태스크는 독립적으로 완료 가능하며, 의존성이 명확히 정의되어 있습니다.

**총 예상 기간**: 6개월
**총 태스크 수**: 32개

---

## Phase Overview

| Phase | Duration | Focus | Key Features |
|-------|----------|-------|--------------|
| Phase 1 (MVP) | 2개월 | Core Memory & Tracking | Feature 1, 2, 3 |
| Phase 2 | 2개월 | Proactive Learning | Feature 4, 5 |
| Phase 3 | 2개월 | Enhancement & Scale | 고도화, 최적화 |

---

## 태스크 분석 프로세스

### 1. 기능별 복잡도 평가

| Feature | Complexity | Backend | Frontend | DB Schema | AI Logic |
|---------|-----------|---------|----------|-----------|----------|
| Feature 1: 학습 패턴 추적 | High | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| Feature 2: 개인화된 피드백 | Medium | ⭐⭐ | ⭐ | ⭐ | ⭐⭐⭐ |
| Feature 3: 진도 대시보드 | Medium | ⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐ |
| Feature 4: 능동적 복습 제안 | High | ⭐⭐⭐ | ⭐⭐ | ⭐ | ⭐⭐ |
| Feature 5: 학습 레벨 자동 조정 | Medium | ⭐⭐ | ⭐⭐ | ⭐ | ⭐⭐⭐ |

### 2. 의존성 분석

```
Phase 1 (병렬 가능):
├── Feature 1 (Foundation)
│   ├── DB Schema 설계 (선행 필수)
│   ├── Backend API (DB 의존)
│   └── Frontend Integration (API 의존)
├── Feature 2 (독립적)
│   ├── AI Prompt 개선 (독립)
│   └── Backend Integration (Feature 1 완료 후)
└── Feature 3 (Feature 1, 2 의존)
    ├── Stats Calculation API (Feature 1 완료 후)
    └── Dashboard UI (API 의존)

Phase 2 (Phase 1 완료 후):
├── Feature 4 (Feature 1, 3 의존)
└── Feature 5 (Feature 1 의존)
```

### 3. 태스크 분류 기준

- **Backend**: DB, API, 비즈니스 로직
- **Frontend**: UI/UX, 클라이언트 로직
- **Fullstack**: Backend + Frontend 통합 작업
- **AI**: Prompt 엔지니어링, LangChain 설정
- **DevOps**: 배포, 모니터링, 성능 최적화

---

## Phase 1: MVP (8주)

### Week 1-2: Foundation & DB Schema

#### Task 1.1: Database Schema 설계 및 마이그레이션
- **Category**: Backend
- **Complexity**: Medium
- **Priority**: P0 (Blocker)
- **Estimated**: 8 hours
- **Dependencies**: None

**Description**:
PRD 6.2에 정의된 3개 신규 테이블을 생성합니다.

**Acceptance Criteria**:
- [ ] `user_profiles` 테이블 생성 (level, learning_goal, recurring_mistakes)
- [ ] `user_mistakes` 테이블 생성 (mistake_type, pattern, frequency, examples)
- [ ] `learning_stats` 테이블 생성 (date, mistake_rate, mistake_breakdown)
- [ ] Drizzle migration 파일 생성
- [ ] `npm run db:migrate` 성공
- [ ] 인덱스 생성 (user_id, date 등)

**Files to Modify**:
- `db/schema.ts` - 신규 테이블 정의
- `drizzle/migrations/` - 마이그레이션 파일

**Technical Notes**:
```sql
-- user_mistakes 예시
CREATE TABLE user_mistakes (
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL,
  mistake_type TEXT NOT NULL,
  sub_type TEXT,
  pattern TEXT,
  frequency INT DEFAULT 1,
  examples JSONB DEFAULT '[]',
  first_occurred TIMESTAMP DEFAULT NOW(),
  last_occurred TIMESTAMP DEFAULT NOW(),
  is_resolved BOOLEAN DEFAULT FALSE
);
```

---

#### Task 1.2: User Profile 초기화 로직
- **Category**: Backend
- **Complexity**: Easy
- **Priority**: P0
- **Estimated**: 4 hours
- **Dependencies**: Task 1.1

**Description**:
신규 사용자 생성 시 `user_profiles` 초기화 로직을 구현합니다.

**Acceptance Criteria**:
- [ ] 첫 메시지 전송 시 user_profile 자동 생성
- [ ] 기본 레벨 'intermediate' 설정
- [ ] recurring_mistakes 빈 배열로 초기화
- [ ] user_id는 기존 chats.userId 재사용

**Files to Create/Modify**:
- `lib/db/user-profile.ts` - 프로필 관리 함수
- `app/api/chat/route.ts` - 프로필 초기화 호출

---

### Week 2-3: Feature 1 - 학습 패턴 추적

#### Task 1.3: AI 실수 분류 로직
- **Category**: AI
- **Complexity**: Hard
- **Priority**: P0
- **Estimated**: 12 hours
- **Dependencies**: Task 1.1

**Description**:
Gemini AI가 실수 유형을 자동 분류하도록 프롬프트를 개선합니다.

**Acceptance Criteria**:
- [ ] 교정 응답에 `mistakeType` 필드 추가
  - Grammar: tense, subject_verb_agreement, preposition, article, etc.
  - Vocabulary: word_choice, collocation
  - Style: formality, clarity
- [ ] Zod schema에 `mistakeType` 정의
- [ ] AI 응답 JSON 포맷 검증
- [ ] 분류 정확도 85% 이상 (수동 샘플링 검증)

**Files to Modify**:
- `lib/ai/schema.ts` - mistakeType enum 추가
- `lib/ai/graph.ts` - AI 프롬프트에 분류 지시 추가

**Prompt Example**:
```
Additionally, classify the mistake type:
- If it's a grammar error, specify: tense, preposition, article, etc.
- If it's vocabulary, specify: word_choice, collocation
- If it's style, specify: formality, clarity

Return in JSON: { ..., "mistakeType": "grammar:preposition" }
```

---

#### Task 1.4: 실수 패턴 저장 API
- **Category**: Backend
- **Complexity**: Medium
- **Priority**: P0
- **Estimated**: 8 hours
- **Dependencies**: Task 1.3

**Description**:
교정 시 실수 패턴을 `user_mistakes` 테이블에 저장하는 API를 구현합니다.

**Acceptance Criteria**:
- [ ] 교정 완료 후 실수 유형 DB 저장
- [ ] 기존 패턴 존재 시 `frequency++` 및 `last_occurred` 업데이트
- [ ] 신규 패턴 시 새 레코드 생성
- [ ] examples 배열에 최대 5개까지 저장 (FIFO)
- [ ] 트랜잭션 처리로 데이터 일관성 보장

**Files to Create/Modify**:
- `lib/db/mistakes.ts` - 실수 패턴 저장/업데이트 함수
- `app/api/chat/route.ts` - 교정 후 mistakes 저장 호출

**Example Function**:
```typescript
async function saveMistakePattern({
  userId,
  mistakeType,
  pattern,
  example
}: MistakePatternInput) {
  const existing = await db.select().from(userMistakes)
    .where(and(
      eq(userMistakes.userId, userId),
      eq(userMistakes.pattern, pattern)
    ));

  if (existing.length > 0) {
    // Update frequency
    await db.update(userMistakes)
      .set({
        frequency: existing[0].frequency + 1,
        lastOccurred: new Date()
      });
  } else {
    // Create new
    await db.insert(userMistakes).values({...});
  }
}
```

---

#### Task 1.5: 반복 패턴 감지 로직
- **Category**: Backend
- **Complexity**: Medium
- **Priority**: P1
- **Estimated**: 6 hours
- **Dependencies**: Task 1.4

**Description**:
동일 패턴이 3회 이상 반복되면 "Insight" 메시지를 생성합니다.

**Acceptance Criteria**:
- [ ] 교정 시 최근 7일 내 동일 패턴 빈도 조회
- [ ] 빈도 >= 3회 시 insight 메시지 생성
- [ ] insight에 간단한 규칙 요약 포함 (AI 생성)
- [ ] 응답 JSON에 `insight` 필드 추가 (optional)

**Files to Modify**:
- `lib/db/mistakes.ts` - 패턴 빈도 조회 함수
- `lib/ai/graph.ts` - insight 생성 로직 추가
- `lib/ai/schema.ts` - insight 필드 추가

---

#### Task 1.6: 프론트엔드 Insight 표시
- **Category**: Frontend
- **Complexity**: Easy
- **Priority**: P1
- **Estimated**: 4 hours
- **Dependencies**: Task 1.5

**Description**:
교정 결과 하단에 Insight 메시지를 표시합니다.

**Acceptance Criteria**:
- [ ] insight 필드 존재 시 별도 섹션 렌더링
- [ ] 💡 아이콘 + 노란색 배경 Alert 컴포넌트 사용
- [ ] "연습 문제 풀기" 버튼 제공 (Phase 2에서 구현)
- [ ] 모바일 반응형 디자인

**Files to Modify**:
- `components/chat/correction-card.tsx` - Insight 섹션 추가
- `components/ui/alert.tsx` - Shadcn Alert 활용

**UI Example**:
```tsx
{correction.insight && (
  <Alert className="mt-4 bg-yellow-50 border-yellow-200">
    <Lightbulb className="h-4 w-4" />
    <AlertTitle>💡 Insight</AlertTitle>
    <AlertDescription>
      {correction.insight}
      <Button variant="link" className="mt-2">
        연습 문제 풀기 →
      </Button>
    </AlertDescription>
  </Alert>
)}
```

---

### Week 3-4: Feature 2 - 개인화된 피드백

#### Task 2.1: 사용자 레벨 관리 시스템
- **Category**: Backend
- **Complexity**: Easy
- **Priority**: P1
- **Estimated**: 4 hours
- **Dependencies**: Task 1.2

**Description**:
사용자 레벨(beginner, intermediate, advanced)을 설정하고 조회하는 API를 구현합니다.

**Acceptance Criteria**:
- [ ] `GET /api/user/profile` - 레벨 조회
- [ ] `POST /api/user/profile` - 레벨 업데이트
- [ ] 기본 레벨은 'intermediate'
- [ ] 레벨 변경 이력 로깅

**Files to Create**:
- `app/api/user/profile/route.ts` - Profile CRUD API

---

#### Task 2.2: Adaptive Prompting 구현
- **Category**: AI
- **Complexity**: Hard
- **Priority**: P0
- **Estimated**: 10 hours
- **Dependencies**: Task 2.1, Task 1.4

**Description**:
사용자 레벨과 최근 실수 패턴을 AI 프롬프트에 주입합니다.

**Acceptance Criteria**:
- [ ] 교정 요청 시 user_profile 조회
- [ ] 최근 7일 내 실수 패턴 조회 (빈도 TOP 3)
- [ ] System Prompt에 컨텍스트 추가:
  ```
  User Profile:
  - Level: Intermediate
  - Recent Mistakes: prepositions (5x), articles (3x)
  - Learning Goal: Business email writing
  ```
- [ ] 레벨별 응답 톤 차별화 테스트

**Files to Modify**:
- `lib/ai/graph.ts` - Adaptive prompt 생성 함수
- `lib/db/mistakes.ts` - 최근 실수 조회 함수

---

#### Task 2.3: 레벨별 설명 검증
- **Category**: QA
- **Complexity**: Easy
- **Priority**: P2
- **Estimated**: 4 hours
- **Dependencies**: Task 2.2

**Description**:
초급/중급/고급 사용자에게 동일 실수를 테스트하여 응답 차이를 검증합니다.

**Acceptance Criteria**:
- [ ] 테스트 케이스 10개 작성 (초급 3, 중급 4, 고급 3)
- [ ] 각 레벨별 설명 길이/톤/예제 수 비교
- [ ] 문서화: `docs/ai-response-examples.md`

---

### Week 4-6: Feature 3 - 진도 대시보드

#### Task 3.1: 학습 통계 계산 API
- **Category**: Backend
- **Complexity**: Medium
- **Priority**: P1
- **Estimated**: 8 hours
- **Dependencies**: Task 1.4

**Description**:
주간/월간 실수율, 향상 영역, 약점 영역을 계산하는 API를 구현합니다.

**Acceptance Criteria**:
- [ ] `GET /api/dashboard/stats?period=week|month`
- [ ] 응답 포맷:
  ```json
  {
    "mistakeRateTrend": [
      { "week": 1, "rate": 30 },
      { "week": 2, "rate": 25 },
      ...
    ],
    "topImprovements": [
      { "area": "prepositions", "improvement": 40 }
    ],
    "weakAreas": [
      { "area": "irregular_verbs", "frequency": 5 }
    ],
    "totalStats": {
      "totalCorrections": 217,
      "activeDays": 28,
      "streakDays": 12
    }
  }
  ```
- [ ] 캐싱 전략 (1시간 TTL)

**Files to Create**:
- `app/api/dashboard/stats/route.ts` - Stats API
- `lib/db/stats.ts` - 통계 계산 함수

---

#### Task 3.2: 대시보드 페이지 생성
- **Category**: Frontend
- **Complexity**: Medium
- **Priority**: P1
- **Estimated**: 12 hours
- **Dependencies**: Task 3.1

**Description**:
사용자 학습 통계를 시각화하는 대시보드 페이지를 구현합니다.

**Acceptance Criteria**:
- [ ] `/dashboard` 경로 생성
- [ ] Recharts로 주간 실수율 그래프
- [ ] 강점/약점 TOP 3 Badge 표시
- [ ] 총 통계 카드 (교정 횟수, 활동 일수, 연속 학습)
- [ ] 모바일 반응형
- [ ] 로딩 상태 처리

**Files to Create**:
- `app/dashboard/page.tsx` - 대시보드 페이지
- `components/dashboard/stats-chart.tsx` - 차트 컴포넌트
- `components/dashboard/improvement-badges.tsx` - Badge 컴포넌트

**UI Libraries**:
- Recharts (Line Chart)
- Shadcn Badge, Card, Progress

---

#### Task 3.3: 네비게이션 통합
- **Category**: Frontend
- **Complexity**: Easy
- **Priority**: P2
- **Estimated**: 2 hours
- **Dependencies**: Task 3.2

**Description**:
메인 레이아웃에 대시보드 링크를 추가합니다.

**Acceptance Criteria**:
- [ ] 사이드바/헤더에 "대시보드" 메뉴 추가
- [ ] 현재 페이지 강조 표시
- [ ] 모바일 메뉴에도 포함

**Files to Modify**:
- `app/layout.tsx` - 네비게이션 추가

---

### Week 7-8: Integration & Testing

#### Task 3.4: End-to-End 테스트
- **Category**: QA
- **Complexity**: Medium
- **Priority**: P0
- **Estimated**: 8 hours
- **Dependencies**: All Phase 1 tasks

**Description**:
MVP 전체 플로우를 테스트합니다.

**Test Scenarios**:
1. 신규 사용자 온보딩
2. 3회 동일 실수 → Insight 표시
3. 대시보드 통계 정확성
4. 레벨별 피드백 차이

**Acceptance Criteria**:
- [ ] 모든 시나리오 통과
- [ ] 버그 리스트 작성 및 수정
- [ ] 성능 테스트 (응답 시간 < 3초)

---

#### Task 3.5: MVP 배포
- **Category**: DevOps
- **Complexity**: Easy
- **Priority**: P0
- **Estimated**: 4 hours
- **Dependencies**: Task 3.4

**Description**:
Vercel에 MVP를 배포하고 모니터링을 설정합니다.

**Acceptance Criteria**:
- [ ] Vercel Production 배포
- [ ] 환경 변수 설정 확인
- [ ] DB 마이그레이션 실행
- [ ] Sentry 또는 Vercel Analytics 연동
- [ ] 배포 URL 공유

---

## Phase 2: Proactive Learning (8주)

### Week 9-10: Feature 4 - 능동적 복습 제안

#### Task 4.1: 복습 자료 생성 API
- **Category**: Backend + AI
- **Complexity**: Hard
- **Priority**: P1
- **Estimated**: 10 hours
- **Dependencies**: Task 1.4

**Description**:
사용자의 약점 패턴 기반으로 퀴즈 형식 복습 자료를 생성합니다.

**Acceptance Criteria**:
- [ ] `POST /api/review/generate`
  - Body: `{ mistakeType: 'preposition', count: 5 }`
  - Response: 퀴즈 5개 (문제, 정답, 해설)
- [ ] AI가 사용자의 실수 예시를 기반으로 유사 문제 생성
- [ ] 난이도는 사용자 레벨 반영

**Files to Create**:
- `app/api/review/generate/route.ts`
- `lib/ai/review-generator.ts`

---

#### Task 4.2: 복습 알림 스케줄러
- **Category**: Backend
- **Complexity**: Medium
- **Priority**: P1
- **Estimated**: 8 hours
- **Dependencies**: Task 4.1

**Description**:
특정 조건 충족 시 복습 알림을 생성하는 배치 작업을 구현합니다.

**Triggers**:
1. 동일 패턴 5회 반복
2. 5일간 미사용
3. 주간 리포트 (일요일)

**Acceptance Criteria**:
- [ ] Vercel Cron Job 설정 (`vercel.json`)
- [ ] 알림 대상 사용자 조회 로직
- [ ] 알림 데이터 DB 저장 (`notifications` 테이블)
- [ ] 이메일 발송 (Resend 또는 SendGrid)

**Files to Create**:
- `app/api/cron/review-reminder/route.ts`
- `lib/email/review-reminder-template.tsx`

---

#### Task 4.3: 복습 UI (모달)
- **Category**: Frontend
- **Complexity**: Medium
- **Priority**: P1
- **Estimated**: 8 hours
- **Dependencies**: Task 4.1

**Description**:
Insight 메시지의 "연습 문제 풀기" 버튼 클릭 시 모달로 퀴즈를 표시합니다.

**Acceptance Criteria**:
- [ ] Shadcn Dialog로 모달 구현
- [ ] 퀴즈 5문제 순차 표시
- [ ] 정답/오답 즉시 피드백
- [ ] 완료 후 결과 요약 (5/5 정답)

**Files to Create**:
- `components/review/review-modal.tsx`
- `components/review/quiz-card.tsx`

---

#### Task 4.4: 알림 센터 UI
- **Category**: Frontend
- **Complexity**: Easy
- **Priority**: P2
- **Estimated**: 4 hours
- **Dependencies**: Task 4.2

**Description**:
헤더에 알림 아이콘과 드롭다운을 추가합니다.

**Acceptance Criteria**:
- [ ] Bell 아이콘 + 미읽음 배지
- [ ] 드롭다운으로 최근 알림 5개 표시
- [ ] 클릭 시 복습 모달 또는 대시보드 이동

**Files to Modify**:
- `app/layout.tsx` - 알림 아이콘 추가
- `components/notifications/notification-dropdown.tsx`

---

### Week 11-12: Feature 5 - 학습 레벨 자동 조정

#### Task 5.1: 초기 레벨 테스트
- **Category**: Fullstack
- **Complexity**: Medium
- **Priority**: P1
- **Estimated**: 10 hours
- **Dependencies**: None

**Description**:
신규 사용자 온보딩 시 5문제 레벨 테스트를 제공합니다.

**Acceptance Criteria**:
- [ ] 온보딩 페이지 `/onboarding` 생성
- [ ] 문법/어휘/스타일 복합 문제 5개
- [ ] 2분 타이머 (선택 사항)
- [ ] 정답률로 레벨 판정:
  - 0-2개: Beginner
  - 3-4개: Intermediate
  - 5개: Advanced
- [ ] 판정 결과 DB 저장

**Files to Create**:
- `app/onboarding/page.tsx`
- `components/onboarding/level-test.tsx`
- `lib/onboarding/test-questions.ts`

---

#### Task 5.2: 레벨 재조정 로직
- **Category**: Backend
- **Complexity**: Medium
- **Priority**: P1
- **Estimated**: 6 hours
- **Dependencies**: Task 5.1

**Description**:
매주 일요일 자동으로 사용자 레벨을 재평가합니다.

**Algorithm**:
```
if (이번 주 실수율 < 지난 주 - 10%) {
  level++;
} else if (신규 실수 유형 > 3개) {
  level = 유지;
}
```

**Acceptance Criteria**:
- [ ] Cron Job: 매주 일요일 00:00
- [ ] 전체 활성 사용자 레벨 재평가
- [ ] 레벨 변경 시 알림 생성
- [ ] 레벨 변경 이력 로깅

**Files to Create**:
- `app/api/cron/level-adjustment/route.ts`
- `lib/level/adjustment-algorithm.ts`

---

#### Task 5.3: 레벨 변경 알림 UI
- **Category**: Frontend
- **Complexity**: Easy
- **Priority**: P2
- **Estimated**: 3 hours
- **Dependencies**: Task 5.2

**Description**:
레벨이 올라간 사용자에게 축하 메시지를 표시합니다.

**Acceptance Criteria**:
- [ ] 로그인 시 레벨 변경 체크
- [ ] 변경 시 Toast 또는 Modal로 축하 메시지
- [ ] "🎉 축하합니다! Intermediate → Advanced로 승급하셨어요!"

**Files to Modify**:
- `app/layout.tsx` - 레벨 변경 체크
- `components/ui/toast.tsx` - Shadcn Toast 활용

---

### Week 13-14: Phase 2 통합

#### Task 5.4: Phase 2 E2E 테스트
- **Category**: QA
- **Complexity**: Medium
- **Priority**: P0
- **Estimated**: 6 hours
- **Dependencies**: All Phase 2 tasks

**Test Scenarios**:
1. 5일 미사용 → 이메일 수신
2. 퀴즈 완료 → 정답률 저장
3. 레벨 자동 조정 → 알림 표시

---

#### Task 5.5: 성능 최적화
- **Category**: DevOps
- **Complexity**: Medium
- **Priority**: P1
- **Estimated**: 8 hours
- **Dependencies**: Task 5.4

**Optimization Areas**:
- [ ] DB 쿼리 최적화 (인덱스 추가)
- [ ] API 응답 캐싱 (Redis 또는 In-memory)
- [ ] 대시보드 그래프 Lazy Loading
- [ ] 이미지 최적화

---

## Phase 3: Enhancement & Scale (8주)

### Week 15-18: 고급 기능

#### Task 6.1: 대시보드 고도화
- **Category**: Fullstack
- **Estimated**: 16 hours

**Features**:
- 사용자가 월간 목표 설정 (예: "전치사 실수 50% 감소")
- 목표 달성률 표시
- 친구 비교 (선택 사항)

---

#### Task 6.2: 음성 피드백 (TTS)
- **Category**: Frontend
- **Estimated**: 8 hours

**Features**:
- 교정된 문장을 Web Speech API로 읽어주기
- 발음 속도 조절

---

#### Task 6.3: 커뮤니티 기능
- **Category**: Fullstack
- **Estimated**: 20 hours

**Features**:
- 학습 그룹 생성
- 주간 챌린지 (예: "이번 주 실수 0개 도전")
- 리더보드

---

### Week 19-22: 스케일링 & 모니터링

#### Task 7.1: A/B 테스트 프레임워크
- **Category**: DevOps
- **Estimated**: 12 hours

**Features**:
- Vercel Analytics A/B Testing
- 무료 교정 횟수 (10회 vs 5회) 테스트
- 전환율 비교

---

#### Task 7.2: 사용자 피드백 시스템
- **Category**: Fullstack
- **Estimated**: 8 hours

**Features**:
- "이 분류가 정확한가요?" Yes/No 버튼
- 피드백 데이터 수집 및 분석
- 프롬프트 개선에 활용

---

#### Task 7.3: 고급 모니터링
- **Category**: DevOps
- **Estimated**: 6 hours

**Features**:
- Sentry Error Tracking
- Vercel Analytics (Core Web Vitals)
- Custom Metrics (실수율, 전환율, Retention)

---

## 태스크 분해 요약

### Phase 1 (MVP) - 16개 태스크

| # | Task | Category | Complexity | Priority | Est. Hours |
|---|------|----------|-----------|----------|-----------|
| 1.1 | DB Schema 설계 | Backend | Medium | P0 | 8 |
| 1.2 | User Profile 초기화 | Backend | Easy | P0 | 4 |
| 1.3 | AI 실수 분류 | AI | Hard | P0 | 12 |
| 1.4 | 실수 패턴 저장 API | Backend | Medium | P0 | 8 |
| 1.5 | 반복 패턴 감지 | Backend | Medium | P1 | 6 |
| 1.6 | Insight 표시 UI | Frontend | Easy | P1 | 4 |
| 2.1 | 레벨 관리 시스템 | Backend | Easy | P1 | 4 |
| 2.2 | Adaptive Prompting | AI | Hard | P0 | 10 |
| 2.3 | 레벨별 설명 검증 | QA | Easy | P2 | 4 |
| 3.1 | 통계 계산 API | Backend | Medium | P1 | 8 |
| 3.2 | 대시보드 페이지 | Frontend | Medium | P1 | 12 |
| 3.3 | 네비게이션 통합 | Frontend | Easy | P2 | 2 |
| 3.4 | E2E 테스트 | QA | Medium | P0 | 8 |
| 3.5 | MVP 배포 | DevOps | Easy | P0 | 4 |

**Total Phase 1**: 94 hours (~2개월, 1명 풀타임 기준)

### Phase 2 - 10개 태스크

| # | Task | Category | Complexity | Priority | Est. Hours |
|---|------|----------|-----------|----------|-----------|
| 4.1 | 복습 자료 생성 API | Backend+AI | Hard | P1 | 10 |
| 4.2 | 복습 알림 스케줄러 | Backend | Medium | P1 | 8 |
| 4.3 | 복습 UI (모달) | Frontend | Medium | P1 | 8 |
| 4.4 | 알림 센터 UI | Frontend | Easy | P2 | 4 |
| 5.1 | 초기 레벨 테스트 | Fullstack | Medium | P1 | 10 |
| 5.2 | 레벨 재조정 로직 | Backend | Medium | P1 | 6 |
| 5.3 | 레벨 변경 알림 UI | Frontend | Easy | P2 | 3 |
| 5.4 | Phase 2 E2E 테스트 | QA | Medium | P0 | 6 |
| 5.5 | 성능 최적화 | DevOps | Medium | P1 | 8 |

**Total Phase 2**: 63 hours (~1.5개월)

### Phase 3 - 6개 태스크

| # | Task | Category | Est. Hours |
|---|------|----------|-----------|
| 6.1 | 대시보드 고도화 | Fullstack | 16 |
| 6.2 | 음성 피드백 (TTS) | Frontend | 8 |
| 6.3 | 커뮤니티 기능 | Fullstack | 20 |
| 7.1 | A/B 테스트 프레임워크 | DevOps | 12 |
| 7.2 | 피드백 시스템 | Fullstack | 8 |
| 7.3 | 고급 모니터링 | DevOps | 6 |

**Total Phase 3**: 70 hours (~1.5개월)

---

## 분해된 이슈 출력 (GitHub Issues 형식)

### 출력 포맷

각 태스크는 다음 형식으로 GitHub Issue를 생성합니다:

```markdown
**Title**: [Phase 1] Database Schema 설계 및 마이그레이션 (Backend, Medium)

**Labels**:
- `area: backend`
- `complexity: medium`
- `type: feature`
- `priority: P0`
- `phase: 1-mvp`

**Description**:
PRD 6.2에 정의된 3개 신규 테이블을 생성합니다.

**Acceptance Criteria**:
- [ ] `user_profiles` 테이블 생성
- [ ] `user_mistakes` 테이블 생성
- [ ] `learning_stats` 테이블 생성
- [ ] Migration 파일 생성
- [ ] 인덱스 생성

**Technical Approach**:
Drizzle ORM을 사용하여 schema.ts에 테이블 정의 후 migration 생성

**Files to Modify**:
- `db/schema.ts`
- `drizzle/migrations/`

**Dependencies**:
None (Blocker)

**Estimated Effort**: 8 hours

**Assignee**: @backend-dev
```

---

## Milestones

### Milestone 1: MVP Launch (Week 8)
- ✅ 학습 패턴 추적
- ✅ 개인화된 피드백
- ✅ 진도 대시보드
- **Target Metrics**: 재방문율 35%, 대시보드 방문율 50%

### Milestone 2: Proactive Features (Week 16)
- ✅ 능동적 복습 제안
- ✅ 학습 레벨 자동 조정
- **Target Metrics**: 재방문율 45%, 전환율 5%

### Milestone 3: Scale & Optimize (Week 24)
- ✅ 커뮤니티 기능
- ✅ A/B 테스트
- **Target Metrics**: 재방문율 50%, 전환율 10%

---

## Risk Management

### Top 3 Risks

1. **AI 분류 정확도 < 85%**
   - Mitigation: 초기 100개 샘플 수동 검증, 피드백 루프 구축

2. **Cron Job 안정성**
   - Mitigation: Vercel Cron 대신 Upstash QStash 고려, 모니터링 강화

3. **사용자 참여율 저조**
   - Mitigation: Phase 1 출시 후 5명 인터뷰, 빠른 피드백 반영

---

## Next Steps

1. ✅ **이 실행 계획 리뷰** (팀 전체)
2. ✅ **GitHub Issues 생성** (`decompose-issue.md` 커맨드 활용)
3. ✅ **Sprint 1 시작** (Task 1.1 - 1.3)
4. ✅ **주간 스탠드업** 설정
5. ✅ **Phase 1 완료 후 사용자 테스트**

---

**Document Version**: 1.0
**Last Updated**: 2025-01-15
**Next Review**: Sprint 1 완료 후 (Week 2)
