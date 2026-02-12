# Seed Data & Static Constants

| 항목 | 값 |
|------|-----|
| **버전** | 1.1.0 |
| **상태** | `완료` |
| **최종 수정일** | 2026-02-12 |
| **관련 문서** | [COMMON-SYSTEMS.md](../COMMON-SYSTEMS.md) · [01-TABLE-DEFINITIONS.md](./01-TABLE-DEFINITIONS.md) · [DATA-MODEL.md](../DATA-MODEL.md) |

---

## 목차

1. [XP 시스템 상수](#1-xp-시스템-상수)
2. [보물상자 보상 풀](#2-보물상자-보상-풀)
3. [일기 주제](#3-일기-주제-diary-prompts)
4. [기분 옵션](#4-기분-옵션-moods)
5. [오늘의 단어](#5-오늘의-단어-words-of-the-day)
6. [오답 패턴 인사이트](#6-오답-패턴-인사이트)
7. [구독 / 요금제](#7-구독--요금제)
8. [IAP 상품](#8-iap-인앱-구매-상품)
9. [퀘스트 타입](#9-퀘스트-타입)
10. [기타 상수](#10-기타-상수)

---

## 개요

이 문서는 애플리케이션에서 사용하는 정적 데이터, 하드코딩된 상수, 시드 풀(pool) 데이터를 정리한다. DB에 INSERT되는 초기 데이터가 아닌, 코드 내 상수로 관리되는 룩업 데이터 중심이다.

---

## 1. XP 시스템 상수

**소스**: `lib/gamification/xp-constants.ts`

### 1.1 일일 상한 (Daily Caps)

| 액션 | 상한 | 설명 |
|------|------|------|
| `diary_submit` | 3회/일 | 일기 제출 XP |
| `expression_save` | 5회/일 | 표현노트 저장 XP |
| `weakness_overcome` | 1회/일 | 약점 극복 XP |

### 1.2 XP 보상 테이블

| 액션 | XP | 조건 |
|------|-----|------|
| `diary_submit` | 30 | 하루 3회 상한 |
| `weakness_overcome` | 20 | 하루 1회, TOP 1 오답 미발생 시 |
| `length_50` | 10 | 50단어 이상, TTR >= 0.4 |
| `length_100` | 20 | 100단어 이상, TTR >= 0.4 |
| `expression_save` | 5 | 하루 5회 상한 |
| `streak_7d` | 100 | 연속 7일 달성 |
| `streak_14d` | 200 | 연속 14일 달성 |
| `streak_30d` | 500 | 연속 30일 달성 |
| `streak_60d` | 1000 | 연속 60일 달성 |
| `streak_100d` | 1500 | 연속 100일 달성 |
| `streak_180d` | 3000 | 연속 180일 달성 |
| `streak_365d` | 5000 | 연속 365일 달성 |
| `monthly_challenge_15` | 200 | 월 15회 작성 |
| `monthly_challenge_20` | 400 | 월 20회 작성 |
| `monthly_challenge_25` | 600 | 월 25회 작성 |
| `weekly_quest` | 80 | 주간 퀘스트 완료 (Pro) |
| `weekly_bonus` | 100 | 주간 보너스 (2/3 완료) |
| `treasure_chest` | 25 | 보물상자 XP (10-50 범위) |
| `welcome_back` | 50 | 3일+ 미접속 복귀 (이전 스트릭 >= 3) |
| `comeback_kid` | 100 | 리셋 후 3일 연속 |

### 1.3 레벨 테이블

**공식**: `floor(80 * N^1.7)`

| 레벨 | 필요 XP | 누적 XP | 티어 |
|------|---------|---------|------|
| 1 | 0 | 0 | Diary Beginner |
| 2 | 259 | 259 | Diary Beginner |
| 3 | 256 | 515 | Diary Beginner |
| 4 | 329 | 844 | Diary Beginner |
| 5 | 390 | 1,234 | Diary Beginner |
| 6 | 455 | 1,689 | Daily Writer |
| 7 | 517 | 2,206 | Daily Writer |
| 8 | 581 | 2,787 | Daily Writer |
| 9 | 646 | 3,433 | Daily Writer |
| 10 | 576 | 4,009 | Daily Writer (Free 상한) |
| 11 | 610 | 4,619 | Story Teller |
| 12 | 641 | 5,260 | Story Teller |
| 13 | 670 | 5,930 | Story Teller |
| 14 | 697 | 6,627 | Story Teller |
| 15 | 724 | 7,351 | Story Teller |
| 16 | 749 | 8,100 | Word Crafter |
| 17 | 773 | 8,873 | Word Crafter |
| 18 | 796 | 9,669 | Word Crafter |
| 19 | 819 | 10,488 | Word Crafter |
| 20 | 840 | 11,328 | Word Crafter |
| 21 | 861 | 12,189 | English Native |
| 22 | 881 | 13,070 | English Native |
| 23 | 900 | 13,970 | English Native |
| 24 | 919 | 14,889 | English Native |
| 25 | 937 | 15,826 | English Native |
| 26 | 955 | 16,781 | Master Author |
| 27 | 972 | 17,753 | Master Author |
| 28 | 988 | 18,741 | Master Author |
| 29 | 1,005 | 19,746 | Master Author |
| 30 | 1,020 | 20,766 | Master Author |

### 1.4 레벨 티어

| 티어 | 레벨 범위 | 칭호 | XP 범위 | Premium |
|------|----------|------|---------|---------|
| 1 | Lv.1 ~ 5 | Diary Beginner | 0 ~ 300 | Free |
| 2 | Lv.6 ~ 10 | Daily Writer | 300 ~ 1,000 | Free |
| 3 | Lv.11 ~ 15 | Story Teller | 1,000 ~ 2,500 | Premium |
| 4 | Lv.16 ~ 20 | Word Crafter | 2,500 ~ 5,000 | Premium |
| 5 | Lv.21 ~ 25 | English Native | 5,000 ~ 10,000 | Premium |
| 6 | Lv.26 ~ 30 | Master Author | 10,000+ | Premium |

### 1.5 상수

| 상수 | 값 | 설명 |
|------|-----|------|
| `FREE_LEVEL_CAP` | 10 | Free 사용자 레벨 상한 |
| `MAX_LEVEL` | 30 | 최대 레벨 |
| `MIN_TTR_FOR_VOLUME_BONUS` | 0.4 | 분량 보너스 최소 TTR |
| `MAX_DUPLICATE_WORD_RATIO` | 0.5 | 클라이언트 중복 단어 비율 상한 |

---

## 2. 보물상자 보상 풀

**소스**: `lib/gamification/treasure-chest.ts`

### 2.1 보상 확률

| 보상 타입 | 확률 | 설명 |
|-----------|------|------|
| `xp_bonus` | 40% | XP 보너스 (10~50 XP 랜덤) |
| `quote` | 25% | 영어 명언 |
| `rare_expression` | 20% | 희귀 표현 카드 (자동 표현노트 저장) |
| `streak_freeze` | 10% | Streak Freeze +1 (상한 2개) |
| `rare_title` | 5% | 레어 칭호 |

Freeze 보유 수가 상한(2)에 도달한 경우, `streak_freeze` 확률이 `xp_bonus`에 합산된다 (50%).

### 2.2 레어 칭호 풀 (8종)

| 칭호 | 한국어 |
|------|--------|
| Night Owl | 밤 올빼미 |
| Weekend Warrior | 주말 전사 |
| Morning Person | 아침형 인간 |
| Consistency King | 꾸준함의 왕 |
| Word Wizard | 단어 마법사 |
| Grammar Guru | 문법 구루 |
| Expression Expert | 표현 전문가 |
| Diary Devotee | 일기 헌신자 |

### 2.3 명언 풀 (5종)

| 저자 | 원문 | 번역 |
|------|------|------|
| Steve Jobs | "The only way to do great work is to love what you do." | 위대한 일을 하는 유일한 방법은 자신이 하는 일을 사랑하는 것이다. |
| John Lennon | "Life is what happens when you're busy making other plans." | 인생이란 당신이 다른 계획을 세우느라 바쁠 때 일어나는 것이다. |
| Eleanor Roosevelt | "The future belongs to those who believe in the beauty of their dreams." | 미래는 자신의 꿈이 아름답다고 믿는 사람들의 것이다. |
| Winston Churchill | "Success is not final, failure is not fatal: it is the courage to continue that counts." | 성공은 최종적이지 않고, 실패는 치명적이지 않다. 중요한 것은 계속할 용기다. |
| Theodore Roosevelt | "Believe you can and you're halfway there." | 할 수 있다고 믿으면 이미 절반은 이룬 것이다. |

### 2.4 희귀 표현 풀 (5종)

| 표현 | 의미 | 예문 | 난이도 |
|------|------|------|--------|
| piece of cake | 아주 쉬운 일 | The exam was a piece of cake! | intermediate |
| break the ice | 어색한 분위기를 깨다 | He told a joke to break the ice. | intermediate |
| hit the nail on the head | 정곡을 찌르다 | You hit the nail on the head with that analysis. | advanced |
| under the weather | 몸이 좀 안 좋은 | I'm feeling a bit under the weather today. | intermediate |
| once in a blue moon | 아주 드물게 | I only see him once in a blue moon. | advanced |

---

## 3. 일기 주제 (Diary Prompts)

**소스**: `app/page.tsx`

매일 날짜 기반으로 하나가 기본 선택되며 (day-of-year % 10), 사용자가 셔플 가능.

| ID | 주제 (한국어) | Placeholder (영어) |
|----|--------------|-------------------|
| `how-was-day` | 오늘 하루 어땠나요? | How was your day? Write about what happened today... |
| `food` | 오늘 먹은 음식 중 가장 맛있었던 것은? | What delicious food did you eat today? Describe the taste... |
| `memorable-moment` | 오늘 가장 기억에 남는 순간은? | What was the most memorable moment of your day?... |
| `weekend-plans` | 주말에 뭘 하고 싶나요? | What do you want to do this weekend?... |
| `hobby` | 요즘 빠져있는 취미가 있나요? | What hobby are you into these days?... |
| `learned-today` | 오늘 새로 배운 것이 있나요? | Did you learn something new today?... |
| `movie-drama` | 최근에 본 영화나 드라마는? | What movie or drama did you watch recently?... |
| `grateful` | 오늘 감사한 일 세 가지는? | What are three things you're grateful for today?... |
| `tomorrow` | 내일 가장 기대되는 일은? | What are you looking forward to tomorrow?... |
| `worry` | 요즘 고민이 있다면? | Is there something on your mind lately?... |

---

## 4. 기분 옵션 (Moods)

**소스**: `components/calendar/mood-selector.tsx`

| ID | 이모지 | 한국어 |
|----|--------|--------|
| `happy` | 😊 | 좋음 |
| `neutral` | 😐 | 보통 |
| `sad` | 😢 | 슬픔 |
| `excited` | 🤩 | 신남 |
| `tired` | 😴 | 피곤 |
| `anxious` | 😰 | 불안 |

DB 스키마(`chats.mood`)에도 동일한 enum이 정의되어 있다.

---

## 5. 오늘의 단어 (Words of the Day)

**소스**: `lib/missions.ts`

20개 단어가 날짜 기반으로 순환 (day-of-year % 20).

| 단어 | 의미 | 예문 |
|------|------|------|
| grateful | 감사하는 | I'm grateful for the support from my friends. |
| accomplish | 성취하다 | I want to accomplish my goals this year. |
| exhausted | 지친 | I felt exhausted after a long day at work. |
| inspired | 영감을 받은 | I was inspired by the movie I watched yesterday. |
| comfortable | 편안한 | I feel comfortable when I'm at home. |
| challenging | 도전적인 | This project is challenging but rewarding. |
| delicious | 맛있는 | The pasta I had for lunch was delicious. |
| nervous | 긴장한 | I was nervous before the presentation. |
| excited | 신나는, 흥분한 | I'm excited about the upcoming trip. |
| peaceful | 평화로운 | The garden feels so peaceful in the morning. |
| fascinating | 매혹적인 | The documentary was absolutely fascinating. |
| confident | 자신감 있는 | I feel more confident after practicing. |
| appreciate | 감사하다, 고마워하다 | I appreciate your help with this task. |
| wonderful | 멋진, 훌륭한 | We had a wonderful time at the party. |
| anxious | 걱정스러운 | I felt anxious about the exam results. |
| memorable | 기억에 남는 | It was a memorable experience for everyone. |
| productive | 생산적인 | Today was a very productive day at work. |
| refreshing | 상쾌한 | The morning walk was so refreshing. |
| overcome | 극복하다 | I managed to overcome my fear of public speaking. |
| determined | 결심한, 단호한 | She is determined to finish the marathon. |

---

## 6. 오답 패턴 인사이트

**소스**: `app/api/chat/route.ts`

반복 오답 패턴에 대한 한국어 학습 팁 (6종).

| 패턴 | 인사이트 메시지 |
|------|----------------|
| `tense-confusion` | 일기는 보통 과거에 있었던 일을 쓰는 거라서, 과거 시제를 자주 써요. 'go → went', 'eat → ate' 같은 불규칙 과거형을 틈틈이 외워보세요! |
| `subject-verb-agreement` | 주어가 he/she/it일 때는 동사에 -s를 붙여야 해요. 'She goes', 'It works' 처럼요! |
| `preposition-usage` | 전치사는 영어에서 정말 중요해요! 'at home', 'in the morning', 'on Monday' 같은 표현을 통째로 외우면 도움이 돼요. |
| `article-usage` | a/an/the 사용이 어려운 건 당연해요! 특정한 것을 말할 때는 'the', 처음 말하는 것은 'a/an'을 써요. |
| `word-order` | 한국어와 영어는 어순이 달라요! 영어는 '주어 + 동사 + 목적어' 순서로 써야 해요. |
| `direct-translation` | 한국어를 그대로 번역하면 어색할 수 있어요. 영어식 표현을 조금씩 익혀봐요! |

---

## 7. 구독 / 요금제

**소스**: `app/pricing/page.tsx`, `lib/subscription/check-usage.ts`

### 7.1 요금제

| 플랜 | 가격 | 일일 교정 횟수 |
|------|------|---------------|
| Free | ₩0 | 3회 |
| Premium | ₩6,900/월 | 무제한 |

### 7.2 Free 플랜 기능

- 하루 3회 무료 교정
- 자연스러운 표현 제안
- 한국어 문법 설명

### 7.3 Premium 플랜 기능

- 무제한 일기 교정
- 자연스러운 표현 제안
- 한국어 문법 설명
- 학습 진도 추적
- 연속 작성 배지

---

## 8. IAP (인앱 구매) 상품

**소스**: `db/schema.ts` (iapPurchases 테이블)

| 상품 타입 | 설명 |
|-----------|------|
| `extra_correction` | 추가 일일 교정 횟수 |
| `streak_freeze_1` | Streak Freeze 1개 |
| `streak_freeze_3` | Streak Freeze 3개 |
| `xp_booster` | 2x XP 부스터 |
| `chest_key_5` | 보물상자 열쇠 5개 |

---

## 9. 퀘스트 타입

**소스**: `db/schema.ts` (weeklyQuests 테이블)

| 퀘스트 타입 | 설명 |
|------------|------|
| `frequency` | 일기 작성 빈도 (예: 주 5회 작성) |
| `challenge` | 특정 도전 (예: 100단어 이상 작성) |
| `expression` | 표현 관련 (예: 대안 표현 3개 사용) |
| `length` | 분량 관련 (예: 총 500단어 작성) |
| `perfect` | 완벽 달성 (예: 오타 없이 3회 작성) |

주간 퀘스트는 매주 월요일 기준 3개 슬롯으로 생성되며, XP 보상은 80~200 XP 범위이다.

---

## 10. 기타 상수

### 10.1 스트릭 관련

**소스**: `lib/streak/streak-manager.ts`

| 상수 | 값 | 설명 |
|------|-----|------|
| 최대 Freeze 보유 | 2개 | user_profiles.streakFreezeCount 상한 |
| Welcome Back 조건 | 이전 스트릭 >= 3일 | +50 XP |
| Comeback Kid 조건 | 리셋 후 3일 연속 | +100 XP |
| Streak Recovery | 7일 연속 복귀 | 이전 스트릭 50% 복구 |

### 10.2 스트릭 마일스톤 (7단계)

| 마일스톤 | 일수 | XP 보상 |
|----------|------|---------|
| 1 | 7일 | 100 XP |
| 2 | 14일 | 200 XP |
| 3 | 30일 | 500 XP |
| 4 | 60일 | 1,000 XP |
| 5 | 100일 | 1,500 XP |
| 6 | 180일 | 3,000 XP |
| 7 | 365일 | 5,000 XP |

### 10.3 입력 검증 규칙

**소스**: `components/diary/diary-editor.tsx`

| 규칙 | 조건 | 안내 메시지 |
|------|------|------------|
| 빈 텍스트 | trim 길이 0 | 버튼 비활성화 |
| 최소 글자 | 공백 제외 20자 | "조금 더 써볼까요?" |
| 최소 단어 | 5단어 이상 | "문장을 조금 더 만들어보세요!" |
| 반복 문자 | 동일 문자 5회+ 연속 | "의미 있는 영어 문장을 써주세요." |
| 반복 단어 | 동일 단어 50%+ | "다양한 단어로 일기를 써보세요!" |
| TTR 경고 | TTR < 0.4 (30단어+) | "다양한 단어를 사용해보세요!" |

### 10.4 Vercel / 인프라

| 상수 | 값 | 설명 |
|------|-----|------|
| `maxDuration` | 60초 | Vercel Function timeout |
| `DEFAULT_USER_ID` | `"default-user"` | 비로그인 폴백 사용자 ID |
