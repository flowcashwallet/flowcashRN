/**
 * Modern Blue Theme Palette
 */

import { Platform } from "react-native";

const palette = {
  primary: "#003366", // Navy Blue
  secondary: "#007AFF", // Bright Blue
  accent: "#4CC9F0", // Light Blue/Cyan
  backgroundLight: "#F0F4F8", // Very Light Blueish Grey
  backgroundDark: "#0B0D17", // Deep Dark Blue (New Vision)
  surfaceLight: "#FFFFFF",
  surfaceDark: "#1A1D3D", // Dark Card (New Vision)
  surfaceDarkHighlight: "#101223", // Header Card (New Vision)
  surfaceDarkActive: "#2D3456", // Active Tab (New Vision)
  textLight: "#172B4D",
  textDark: "#FFFFFF",
  textGrey: "#A0A0A0",
  success: "#14dc64ff", // Bright Green (New Vision)
  error: "#FF416C", // Bright Pink/Red (New Vision)
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
    text: palette.textDark, // Force white text for dark blue theme
    textSecondary: palette.textGrey,
    background: palette.backgroundDark, // Force dark background
    surface: palette.surfaceDark,
    surfaceHighlight: palette.surfaceDarkHighlight,
    surfaceActive: palette.surfaceDarkActive,
    tint: palette.accent,
    icon: palette.textGrey,
    tabIconDefault: palette.grey,
    tabIconSelected: palette.accent,
    border: "#1E4976", // Dark blue border
    primary: palette.accent, // Lighter blue for better contrast on dark
    secondary: palette.secondary,
    accent: palette.primary,
    error: palette.error,
    success: palette.success,
    gradients: palette.gradients,
  },
  dark: {
    text: palette.textDark,
    textSecondary: palette.textGrey,
    background: palette.backgroundDark,
    surface: palette.surfaceDark,
    surfaceHighlight: palette.surfaceDarkHighlight,
    surfaceActive: palette.surfaceDarkActive,
    tint: palette.accent,
    icon: palette.textGrey,
    tabIconDefault: "#6B7D8C",
    tabIconSelected: palette.accent,
    border: "#1E4976",
    primary: palette.accent, // Lighter blue for dark mode
    secondary: palette.secondary,
    accent: palette.primary,
    error: palette.error,
    success: palette.success,
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
