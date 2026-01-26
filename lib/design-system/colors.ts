/**
 * Design System - Color Palette
 *
 * 레퍼런스 디자인을 바탕으로 정의된 색상 시스템
 * 따뜻하고 아날로그적인 일기장 컨셉
 */

export const colors = {
  // Background Colors - 베이지/크림 톤 배경
  background: {
    primary: "#F5F1E8",    // 메인 배경 (베이지/크림)
    secondary: "#E8DFD0",  // 서브 배경 (더 어두운 베이지)
    card: "#FFFFFF",       // 카드 배경 (화이트)
    elevated: "#FDFBF7",   // 살짝 들린 배경
  },

  // Accent Colors - 강조 색상
  accent: {
    primary: "#B8917B",    // 브라운/테라코타 (메인 강조)
    secondary: "#D4A88F",  // 라이트 브라운 (보조 강조)
    tertiary: "#8B7AA8",   // 라벤더/보라 (3차 강조)
    hover: "#A67D67",      // Primary accent hover state
  },

  // Pastel Decorations - 마스킹 테이프/장식용
  pastel: {
    mint: "#B8E6D5",
    coral: "#F5B5A8",
    yellow: "#FFE8A3",
    lavender: "#D4C5F9",
    pink: "#FFB5C5",
    peach: "#FFDAB9",
  },

  // Text Colors - 텍스트
  text: {
    primary: "#3D2E1F",    // 다크 브라운 (메인 텍스트)
    secondary: "#6B5D4F",  // 미디엄 브라운 (보조 텍스트)
    muted: "#9B8B7E",      // 라이트 브라운 (비활성 텍스트)
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
