/**
 * Design System - Color Palette
 *
 * 레퍼런스 디자인을 바탕으로 정의된 색상 시스템
 * 따뜻하고 아날로그적인 일기장 컨셉
 */

export const colors = {
  // Background Colors - Vintage 베이지/브라운 톤 배경 (Refer4_2.png 기준)
  background: {
    primary: "#E8DFD0",    // 메인 배경 (빈티지 베이지)
    secondary: "#D4C5B0",  // 서브 배경 (더 어두운 베이지)
    card: "#F5F1E8",       // 카드 배경 (오래된 종이색)
    elevated: "#FAF6EE",   // 살짝 들린 배경
  },

  // Accent Colors - 강조 색상 (더 따뜻한 브라운 톤)
  accent: {
    primary: "#A0725B",    // 브라운 (메인 강조)
    secondary: "#C9A88A",  // 라이트 브라운 (보조 강조)
    tertiary: "#8B7AA8",   // 라벤더/보라 (3차 강조)
    hover: "#8B5E47",      // Primary accent hover state
  },

  // Pastel Decorations - 마스킹 테이프/장식용 (빈티지 톤)
  pastel: {
    mint: "#C8D6C0",       // 빈티지 민트
    coral: "#E8C4B8",      // 빈티지 코랄
    yellow: "#F0DCAE",     // 빈티지 옐로우
    lavender: "#D8CDE0",   // 빈티지 라벤더
    pink: "#E8C8CF",       // 빈티지 핑크
    peach: "#F0DAC8",      // 빈티지 피치
  },

  // Text Colors - 텍스트 (더 따뜻한 브라운)
  text: {
    primary: "#4A3728",    // 다크 브라운 (메인 텍스트)
    secondary: "#75604E",  // 미디엄 브라운 (보조 텍스트)
    muted: "#A08A76",      // 라이트 브라운 (비활성 텍스트)
    inverse: "#FFFFFF",    // 역전 텍스트 (어두운 배경용)
  },

  // Semantic Colors - 의미론적 색상
  semantic: {
    success: "#7BAE7F",    // 성공 (그린)
    warning: "#E8B86D",    // 경고 (옐로우)
    error: "#D97777",      // 에러 (레드)
    info: "#8B9DC3",       // 정보 (블루)
  },

  // Border Colors - 테두리
  border: {
    light: "#E8DFD0",
    medium: "#D4C5B8",
    dark: "#B8A89A",
  },

  // Shadow Colors - 그림자
  shadow: {
    soft: "rgba(61, 46, 31, 0.08)",    // 부드러운 그림자
    medium: "rgba(61, 46, 31, 0.12)",  // 중간 그림자
    strong: "rgba(61, 46, 31, 0.16)",  // 강한 그림자
  },

  // Diary Status Colors - 일기 상태별 색상
  diary: {
    pending: "#FFE8A3",    // 작성 중 (옐로우)
    corrected: "#B8E6D5",  // 교정 완료 (민트)
    saved: "#D4C5F9",      // 저장됨 (라벤더)
  },
} as const;

// Color type for TypeScript
export type ColorPalette = typeof colors;
export type ColorCategory = keyof ColorPalette;
