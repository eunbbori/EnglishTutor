# 디자인 시스템 가이드

> **Last Updated**: 2026-02-12

---

## 개요

Daily English는 **빈티지 스크랩북** 컨셉의 디자인 시스템을 사용한다. 따뜻한 브라운/베이지 톤을 기반으로 아날로그 일기장 느낌을 구현하며, 모바일 퍼스트로 설계되었다.

### 디자인 시스템 구조

```
lib/design-system/
├── colors.ts       # 색상 팔레트
├── typography.ts   # 타이포그래피
└── tokens.ts       # 스페이싱, 그림자, 보더, z-index 등
```

이 토큰들은 `tailwind.config.ts`에서 참조되어 Tailwind 유틸리티 클래스로 사용 가능하다.

---

## 1. 색상 팔레트

**소스**: `lib/design-system/colors.ts`

### 1.1 배경 (Background)

| 토큰 | 값 | Tailwind 클래스 | 용도 |
|------|-----|----------------|------|
| `background.primary` | `#E8DFD0` | `bg-ds-bg-primary` | 메인 배경 (빈티지 베이지) |
| `background.secondary` | `#D4C5B0` | `bg-ds-bg-secondary` | 서브 배경 |
| `background.card` | `#F5F1E8` | `bg-ds-bg-card` | 카드 배경 (오래된 종이색) |
| `background.elevated` | `#FAF6EE` | `bg-ds-bg-elevated` | 부유 배경 |

### 1.2 강조 (Accent)

| 토큰 | 값 | Tailwind 클래스 | 용도 |
|------|-----|----------------|------|
| `accent.primary` | `#A0725B` | `text-ds-accent-primary` | 메인 강조 (브라운) |
| `accent.secondary` | `#C9A88A` | `text-ds-accent-secondary` | 보조 강조 |
| `accent.tertiary` | `#8B7AA8` | `text-ds-accent-tertiary` | 3차 강조 (라벤더) |
| `accent.hover` | `#8B5E47` | `hover:text-ds-accent-hover` | hover 상태 |

### 1.3 파스텔 장식 (Pastel)

마스킹 테이프, 태그 등 장식 요소에 사용:

| 토큰 | 값 | Tailwind 클래스 |
|------|-----|----------------|
| `pastel.mint` | `#C8D6C0` | `bg-ds-pastel-mint` |
| `pastel.coral` | `#E8C4B8` | `bg-ds-pastel-coral` |
| `pastel.yellow` | `#F0DCAE` | `bg-ds-pastel-yellow` |
| `pastel.lavender` | `#D8CDE0` | `bg-ds-pastel-lavender` |
| `pastel.pink` | `#E8C8CF` | `bg-ds-pastel-pink` |
| `pastel.peach` | `#F0DAC8` | `bg-ds-pastel-peach` |

### 1.4 텍스트 (Text)

| 토큰 | 값 | Tailwind 클래스 | 용도 |
|------|-----|----------------|------|
| `text.primary` | `#4A3728` | `text-ds-text-primary` | 메인 텍스트 (다크 브라운) |
| `text.secondary` | `#75604E` | `text-ds-text-secondary` | 보조 텍스트 |
| `text.muted` | `#A08A76` | `text-ds-text-muted` | 비활성 텍스트 |
| `text.inverse` | `#FFFFFF` | `text-ds-text-inverse` | 어두운 배경용 |

### 1.5 시맨틱 (Semantic)

| 토큰 | 값 | Tailwind 클래스 | 용도 |
|------|-----|----------------|------|
| `semantic.success` | `#7BAE7F` | `text-ds-semantic-success` | 성공 |
| `semantic.warning` | `#E8B86D` | `text-ds-semantic-warning` | 경고 |
| `semantic.error` | `#D97777` | `text-ds-semantic-error` | 에러 |
| `semantic.info` | `#8B9DC3` | `text-ds-semantic-info` | 정보 |

### 1.6 일기 상태 (Diary Status)

| 토큰 | 값 | Tailwind 클래스 | 용도 |
|------|-----|----------------|------|
| `diary.pending` | `#FFE8A3` | `bg-ds-diary-pending` | 작성 중 (옐로우) |
| `diary.corrected` | `#B8E6D5` | `bg-ds-diary-corrected` | 교정 완료 (민트) |
| `diary.saved` | `#D4C5F9` | `bg-ds-diary-saved` | 저장됨 (라벤더) |

### 1.7 테두리 / 그림자

```typescript
border: {
  light: "#E8DFD0",
  medium: "#D4C5B8",
  dark: "#B8A89A",
}

shadow: {
  soft: "rgba(61, 46, 31, 0.08)",
  medium: "rgba(61, 46, 31, 0.12)",
  strong: "rgba(61, 46, 31, 0.16)",
}
```

---

## 2. 타이포그래피

**소스**: `lib/design-system/typography.ts`

### 2.1 폰트 패밀리

| 토큰 | 폰트 | Tailwind 클래스 | 용도 |
|------|------|----------------|------|
| `handwriting` | Caveat, Nanum Pen Script | `font-handwriting` | 타이틀, 헤딩 (손글씨) |
| `sans` | Inter, Pretendard | `font-sans` | 본문 텍스트 |
| `rounded` | Pretendard, Apple SD Gothic Neo | `font-rounded` | 한글 강조 |
| `mono` | JetBrains Mono, Fira Code | `font-mono` | 코드 표시 |

### 2.2 폰트 사이즈

| 토큰 | 크기 | 행간 |
|------|------|------|
| `xs` | 0.75rem (12px) | 1rem |
| `sm` | 0.875rem (14px) | 1.25rem |
| `base` | 1rem (16px) | 1.5rem |
| `lg` | 1.125rem (18px) | 1.75rem |
| `xl` | 1.25rem (20px) | 1.75rem |
| `2xl` | 1.5rem (24px) | 2rem |
| `3xl` | 1.875rem (30px) | 2.25rem |
| `4xl` | 2.25rem (36px) | 2.5rem |

### 2.3 프리셋

| 프리셋 | 폰트 | 사이즈 | 웨이트 | 용도 |
|--------|------|--------|--------|------|
| `h1` | Handwriting | 4xl | Bold | 페이지 대제목 |
| `h2` | Handwriting | 3xl | Bold | 섹션 제목 |
| `h3` | Sans | 2xl | Semibold | 소제목 |
| `h4` | Sans | xl | Semibold | 서브 소제목 |
| `body` | Sans | base | Normal | 본문 |
| `bodyLarge` | Sans | lg | Normal | 큰 본문 |
| `bodySmall` | Sans | sm | Normal | 작은 본문 |
| `caption` | Sans | xs | Normal | 캡션 |
| `label` | Sans | sm | Medium | 라벨 |

### 2.4 글로벌 스타일

`app/globals.css`에서 `h1`, `h2`에 자동으로 손글씨 폰트 적용:

```css
h1, h2 {
  @apply font-handwriting;
}
```

---

## 3. 디자인 토큰

**소스**: `lib/design-system/tokens.ts`

### 3.1 스페이싱

| 토큰 | 값 |
|------|-----|
| 0 | 0px |
| 1 | 4px |
| 2 | 8px |
| 3 | 12px |
| 4 | 16px |
| 6 | 24px |
| 8 | 32px |
| 12 | 48px |
| 16 | 64px |

### 3.2 보더 라디우스

| 토큰 | 값 | 용도 |
|------|-----|------|
| `sm` | 8px | 버튼, 태그 |
| `md` | 12px | 카드, 입력 필드 |
| `lg` | 16px | 메인 카드 |
| `xl` | 20px | 큰 요소 |
| `2xl` | 24px | 특별한 요소 |
| `full` | 9999px | 원형 (아바타, 날짜 버튼) |

### 3.3 그림자

| 토큰 | 용도 |
|------|------|
| `sm` | 미세한 깊이감 |
| `DEFAULT` | 기본 요소 |
| `md` | 중간 깊이 |
| `lg` | 카드 호버 |
| `card` | 카드 기본 그림자 |
| `elevated` | 부유 카드 |
| `floating` | 모달, 드롭다운 |

### 3.4 트랜지션

| 토큰 | 시간 | 용도 |
|------|------|------|
| `fast` | 150ms | 호버, 포커스 |
| `base` | 200ms | 기본 애니메이션 |
| `slow` | 300ms | 모달, 패널 |
| `slower` | 500ms | 페이지 전환 |

### 3.5 Z-Index 레이어

| 토큰 | 값 | 용도 |
|------|-----|------|
| `base` | 0 | 기본 |
| `dropdown` | 1000 | 드롭다운 |
| `sticky` | 1100 | 고정 헤더 |
| `fixed` | 1200 | 고정 요소 |
| `overlay` | 1300 | 오버레이 |
| `modal` | 1400 | 모달 |
| `popover` | 1500 | 팝오버 |
| `tooltip` | 1600 | 툴팁 |

### 3.6 브레이크포인트

| 토큰 | 값 | 용도 |
|------|-----|------|
| `xs` | 475px | 소형 모바일 (커스텀) |
| `sm` | 640px | 모바일 |
| `md` | 768px | 태블릿 |
| `lg` | 1024px | 데스크탑 |
| `xl` | 1280px | 대형 데스크탑 |

---

## 4. Tailwind 통합

**소스**: `tailwind.config.ts`

### 색상 네임스페이스

디자인 시스템 색상은 `ds-` 접두사로 구분:

```typescript
// Shadcn UI 색상 (CSS 변수 기반)
background: "hsl(var(--background))"
primary: "hsl(var(--primary))"

// 디자인 시스템 색상 (직접 정의)
"ds-bg": colors.background
"ds-accent": colors.accent
"ds-pastel": colors.pastel
```

### 사용 예시

```tsx
// Shadcn UI 색상 (컴포넌트 기본)
<Card className="bg-card text-card-foreground" />

// 디자인 시스템 색상 (도메인 스타일)
<div className="bg-ds-bg-primary text-ds-text-primary" />
<span className="bg-ds-pastel-mint" />
<p className="text-ds-semantic-error" />
```

### 다크 모드

`class` 전략으로 다크 모드 지원:

```css
/* Light (기본) */
:root {
  --background: 35 28% 88%;     /* 빈티지 베이지 */
  --primary: 20 29% 49%;        /* 브라운 */
}

/* Dark */
.dark {
  --background: 25 36% 12%;     /* 다크 브라운 */
  --primary: 25 27% 59%;        /* 밝은 브라운 */
}
```

---

## 5. 커스텀 CSS 클래스

**소스**: `app/globals.css`

### 빈티지 스크랩북 효과

| 클래스 | 효과 |
|--------|------|
| `.card-diary` | 일기 카드 (배경 + 둥근 모서리 + 그림자 + 테두리) |
| `.card-elevated` | 부유 카드 (큰 그림자) |
| `.torn-paper` | 찢어진 종이 효과 (그라데이션 + 그림자 + 가장자리) |
| `.masking-tape` | 마스킹 테이프 장식 (사선 무늬 오버레이) |
| `.notebook-lines` | 노트 줄무늬 배경 |
| `.vintage-bg` | 빈티지 그라데이션 배경 |
| `.pin-decoration` | 핀/클립 장식 |

### iOS Safe Area

```html
<div className="safe-top safe-bottom">
  <!-- iOS 노치/하단 영역 자동 패딩 -->
</div>
```

### 터치 최적화

```html
<button className="touch-manipulation">
  <!-- 터치 딜레이 제거, 하이라이트 제거 -->
</button>
```

---

## 6. Shadcn UI 컴포넌트

**설정**: `components.json`

### 설치된 컴포넌트

| 컴포넌트 | 경로 | 용도 |
|----------|------|------|
| Button | `components/ui/button.tsx` | 버튼 (variant: default, outline, ghost 등) |
| Card | `components/ui/card.tsx` | 카드 컨테이너 |
| Dialog | `components/ui/dialog.tsx` | 모달 다이얼로그 |
| DropdownMenu | `components/ui/dropdown-menu.tsx` | 드롭다운 메뉴 |
| Progress | `components/ui/progress.tsx` | 프로그레스 바 |
| ScrollArea | `components/ui/scroll-area.tsx` | 스크롤 영역 |
| Select | `components/ui/select.tsx` | 셀렉트 박스 |
| Toast | `components/ui/toast.tsx` | 토스트 알림 |
| Badge | `components/ui/badge.tsx` | 배지/태그 |
| Avatar | `components/ui/avatar.tsx` | 프로필 아바타 |

### 새 컴포넌트 추가

```bash
npx shadcn@latest add <component-name>
```

### cn() 유틸리티

모든 클래스 병합에 `cn()` 사용:

```typescript
import { cn } from "@/lib/utils";

// clsx + tailwind-merge 조합
cn("px-4 py-2", isActive && "bg-primary", className)
```

---

## 7. 아이콘

**라이브러리**: `lucide-react`

```typescript
import { PenLine, Flame, Calendar, BookOpen, Shield } from "lucide-react";

<PenLine className="h-4 w-4" />
<Flame className="h-5 w-5 text-ds-semantic-warning" />
```

---

## 8. 반응형 디자인

### 모바일 퍼스트 접근

기본 스타일은 모바일, 브레이크포인트로 확장:

```tsx
<div className="p-4 sm:p-6 lg:p-8">
  <h1 className="text-2xl sm:text-3xl lg:text-4xl">Title</h1>
</div>
```

### 터치 타겟

Apple HIG 기준 44pt 최소 터치 영역:

```tsx
<button className="min-h-[44px] min-w-[44px] touch-manipulation">
  Touch Target
</button>
```

### 구글 폰트 로드

`globals.css`에서 import:

```css
@import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400;500;600;700&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
```
