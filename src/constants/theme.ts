/**
 * Premium Slate Theme Palette
 * A sophisticated dark theme using deep slate greys and vibrant indigo accents.
 * Designed to reduce visual noise while maintaining high readability.
 */

import { Platform } from "react-native";

const palette = {
  // Brand Colors
  primary: "#6366F1", // Indigo 500 - Sophisticated, vibrant but not harsh
  secondary: "#8B5CF6", // Violet 500 - Elegant secondary
  accent: "#EC4899", // Pink 500 - Playful accent for highlights

  // Backgrounds - Using Slate scale for a premium feel
  backgroundLight: "#F8FAFC", // Slate 50
  backgroundDark: "#020617", // Slate 950 - Rich, deep dark (almost black)

  // Surfaces
  surfaceLight: "#FFFFFF",
  surfaceDark: "#0F172A", // Slate 900 - Dark surface
  surfaceDarkHighlight: "#1E293B", // Slate 800 - Slightly lighter for cards/headers
  surfaceDarkActive: "#334155", // Slate 700 - Active states

  // Text
  textLight: "#0F172A", // Slate 900
  textDark: "#F8FAFC", // Slate 50 - High contrast white/off-white
  textGrey: "#94A3B8", // Slate 400 - Readable muted text

  // Functional Colors - Softened for dark mode
  success: "#34D399", // Emerald 400 - Soft Mint
  error: "#F87171", // Red 400 - Soft Salmon
  warning: "#FBBF24", // Amber 400
  grey: "#64748B", // Slate 500

  // Gradients
  gradients: {
    primary: ["#6366F1", "#4338CA"] as const, // Indigo 500 -> Indigo 700
    success: ["#34D399", "#10B981"] as const, // Emerald 400 -> Emerald 500
    error: ["#F87171", "#EF4444"] as const, // Red 400 -> Red 500
  },
};

export const Colors = {
  light: {
    text: palette.textDark, // Force dark mode look even in light map for consistency
    textSecondary: palette.textGrey,
    background: palette.backgroundDark,
    surface: palette.surfaceDark,
    surfaceHighlight: palette.surfaceDarkHighlight,
    surfaceActive: palette.surfaceDarkActive,
    tint: palette.primary,
    icon: palette.textGrey,
    tabIconDefault: palette.grey,
    tabIconSelected: palette.primary,
    border: "#1E293B", // Slate 800
    primary: palette.primary,
    secondary: palette.secondary,
    accent: palette.accent,
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
    tint: palette.primary,
    icon: palette.textGrey,
    tabIconDefault: palette.grey,
    tabIconSelected: palette.primary,
    border: "#1E293B", // Slate 800
    primary: palette.primary,
    secondary: palette.secondary,
    accent: palette.accent,
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
});
