# Database Schema v3.0

> **Document Owner**: Backend Architect
> **Last Updated**: 2026-01-31
> **Base**: PRD v3.0 (gamification + Freemium/IAP 하이브리드)
> **ORM**: Drizzle ORM (PostgreSQL / Neon Serverless)

---

## 1. 변경 요약 (v2.0 → v3.0 Delta)

### DROP (1)

| 테이블 | 사유 |
|--------|------|
| `checkpoints` | v3.0 제외 — 3단계 메모리(체크포인트+대화요약) 제거. 사용자 프로필(장기 메모리)만 유지 |

### ALTER (7)

| 테이블 | 변경 내용 |
|--------|-----------|
| `user_profiles` | `level` text enum 삭제 → `xp`, `level` integer, 칭호/인벤토리 컬럼 추가 |
| `chats` | `summary` 삭제, `mood`/`word_count`/`challenge_word_used` 추가 |
| `messages` | `role` enum에 `'penpal'` 추가 (AI Pen Pal) |
| `diary_streaks` | Streak Freeze/Comeback Bonus 추적 컬럼 추가 |
| `daily_usage` | `bonus_count` 추가 (IAP 추가 교정권) |
| `user_mistakes` | `mistake_type` enum 재정의, `sub_type` 컬럼 추가 |
| `learning_stats` | `mistake_breakdown` jsonb 포맷 변경 (3-category 체계) |

### CREATE (7)

| 테이블 | 기능 | 연관 Feature |
|--------|------|-------------|
| `xp_history` | XP 획득 이벤트 로그 | F3 |
| `treasure_chest_log` | 보물상자 보상 이력 | F5 |
| `weekly_quests` | 주간 퀘스트 정의 (주 3개) | F6 |
| `user_quest_progress` | 사용자별 퀘스트 진행률 | F6 |
| `monthly_challenges` | 월간 챌린지 정의 | F6 |
| `user_challenge_progress` | 사용자별 월간 챌린지 진행률 | F6 |
| `iap_purchases` | IAP 결제 트랜잭션 로그 | F12 |

### 변경 없음 (6)

| 테이블 | 비고 |
|--------|------|
| `users` | NextAuth — 변경 없음 |
| `accounts` | NextAuth OAuth — 변경 없음 |
| `sessions` | NextAuth 세션 — 변경 없음 |
| `verification_tokens` | NextAuth 이메일 인증 — 변경 없음 |
| `subscriptions` | 스키마 변경 없음 (가격 ₩9,900→₩6,900은 앱 레벨 정책) |
| `vocabulary` | 표현노트로 명칭 변경. 스키마 변경 없음 (20개 제한은 앱 레벨 정책) |

**v3.0 총 테이블 수: 20개** (기존 14 - 1 DROP + 7 CREATE)

---

## 2. ERD 요약 (테이블 관계)

```
users (PK: id)
 ├── accounts (FK: user_id)
 ├── sessions (FK: user_id)
 ├── subscriptions (FK: user_id)
 ├── daily_usage (FK: user_id)
 ├── user_profiles (FK: user_id, UNIQUE)
 ├── diary_streaks (FK: user_id, UNIQUE)
 ├── xp_history (FK: user_id)              ← NEW
 ├── treasure_chest_log (FK: user_id)      ← NEW
 ├── user_quest_progress (FK: user_id)     ← NEW
 ├── user_challenge_progress (FK: user_id) ← NEW
 ├── iap_purchases (FK: user_id)           ← NEW
 ├── user_mistakes (FK: user_id)
 ├── learning_stats (ref: user_id)
 └── vocabulary (FK: user_id)

chats (PK: id, ref: user_id)
 └── messages (FK: chat_id)

weekly_quests (PK: id)                     ← NEW
 └── user_quest_progress (FK: quest_id)

monthly_challenges (PK: id)                ← NEW
 └── user_challenge_progress (FK: challenge_id)

verification_tokens (독립)
```

---

## 3. 테이블 정의

> **표기법**: `*` = NOT NULL, `PK` = Primary Key, `FK` = Foreign Key, `UQ` = Unique, `IDX` = Index
> **타입**: Drizzle ORM 기준 PostgreSQL 네이티브 타입

---

### 3.1 인증 (Auth) — 변경 없음

NextAuth.js adapter 테이블 4개. **v3.0에서 스키마 변경 없음.**

- `users` (id, name, email, emailVerified, image, createdAt, updatedAt)
- `accounts` (userId, type, provider, providerAccountId, refresh_token, access_token, ...)
- `sessions` (sessionToken, userId, expires)
- `verification_tokens` (identifier, token, expires)

> 상세 정의는 기존 `db/schema.ts` 참조.

---

### 3.2 구독 & 결제 (Billing)

#### `subscriptions` — 변경 없음

기존 스키마 유지. 가격 변경(₩9,900→₩6,900)은 앱 레벨 정책.

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | uuid | PK, default random | |
| user_id | text | *FK→users.id, IDX | |
| plan | text enum('free','premium') | *default 'free' | |
| status | text enum('active','cancelled','expired') | *default 'active' | |
| payment_key | text | nullable | 토스페이먼츠 결제 키 |
| start_date | timestamp | *default now | |
| end_date | timestamp | nullable | 구독 만료일 |
| created_at | timestamp | *default now | |
| updated_at | timestamp | *default now | |

#### `daily_usage` — ALTER

| 컬럼 | 타입 | 제약 | 설명 | 변경 |
|------|------|------|------|------|
| id | uuid | PK | | |
| user_id | text | *FK→users.id | | |
| date | date | * | | |
| count | integer | *default 0 | 사용한 교정 횟수 | |
| **bonus_count** | **integer** | ***default 0** | **IAP로 구매한 추가 교정 횟수** | **NEW** |
| created_at | timestamp | *default now | | |
| updated_at | timestamp | *default now | | |

**인덱스**: `(user_id, date)` UNIQUE (기존 유지)

**교정 가능 판정 로직**:
```
free_limit = 1 (무료) or ∞ (프리미엄)
available = free_limit + bonus_count - count
if available > 0 → 교정 허용
```

#### `iap_purchases` — NEW

IAP 결제 트랜잭션을 기록한다. 토스페이먼츠 승인 후 서버에서 INSERT.

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | uuid | PK, default random | |
| user_id | text | *FK→users.id, IDX | |
| product_type | text enum | * | 아래 enum 참조 |
| amount | integer | * | 결제 금액 (KRW) |
| payment_key | text | * | 토스페이먼츠 결제 키 |
| status | text enum('pending','completed','failed','refunded') | *default 'pending' | |
| created_at | timestamp | *default now | |

**`product_type` enum**:

| 값 | 가격 | 효과 |
|----|------|------|
| `extra_correction` | 500 | 당일 교정 1회 추가 (`daily_usage.bonus_count` +1) |
| `streak_freeze_1` | 1500 | Streak Freeze x1 (`user_profiles.streak_freeze_count` +1) |
| `streak_freeze_3` | 3500 | Streak Freeze x3 (`user_profiles.streak_freeze_count` +3, 상한 2 체크) |
| `xp_booster` | 1000 | 24h XP 2배 (`user_profiles.xp_booster_expires_at` = now + 24h) |
| `chest_key_5` | 2500 | 보물상자 열쇠 x5 (`user_profiles.chest_key_count` +5) |

**인덱스**: `(user_id)`, `(user_id, created_at DESC)`

---

### 3.3 핵심 데이터 (Core)

#### `chats` — ALTER

일기 세션. 한 건의 일기 = 한 건의 chat.

| 컬럼 | 타입 | 제약 | 설명 | 변경 |
|------|------|------|------|------|
| id | uuid | PK | | |
| user_id | text | * | | |
| title | text | * | 일기 제목 (원문 앞 50자) | |
| ~~summary~~ | ~~text~~ | | ~~LLM 대화 요약~~ | **DROP** |
| **mood** | **text enum** | **nullable** | **기분 (happy/neutral/sad/excited/tired/anxious)** | **NEW** |
| **word_count** | **integer** | **default 0** | **원문 단어 수** | **NEW** |
| **challenge_word_used** | **boolean** | **default false** | **오늘의 단어 사용 여부** | **NEW** |
| created_at | timestamp | *default now | | |
| updated_at | timestamp | *default now | | |

**`mood` enum**: `'happy'`, `'neutral'`, `'sad'`, `'excited'`, `'tired'`, `'anxious'`

**인덱스**: `(user_id, created_at DESC)` — 캘린더/기록 조회용

#### `messages` — ALTER

| 컬럼 | 타입 | 제약 | 설명 | 변경 |
|------|------|------|------|------|
| id | uuid | PK | | |
| chat_id | uuid | *FK→chats.id | | |
| role | text enum | * | `'user'`, `'assistant'`, **`'penpal'`** | **ALTER enum** |
| content | text | * | user: 원문 / assistant: 교정 JSON / penpal: 답장 텍스트 | |
| created_at | timestamp | *default now | | |

**`role` 별 `content` 포맷**:

| role | content 형식 |
|------|-------------|
| `user` | 사용자가 쓴 영어 일기 원문 (plain text) |
| `assistant` | AI 교정 결과 JSON `{ corrected, explanation, alternatives, keywords }` |
| `penpal` | AI Pen Pal 답장 (plain text, 영어) |

**인덱스**: `(chat_id, created_at)` — 메시지 순서 조회용

---

### 3.4 게이미피케이션 (Gamification)

#### `user_profiles` — ALTER (대규모 변경)

사용자의 XP/레벨/인벤토리/설정을 관리하는 싱글톤 테이블.

| 컬럼 | 타입 | 제약 | 설명 | 변경 |
|------|------|------|------|------|
| id | uuid | PK | | |
| user_id | text | *UQ, IDX | | |
| ~~level~~ | ~~text enum('detailed','concise')~~ | | ~~설명 수준~~ | **DROP** |
| learning_goal | text | nullable | 학습 목표 ("비즈니스 이메일" 등) | |
| recurring_mistakes | jsonb | *default '[]' | 반복 오답 패턴 요약 | |
| learning_preferences | jsonb | *default '{}' | 학습 설정 | |
| **xp** | **integer** | ***default 0** | **누적 경험치** | **NEW** |
| **xp_level** | **integer** | ***default 1** | **현재 레벨 (1~30)** | **NEW** |
| **title** | **text** | ***default 'Diary Beginner'** | **현재 칭호** | **NEW** |
| **equipped_title** | **text** | **nullable** | **장착 중인 레어 칭호 (보물상자 획득)** | **NEW** |
| **earned_titles** | **jsonb** | ***default '[]'** | **획득한 칭호 목록** | **NEW** |
| **streak_freeze_count** | **integer** | ***default 0** | **Streak Freeze 보유 수 (max 2)** | **NEW** |
| **xp_booster_expires_at** | **timestamp** | **nullable** | **XP 2배 부스터 만료 시각** | **NEW** |
| **chest_key_count** | **integer** | ***default 0** | **보물상자 열쇠 보유 수** | **NEW** |
| created_at | timestamp | *default now | | |
| updated_at | timestamp | *default now | | |

> **설계 결정**: Streak Freeze, XP Booster, Chest Key를 별도 `inventory` 테이블 대신 `user_profiles`에 직접 배치. 아이템 종류가 3종으로 고정이고, 사용자당 싱글톤이므로 JOIN 없이 단일 쿼리로 조회 가능.

**레벨 칭호 매핑** (앱 레벨 상수):

| xp_level | title | 필요 XP (누적) |
|----------|-------|---------------|
| 1-5 | Diary Beginner | 0 ~ 300 |
| 6-10 | Daily Writer | 300 ~ 1,000 |
| 11-15 | Story Teller | 1,000 ~ 2,500 |
| 16-20 | Word Crafter | 2,500 ~ 5,000 |
| 21-25 | English Native | 5,000 ~ 10,000 |
| 26-30 | Master Author | 10,000+ |

**XP Booster 활성 판정**: `xp_booster_expires_at IS NOT NULL AND xp_booster_expires_at > NOW()`

#### `diary_streaks` — ALTER

| 컬럼 | 타입 | 제약 | 설명 | 변경 |
|------|------|------|------|------|
| id | uuid | PK | | |
| user_id | text | *UQ FK→users.id, IDX | | |
| current_streak | integer | *default 0 | 현재 연속 일수 | |
| longest_streak | integer | *default 0 | 역대 최장 기록 | |
| last_written_at | date | nullable | 마지막 작성일 | |
| total_entries | integer | *default 0 | 누적 작성 수 | |
| **previous_streak** | **integer** | ***default 0** | **리셋 전 스트릭 (Comeback 50% 복구용)** | **NEW** |
| **streak_freeze_used_at** | **date** | **nullable** | **마지막 Freeze 자동 소비일** | **NEW** |
| **comeback_started_at** | **date** | **nullable** | **복귀 후 연속 작성 추적 시작일** | **NEW** |
| **comeback_days** | **integer** | ***default 0** | **복귀 후 연속 작성 일수** | **NEW** |
| created_at | timestamp | *default now | | |
| updated_at | timestamp | *default now | | |

**스트릭 판정 로직** (KST 기준):

```
today = KST 기준 오늘 날짜
gap = today - last_written_at

if gap == 0 → 이미 작성함 (중복 방지)
if gap == 1 → 연속 유지 (current_streak +1)
if gap == 2 AND streak_freeze_count > 0:
    → Freeze 자동 소비 (streak_freeze_count -1, streak_freeze_used_at = yesterday)
    → 연속 유지 (current_streak +1)
if gap >= 2 (Freeze 없음):
    → previous_streak = current_streak
    → current_streak = 1 (리셋)
    → if gap >= 3: comeback 자격 부여

Comeback Bonus:
- 3일+ 미접속 후 복귀 작성 → Welcome Back 50 XP
- 리셋 후 3일 연속 → Comeback Kid 칭호 + 100 XP
- 리셋 후 7일 연속 → previous_streak * 0.5 복구
```

#### `xp_history` — NEW

모든 XP 변동 이벤트를 기록한다. 디버깅, 어뷰징 감지, 통계 분석용.

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | uuid | PK, default random | |
| user_id | text | *FK→users.id, IDX | |
| amount | integer | * | 획득 XP (양수만) |
| action | text enum | * | XP 획득 행동 |
| booster_applied | boolean | *default false | XP 2배 부스터 적용 여부 |
| reference_id | uuid | nullable | 관련 엔티티 ID (chat_id, quest_id 등) |
| created_at | timestamp | *default now | |

**`action` enum**:

| 값 | XP | 설명 |
|----|-----|------|
| `diary_submit` | 30 | 일기 제출 |
| `challenge_word` | 15 | 챌린지 단어 사용 |
| `perfect_diary` | 20 | 오답 0개 교정 |
| `expression_save` | 5 | 표현노트 저장 |
| `streak_7d` | 100 | 연속 7일 마일스톤 |
| `streak_30d` | 500 | 연속 30일 마일스톤 |
| `weekly_quest` | 80-200 | 주간 퀘스트 완료 |
| `weekly_bonus` | 100 | 주간 보너스 (2/3 완료) |
| `monthly_challenge` | 1000 | 월간 챌린지 완료 |
| `welcome_back` | 50 | 복귀 보너스 |
| `comeback_kid` | 100 | Comeback Kid 보너스 |
| `treasure_chest` | 10-50 | 보물상자 XP 보너스 |

**인덱스**: `(user_id, created_at DESC)`, `(user_id, action)`

#### `treasure_chest_log` — NEW

보물상자에서 획득한 보상 이력. "최근 7일간 보상 목록" 조회용.

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | uuid | PK, default random | |
| user_id | text | *FK→users.id, IDX | |
| reward_type | text enum | * | 보상 종류 |
| reward_data | jsonb | *default '{}' | 보상 상세 (아래 참조) |
| source | text enum('daily','key') | *default 'daily' | 일일 자동 / IAP 열쇠 |
| created_at | timestamp | *default now | |

**`reward_type` enum & `reward_data` 포맷**:

| reward_type | 확률 | reward_data 예시 |
|-------------|------|-----------------|
| `xp_bonus` | 40% | `{ "amount": 30 }` |
| `quote` | 25% | `{ "text": "...", "translation": "...", "author": "..." }` |
| `rare_expression` | 20% | `{ "expression": "...", "meaning": "...", "example": "..." }` |
| `streak_freeze` | 10% | `{}` (user_profiles.streak_freeze_count에 반영) |
| `rare_title` | 5% | `{ "title": "Night Owl" }` |

**인덱스**: `(user_id, created_at DESC)`

> **확률 결정은 서버에서 수행** (클라이언트 조작 방지). Streak Freeze 보유 상한(2개) 초과 시 `xp_bonus`로 대체.

#### `weekly_quests` — NEW

매주 월요일 자정(KST)에 서버가 생성하는 3개 퀘스트 정의.

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | uuid | PK, default random | |
| week_start | date | * | 해당 주 월요일 날짜 |
| slot | integer | * | 슬롯 번호 (1, 2, 3) |
| quest_type | text enum | * | 퀘스트 유형 |
| description | text | * | 퀘스트 설명 (예: "이번 주 5일 이상 일기 쓰기") |
| target_count | integer | * | 목표 달성 수 |
| xp_reward | integer | * | 완료 시 보상 XP |
| created_at | timestamp | *default now | |

**`quest_type` enum**:

| 값 | 설명 | target 예시 | XP |
|----|------|------------|-----|
| `frequency` | N일 이상 작성 | 5 | 150 |
| `challenge` | 챌린지 단어 N개 사용 | 3 | 100 |
| `expression` | 표현노트 N개 저장 | 5 | 80 |
| `length` | N단어 이상 일기 M회 | 2 | 120 |
| `perfect` | 오답 0개 일기 N회 | 1 | 200 |

**인덱스**: `(week_start)` UNIQUE composite `(week_start, slot)`

**접근 정책**:
- 무료 사용자: slot 1만 활성
- 프리미엄: slot 1, 2, 3 전체 활성

#### `user_quest_progress` — NEW

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | uuid | PK, default random | |
| user_id | text | *FK→users.id, IDX | |
| quest_id | uuid | *FK→weekly_quests.id | |
| current_count | integer | *default 0 | 현재 진행률 |
| completed | boolean | *default false | 완료 여부 |
| completed_at | timestamp | nullable | 완료 시각 |
| created_at | timestamp | *default now | |

**인덱스**: `(user_id, quest_id)` UNIQUE

**주간 보너스 판정**: 동일 `week_start`에 해당하는 3개 퀘스트 중 `completed = true`인 것이 2개 이상이면 +100 XP 주간 보너스 지급. (xp_history에 `weekly_bonus` action으로 기록)

#### `monthly_challenges` — NEW

매월 1일에 관리자가 생성하는 월간 챌린지 정의.

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | uuid | PK, default random | |
| year | integer | * | 연도 |
| month | integer | * | 월 (1~12) |
| theme | text | * | 테마명 (예: "감정 표현 마스터") |
| expressions | jsonb | * | 10개 표현 배열 `[{ "word": "...", "meaning": "..." }]` |
| xp_reward | integer | *default 1000 | 완료 보상 XP |
| badge_name | text | * | 완료 시 부여 배지/칭호명 |
| created_at | timestamp | *default now | |

**인덱스**: `(year, month)` UNIQUE

#### `user_challenge_progress` — NEW

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | uuid | PK, default random | |
| user_id | text | *FK→users.id, IDX | |
| challenge_id | uuid | *FK→monthly_challenges.id | |
| used_expressions | jsonb | *default '[]' | 사용한 표현 목록 `["overjoyed", "devastated"]` |
| completed | boolean | *default false | 10개 모두 사용 시 true |
| completed_at | timestamp | nullable | 완료 시각 |
| created_at | timestamp | *default now | |

**인덱스**: `(user_id, challenge_id)` UNIQUE

---

### 3.5 학습 도구 (Learning Tools)

#### `user_mistakes` — ALTER

| 컬럼 | 타입 | 제약 | 설명 | 변경 |
|------|------|------|------|------|
| id | uuid | PK | | |
| user_id | text | *IDX | | |
| mistake_type | text enum | * | 대분류 | **ALTER enum** |
| **sub_type** | **text** | **nullable** | **세부 유형** | **NEW** |
| pattern | text | * | 구체적 패턴 설명 | |
| frequency | integer | *default 1 | 발생 횟수 | |
| examples | jsonb | *default '[]' | 예시 문장 (최대 5개) | |
| last_occurred_at | timestamp | *default now | | |
| created_at | timestamp | *default now | | |
| updated_at | timestamp | *default now | | |

**`mistake_type` enum 변경** (v2.0 → v3.0):

| v2.0 | v3.0 |
|------|------|
| grammar, vocabulary, pronunciation, fluency, comprehension | **grammar, expression, vocabulary** |

**`sub_type` 체계**:

| mistake_type | sub_type 값 | 설명 |
|-------------|-------------|------|
| grammar | `tense` | 시제 오류 |
| grammar | `agreement` | 주어-동사 수 일치 |
| grammar | `preposition` | 전치사 오용 |
| grammar | `article` | 관사 오용 |
| grammar | `word_order` | 한국어식 어순 |
| grammar | `plural` | 단수/복수 |
| expression | `unnatural` | 문법은 맞지만 부자연스러운 표현 |
| expression | `literal_translation` | 한국어 직역 |
| vocabulary | `word_choice` | 맥락에 안 맞는 단어 |
| vocabulary | `collocation` | 어색한 단어 조합 |

**인덱스**: `(user_id)`, `(user_id, pattern)`, `(user_id, mistake_type)`

**반복 오답 인사이트 트리거**: `frequency >= 3 AND last_occurred_at > NOW() - INTERVAL '7 days'`

#### `vocabulary` — 변경 없음

기존 스키마 그대로 사용. PRD v3.0에서 "표현노트"로 명칭 변경.

| 기능 | 구현 위치 |
|------|----------|
| 무료 20개 제한 | 앱 레벨 (`COUNT WHERE user_id = ? < 20`) |
| AI 자동 보강 | 기존 컬럼 활용 (meaning, pronunciation, partOfSpeech, synonyms, context, difficulty) |
| 원문 맥락 보존 | 기존 `context`, `source_id` 컬럼 활용 |
| 드래그 저장 | 프론트엔드 구현 |

#### `learning_stats` — 데이터 포맷 변경

스키마 변경 없음. `mistake_breakdown` jsonb의 키를 새 3-category 체계로 변경.

**v2.0 포맷**: `{ "grammar": 5, "vocabulary": 3, "pronunciation": 2 }`
**v3.0 포맷**: `{ "grammar": 5, "expression": 3, "vocabulary": 2 }`

---

## 4. 인덱스 전략 요약

### 고빈도 쿼리 패턴 & 대응 인덱스

| 쿼리 패턴 | 테이블 | 인덱스 |
|-----------|--------|--------|
| 사용자의 오늘 사용량 조회 | daily_usage | `(user_id, date)` UNIQUE |
| 캘린더 — 월별 일기 목록 | chats | `(user_id, created_at DESC)` |
| 기록 조회 — 최신순 일기 | chats | `(user_id, created_at DESC)` |
| 채팅 메시지 순서 조회 | messages | `(chat_id, created_at)` |
| XP 이력 조회 | xp_history | `(user_id, created_at DESC)` |
| 보물상자 최근 7일 이력 | treasure_chest_log | `(user_id, created_at DESC)` |
| 이번 주 퀘스트 조회 | weekly_quests | `(week_start)` |
| 사용자 퀘스트 진행률 | user_quest_progress | `(user_id, quest_id)` UNIQUE |
| 반복 오답 인사이트 | user_mistakes | `(user_id, mistake_type)` |
| 표현노트 최신순 | vocabulary | `(user_id, created_at DESC)` |

### 복합 인덱스 주의사항

- `daily_usage(user_id, date)`: 매 교정 요청마다 조회하므로 UNIQUE 인덱스로 upsert 최적화
- `chats(user_id, created_at)`: 캘린더/기록 조회가 가장 빈번한 읽기 쿼리
- `user_quest_progress(user_id, quest_id)`: UNIQUE로 중복 진행 방지

---

## 5. 마이그레이션 체크리스트

### Phase 1: 비파괴적 변경 (ADD 먼저)

1. `user_profiles`: ADD `xp`, `xp_level`, `title`, `equipped_title`, `earned_titles`, `streak_freeze_count`, `xp_booster_expires_at`, `chest_key_count`
2. `chats`: ADD `mood`, `word_count`, `challenge_word_used`
3. `diary_streaks`: ADD `previous_streak`, `streak_freeze_used_at`, `comeback_started_at`, `comeback_days`
4. `daily_usage`: ADD `bonus_count`
5. `user_mistakes`: ADD `sub_type`
6. `messages`: `role` enum에 `'penpal'` 값 추가

### Phase 2: 새 테이블 생성

7. CREATE `xp_history`
8. CREATE `treasure_chest_log`
9. CREATE `weekly_quests`
10. CREATE `user_quest_progress`
11. CREATE `monthly_challenges`
12. CREATE `user_challenge_progress`
13. CREATE `iap_purchases`

### Phase 3: 데이터 마이그레이션

14. `user_profiles`: 기존 `level` 컬럼 값('detailed'/'concise')을 `learning_preferences` jsonb로 이관 (필요 시)
15. `user_mistakes`: 기존 `mistake_type` 값 매핑 (`pronunciation` → `expression`, `fluency` → `expression`, `comprehension` → `vocabulary`)
16. `learning_stats`: 기존 `mistake_breakdown` jsonb 키 매핑

### Phase 4: 파괴적 변경 (DROP 마지막)

17. `user_profiles`: DROP COLUMN `level` (old text enum)
18. `chats`: DROP COLUMN `summary`
19. DROP TABLE `checkpoints`
20. `user_mistakes`: ALTER `mistake_type` enum (old 값 제거)

> **주의**: Phase 3→4 사이에 앱 코드 배포가 선행되어야 함. 코드가 old 컬럼을 참조하지 않는 것을 확인한 후 DROP 실행.

---

## 6. Feature ↔ Table 매핑

| Feature | 주요 테이블 | 비고 |
|---------|------------|------|
| F1: 일기 & AI 교정 | chats, messages, daily_usage | mood/wordCount 추가 |
| F2: 챌린지 모드 | chats (challenge_word_used) | 20종 단어는 앱 상수 |
| F3: XP & 레벨 | user_profiles, xp_history | xp/level 관리 |
| F4: 스트릭 & 위기 구제 | diary_streaks, user_profiles | freeze/comeback 로직 |
| F5: 보물상자 | treasure_chest_log, user_profiles | 보상 결정은 서버 |
| F6: 주간/월간 퀘스트 | weekly_quests, user_quest_progress, monthly_challenges, user_challenge_progress | |
| F7: AI Pen Pal | messages (role='penpal') | 기존 테이블 재활용 |
| F8: 표현노트 | vocabulary | 변경 없음 |
| F9: 오답 분석 | user_mistakes, learning_stats | enum 변경 |
| F10: 캘린더 | chats (mood, word_count) | 읽기 전용 |
| F11: 기록 조회 | chats, messages | 7일/전체 필터 |
| F12: 프리미엄 & IAP | subscriptions, iap_purchases, daily_usage | |
| F13: 프로필 | user_profiles | 인벤토리 통합 |
