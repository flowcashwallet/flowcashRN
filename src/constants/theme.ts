/**
 * Modern Blue Theme Palette
 */

import { Platform } from "react-native";

const palette = {
  primary: "#003366", // Navy Blue
  secondary: "#007AFF", // Bright Blue
  accent: "#4CC9F0", // Light Blue/Cyan
  backgroundLight: "#F0F4F8", // Very Light Blueish Grey
  backgroundDark: "#0A1929", // Very Dark Blue
  surfaceLight: "#FFFFFF",
  surfaceDark: "#132F4C", // Dark Blue Surface
  textLight: "#172B4D",
  textDark: "#E3F2FD",
  success: "#36B37E",
  error: "#FF5630",
  warning: "#FFAB00",
  grey: "#97A0AF",
  gradients: {
    primary: ["#0056D2", "#003366"] as const, // Bright Blue to Navy Blue
    success: ["#00F260", "#0575E6"] as const,
    error: ["#FF416C", "#FF4B2B"] as const,
  },
};

export const Colors = {
  light: {
    text: palette.textLight,
    background: palette.backgroundLight,
    surface: palette.surfaceLight,
    tint: palette.primary,
    icon: palette.grey,
    tabIconDefault: palette.grey,
    tabIconSelected: palette.primary,
    border: "#E1E4E8",
    primary: palette.primary,
    secondary: palette.secondary,
    accent: palette.accent,
    error: palette.error,
    success: palette.success,
    gradients: palette.gradients,
  },
  dark: {
    text: palette.textDark,
    background: palette.backgroundDark,
    surface: palette.surfaceDark,
    tint: palette.accent,
    icon: "#6B7D8C",
    tabIconDefault: "#6B7D8C",
    tabIconSelected: palette.accent,
    border: "#1E4976",
    primary: palette.accent, // Lighter blue for dark mode
    secondary: palette.secondary,
    accent: palette.primary,
    error: "#FF8F73",
    success: "#57D9A3",
    gradients: palette.gradients,
  },
};

export const Spacing = {
  xs: 4,
  s: 8,
  m: 16,
  l: 24,
  xl: 32,
  xxl: 48,
};

export const BorderRadius = {
  s: 4,
  m: 8,
  l: 16,
  xl: 24,
  round: 9999,
};

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
