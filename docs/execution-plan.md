# Execution Plan v3.0 — 개발 실행 계획

> **Document Owner**: Project Manager
> **Last Updated**: 2026-01-31
> **기준 문서**: [PRD v3.0](./PRD.md), [Database Schema v3.0](./database-schema.md)
> **방법론**: Feature-driven Sprints (기능 단위 점진적 배포)

---

## 1. 현행 구현 상태 (As-Is)

### ✅ 구현 완료 (v2.0)

| 영역 | 구현 현황 | 코드 위치 |
|------|----------|----------|
| 일기 & AI 교정 | LangGraph + Gemini 교정 파이프라인 (원문/교정문/한국어 설명/대안 표현 3종) | `lib/ai/graph.ts`, `app/api/chat/route.ts` |
| 분량 기반 보상 | 50단어 이상 +10 XP, 100단어 이상 +20 XP | `app/api/chat/route.ts` |
| 스트릭 | 연속 작성 일수, 최장 기록, 총 작성 수 | `lib/streak/streak-manager.ts` |
| 캘린더 뷰 | 월별 달력, 기분 이모지, 키워드, 단어 수, 미리보기 | `components/calendar/`, `app/api/calendar/` |
| 기록 조회 | 최신순 목록, 상세 보기 | `app/history/`, `app/api/history/` |
| 표현노트 | 드래그 저장, AI 자동 보강 (뜻/발음/품사/동의어/예문/난이도) | `app/vocabulary/`, `lib/ai/vocabulary-enricher.ts` |
| 오답 추적 | `user_mistakes` 기반 패턴 감지, 반복 시 인사이트 | `lib/db/mistakes.ts` |
| 결제 | Toss Payments 구독 flow (₩9,900/월, 무료 3회/일) | `lib/payment/toss.ts`, `app/pricing/` |
| 인증 | NextAuth + Google OAuth | `lib/auth.ts` |
| 프로필 | 학습 목표, 설명 수준 (detailed/concise) | `app/api/user/profile/` |
| UI | Shadcn UI + Tailwind, 반응형 모바일 | `components/ui/` |

### ❌ 미구현 (v3.0 신규 개발)

| 영역 | Feature |
|------|---------|
| XP & 레벨 시스템 | F3 |
| Streak Freeze & Comeback Bonus | F4 |
| 보물상자 (Variable Reward) | F5 |
| 주간/월간 퀘스트 | F6 |
| AI Pen Pal | F7 |
| IAP (인앱 구매) | F12 확장 |
| 입력 검증 | F1 확장 |

### ⚠️ 수정 필요 (v2.0 → v3.0 변경)

| 항목 | 현재 | v3.0 목표 |
|------|------|----------|
| 무료 교정 횟수 | 3회/일 | 1회/일 |
| 구독 가격 | ₩9,900/월 | ₩6,900/월 |
| 설명 수준 | 수동 선택 (detailed/concise) | XP 레벨 기반 자동 적응 |
| AI 파이프라인 | LangGraph 체크포인트 + 대화 요약 | 프로필(장기 메모리)만 유지 |
| 오답 분류 | 5-category | 3-category + sub_type |
| 기록 조회 | 전체 무제한 | 무료 7일 / 프리미엄 전체 |
| 표현노트 | 무제한 | 무료 20개 / 프리미엄 무제한 |

### 🗑️ 제거 대상

| 대상 | 파일 |
|------|------|
| 체크포인트 테이블 & 로직 | `lib/ai/checkpointer.ts` |
| 대화 요약 | `lib/ai/summarizer.ts` |
| 수동 레벨 선택 UI | `components/profile/level-selector.tsx` |
| `chats.summary` 컬럼 | `db/schema.ts` |
| `checkpoints` 테이블 | `db/schema.ts` |

---

## 2. 스프린트 구조

```
Sprint 0  Foundation & Cleanup
   │
   ↓
Sprint 1  XP & Level System ──────────────────┐
   │                                            │ (XP 의존)
   ↓                                            │
Sprint 2  Streak Freeze & Comeback              │
   │                                            │
   ↓                                            ↓
Sprint 3  Treasure Chest (XP + Freeze 보상 필요)
   │
   ↓
Sprint 4  Weekly & Monthly Quests (XP 보상 필요)
   │
   ↓
Sprint 5  AI Pen Pal (독립적, Sprint 1 이후 언제든 가능)
   │
   ↓
Sprint 5.5  Writing Analysis & Discovery Rewards (사후 발견형 보상)
   │
   ↓
Sprint 6  IAP & Monetization (모든 상품 존재 필요)
   │
   ↓
Sprint 7  Integration & Polish
```

### 병렬 실행 가능 구간

- Sprint 2 ↔ Sprint 4: 상호 독립 (동시 진행 가능)
- Sprint 5: Sprint 1 이후 다른 sprint와 병렬 가능

---

## 3. 스프린트 상세

---

### Sprint 0: Foundation & Cleanup

> **목표**: DB 스키마 마이그레이션, deprecated 코드 제거, 정책 변경 적용. 사용자 체감 변화 최소.

#### 태스크

| # | 태스크 | 유형 | 상세 |
|---|--------|------|------|
| 0-1 | DB 마이그레이션 Phase 1 (ADD) | Backend | `user_profiles`: xp, xp_level, title, equipped_title, earned_titles, streak_freeze_count, xp_booster_expires_at, chest_key_count 추가. `chats`: mood, word_count, challenge_word_used 추가. `diary_streaks`: previous_streak, streak_freeze_used_at, comeback_started_at, comeback_days 추가. `daily_usage`: bonus_count 추가. `messages`: role enum에 'penpal' 추가. `user_mistakes`: sub_type 추가 |
| 0-2 | DB 마이그레이션 Phase 2 (CREATE) | Backend | 7개 신규 테이블 생성: xp_history, treasure_chest_log, weekly_quests, user_quest_progress, monthly_challenges, user_challenge_progress, iap_purchases |
| 0-3 | DB 데이터 마이그레이션 Phase 3 | Backend | user_profiles.level 값 → learning_preferences 이관. user_mistakes.mistake_type 값 매핑 |
| 0-4 | DB 마이그레이션 Phase 4 (DROP) | Backend | DROP TABLE checkpoints. DROP COLUMN chats.summary, user_profiles.level (old enum). ALTER user_mistakes.mistake_type enum |
| 0-5 | Deprecated 코드 제거 | Backend | `lib/ai/checkpointer.ts` 삭제. `lib/ai/summarizer.ts` 삭제. `components/profile/level-selector.tsx` 삭제. `lib/ai/graph.ts`에서 체크포인트/요약 호출 제거 |
| 0-6 | AI 파이프라인 정리 | Backend | `lib/ai/graph.ts`: 체크포인트/요약 의존성 제거 후 교정 동작 확인. 프롬프트에서 detailed/concise 분기 제거 (임시로 detailed 기본값 통일) |
| 0-7 | 입력 검증 추가 | Frontend | `components/diary/diary-editor.tsx`: 빈 텍스트 → 버튼 비활성화, 최소 20자, 최소 5단어, 반복 문자 5회, 반복 단어 **50%** (어뷰징 방지 강화) |
| 0-8 | 분량 기반 XP 보상 추가 | Backend | `app/api/chat/route.ts`: 단어 수 계산 로직 추가, 50단어+ → +10 XP, 100단어+ → +20 XP |
| 0-9 | 챌린지 모드 제거 | Frontend + Backend | `lib/missions.ts`, `components/diary/daily-mission.tsx`, `components/diary/mode-selector.tsx` 삭제. UI에서 챌린지 모드 선택 제거. 오늘의 주제 섹션 제거 (#133) |
| 0-10 | 구독 가격 변경 | Backend + Frontend | `lib/payment/toss.ts`: ₩9,900 → ₩6,900. `app/pricing/page.tsx`: 가격 표시 업데이트 |
| 0-11 | Opt-in 영감 힌트 UX | Frontend | "💡 뭘 쓸지 모르겠어요" 버튼 추가 (기본 숨김). 클릭 시 영감 카드 펼침 (무제한 셔플). "✕ 닫기" 버튼 추가 (#135) |

> **⚠️ 무료 교정 3→1 축소는 이 시점에서 코드만 준비하고, 실제 적용은 Sprint 3 (보물상자) 배포와 동시에.** 게이미피케이션 없이 무료 횟수만 줄이면 이탈 위험.

#### 완료 조건

- [x] `drizzle-kit generate` + `drizzle-kit migrate` 성공
- [x] 기존 기능 (교정, 스트릭, 캘린더, 표현노트, 기록 조회) 정상 동작
- [x] deprecated 코드 삭제 후 `npm run build` 에러 없음
- [x] 입력 검증 규칙 5종 동작
- [x] 가격 ₩6,900 반영
- [x] 챌린지 모드 제거 완료 (#133)
- [ ] Opt-in 영감 힌트 UX 구현 (#135)

#### 영향 받는 파일

```
db/schema.ts                              — 스키마 전면 수정
lib/ai/graph.ts                           — 체크포인트/요약 제거
lib/ai/checkpointer.ts                    — 삭제
lib/ai/summarizer.ts                      — 삭제
components/profile/level-selector.tsx      — 삭제
lib/missions.ts                           — 삭제 (챌린지 모드)
components/diary/daily-mission.tsx         — 삭제 (챌린지 모드)
components/diary/mode-selector.tsx         — 삭제 (챌린지 모드)
components/diary/diary-editor.tsx          — 입력 검증 추가, 영감 힌트 Opt-in 변경
lib/payment/toss.ts                       — 가격 변경
app/pricing/page.tsx                      — 가격 표시 변경
```

---

### Sprint 1: XP & Level System (F3)

> **목표**: 모든 게이미피케이션의 근간. 일기 제출 시 XP 획득 → 레벨업 → 레벨 기반 적응형 설명.

**선행**: Sprint 0

#### 태스크

| # | 태스크 | 유형 | 상세 |
|---|--------|------|------|
| 1-1 | XP 상수 & 레벨 계산 | Backend | `lib/gamification/xp-constants.ts`: XP 보상 테이블 (하루 상한 포함), 레벨 공식 `floor(80 × N^1.7)`, 칭호 매핑. 레벨 계산 함수 구현 |
| 1-2 | XP Service | Backend | `lib/gamification/xp-service.ts`: `grantXp(userId, action, referenceId?)` — XP 부여 + 하루 상한 체크 + xp_history INSERT + user_profiles.xp 갱신 + 레벨업 판정 + 부스터 2x 체크. 트랜잭션 원자성 보장 |
| 1-3 | 교정 Flow XP 연동 | Backend | `app/api/chat/route.ts`: ① 하루 교정 횟수 체크 (3회 상한), ② diary_submit +30 XP (상한 내), ③ 단어 수 계산 + TTR 검증 (≥0.4), ④ 30/60/100단어+ 분량 보너스, ⑤ 약점 극복 판정 (최근 TOP 오답 미발생 시 +20 XP, 하루 1회) |
| 1-4 | 표현노트 XP 연동 | Backend | `app/api/vocabulary/route.ts`: POST 성공 시 expression_save +5 XP |
| 1-5 | 스트릭 마일스톤 XP | Backend | `lib/streak/streak-manager.ts`: 7일 +100, 14일 +150, 30일 +500, 60일 +800, 100일 +1,500, 180일 +2,000, 365일 +5,000 XP (각 1회, 칭호 포함) |
| 1-6 | 레벨 기반 적응형 프롬프트 | AI | `lib/ai/graph.ts`: user_profiles.xp_level 조회 → Lv.1-10 한국어 70-90% / Lv.11-20 50-70% / Lv.21+ 30-50% 프롬프트 분기 |
| 1-7 | 무료 Lv.10 상한 | Backend | xp-service: 무료 사용자 Lv.10 초과 시 XP 누적하되 레벨 고정. 프리미엄 전환 시 즉시 레벨 반영 |
| 1-8 | XP API | Backend | `GET /api/user/xp` — 현재 XP, 레벨, 칭호, 다음 레벨까지 남은 XP, 부스터 상태 |
| 1-9 | 헤더 레벨 UI | Frontend | 헤더에 레벨 뱃지 + 칭호 + 프로그레스 바 (다음 레벨까지 남은 XP) |
| 1-10 | 레벨업 연출 | Frontend | 레벨업 시 축하 모달: 새 칭호 + XP 획득 애니메이션 |
| 1-11 | XP 토스트 | Frontend | 일기 제출 후 "+30 XP" 토스트. 부스터 시 "+60 XP (2x)" |
| 1-12 | Lv.10 특별 보상 | Frontend + Backend | ① 무료 Lv.10 **최초** 도달 시 3일 프리미엄 체험권 자동 부여 (1회), ② 잠재 레벨 표시 (예: "프리미엄 시 Lv.13"), ③ 체험 종료 후 성과 요약 + 전환 유도 |

#### 완료 조건

- [ ] 일기 제출 → XP 획득 → xp_history 기록
- [ ] 레벨업 정상 동작 (Lv.1 → ... → Lv.30)
- [ ] 무료 Lv.10 상한 동작
- [ ] 레벨 기반 AI 설명 깊이 변화 확인
- [ ] 헤더 레벨/칭호/진행바 표시
- [ ] 레벨업 축하 모달 동작

#### 신규 파일

```
lib/gamification/xp-constants.ts          — XP 보상/레벨 상수
lib/gamification/xp-service.ts            — XP 부여 비즈니스 로직
app/api/user/xp/route.ts                  — XP 조회 API
components/gamification/level-badge.tsx    — 레벨 뱃지 컴포넌트
components/gamification/levelup-modal.tsx  — 레벨업 모달
components/gamification/xp-toast.tsx       — XP 획득 토스트
```

---

### Sprint 2: Streak Freeze & Comeback Bonus (F4)

> **목표**: 기존 스트릭에 보호막과 복귀 보너스를 추가하여 이탈 방지.

**선행**: Sprint 0, Sprint 1 (XP 부여)

#### 태스크

| # | 태스크 | 유형 | 상세 |
|---|--------|------|------|
| 2-1 | Streak Manager 리팩토링 | Backend | `lib/streak/streak-manager.ts` 전면 수정: Freeze 자동 소비, Comeback 자격 판정, previous_streak 저장, comeback_days 추적 |
| 2-2 | Freeze 소비 로직 | Backend | gap==2 + freeze_count>0 → freeze 자동 소비 (streak_freeze_count -1, streak_freeze_used_at = yesterday), streak 유지 |
| 2-3 | Comeback Bonus 로직 | Backend | 3일+ 미접속 후 복귀 → Welcome Back 50 XP (**단, 이전 스트릭 3일 이상 조건**). 리셋 후 3일 연속 → Comeback Kid 칭호 + 100 XP. 7일 연속 → previous_streak * 0.5 복구 |
| 2-4 | Streak API 확장 | Backend | `GET /api/streak`: freeze_count, comeback 상태 포함 |
| 2-5 | Freeze 보유 UI | Frontend | 헤더 불꽃 옆 방패 아이콘 + 보유 수 (0/1/2) |
| 2-6 | Freeze 사용 알림 | Frontend | "보호막이 사용되었어요! 남은 보호막: N개" 토스트 |
| 2-7 | Welcome Back 카드 | Frontend | 복귀 시 "Welcome Back" 카드 + 50 XP 연출 |
| 2-8 | Comeback Kid 연출 | Frontend | 리셋 후 3일 연속 시 "Comeback Kid" 칭호 획득 모달 |

#### 완료 조건

- [ ] Freeze 자동 소비 → 스트릭 유지 동작
- [ ] Freeze 0개 + 공백 → 스트릭 리셋 + previous_streak 저장
- [ ] Welcome Back 50 XP 동작
- [ ] Comeback Kid 칭호 + 100 XP 동작
- [ ] 7일 연속 → previous_streak 50% 복구
- [ ] 방패 아이콘 + 보유 수 표시

---

### Sprint 3: Treasure Chest — Variable Reward (F5)

> **목표**: 매일 첫 일기 시 랜덤 보상으로 "오늘은 뭐가 나올까?" 기대감 생성. 프리미엄 핵심 가치.

**선행**: Sprint 1 (XP), Sprint 2 (Streak Freeze)

#### 태스크

| # | 태스크 | 유형 | 상세 |
|---|--------|------|------|
| 3-1 | 보상 결정 엔진 | Backend | `lib/gamification/treasure-chest.ts`: 확률 기반 보상 결정 (서버). XP 40%, 명언 25%, 희귀 표현 20%, Freeze 10%, 레어 칭호 5%. Freeze 상한 초과 시 XP 대체 |
| 3-2 | 보물상자 Open API | Backend | `POST /api/treasure-chest/open` — 프리미엄 확인, 오늘 이미 열었는지 확인, 보상 결정 + treasure_chest_log INSERT + 사이드이펙트 (XP 부여, Freeze 추가, 칭호 추가, 표현노트 자동 추가) |
| 3-3 | 보물상자 열쇠 API | Backend | `POST /api/treasure-chest/open-with-key` — chest_key_count 차감 + 보상 결정 |
| 3-4 | 보물상자 이력 API | Backend | `GET /api/treasure-chest/history` — 최근 7일 보상 목록 |
| 3-5 | 교정 Flow 연동 | Backend | `app/api/chat/route.ts`: 프리미엄 + 당일 첫 교정 시 보물상자 자동 트리거 |
| 3-6 | 오픈 애니메이션 | Frontend | 상자 흔들림 → 열림 → 보상 카드 등장. 등급별 테두리 (일반/레어/에픽) |
| 3-7 | 보상 카드 컴포넌트 | Frontend | XP 보너스, 명언 카드 (공유), 희귀 표현 카드, Freeze 획득, 레어 칭호 |
| 3-8 | 보상 이력 UI | Frontend | 최근 7일 보상 목록 |
| 3-9 | 무료 사용자 티저 | Frontend | 교정 결과 하단에 흐릿한 보물상자 + "프리미엄에서 열어보세요" |
| 3-10 | **무료 교정 3→1 적용** | Backend | `lib/subscription/check-usage.ts`: 이 시점에서 무료 교정 1회/일로 실제 변경 |

> **3-10**: 보물상자가 프리미엄의 핵심 가치로 자리잡은 시점에 무료 교정 축소를 함께 배포. "재미 요소에 과금" 전략의 핵심.

#### 완료 조건

- [ ] 프리미엄 첫 일기 → 보물상자 자동 오픈
- [ ] 5종 보상 정상 지급
- [ ] Freeze 상한 초과 시 XP 대체
- [ ] 오픈 애니메이션 동작
- [ ] 무료 사용자: 블러 티저
- [ ] 최근 7일 이력 조회
- [ ] 무료 교정 1회/일 적용

#### 신규 파일

```
lib/gamification/treasure-chest.ts              — 보상 결정 엔진
app/api/treasure-chest/open/route.ts            — 보물상자 오픈 API
app/api/treasure-chest/open-with-key/route.ts   — 열쇠로 오픈 API
app/api/treasure-chest/history/route.ts         — 이력 조회 API
components/gamification/chest-animation.tsx      — 오픈 애니메이션
components/gamification/reward-card.tsx          — 보상 카드
components/gamification/chest-teaser.tsx         — 무료 사용자 티저
```

---

### Sprint 4: Weekly & Monthly Quests (F6)

> **목표**: 주간/월간 미니 목표로 "매일 일기" 외 부가 동기 부여.

**선행**: Sprint 1 (XP)

#### 태스크

| # | 태스크 | 유형 | 상세 |
|---|--------|------|------|
| 4-1 | 주간 퀘스트 생성 | Backend | `lib/gamification/quest-scheduler.ts`: lazy generation — 조회 시 해당 주 퀘스트 없으면 5종 풀에서 3개 선택 → weekly_quests INSERT |
| 4-2 | 퀘스트 진행률 추적 | Backend | `lib/gamification/quest-tracker.ts`: 일기 제출/표현노트 저장/분량 달성/약점 극복 이벤트 시 current_count 갱신. target_count 도달 → completed + XP 부여 |
| 4-3 | 주간 보너스 판정 | Backend | 동일 주 3개 중 2개+ 완료 시 weekly_bonus +100 XP |
| 4-4 | 월간 챌린지 데이터 | Backend | monthly_challenges 시드 데이터 관리. 일기에서 표현 사용 감지 → used_expressions 업데이트 |
| 4-5 | 퀘스트 API | Backend | `GET /api/quests/weekly` — 이번 주 퀘스트 + 진행률 (무료: slot 1만). `GET /api/quests/monthly` — 이번 달 챌린지 + 진행률 (Pro only) |
| 4-6 | 이벤트 통합 | Backend | chat route, vocabulary route: 교정/표현저장 시 quest-tracker 호출 |
| 4-7 | 퀘스트 목록 UI | Frontend | 활성 퀘스트 카드: 설명 + 진행 바 + XP 보상. 무료: 비활성 퀘스트에 자물쇠 |
| 4-8 | 퀘스트 완료 연출 | Frontend | 퀘스트 완료 → XP 획득 애니메이션 + 체크마크 |
| 4-9 | 주간 보너스 연출 | Frontend | 2/3 완료 시 "주간 보너스 +100 XP" 배너 |
| 4-10 | 월간 챌린지 UI | Frontend | 이번 달 테마 + 10개 표현 체크리스트 |

#### 완료 조건

- [ ] 매주 퀘스트 3개 자동 생성 (lazy)
- [ ] 교정/표현저장 시 퀘스트 진행률 자동 갱신
- [ ] 무료: 1개만 활성. 프리미엄: 3개 + 월간
- [ ] 주간 보너스 (2/3 완료 → +100 XP)
- [ ] 퀘스트 UI + 진행 바 + 완료 연출

#### 신규 파일

```
lib/gamification/quest-scheduler.ts        — 퀘스트 생성/조회
lib/gamification/quest-tracker.ts          — 진행률 추적
app/api/quests/weekly/route.ts             — 주간 퀘스트 API
app/api/quests/monthly/route.ts            — 월간 챌린지 API
components/gamification/quest-card.tsx      — 퀘스트 카드
components/gamification/quest-list.tsx      — 퀘스트 목록
components/gamification/monthly-challenge.tsx — 월간 챌린지 UI
```

---

### Sprint 5: AI Pen Pal (F7)

> **목표**: 교정 이후 AI 친구가 영어 답장을 보내는 킬러 피쳐. "교정 도구" → "교환 일기" 전환.

**선행**: Sprint 0 (messages role 'penpal'), Sprint 1 (레벨 기반 난이도)

#### 태스크

| # | 태스크 | 유형 | 상세 |
|---|--------|------|------|
| 5-1 | Pen Pal 프롬프트 설계 | AI | 시스템 프롬프트: 친근한 친구 톤. 구조: 공감(1문장) + 자기 이야기(1-2문장) + 질문(1문장). 레벨별 영어 난이도. 한국어 비율 0-30% |
| 5-2 | Pen Pal 생성 Service | Backend | `lib/ai/penpal.ts`: 교정 결과 + 원문 + 이전 답장(최근 3개) + 레벨 → Gemini API. 답장 길이: 원문 50-80%. 타임아웃 15초 |
| 5-3 | 교정 Flow 연동 | Backend | `app/api/chat/route.ts`: 교정 완료 후 비동기로 Pen Pal 생성. messages 테이블에 role='penpal' INSERT. 실패 시 교정은 정상 반환 |
| 5-4 | 맥락 기억 | Backend | 이전 penpal 메시지 최근 3개를 프롬프트에 포함. user_profiles.learning_preferences 반영 |
| 5-5 | Pen Pal API | Backend | `GET /api/chat/[chatId]/penpal` — 해당 일기의 답장 조회. 무료: 미리보기 2줄만 |
| 5-6 | 답장 UI (프리미엄) | Frontend | 교정 결과 하단 "편지 봉투" 카드. 전체 답장 표시 |
| 5-7 | 답장 미리보기 (무료) | Frontend | 첫 2줄 + 나머지 블러 + "전체 답장은 프리미엄에서" CTA |
| 5-8 | 답장 내 표현 저장 | Frontend | 프리미엄: 답장에서 모르는 표현 탭 → 뜻 확인 + 표현노트 저장 |
| 5-9 | 기록 상세 연동 | Frontend | `app/history/[id]/page.tsx`: 일기 + 교정 + AI 답장 "교환 일기" 형태 |

#### 완료 조건

- [ ] 교정 후 AI 답장 자동 생성 (비동기, 15초 타임아웃)
- [ ] 공감 + 이야기 + 질문 구조
- [ ] 레벨 기반 영어 난이도
- [ ] 이전 답장 3개 맥락 기억
- [ ] 무료: 2줄 미리보기 + 블러
- [ ] 프리미엄: 전체 답장 + 표현 탭 저장
- [ ] 기록 상세에서 교환 일기 표시

#### 신규 파일

```
lib/ai/penpal.ts                          — Pen Pal 생성 서비스
app/api/chat/[chatId]/penpal/route.ts     — Pen Pal 조회 API
components/penpal/penpal-card.tsx          — 답장 카드
components/penpal/penpal-teaser.tsx        — 무료 미리보기
```

---

### Sprint 5.5: Writing Analysis & Discovery Rewards (사후 발견형 보상)

> **목표**: 사용자가 자연스럽게 쓴 일기에서 좋은 점을 AI가 발견하여 보상. "미션 달성"이 아닌 "발견의 기쁨" 제공.

**선행**: Sprint 1 (XP 시스템)

#### 태스크

| # | 태스크 | 유형 | 상세 |
|---|--------|------|------|
| 5.5-1 | 작성 분석 Service | Backend | `lib/ai/writing-analyzer.ts`: 교정 결과를 분석하여 좋은 점 발견. 새로운 표현 사용, 다양한 시제, 복문 구조, 자연스러운 연결어 등 |
| 5.5-2 | 발견 기반 XP 부여 | Backend | 발견된 각 항목마다 XP 부여. 예: 새로운 표현 +5 XP, 다양한 시제 +10 XP, 복문 구조 +15 XP |
| 5.5-3 | 분석 결과 구조 설계 | Backend | 교정 결과에 `writingAnalysis` 필드 추가. discoveries 배열로 발견 항목 전달 |
| 5.5-4 | 작성 분석 카드 UI | Frontend | 교정 결과 하단에 "오늘의 작성 분석" 카드 표시. 발견된 좋은 점 + 획득 XP |
| 5.5-5 | 발견 애니메이션 | Frontend | 각 발견 항목이 순차적으로 나타나는 연출 (0.3초 간격) |
| 5.5-6 | 분석 실패 처리 | Backend | 분석 실패 시 교정은 정상 동작 (비차단) |

#### 완료 조건

- [ ] 교정 후 작성 분석 자동 실행
- [ ] 새로운 표현, 시제, 복문 등 5가지 이상 발견 패턴 구현
- [ ] 발견된 항목마다 XP 부여
- [ ] 작성 분석 카드 UI 표시
- [ ] 분석 실패 시에도 교정 정상 동작

#### 신규 파일

```
lib/ai/writing-analyzer.ts           — 작성 분석 서비스
app/api/chat/route.ts                — 분석 통합 (수정)
components/diary/writing-analysis.tsx — 작성 분석 카드
```

---

### Sprint 6: IAP & Monetization (F12)

> **목표**: 5종 IAP 소모품 결제 + 6개 과금 트리거 시점에 자연스러운 구매 동선 배치.

**선행**: Sprint 1~5 (IAP 상품에 해당하는 기능 존재)

#### 태스크

| # | 태스크 | 유형 | 상세 |
|---|--------|------|------|
| 6-1 | IAP 상품 정의 | Backend | `lib/payment/iap-products.ts`: 5종 상품 (product_type, 가격, 효과). 서버 금액 검증 상수 |
| 6-2 | IAP 결제 API | Backend | `POST /api/payment/iap/confirm` — Toss 승인 → 금액 검증 → iap_purchases INSERT → 사이드이펙트 (bonus_count +1, freeze +N, booster 활성화, key +5) |
| 6-3 | 사이드이펙트 처리 | Backend | 상품별 적용 함수: applyExtraCorrection(), applyStreakFreeze(), applyXpBooster(), applyChestKeys() |
| 6-4 | 교정 소진 모달 | Frontend | 무료 교정 소진 → "추가 교정 ₩500" 원버튼 + "프리미엄 ₩6,900" 하단 |
| 6-5 | Streak 위기 배너 | Frontend | 스트릭 리셋 직후 → "Streak Freeze로 보호하세요" ₩1,500 / ₩3,500 묶음 |
| 6-6 | XP 부스터 배너 | Frontend | 레벨업 직전 (50 XP 이하) → "XP 2배 부스터 ₩1,000" |
| 6-7 | 보물상자 열쇠 구매 | Frontend | 보물상자 이력 화면에서 "열쇠 5개 ₩2,500" 구매 버튼 |
| 6-8 | 프리미엄 안내 통합 | Frontend | Lv.10 도달, 표현노트 20개, AI 펜팔 미리보기, 기록 7일 초과, 퀘스트 잠금, 오답 분석 블러 → 프리미엄 안내 모달 통합 |
| 6-9 | 가격 페이지 업데이트 | Frontend | `app/pricing/page.tsx`: Free vs Premium 비교표 (PRD 3.1절) + IAP 상품 목록 |

#### 완료 조건

- [ ] 5종 IAP 결제 → Toss 승인 → 효과 즉시 적용
- [ ] 서버 금액 검증 동작
- [ ] 6개 과금 트리거 시점에 자연스러운 구매 동선
- [ ] iap_purchases 트랜잭션 기록
- [ ] 가격 페이지 업데이트

#### 신규 파일

```
lib/payment/iap-products.ts               — IAP 상품 정의
lib/payment/iap-effects.ts                — 사이드이펙트 처리
app/api/payment/iap/confirm/route.ts      — IAP 결제 승인 API
components/payment/iap-modal.tsx           — IAP 구매 모달
components/payment/trigger-banner.tsx      — 과금 트리거 배너
```

---

### Sprint 7: Integration & Polish

> **목표**: 전체 기능 통합, 프리미엄 게이팅 일관성, 성능 최적화, 엣지 케이스 처리.

**선행**: Sprint 0~6

#### 태스크

| # | 태스크 | 유형 | 상세 |
|---|--------|------|------|
| 7-1 | 프리미엄 게이팅 검증 | QA | PRD "인증 정책" 테이블 대비 13개 기능 전수 확인. 기록 7일 제한, 표현노트 20개 제한, 오답 분석 Pro only, 퀘스트 1/3개 |
| 7-2 | 비차단 원칙 검증 | QA | XP/스트릭/퀘스트/보물상자/Pen Pal 장애 시 교정 정상 동작 확인 |
| 7-3 | 오답 분류 업데이트 | Backend | AI 프롬프트: 3-category + sub_type 체계. mistakes.ts: 새 분류 저장/조회 |
| 7-4 | 오답 분석 Pro 게이팅 | Backend + Frontend | 무료: "이 실수 N번" 티저 + 인사이트 블러. 프리미엄: 전체 인사이트 |
| 7-5 | 기록 조회 7일 제한 | Backend | `GET /api/history`: 무료 최근 7일만 반환 + 7일 초과 안내 |
| 7-6 | 표현노트 20개 제한 | Backend | `POST /api/vocabulary`: 무료 사용자 20개 초과 시 거부 + 안내 |
| 7-7 | 프로필 페이지 통합 | Frontend | XP/레벨/칭호 + Freeze 보유 + 열쇠 보유 + 구독 상태 + 학습 목표 — 한 화면 |
| 7-8 | 캘린더 뷰 업데이트 | Frontend | chats 테이블 새 컬럼 (mood, word_count, challenge_word_used) 반영 |
| 7-9 | 에러 처리 통합 | Backend | 모든 gamification API try-catch + 비차단 fallback + 한국어 메시지 |
| 7-10 | 게스트 모드 정리 | Backend + Frontend | 비인증 사용자: 교정 1회 (기록 미저장), XP/스트릭/퀘스트/보물상자/Pen Pal 불가 |
| 7-11 | API 타임아웃 정리 | Backend | 교정 60초, Pen Pal 15초, AI 보강 5초 |

#### 완료 조건

- [ ] 인증 정책 테이블 전수 확인 통과
- [ ] 비차단 원칙 검증 통과
- [ ] 오답 3-category 체계 동작
- [ ] 무료 기록 7일 / 표현노트 20개 제한
- [ ] 프로필 전체 인벤토리 표시
- [ ] 게스트 모드 접근 제어

---

## 4. Feature → Sprint 매핑

| Feature | Sprint | 작업 유형 |
|---------|--------|----------|
| F1: 일기 & AI 교정 | **0** (입력 검증, 정책 변경, 분량 기반 보상) | 기존 수정 |
| F2: (삭제됨) 챌린지 모드 | - | 제거 |
| F3: XP & 레벨 | **1** | 전체 신규 |
| F4: 스트릭 & 위기 구제 | **2** | 기존 확장 |
| F5: 보물상자 | **3** | 전체 신규 |
| F6: 주간/월간 퀘스트 | **4** | 전체 신규 |
| F7: AI Pen Pal | **5** | 전체 신규 |
| F8: 표현노트 | **7** (20개 제한) | 기존 수정 |
| F9: 오답 분석 | **7** (분류 변경 + Pro 게이팅) | 기존 수정 |
| F10: 캘린더 | **7** (새 컬럼 반영) | 기존 수정 |
| F11: 기록 조회 | **7** (7일 제한) | 기존 수정 |
| F12: 프리미엄 & IAP | **0** (가격) + **6** (IAP) | 기존 + 신규 |
| F13: 프로필 | **1** (XP) + **7** (통합) | 점진적 확장 |

---

## 5. 배포 전략

v3.0을 한 번에 출시하지 않고 **4단계 점진 배포**.

| 배포 | 스프린트 | 사용자 체감 변화 | 핵심 포인트 |
|------|---------|----------------|------------|
| **v3.0-alpha** | Sprint 0 + 1 | XP/레벨 등장, 레벨업 연출, 레벨 기반 설명 | 게이미피케이션 첫 경험 |
| **v3.0-beta** | Sprint 2 + 3 | Streak Freeze, 보물상자 + **무료 교정 3→1 축소** | 프리미엄 가치 상승과 동시에 무료 제한 |
| **v3.0-rc** | Sprint 4 + 5 + 5.5 | 퀘스트, AI Pen Pal, 작성 분석 | 게임성 완성 + 킬러 피쳐 + 발견 보상 |
| **v3.0** | Sprint 6 + 7 | IAP 상점, 전체 Polish | 수익화 on |

---

## 6. 리스크 & 대응

| # | 리스크 | 영향 | 대응 |
|---|--------|------|------|
| R1 | LangGraph 체크포인트 제거 시 기존 대화 호환성 | Sprint 0 | 기존 데이터는 orphan 처리. 새 일기부터 새 파이프라인 적용 |
| R2 | Gemini API 비용 증가 (Pen Pal 추가 호출) | Sprint 5 | Pen Pal은 별도 호출. gemini-1.5-flash 사용으로 비용 최소화. 일일 호출량 모니터링 |
| R3 | 무료 교정 1회 축소 시 이탈 | Sprint 3 | **게이미피케이션 도입과 동시 적용** (Sprint 3 배포 시점). 단독 축소 금지 |
| R4 | 보물상자 확률 밸런싱 | Sprint 3 | 초기 PRD 확률 적용 후 데이터 기반 튜닝 (2주 단위) |
| R5 | 주간 퀘스트 스케줄러 인프라 | Sprint 4 | Cron 대신 lazy generation (첫 조회 시 생성) 패턴으로 인프라 의존성 제거 |
| R6 | IAP 결제 검증 보안 | Sprint 6 | 서버 금액 검증 필수. product_type별 정가와 일치하지 않으면 거부 |
| R7 | DB 마이그레이션 실패 | Sprint 0 | 4-Phase 순서 엄수 (ADD → CREATE → 데이터 이관 → DROP). 각 Phase 후 롤백 지점 설정 |
