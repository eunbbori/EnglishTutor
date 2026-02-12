# Directory Structure

| 항목 | 값 |
|------|-----|
| **버전** | 1.2.0 |
| **상태** | `완료` |
| **최종 수정일** | 2026-02-12 |
| **관련 문서** | [OVERVIEW.md](./OVERVIEW.md) · [UI-DESIGN.md](./UI-DESIGN.md) · [AI-SYSTEM.md](./AI-SYSTEM.md) |

---

## 목차

1. [프로젝트 루트](#프로젝트-루트)
2. [`app/` — Next.js App Router](#app--nextjs-app-router)
3. [`components/` — React 컴포넌트](#components--react-컴포넌트)
4. [`lib/` — 비즈니스 로직 & 유틸리티](#lib--비즈니스-로직--유틸리티)
5. [`db/` — 데이터베이스](#db--데이터베이스)
6. [기타 디렉토리](#기타-디렉토리)
7. [파일 배치 규칙](#파일-배치-규칙)

---

## 프로젝트 루트

```
/ (Root)
├── app/                        # Next.js App Router (페이지 + API)
├── components/                 # React 컴포넌트
├── lib/                        # 비즈니스 로직 & 유틸리티
├── db/                         # 데이터베이스 (Drizzle ORM)
├── hooks/                      # 커스텀 React Hooks
├── types/                      # TypeScript 타입 정의
├── public/                     # 정적 자산
├── scripts/                    # 빌드/마이그레이션 스크립트
├── drizzle/                    # Drizzle 마이그레이션 파일 (자동 생성)
├── docs/                       # 프로젝트 문서
├── docs_old/                   # 레거시 문서 (PRD, 기획)
│
├── claude.md                   # 프로젝트 규칙 & 컨텍스트 (AI 어시스턴트용)
├── package.json                # 의존성 및 스크립트
├── tsconfig.json               # TypeScript 설정
├── next.config.mjs             # Next.js 설정
├── drizzle.config.ts           # Drizzle Kit 설정
├── tailwind.config.ts          # Tailwind CSS 설정
├── .env.local                  # 환경 변수 (git 미추적)
└── .env.example                # 환경 변수 템플릿
```

---

## `app/` — Next.js App Router

페이지와 API Route Handler를 포함한다. Next.js 15 App Router 구조를 따른다.

```
app/
├── layout.tsx                          # 루트 레이아웃 (Providers, 폰트, 메타데이터)
├── page.tsx                            # 메인 페이지 (일기 작성 + 교정)
│
├── history/
│   ├── page.tsx                        # 일기 히스토리 목록
│   └── [id]/
│       └── page.tsx                    # 개별 일기 상세 보기
│
├── vocabulary/
│   └── page.tsx                        # 표현노트 (저장된 어휘 목록)
│
├── pricing/
│   └── page.tsx                        # 구독 요금제 페이지
│
├── payment/
│   ├── success/
│   │   └── page.tsx                    # 결제 성공 페이지
│   └── fail/
│       └── page.tsx                    # 결제 실패 페이지
│
└── api/                                # API Route Handlers
    ├── chat/
    │   └── route.ts                    # [POST] AI 일기 교정 (핵심 엔드포인트)
    ├── history/
    │   ├── route.ts                    # [GET] 일기 히스토리 목록
    │   └── [id]/
    │       └── route.ts                # [GET/DELETE] 개별 일기 조회/삭제
    ├── calendar/
    │   └── [year]/
    │       └── [month]/
    │           └── route.ts            # [GET] 월별 캘린더 데이터
    ├── vocabulary/
    │   ├── route.ts                    # [GET/POST] 표현노트 목록/저장
    │   └── [id]/
    │       └── route.ts                # [DELETE] 표현노트 삭제
    ├── streak/
    │   └── route.ts                    # [GET] 스트릭 정보 조회
    ├── usage/
    │   └── route.ts                    # [GET] 사용량/구독 상태 조회
    ├── user/
    │   ├── xp/
    │   │   └── route.ts                # [GET] XP/레벨 정보 조회
    │   └── profile/
    │       └── route.ts                # [GET/PATCH] 사용자 프로필
    ├── treasure-chest/
    │   ├── open/
    │   │   └── route.ts                # [POST] 일일 보물상자 열기
    │   ├── open-with-key/
    │   │   └── route.ts                # [POST] 열쇠로 보물상자 열기 (IAP)
    │   └── history/
    │       └── route.ts                # [GET] 보물상자 히스토리
    └── payment/
        └── confirm/
            └── route.ts                # [POST] 토스페이먼츠 결제 확인
```

---

## `components/` — React 컴포넌트

기능별로 하위 디렉토리를 나누며, `ui/`는 Shadcn 기반 공통 프리미티브이다.

```
components/
├── providers.tsx                       # 전역 Provider (SessionProvider, Toaster 등)
│
├── ui/                                 # Shadcn UI 프리미티브 (공통)
│   ├── alert.tsx
│   ├── avatar.tsx
│   ├── badge.tsx
│   ├── button.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   ├── dropdown-menu.tsx
│   ├── input.tsx
│   ├── progress.tsx
│   ├── scroll-area.tsx
│   ├── select.tsx
│   ├── skeleton.tsx
│   ├── textarea.tsx
│   ├── toast.tsx
│   └── toaster.tsx
│
├── chat/                               # 채팅/교정 UI
│   ├── chat-input.tsx                  # 일기 입력 (텍스트 영역 + 제출 버튼)
│   ├── chat-list.tsx                   # 메시지 목록 컨테이너
│   ├── message-bubble.tsx              # 개별 메시지 렌더러 (역할별 분기)
│   ├── correction-card.tsx             # AI 교정 결과 카드
│   ├── loading-message.tsx             # AI 응답 로딩 스켈레톤
│   └── xp-feedback.tsx                 # XP 획득 피드백 표시
│
├── diary/                              # 일기 기능
│   ├── diary-editor.tsx                # 일기 작성 에디터
│   └── correction-result.tsx           # 교정 결과 표시
│
├── calendar/                           # 캘린더 뷰
│   ├── calendar-view.tsx               # 월별 캘린더
│   ├── calendar-day.tsx                # 개별 날짜 셀
│   ├── calendar-quick-view.tsx         # 날짜 클릭 시 빠른 보기
│   └── mood-selector.tsx               # 기분 선택 UI
│
├── gamification/                       # 게이미피케이션 UI
│   ├── level-badge.tsx                 # 레벨 뱃지 표시
│   ├── levelup-modal.tsx               # 레벨업 축하 모달
│   ├── level-cap-modal.tsx             # 무료 레벨 상한(Lv.10) 안내 모달
│   ├── trial-granted-modal.tsx         # Lv.10 달성 시 체험판 부여 모달
│   └── xp-toast.tsx                    # XP 획득 토스트 알림
│
├── vocabulary/                         # 표현노트 UI
│   ├── selectable-text.tsx             # 텍스트 선택하여 저장
│   ├── word-tooltip.tsx                # 단어 선택 시 툴팁
│   └── onboarding-tooltip.tsx          # 최초 사용자 안내 툴팁
│
├── auth/                               # 인증
│   └── login-button.tsx                # Google 로그인 버튼
│
├── payment/                            # 결제
│   └── upgrade-modal.tsx               # Premium 업그레이드 모달
│
└── usage/                              # 사용량
    └── usage-counter.tsx               # 남은 사용 횟수 표시
```

---

## `lib/` — 비즈니스 로직 & 유틸리티

UI에 독립적인 서버/클라이언트 로직을 포함한다.

```
lib/
├── utils.ts                            # 공통 유틸리티 (cn, clsx, tw-merge)
│
├── ai/                                 # AI 파이프라인
│   ├── graph.ts                        # LangGraph StateGraph (교정 워크플로우)
│   ├── schema.ts                       # Zod 스키마 (CorrectionResponse)
│   ├── response-validator.ts           # 레벨별 응답 품질 검증
│   ├── user-profile.ts                 # UserProfileManager (반복 오답 관리)
│   └── vocabulary-enricher.ts          # AI 기반 어휘 보강 (발음, 유의어 등)
│
├── db/                                 # DB 쿼리 헬퍼
│   ├── user-profile.ts                 # 사용자 프로필 CRUD
│   └── mistakes.ts                     # 오답 패턴 저장/조회
│
├── gamification/                       # 게이미피케이션 로직
│   ├── xp-service.ts                   # XP 부여 (일기, 분량, 약점 극복)
│   ├── xp-constants.ts                 # 레벨 테이블, 칭호, XP 보상 값
│   └── treasure-chest.ts               # 보물상자 보상 시스템
│
├── xp/                                 # XP 보조 모듈
│   ├── daily-tracking.ts               # 일일 XP 상한 추적
│   ├── weakness-overcome.ts            # 약점 극복 판정 로직
│   └── level-rewards.ts                # 레벨 보상 (Lv.10 체험판 등)
│
├── streak/                             # 스트릭 관리
│   └── streak-manager.ts              # 연속 작성 일수 관리 (Freeze, Comeback)
│
├── subscription/                       # 구독/사용량
│   └── check-usage.ts                 # Freemium 사용량 확인
│
├── payment/                            # 결제
│   └── toss.ts                        # 토스페이먼츠 API 연동
│
├── validation/                         # 입력 검증
│   └── ttr.ts                         # TTR(Type-Token Ratio) 계산 + 분량 보너스 판정
│
├── calendar/                           # 캘린더 유틸
│   └── utils.ts                       # 날짜/캘린더 헬퍼
│
├── design-system/                      # 디자인 시스템 토큰
│   ├── index.ts                       # 통합 export
│   ├── colors.ts                      # 색상 팔레트
│   ├── tokens.ts                      # 디자인 토큰 (간격, 라운딩 등)
│   └── typography.ts                  # 타이포그래피 스케일
│
├── utils/                              # 기타 유틸리티
│   └── text-highlighter.tsx           # 교정 텍스트 하이라이트
│
└── missions.ts                         # (레거시) 미션 정의
```

---

## `db/` — 데이터베이스

```
db/
├── index.ts                            # Neon Serverless 연결 (싱글톤)
└── schema.ts                           # 전체 Drizzle 테이블 정의 (15+ 테이블)
```

---

## 기타 디렉토리

```
hooks/
└── use-toast.ts                        # Toast 알림 커스텀 훅

scripts/
├── apply-migration.mjs                 # 마이그레이션 실행
├── apply-migration.ts                  # 마이그레이션 실행 (TS)
├── data-migration.ts                   # 데이터 마이그레이션
├── diagnose-xp.ts                      # XP 진단 스크립트
├── migrate-level.ts                    # 레벨 마이그레이션
├── migrate-vocabulary.ts               # 어휘 마이그레이션
├── run-migration.ts                    # 마이그레이션 러너
├── set-usage-zero.ts                   # 사용량 초기화
└── test-xp-grant.ts                    # XP 부여 테스트

public/
├── assets/                             # 정적 자산
├── icons/                              # 앱 아이콘
└── images/                             # 이미지

drizzle/
└── *.sql                               # 자동 생성된 SQL 마이그레이션 파일
```

---

## 파일 배치 규칙

| 유형 | 위치 | 설명 | 관련 문서 |
|------|------|------|----------|
| 페이지 | `app/` | Next.js App Router 규칙 준수 | [UI-DESIGN.md](./UI-DESIGN.md) |
| API 핸들러 | `app/api/` | Route Handler (server-only) | [API-SPEC.md](./API-SPEC.md) |
| 공통 UI | `components/ui/` | Shadcn 기반 프리미티브 | [UI-DESIGN.md](./UI-DESIGN.md) |
| 기능 UI | `components/{feature}/` | 기능별 컴포넌트 | [UI-DESIGN.md](./UI-DESIGN.md) |
| AI 로직 | `lib/ai/` | LangGraph, 스키마, 검증 | [AI-SYSTEM.md](./AI-SYSTEM.md) |
| DB 로직 | `lib/db/` 또는 `db/` | 스키마 `db/`, 쿼리 헬퍼 `lib/db/` | [DATA-MODEL.md](./DATA-MODEL.md) |
| 게이미피케이션 | `lib/gamification/` + `lib/xp/` | 핵심 `gamification/`, 보조 `xp/` | [COMMON-SYSTEMS.md](./COMMON-SYSTEMS.md) |
| 유틸리티 | `lib/utils.ts` 또는 `lib/{domain}/` | 공통 `utils.ts`, 도메인별 하위 디렉토리 | — |
| 타입 정의 | `types/` | 전역 TypeScript 타입 | — |
| 스크립트 | `scripts/` | 일회성/마이그레이션 스크립트 | — |
