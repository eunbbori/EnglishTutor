# UI Design

> **Last Updated**: 2026-02-12

---

## 1. 기술 스택

| 영역 | 기술 |
|------|------|
| UI 프레임워크 | React 19 (Next.js 15 App Router) |
| 컴포넌트 라이브러리 | Shadcn UI (Radix UI 기반) |
| 스타일링 | Tailwind CSS |
| 아이콘 | Lucide React |
| 상태 관리 | React Hooks (useState, useEffect) |
| 인증 UI | NextAuth SessionProvider |
| 토스트 알림 | Shadcn Toast (커스텀 훅 `use-toast.ts`) |

---

## 2. 페이지 구조

### 2.1 메인 페이지 (`app/page.tsx`)

3가지 뷰 모드를 가진 단일 페이지 앱:

```
┌─────────────────────────────────────────────┐
│  Header                                      │
│  ┌────┬──────┬──────┬────┬────┬────┬─────┐  │
│  │Logo│Level │Streak│❄️  │📅  │📖  │Login│  │
│  │    │Badge │      │Frz │Cal │Hist│     │  │
│  └────┴──────┴──────┴────┴────┴────┴─────┘  │
├─────────────────────────────────────────────┤
│                                              │
│  Main Content (ViewMode에 따라 전환)          │
│                                              │
│  ┌─ viewMode="calendar" ────────────────┐   │
│  │  CalendarView (월별 일기 캘린더)       │   │
│  └──────────────────────────────────────┘   │
│                                              │
│  ┌─ viewMode="write" ──────────────────┐    │
│  │  DiaryEditor (일기 작성)              │    │
│  │  ├─ 날짜/기분 선택                    │    │
│  │  ├─ 영감 카드 (opt-in)               │    │
│  │  └─ 노트북 스타일 텍스트 영역          │    │
│  └──────────────────────────────────────┘   │
│                                              │
│  ┌─ viewMode="result" ─────────────────┐    │
│  │  CorrectionResult (교정 결과)         │    │
│  │  ├─ MessageBubble (user)             │    │
│  │  ├─ CorrectionCard (assistant)       │    │
│  │  └─ XP 피드백                         │    │
│  └──────────────────────────────────────┘   │
│                                              │
└─────────────────────────────────────────────┘
```

### 2.2 전체 페이지 목록

| 경로 | 컴포넌트 | 설명 |
|------|----------|------|
| `/` | Home | 메인 — 캘린더/작성/결과 3-view |
| `/history` | HistoryPage | 일기 히스토리 목록 |
| `/history/[id]` | HistoryDetailPage | 일기 상세 보기 |
| `/vocabulary` | VocabularyPage | 표현노트 |
| `/pricing` | PricingPage | 구독 요금제 |
| `/payment/success` | PaymentSuccessPage | 결제 성공 |
| `/payment/fail` | PaymentFailPage | 결제 실패 |

---

## 3. 컴포넌트 계층 구조

```
RootLayout (app/layout.tsx)
  └─ Providers (SessionProvider)
      └─ Home (app/page.tsx)
          ├─ Header
          │   ├─ LevelBadge            — XP/레벨 표시
          │   ├─ Streak Badge          — 연속 일수
          │   ├─ Freeze Badge          — ❄️ 보유 수
          │   ├─ UsageCounter          — 남은 횟수
          │   └─ LoginButton           — Google 로그인
          │
          ├─ [calendar] CalendarView
          │   ├─ CalendarDay           — 날짜 셀 (기분 이모지)
          │   └─ CalendarQuickView     — 날짜 클릭 시 미리보기
          │
          ├─ [write] DiaryEditor
          │   ├─ MoodSelector          — 기분 선택 이모지
          │   └─ Textarea (노트북 스타일)
          │
          ├─ [result] CorrectionResult
          │   ├─ MessageBubble (user)  — 원문 표시
          │   ├─ CorrectionCard        — 교정 결과
          │   │   ├─ 교정문 (녹색)
          │   │   ├─ 한국어 설명
          │   │   ├─ 대안 표현 Badges
          │   │   └─ 인사이트 (반복 오답)
          │   └─ SelectableText        — 텍스트 선택 → 표현노트 저장
          │       └─ WordTooltip       — 단어 선택 시 저장 옵션
          │
          └─ Modals
              ├─ LevelupModal          — 레벨업 축하
              ├─ LevelCapModal         — Lv.10 상한 안내
              ├─ TrialGrantedModal     — 체험판 부여
              ├─ UpgradeModal          — Premium 업그레이드
              └─ XpToast               — XP 획득 토스트
```

---

## 4. 핵심 컴포넌트 상세

### 4.1 DiaryEditor (`components/diary/diary-editor.tsx`)

노트북 스타일의 일기 작성 에디터.

**Props:**

```typescript
interface DiaryEditorProps {
  prompts: DiaryPrompt[];
  defaultPromptId?: string;
  onSubmit: (text: string, promptId: string | null, mood: string | null) => void;
  isLoading?: boolean;
}
```

**UI 구성:**

```
┌─────────────────────────────────────┐
│ 📅 February 12, 2026 (Wed) Day 43  │  ← 날짜 스탬프
├─────────────────────────────────────┤
│ 😊 😐 😢 😆 😴 😰                 │  ← 기분 선택
├─────────────────────────────────────┤
│ 💡 뭘 쓸지 모르겠어요              │  ← 영감 카드 토글
│ ┌─────────────────────────────────┐ │
│ │ 오늘 가장 맛있었던 음식에 대해  │ │  ← 영감 주제 (셔플 가능)
│ │ 영어로 써보세요!                │ │
│ └─────────────────────────────────┘ │
├─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┤
│ ○                                   │  ← 노트북 구멍 장식
│ ○  Today I went to a nice café     │
│ ○  and ate delicious pasta...      │  ← 노트북 줄 스타일
│ ○                                   │
│ ○                                   │
├─────────────────────────────────────┤
│ 156자 · 28단어            제출하기  │  ← 글자/단어 수 + 제출 버튼
└─────────────────────────────────────┘
```

**입력 검증:**

| 규칙 | 조건 | 안내 메시지 |
|------|------|----------|
| 빈 텍스트 | trim 길이 0 | 버튼 비활성화 |
| 최소 글자 | 공백 제외 20자 | "조금 더 써볼까요?" |
| 최소 단어 | 5단어 이상 | "문장을 조금 더 만들어보세요!" |
| 반복 문자 | 동일 문자 5회+ 연속 | "의미 있는 영어 문장을 써주세요." |
| 반복 단어 | 동일 단어 50%+ | "다양한 단어로 일기를 써보세요!" |
| TTR 경고 | TTR < 0.4 (30단어+) | "다양한 단어를 사용해보세요!" |

### 4.2 CorrectionCard (`components/chat/correction-card.tsx`)

AI 교정 결과를 표시하는 카드.

**Props:**

```typescript
interface CorrectionCardProps {
  correction: CorrectionResponse;
}
```

**UI 구성:**

```
┌────────────────────────────────────────┐
│ ✅ Today I ate delicious pasta at a    │  ← 교정문 (녹색)
│    nice café.                          │
├────────────────────────────────────────┤
│ 💡 잘 쓰셨어요! 일기는 과거 일을 쓰는 │  ← 한국어 설명
│    거라서 'eat' → 'ate'로 바꿔주세요.  │
├────────────────────────────────────────┤
│ 🏷️ Casual: I had some great pasta...  │  ← 대안 표현 (Badge)
│ 🏷️ Expressive: I savored...           │
│ 🏷️ Simple: I ate good food...         │
├────────────────────────────────────────┤
│ ⚠️ 자주 틀리는 부분이에요 (5회)        │  ← 인사이트 (조건부)
│   과거 시제 연습 팁...                  │
└────────────────────────────────────────┘
```

### 4.3 LevelBadge (`components/gamification/level-badge.tsx`)

헤더에 표시되는 XP/레벨 뱃지.

**데이터 소스:** `GET /api/user/xp`

```
┌──────────────────────────────────┐
│ ✨ Lv.7  Daily Writer            │
│ ████████████░░░░░░  250/517 XP   │  ← 프로그레스 바
└──────────────────────────────────┘
```

- 모바일: `✨ Lv.7` 만 표시 (타이틀/프로그레스 숨김)
- 부스터 활성 시: `2x` 뱃지 표시
- 최대 레벨: `MAX LEVEL` 표시

### 4.4 XP Toast (`components/gamification/xp-toast.tsx`)

XP 획득 시 토스트 알림을 표시하는 커스텀 훅.

```typescript
const { showXpGained, showBoosterActivated, showLevelCapReached } = useXpToast();

showXpGained(30, "diary_submit");     // "+30 XP 획득! (일기 제출)"
showXpGained(20, "weakness_overcome"); // "+20 XP 획득! (약점 극복)"
```

- 표시 시간: 3초 (XP), 5초 (특수 알림)
- 다중 토스트: 500ms 간격으로 순차 표시

---

## 5. 모달 시스템

| 모달 | 트리거 | 목적 |
|------|--------|------|
| `LevelupModal` | 레벨업 시 | 새 레벨/칭호 축하 |
| `LevelCapModal` | Lv.10 도달 (Free) | Premium 업그레이드 유도 |
| `TrialGrantedModal` | Lv.10 최초 도달 | 7일 체험판 안내 |
| `UpgradeModal` | 사용량 초과 / 요금제 버튼 | Premium 결제 안내 |

---

## 6. 반응형 디자인

### 모바일 (< 640px)

- 헤더: LevelBadge 축소 (`Lv.X`만), 일부 네비게이션 숨김
- DiaryEditor: 노트북 줄 숨김, 전체 너비
- 터치 타겟: HIG 기준 44pt 이상

### 데스크톱 (≥ 640px)

- 헤더: 전체 LevelBadge (타이틀 + 프로그레스)
- DiaryEditor: 노트북 줄 표시, 최대 너비 제한
- 키보드 단축키: `Cmd/Ctrl + Enter` 제출

---

## 7. 디자인 시스템 토큰

`lib/design-system/` 에 정의된 디자인 토큰:

### 색상 (`colors.ts`)

프로젝트 전용 색상 팔레트 정의.

### 타이포그래피 (`typography.ts`)

텍스트 스케일 정의 (heading, body, caption 등).

### 토큰 (`tokens.ts`)

간격(spacing), 라운딩(radius), 그림자(shadow) 등 디자인 토큰.

---

## 8. Shadcn UI 컴포넌트 사용

`components/ui/` 에 설치된 Shadcn 프리미티브:

| 컴포넌트 | 사용처 |
|----------|--------|
| `Button` | 제출, 네비게이션, 액션 버튼 |
| `Card` | CorrectionCard, 정보 카드 |
| `Badge` | 대안 표현 타입, 스트릭 뱃지 |
| `Dialog` | 모달 (레벨업, 업그레이드 등) |
| `Toast` | XP 획득, 알림 |
| `Progress` | 레벨 프로그레스 바 |
| `Avatar` | 사용자/AI 아바타 |
| `Select` | 드롭다운 선택 |
| `Textarea` | 일기 입력 |
| `Input` | 폼 입력 |
| `Skeleton` | 로딩 스켈레톤 |
| `ScrollArea` | 스크롤 영역 |
| `DropdownMenu` | 메뉴 |
| `Alert` | 인사이트 알림 |
