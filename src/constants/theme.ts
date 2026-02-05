/**
 * Dual Theme Configuration
 * Light Mode: "Glacial Breeze" (Mint/Ice + Teal)
 * Dark Mode: "Midnight Teal" (Dark Slate + Teal)
 */

import { Platform } from "react-native";

// --- LIGHT THEME (Glacial Breeze) ---
const lightPalette = {
  // Backgrounds
  background: "#F0FDFA", // Ice/Mint 50
  surface: "#FFFFFF", // Pure White
  surfaceHighlight: "#E0F2FE", // Sky 100
  surfaceActive: "#CCFBF1", // Teal 100

  // Text
  text: "#0F172A", // Slate 900
  textSecondary: "#475569", // Slate 600

  // Brand
  primary: "#0D9488", // Teal 600
  secondary: "#0284C7", // Sky 600
  accent: "#6366F1", // Indigo 500

  // Functional
  success: "#059669", // Emerald 600
  error: "#DC2626", // Red 600
  warning: "#D97706", // Amber 600
  grey: "#94A3B8", // Slate 400
  border: "#E2E8F0", // Slate 200

  gradients: {
    primary: ["#0D9488", "#115E59"] as const,
    success: ["#34D399", "#10B981"] as const,
    error: ["#F87171", "#EF4444"] as const,
  },
};

// --- DARK THEME (Midnight Teal) ---
const darkPalette = {
  // Backgrounds
  background: "#0F172A", // Slate 900 - Deep Blue/Grey
  surface: "#1E293B", // Slate 800 - Lighter Blue/Grey
  surfaceHighlight: "#334155", // Slate 700
  surfaceActive: "#1E293B", // Slate 800

  // Text
  text: "#F1F5F9", // Slate 100 - White-ish
  textSecondary: "#94A3B8", // Slate 400 - Light Grey

  // Brand (Adjusted for Dark Mode contrast)
  primary: "#2DD4BF", // Teal 400 - Brighter/Lighter Teal
  secondary: "#38BDF8", // Sky 400 - Brighter Sky
  accent: "#818CF8", // Indigo 400

  // Functional
  success: "#34D399", // Emerald 400
  error: "#F87171", // Red 400
  warning: "#FBBF24", // Amber 400
  grey: "#64748B", // Slate 500
  border: "#334155", // Slate 700

  gradients: {
    primary: ["#2DD4BF", "#0D9488"] as const, // Lighter to Darker Teal
    success: ["#34D399", "#10B981"] as const,
    error: ["#F87171", "#EF4444"] as const,
  },
};

export const Colors = {
  light: {
    text: lightPalette.text,
    textSecondary: lightPalette.textSecondary,
    background: lightPalette.background,
    surface: lightPalette.surface,
    surfaceHighlight: lightPalette.surfaceHighlight,
    surfaceActive: lightPalette.surfaceActive,
    tint: lightPalette.primary,
    icon: lightPalette.textSecondary,
    tabIconDefault: lightPalette.grey,
    tabIconSelected: lightPalette.primary,
    border: lightPalette.border,
    primary: lightPalette.primary,
    secondary: lightPalette.secondary,
    accent: lightPalette.accent,
    error: lightPalette.error,
    success: lightPalette.success,
    gradients: lightPalette.gradients,
  },
  dark: {
    text: darkPalette.text,
    textSecondary: darkPalette.textSecondary,
    background: darkPalette.background,
    surface: darkPalette.surface,
    surfaceHighlight: darkPalette.surfaceHighlight,
    surfaceActive: darkPalette.surfaceActive,
    tint: darkPalette.primary,
    icon: darkPalette.textSecondary,
    tabIconDefault: darkPalette.grey,
    tabIconSelected: darkPalette.primary,
    border: darkPalette.border,
    primary: darkPalette.primary,
    secondary: darkPalette.secondary,
    accent: darkPalette.accent,
    error: darkPalette.error,
    success: darkPalette.success,
    gradients: darkPalette.gradients,
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
