# Design System

레퍼런스 디자인을 바탕으로 구축된 Daily English의 디자인 시스템입니다.
따뜻하고 아날로그적인 일기장 컨셉을 반영했습니다.

## 📁 파일 구조

```
lib/design-system/
├── colors.ts      # 색상 팔레트
├── typography.ts  # 타이포그래피 시스템
├── tokens.ts      # 디자인 토큰 (spacing, radius, shadow 등)
├── index.ts       # 통합 export
└── README.md      # 이 파일
```

## 🎨 색상 시스템

### Background Colors
```tsx
import { colors } from '@/lib/design-system'

// 메인 배경
className="bg-ds-bg-primary"        // #F5F1E8 베이지/크림

// 카드 배경
className="bg-ds-bg-card"           // #FFFFFF 화이트

// 서브 배경
className="bg-ds-bg-secondary"      // #E8DFD0 어두운 베이지
```

### Accent Colors
```tsx
// 메인 강조색
className="bg-ds-accent-primary"    // #B8917B 브라운/테라코타
className="text-ds-accent-primary"

// 보조 강조색
className="bg-ds-accent-secondary"  // #D4A88F 라이트 브라운
```

### Pastel Decorations (마스킹 테이프)
```tsx
className="bg-ds-pastel-mint"       // #B8E6D5
className="bg-ds-pastel-coral"      // #F5B5A8
className="bg-ds-pastel-yellow"     // #FFE8A3
className="bg-ds-pastel-lavender"   // #D4C5F9
className="bg-ds-pastel-pink"       // #FFB5C5
```

### Text Colors
```tsx
className="text-ds-text-primary"    // #3D2E1F 다크 브라운
className="text-ds-text-secondary"  // #6B5D4F 미디엄 브라운
className="text-ds-text-muted"      // #9B8B7E 라이트 브라운
```

## ✍️ 타이포그래피

### Font Families
```tsx
className="font-handwriting"  // 손글씨 스타일 (Caveat)
className="font-sans"         // 산세리프 (Inter, Pretendard)
className="font-rounded"      // 둥근 고딕 (Pretendard)
className="font-mono"         // 모노스페이스
```

### Font Sizes
```tsx
className="text-xs"    // 12px
className="text-sm"    // 14px
className="text-base"  // 16px
className="text-lg"    // 18px
className="text-xl"    // 20px
className="text-2xl"   // 24px
className="text-3xl"   // 30px
className="text-4xl"   // 36px
```

### Typography Presets
```tsx
import { typographyPresets } from '@/lib/design-system'

// 사용 예시
<h1 style={typographyPresets.h1}>Title</h1>
<p style={typographyPresets.body}>Body text</p>
```

## 📐 Border Radius

```tsx
className="rounded-sm"    // 8px  - 버튼, 태그
className="rounded-md"    // 12px - 카드, 입력 필드
className="rounded-lg"    // 16px - 메인 카드
className="rounded-xl"    // 20px - 큰 요소
className="rounded-2xl"   // 24px - 특별한 요소
className="rounded-full"  // 9999px - 원형 버튼
```

## 🌊 Shadows

```tsx
className="shadow-card"      // 카드 그림자
className="shadow-elevated"  // 들린 요소
className="shadow-floating"  // 떠있는 요소
className="shadow-sm"        // 작은 그림자
className="shadow"           // 기본 그림자
className="shadow-md"        // 중간 그림자
className="shadow-lg"        // 큰 그림자
```

## 🎯 유틸리티 클래스

### 마스킹 테이프 스타일
```tsx
<div className="masking-tape bg-ds-pastel-mint">
  마스킹 테이프 효과
</div>
```

### 카드 스타일
```tsx
<div className="card-diary">일기 카드</div>
<div className="card-elevated">들린 카드</div>
```

### 노트 스타일
```tsx
<div className="notebook-lines p-4">
  줄무늬 노트 배경
</div>
```

### 핀 장식
```tsx
<div className="pin-decoration">
  상단에 핀이 달린 요소
</div>
```

## 🔧 Tailwind Config 사용

`tailwind.config.ts`에서 디자인 시스템 토큰을 가져와 사용합니다.

```typescript
import { colors } from './lib/design-system/colors'
import { typography } from './lib/design-system/typography'
import { borderRadius, boxShadow } from './lib/design-system/tokens'

// Tailwind theme에서 사용 가능
```

## 💡 사용 예시

### 일기 카드 컴포넌트
```tsx
<div className="card-diary space-y-4">
  <div className="masking-tape bg-ds-pastel-yellow w-24">
    24 Jan
  </div>
  <h2 className="font-handwriting text-3xl text-ds-text-primary">
    Today's Diary
  </h2>
  <p className="text-ds-text-secondary leading-relaxed">
    Lorem ipsum dolor sit amet...
  </p>
</div>
```

### 버튼 컴포넌트
```tsx
<button className="
  bg-ds-accent-primary hover:bg-ds-accent-hover
  text-white
  px-6 py-3
  rounded-full
  shadow-card hover:shadow-elevated
  transition-smooth
">
  저장하기
</button>
```

## 📝 노트

- Shadcn UI 컴포넌트와 호환성 유지
- CSS 변수(`--primary`, `--background` 등)는 기존 Shadcn UI 사용
- 새로운 디자인은 `ds-*` 접두사 사용
- 다크모드 지원 (`.dark` 클래스)

## 🎨 레퍼런스 이미지

디자인 레퍼런스는 `public/images/` 폴더에 있습니다:
- `Refer1.png` - 캘린더 뷰
- `Refer2.png` - 일기 목록
- `Refer3.png` - 일기 작성
