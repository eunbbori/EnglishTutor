/**
 * Design System - Main Export
 *
 * 디자인 시스템의 모든 토큰을 중앙에서 관리
 */

export { colors } from "./colors";
export type { ColorPalette, ColorCategory } from "./colors";

export { typography, typographyPresets } from "./typography";
export type { TypographyPreset } from "./typography";

export {
  spacing,
  borderRadius,
  boxShadow,
  transition,
  zIndex,
  breakpoints,
  duration,
  opacity,
} from "./tokens";

// Design system as a whole
export const designSystem = {
  colors: require("./colors").colors,
  typography: require("./typography").typography,
  spacing: require("./tokens").spacing,
  borderRadius: require("./tokens").borderRadius,
  boxShadow: require("./tokens").boxShadow,
  transition: require("./tokens").transition,
  zIndex: require("./tokens").zIndex,
  breakpoints: require("./tokens").breakpoints,
  duration: require("./tokens").duration,
  opacity: require("./tokens").opacity,
};
