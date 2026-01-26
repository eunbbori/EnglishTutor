/**
 * Design System - Design Tokens
 *
 * Spacing, Border Radius, Shadows, etc.
 */

export const spacing = {
  0: "0px",
  1: "4px",
  2: "8px",
  3: "12px",
  4: "16px",
  5: "20px",
  6: "24px",
  7: "28px",
  8: "32px",
  10: "40px",
  12: "48px",
  16: "64px",
  20: "80px",
  24: "96px",
  32: "128px",
} as const;

export const borderRadius = {
  none: "0px",
  sm: "8px",      // 작은 요소 (버튼, 태그)
  md: "12px",     // 중간 요소 (카드, 입력 필드)
  lg: "16px",     // 큰 요소 (메인 카드)
  xl: "20px",     // 매우 큰 요소
  "2xl": "24px",  // 특별한 요소
  full: "9999px", // 원형 (날짜 버튼, 아바타)
} as const;

export const boxShadow = {
  // 부드러운 그림자 시스템
  none: "none",
  sm: "0 1px 2px 0 rgba(61, 46, 31, 0.05)",
  DEFAULT: "0 2px 4px 0 rgba(61, 46, 31, 0.08), 0 1px 2px 0 rgba(61, 46, 31, 0.04)",
  md: "0 4px 6px -1px rgba(61, 46, 31, 0.1), 0 2px 4px -1px rgba(61, 46, 31, 0.06)",
  lg: "0 10px 15px -3px rgba(61, 46, 31, 0.1), 0 4px 6px -2px rgba(61, 46, 31, 0.05)",
  xl: "0 20px 25px -5px rgba(61, 46, 31, 0.1), 0 10px 10px -5px rgba(61, 46, 31, 0.04)",
  "2xl": "0 25px 50px -12px rgba(61, 46, 31, 0.25)",
  inner: "inset 0 2px 4px 0 rgba(61, 46, 31, 0.06)",

  // 특수 그림자 (카드, 하이라이트)
  card: "0 2px 8px 0 rgba(61, 46, 31, 0.08), 0 1px 3px 0 rgba(61, 46, 31, 0.04)",
  elevated: "0 4px 12px 0 rgba(61, 46, 31, 0.12), 0 2px 6px 0 rgba(61, 46, 31, 0.06)",
  floating: "0 8px 24px 0 rgba(61, 46, 31, 0.16), 0 4px 12px 0 rgba(61, 46, 31, 0.08)",
} as const;

export const transition = {
  fast: "150ms cubic-bezier(0.4, 0, 0.2, 1)",
  base: "200ms cubic-bezier(0.4, 0, 0.2, 1)",
  slow: "300ms cubic-bezier(0.4, 0, 0.2, 1)",
  slower: "500ms cubic-bezier(0.4, 0, 0.2, 1)",
} as const;

export const zIndex = {
  base: 0,
  dropdown: 1000,
  sticky: 1100,
  fixed: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  tooltip: 1600,
} as const;

// Breakpoints (Tailwind default와 동일하게 유지)
export const breakpoints = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
} as const;

// Animation durations
export const duration = {
  instant: "0ms",
  fast: "150ms",
  base: "200ms",
  slow: "300ms",
  slower: "500ms",
  slowest: "700ms",
} as const;

// Opacity values
export const opacity = {
  0: "0",
  5: "0.05",
  10: "0.1",
  20: "0.2",
  30: "0.3",
  40: "0.4",
  50: "0.5",
  60: "0.6",
  70: "0.7",
  80: "0.8",
  90: "0.9",
  95: "0.95",
  100: "1",
} as const;
