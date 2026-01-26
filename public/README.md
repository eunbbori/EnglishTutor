# Public Assets

이 폴더는 정적 파일(이미지, 아이콘, 폰트 등)을 저장하는 곳입니다.

## 폴더 구조

### `/images`
일반 이미지 파일 (JPG, PNG, WebP 등)
- 예: 로고, 배경 이미지, 일러스트레이션

### `/icons`
아이콘 파일 (SVG, PNG)
- 예: favicon, app icons, UI 아이콘

### `/assets`
기타 정적 자산
- 예: 폰트 파일, 문서, JSON 데이터

## 사용 방법

Next.js는 `public` 폴더의 파일을 루트(`/`)에서 제공합니다.

### 예시
```tsx
// public/images/logo.png 파일의 경우
<img src="/images/logo.png" alt="Logo" />

// public/icons/star.svg 파일의 경우
<img src="/icons/star.svg" alt="Star" />
```

## 주의사항
- 파일명은 영문과 숫자, 하이픈(-)만 사용하는 것을 권장합니다
- 이미지 최적화를 위해 Next.js의 `Image` 컴포넌트 사용을 권장합니다
- 대용량 파일은 외부 CDN 사용을 고려하세요
