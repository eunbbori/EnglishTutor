# Table Definitions

| 항목 | 값 |
|------|-----|
| **버전** | 2.0.0 |
| **상태** | `완료` |
| **최종 수정일** | 2026-02-12 |
| **소스 파일** | `db/schema.ts` |
| **ORM** | Drizzle ORM (`drizzle-orm/pg-core`) |
| **Database** | Neon (Serverless Postgres) |
| **관련 문서** | [DATA-MODEL.md](../DATA-MODEL.md) · [02-ERD.md](./02-ERD.md) · [03-SEED-DATA.md](./03-SEED-DATA.md) |

> **역할**: 이 문서는 모든 테이블의 **컬럼 수준 DDL 상세**(타입, 제약조건, 인덱스)를 기술한다. 설계 의도와 관계도는 [DATA-MODEL.md](../DATA-MODEL.md), ERD는 [02-ERD.md](./02-ERD.md) 참조.

---

## 목차

- [Auth 도메인](#auth-도메인) — `users` · `accounts` · `sessions` · `verification_tokens`
- [Billing 도메인](#billing-도메인) — `subscriptions` · `daily_usage`
- [Core 도메인](#core-도메인) — `chats` · `messages` · `user_profiles` · `user_mistakes` · `vocabulary` · `learning_stats`
- [Gamification 도메인](#gamification-도메인) — `diary_streaks` · `daily_xp_tracking` · `xp_history` · `treasure_chest_log` · `weekly_quests` · `user_quest_progress` · `monthly_challenges` · `user_challenge_progress` · `iap_purchases`

---

## Auth 도메인

### `users`

NextAuth 사용자 테이블.

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|----------|------|
| `id` | text | PK, `crypto.randomUUID()` | 사용자 ID |
| `name` | text | nullable | 이름 |
| `email` | text | UNIQUE, nullable | 이메일 |
| `email_verified` | timestamp | nullable | 이메일 인증 일시 |
| `image` | text | nullable | 프로필 이미지 URL |
| `created_at` | timestamp | NOT NULL, DEFAULT NOW | 생성일 |
| `updated_at` | timestamp | NOT NULL, DEFAULT NOW | 수정일 |

### `accounts`

OAuth 계정 연결 테이블.

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|----------|------|
| `user_id` | text | FK → users.id (CASCADE) | 사용자 ID |
| `type` | text | NOT NULL | 계정 타입 |
| `provider` | text | PK (복합) | OAuth 제공자 |
| `provider_account_id` | text | PK (복합) | 제공자 계정 ID |
| `refresh_token` | text | nullable | 리프레시 토큰 |
| `access_token` | text | nullable | 액세스 토큰 |
| `expires_at` | integer | nullable | 만료 시각 |
| `token_type` | text | nullable | 토큰 타입 |
| `scope` | text | nullable | 스코프 |
| `id_token` | text | nullable | ID 토큰 |
| `session_state` | text | nullable | 세션 상태 |

**PK**: `(provider, provider_account_id)` 복합 키

### `sessions`

활성 세션 테이블.

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|----------|------|
| `session_token` | text | PK | 세션 토큰 |
| `user_id` | text | FK → users.id (CASCADE) | 사용자 ID |
| `expires` | timestamp | NOT NULL | 만료 일시 |

### `verification_tokens`

이메일 인증 토큰 테이블.

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|----------|------|
| `identifier` | text | PK (복합) | 식별자 |
| `token` | text | PK (복합) | 토큰 |
| `expires` | timestamp | NOT NULL | 만료 일시 |

**PK**: `(identifier, token)` 복합 키

---

## Billing 도메인

### `subscriptions`

구독 상태 테이블.

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|----------|------|
| `id` | uuid | PK, DEFAULT RANDOM | ID |
| `user_id` | text | FK → users.id (CASCADE), NOT NULL | 사용자 ID |
| `plan` | text | NOT NULL, DEFAULT "free" | `free` \| `premium` |
| `status` | text | NOT NULL, DEFAULT "active" | `active` \| `cancelled` \| `expired` |
| `payment_key` | text | nullable | 토스페이먼츠 결제 키 |
| `start_date` | timestamp | NOT NULL, DEFAULT NOW | 구독 시작일 |
| `end_date` | timestamp | nullable | 구독 만료일 |
| `created_at` | timestamp | NOT NULL, DEFAULT NOW | 생성일 |
| `updated_at` | timestamp | NOT NULL, DEFAULT NOW | 수정일 |

**인덱스**: `subscriptions_user_id_idx` ON (user_id)

### `daily_usage`

일일 사용량 테이블.

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|----------|------|
| `id` | uuid | PK, DEFAULT RANDOM | ID |
| `user_id` | text | FK → users.id (CASCADE), NOT NULL | 사용자 ID |
| `date` | date | NOT NULL | 날짜 (YYYY-MM-DD) |
| `count` | integer | NOT NULL, DEFAULT 0 | 교정 횟수 |
| `bonus_count` | integer | NOT NULL, DEFAULT 0 | IAP 추가 교정권 |
| `created_at` | timestamp | NOT NULL, DEFAULT NOW | 생성일 |
| `updated_at` | timestamp | NOT NULL, DEFAULT NOW | 수정일 |

**인덱스**: `daily_usage_user_date_idx` ON (user_id, date)

---

## Core 도메인

### `chats`

일기(채팅) 세션 테이블.

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|----------|------|
| `id` | uuid | PK, DEFAULT RANDOM | ID |
| `user_id` | text | NOT NULL | 사용자 ID |
| `title` | text | NOT NULL | 일기 제목 (첫 50자) |
| `mood` | text | nullable | `happy` \| `neutral` \| `sad` \| `excited` \| `tired` \| `anxious` |
| `word_count` | integer | NOT NULL, DEFAULT 0 | 원문 단어 수 |
| `challenge_word_used` | boolean | NOT NULL, DEFAULT false | 오늘의 단어 사용 여부 |
| `created_at` | timestamp | NOT NULL, DEFAULT NOW | 생성일 |
| `updated_at` | timestamp | NOT NULL, DEFAULT NOW | 수정일 |

**인덱스**: `chats_user_created_idx` ON (user_id, created_at)

### `messages`

채팅 메시지 테이블.

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|----------|------|
| `id` | uuid | PK, DEFAULT RANDOM | ID |
| `chat_id` | uuid | FK → chats.id (CASCADE), NOT NULL | 채팅 세션 ID |
| `role` | text | NOT NULL | `user` \| `assistant` \| `penpal` |
| `content` | text | NOT NULL | 메시지 내용 (assistant는 JSON) |
| `created_at` | timestamp | NOT NULL, DEFAULT NOW | 생성일 |

### `user_profiles`

사용자 프로필 + 게이미피케이션 상태 테이블.

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|----------|------|
| `id` | uuid | PK, DEFAULT RANDOM | ID |
| `user_id` | text | UNIQUE, NOT NULL | 사용자 ID |
| `learning_goal` | text | nullable | 학습 목표 |
| `recurring_mistakes` | jsonb | NOT NULL, DEFAULT `[]` | 반복 오답 패턴 배열 |
| `learning_preferences` | jsonb | NOT NULL, DEFAULT `{}` | 학습 선호 설정 |
| `xp` | integer | NOT NULL, DEFAULT 0 | 누적 XP |
| `xp_level` | integer | NOT NULL, DEFAULT 1 | 현재 레벨 (1~30) |
| `title` | text | NOT NULL, DEFAULT "Diary Beginner" | 현재 칭호 |
| `equipped_title` | text | nullable | 장착 레어 칭호 |
| `earned_titles` | jsonb | NOT NULL, DEFAULT `[]` | 획득 칭호 목록 |
| `streak_freeze_count` | integer | NOT NULL, DEFAULT 0 | Freeze 보유 (max 2) |
| `xp_booster_expires_at` | timestamp | nullable | XP 2배 부스터 만료 |
| `chest_key_count` | integer | NOT NULL, DEFAULT 0 | 보물상자 열쇠 보유 |
| `created_at` | timestamp | NOT NULL, DEFAULT NOW | 생성일 |
| `updated_at` | timestamp | NOT NULL, DEFAULT NOW | 수정일 |

**인덱스**: `user_profiles_user_id_idx` ON (user_id)

### `user_mistakes`

오답 패턴 분석 테이블.

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|----------|------|
| `id` | uuid | PK, DEFAULT RANDOM | ID |
| `user_id` | text | NOT NULL | 사용자 ID |
| `mistake_type` | text | NOT NULL | `grammar` \| `vocabulary` \| `expression` |
| `sub_type` | text | nullable | 세부 유형 (tense, agreement 등) |
| `pattern` | text | NOT NULL | 패턴명 (kebab-case) |
| `frequency` | integer | NOT NULL, DEFAULT 1 | 발생 횟수 |
| `examples` | jsonb | NOT NULL, DEFAULT `[]` | 예시 문장 배열 |
| `last_occurred_at` | timestamp | NOT NULL, DEFAULT NOW | 마지막 발생일 |
| `created_at` | timestamp | NOT NULL, DEFAULT NOW | 생성일 |
| `updated_at` | timestamp | NOT NULL, DEFAULT NOW | 수정일 |

**인덱스**: `(user_id)`, `(mistake_type)`, `(user_id, pattern)`

### `vocabulary`

표현노트 테이블.

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|----------|------|
| `id` | uuid | PK, DEFAULT RANDOM | ID |
| `user_id` | text | FK → users.id (CASCADE), NOT NULL | 사용자 ID |
| `word` | text | NOT NULL | 단어/표현 |
| `meaning` | text | nullable | 한국어 뜻 |
| `example` | text | nullable | 예문 |
| `memo` | text | nullable | 사용자 메모 |
| `source_type` | text | NOT NULL, DEFAULT "manual" | `diary` \| `chat` \| `manual` |
| `source_id` | uuid | nullable | 출처 참조 |
| `pronunciation` | text | nullable | IPA 발음 |
| `part_of_speech` | text | nullable | 품사 |
| `synonyms` | text[] | nullable | 유의어 (최대 3개) |
| `context` | text | nullable | 원문 문맥 |
| `difficulty` | text | nullable | `beginner` \| `intermediate` \| `advanced` |
| `created_at` | timestamp | NOT NULL, DEFAULT NOW | 생성일 |
| `updated_at` | timestamp | NOT NULL, DEFAULT NOW | 수정일 |

**인덱스**: `(user_id)`, `(created_at)`, `(user_id, created_at)`

### `learning_stats`

일별 학습 통계 테이블.

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|----------|------|
| `id` | uuid | PK, DEFAULT RANDOM | ID |
| `user_id` | text | NOT NULL | 사용자 ID |
| `date` | date | NOT NULL | 통계 날짜 |
| `mistake_rate` | decimal(5,2) | nullable | 오답률 (0.00~100.00) |
| `mistake_breakdown` | jsonb | NOT NULL, DEFAULT `{}` | 유형별 오답 수 |
| `total_messages` | integer | NOT NULL, DEFAULT 0 | 총 메시지 수 |
| `total_mistakes` | integer | NOT NULL, DEFAULT 0 | 총 오답 수 |
| `created_at` | timestamp | NOT NULL, DEFAULT NOW | 생성일 |
| `updated_at` | timestamp | NOT NULL, DEFAULT NOW | 수정일 |

**인덱스**: `(user_id)`, `(date)`, `(user_id, date)`

---

## Gamification 도메인

### `diary_streaks`

연속 작성 스트릭 테이블.

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|----------|------|
| `id` | uuid | PK, DEFAULT RANDOM | ID |
| `user_id` | text | UNIQUE, FK → users.id (CASCADE), NOT NULL | 사용자 ID |
| `current_streak` | integer | NOT NULL, DEFAULT 0 | 현재 연속 일수 |
| `longest_streak` | integer | NOT NULL, DEFAULT 0 | 최장 연속 일수 |
| `last_written_at` | date | nullable | 마지막 작성일 |
| `total_entries` | integer | NOT NULL, DEFAULT 0 | 총 일기 수 |
| `previous_streak` | integer | NOT NULL, DEFAULT 0 | 리셋 전 스트릭 |
| `streak_freeze_used_at` | date | nullable | 마지막 Freeze 사용일 |
| `comeback_started_at` | date | nullable | 복귀 추적 시작일 |
| `comeback_days` | integer | NOT NULL, DEFAULT 0 | 복귀 연속 일수 |
| `created_at` | timestamp | NOT NULL, DEFAULT NOW | 생성일 |
| `updated_at` | timestamp | NOT NULL, DEFAULT NOW | 수정일 |

**인덱스**: `diary_streaks_user_id_idx` ON (user_id)

### `daily_xp_tracking`

일일 XP 상한 추적 테이블.

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|----------|------|
| `id` | uuid | PK, DEFAULT RANDOM | ID |
| `user_id` | text | FK → users.id (CASCADE), NOT NULL | 사용자 ID |
| `date` | date | NOT NULL | 날짜 |
| `diary_count` | integer | NOT NULL, DEFAULT 0 | 일기 제출 횟수 (상한 3) |
| `vocab_count` | integer | NOT NULL, DEFAULT 0 | 표현노트 저장 횟수 (상한 5) |
| `weakness_overcome_count` | integer | NOT NULL, DEFAULT 0 | 약점 극복 횟수 (상한 1) |
| `created_at` | timestamp | NOT NULL, DEFAULT NOW | 생성일 |
| `updated_at` | timestamp | NOT NULL, DEFAULT NOW | 수정일 |

**인덱스**: `daily_xp_tracking_user_date_idx` ON (user_id, date)

### `xp_history`

XP 획득 이벤트 로그 테이블.

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|----------|------|
| `id` | uuid | PK, DEFAULT RANDOM | ID |
| `user_id` | text | FK → users.id (CASCADE), NOT NULL | 사용자 ID |
| `amount` | integer | NOT NULL | 획득 XP |
| `action` | text | NOT NULL | 액션 유형 (enum) |
| `booster_applied` | boolean | NOT NULL, DEFAULT false | 2배 부스터 적용 여부 |
| `reference_id` | uuid | nullable | 관련 엔티티 ID |
| `created_at` | timestamp | NOT NULL, DEFAULT NOW | 생성일 |

**action enum**: `diary_submit`, `weakness_overcome`, `length_30`, `length_60`, `length_100`, `expression_save`, `streak_7d`~`streak_365d`, `monthly_challenge_15/20/25`, `weekly_quest`, `weekly_bonus`, `treasure_chest`, `welcome_back`, `comeback_kid`

**인덱스**: `(user_id)`, `(user_id, created_at)`, `(user_id, action)`

### `treasure_chest_log`

보물상자 보상 히스토리 테이블.

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|----------|------|
| `id` | uuid | PK, DEFAULT RANDOM | ID |
| `user_id` | text | FK → users.id (CASCADE), NOT NULL | 사용자 ID |
| `reward_type` | text | NOT NULL | `xp_bonus` \| `quote` \| `rare_expression` \| `streak_freeze` \| `rare_title` |
| `reward_data` | jsonb | NOT NULL, DEFAULT `{}` | 보상 상세 |
| `source` | text | NOT NULL, DEFAULT "daily" | `daily` \| `key` |
| `created_at` | timestamp | NOT NULL, DEFAULT NOW | 생성일 |

**인덱스**: `(user_id)`, `(user_id, created_at)`

### `weekly_quests`

주간 퀘스트 정의 테이블.

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|----------|------|
| `id` | uuid | PK, DEFAULT RANDOM | ID |
| `week_start` | date | NOT NULL | 주 시작일 (월요일) |
| `slot` | integer | NOT NULL | 슬롯 번호 (1, 2, 3) |
| `quest_type` | text | NOT NULL | `frequency` \| `challenge` \| `expression` \| `length` \| `perfect` |
| `description` | text | NOT NULL | 퀘스트 설명 |
| `target_count` | integer | NOT NULL | 목표 수 |
| `xp_reward` | integer | NOT NULL | 완료 시 XP 보상 |
| `created_at` | timestamp | NOT NULL, DEFAULT NOW | 생성일 |

**인덱스**: `(week_start)`, `(week_start, slot)`

### `user_quest_progress`

사용자 퀘스트 진행도 테이블.

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|----------|------|
| `id` | uuid | PK, DEFAULT RANDOM | ID |
| `user_id` | text | FK → users.id (CASCADE), NOT NULL | 사용자 ID |
| `quest_id` | uuid | FK → weekly_quests.id (CASCADE), NOT NULL | 퀘스트 ID |
| `current_count` | integer | NOT NULL, DEFAULT 0 | 현재 진행도 |
| `completed` | boolean | NOT NULL, DEFAULT false | 완료 여부 |
| `completed_at` | timestamp | nullable | 완료 일시 |
| `created_at` | timestamp | NOT NULL, DEFAULT NOW | 생성일 |

**인덱스**: `(user_id)`, `(user_id, quest_id)`

### `monthly_challenges`

월간 챌린지 정의 테이블.

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|----------|------|
| `id` | uuid | PK, DEFAULT RANDOM | ID |
| `year` | integer | NOT NULL | 연도 |
| `month` | integer | NOT NULL | 월 (1-12) |
| `theme` | text | NOT NULL | 챌린지 테마 |
| `expressions` | jsonb | NOT NULL | 10개 표현 배열 |
| `xp_reward` | integer | NOT NULL, DEFAULT 1000 | 완료 보상 |
| `badge_name` | text | NOT NULL | 완료 시 뱃지/칭호 |
| `created_at` | timestamp | NOT NULL, DEFAULT NOW | 생성일 |

**인덱스**: `(year, month)`

### `user_challenge_progress`

사용자 챌린지 진행도 테이블.

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|----------|------|
| `id` | uuid | PK, DEFAULT RANDOM | ID |
| `user_id` | text | FK → users.id (CASCADE), NOT NULL | 사용자 ID |
| `challenge_id` | uuid | FK → monthly_challenges.id (CASCADE), NOT NULL | 챌린지 ID |
| `used_expressions` | jsonb | NOT NULL, DEFAULT `[]` | 사용한 표현 목록 |
| `completed` | boolean | NOT NULL, DEFAULT false | 완료 여부 (10개 사용) |
| `completed_at` | timestamp | nullable | 완료 일시 |
| `created_at` | timestamp | NOT NULL, DEFAULT NOW | 생성일 |

**인덱스**: `(user_id)`, `(user_id, challenge_id)`

### `iap_purchases`

IAP 구매 기록 테이블.

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|----------|------|
| `id` | uuid | PK, DEFAULT RANDOM | ID |
| `user_id` | text | FK → users.id (CASCADE), NOT NULL | 사용자 ID |
| `product_type` | text | NOT NULL | `extra_correction` \| `streak_freeze_1` \| `streak_freeze_3` \| `xp_booster` \| `chest_key_5` |
| `amount` | integer | NOT NULL | 결제 금액 (KRW) |
| `payment_key` | text | NOT NULL | 토스페이먼츠 결제 키 |
| `status` | text | NOT NULL, DEFAULT "pending" | `pending` \| `completed` \| `failed` \| `refunded` |
| `created_at` | timestamp | NOT NULL, DEFAULT NOW | 생성일 |

**인덱스**: `(user_id)`, `(user_id, created_at)`
