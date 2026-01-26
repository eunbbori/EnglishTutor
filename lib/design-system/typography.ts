/**
 * Design System - Typography
 *
 * 폰트 패밀리, 사이즈, 웨이트, 라인 높이 정의
 */

export const typography = {
  // Font Families
  fontFamily: {
    // 손글씨 스타일 - 타이틀/헤딩용
    handwriting: [
      "'Caveat'",
      "'Nanum Pen Script'",
      "cursive",
    ].join(", "),

    // 산세리프 - 본문용
    sans: [
      "'Inter'",
      "'Pretendard'",
      "-apple-system",
      "BlinkMacSystemFont",
      "system-ui",
      "sans-serif",
    ].join(", "),

    // 둥근 고딕 - 한글 강조용
    rounded: [
      "'Pretendard'",
      "'Apple SD Gothic Neo'",
      "sans-serif",
    ].join(", "),

    // 모노스페이스 - 코드용
    mono: [
      "'JetBrains Mono'",
      "'Fira Code'",
      "monospace",
    ].join(", "),
  },

  // Font Sizes - Tailwind 기본 scale 확장
  fontSize: {
    xs: ["0.75rem", { lineHeight: "1rem" }] as [string, { lineHeight: string }],
    sm: ["0.875rem", { lineHeight: "1.25rem" }] as [string, { lineHeight: string }],
    base: ["1rem", { lineHeight: "1.5rem" }] as [string, { lineHeight: string }],
    lg: ["1.125rem", { lineHeight: "1.75rem" }] as [string, { lineHeight: string }],
    xl: ["1.25rem", { lineHeight: "1.75rem" }] as [string, { lineHeight: string }],
    "2xl": ["1.5rem", { lineHeight: "2rem" }] as [string, { lineHeight: string }],
    "3xl": ["1.875rem", { lineHeight: "2.25rem" }] as [string, { lineHeight: string }],
    "4xl": ["2.25rem", { lineHeight: "2.5rem" }] as [string, { lineHeight: string }],
    "5xl": ["3rem", { lineHeight: "1" }] as [string, { lineHeight: string }],
    "6xl": ["3.75rem", { lineHeight: "1" }] as [string, { lineHeight: string }],
  },

  // Font Weights
  fontWeight: {
    light: "300",
    normal: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
    extrabold: "800",
  },

  // Letter Spacing
  letterSpacing: {
    tighter: "-0.05em",
    tight: "-0.025em",
    normal: "0em",
    wide: "0.025em",
    wider: "0.05em",
    widest: "0.1em",
  },

  // Line Heights
  lineHeight: {
    none: "1",
    tight: "1.25",
    snug: "1.375",
    normal: "1.5",
    relaxed: "1.625",
    loose: "2",
  },
} as const;

// Typography presets for common use cases
export const typographyPresets = {
  // Headings
  h1: {
    fontFamily: typography.fontFamily.handwriting,
    fontSize: typography.fontSize["4xl"],
    fontWeight: typography.fontWeight.bold,
    lineHeight: typography.lineHeight.tight,
  },
  h2: {
    fontFamily: typography.fontFamily.handwriting,
    fontSize: typography.fontSize["3xl"],
    fontWeight: typography.fontWeight.bold,
    lineHeight: typography.lineHeight.tight,
  },
  h3: {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize["2xl"],
    fontWeight: typography.fontWeight.semibold,
    lineHeight: typography.lineHeight.snug,
  },
  h4: {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    lineHeight: typography.lineHeight.snug,
  },

  // Body text
  body: {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.normal,
    lineHeight: typography.lineHeight.normal,
  },
  bodyLarge: {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.normal,
    lineHeight: typography.lineHeight.relaxed,
  },
  bodySmall: {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.normal,
    lineHeight: typography.lineHeight.normal,
  },

  // Special
  caption: {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.normal,
    lineHeight: typography.lineHeight.tight,
  },
  label: {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    lineHeight: typography.lineHeight.tight,
  },
} as const;

export type TypographyPreset = keyof typeof typographyPresets;
