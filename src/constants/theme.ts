/**
 * Dual Theme Configuration
 * Light Mode: "Glacial Breeze" (Mint/Ice + Teal)
 * Dark Mode: "Midnight Teal" (Dark Slate + Teal)
 */

// --- LIGHT THEME (Glacial Breeze) ---
const lightPalette = {
  // Backgrounds
  background: "#f7f5fa", // Ice/Mint 50
  surface: "#FFFFFF", // Pure White
  surfaceHighlight: "#E0F2FE", // Sky 100
  surfaceActive: "#CCFBF1", // Teal 100

  // Text
  text: "#0F172A", // Slate 900
  textSecondary: "#475569", // Slate 600

  // Brand
  primary: "#78cf6c", // Teal 600
  secondary: "#0233c7", // Sky 600
  accent: "#6366F1", // Indigo 500

  /**
   * Contenido (texto, icono, pulgar de switch) sobre un relleno `primary`.
   * Codifica el aviso de contraste de la dirección estética: en claro `primary`
   * es un verde claro y el blanco da ~2:1, así que el contenido va oscuro.
   */
  onPrimary: "#0F172A", // = text (Slate 900)

  // Functional
  success: "#059669", // Emerald 600
  error: "#DC2626", // Red 600
  warning: "#D97706", // Amber 600
  /**
   * Color de gasto/débito — distinto de `error`. Rojo por tradición contable
   * (tinta roja para débitos), pero desaturado: comunica "sale dinero", no
   * "algo salió mal". `error` sigue siendo exclusivo de sobregiro/vencido/fallo.
   */
  expense: "#9F1239", // Rose 800
  grey: "#94A3B8", // Slate 400
  border: "#86898dff", // Slate 200
};

// --- DARK THEME (Midnight Teal) ---
const darkPalette = {
  // Backgrounds
  background: "#050910ff", // Slate 900 - Deep Blue/Grey
  surface: "#1E293B", // Slate 800 - Lighter Blue/Grey
  surfaceHighlight: "#334155", // Slate 700
  surfaceActive: "#1E293B", // Slate 800

  // Text
  text: "#F1F5F9", // Slate 100 - White-ish
  textSecondary: "#94A3B8", // Slate 400 - Light Grey

  // Brand (Adjusted for Dark Mode contrast)
  primary: "#0D9488", // Teal 400 - Brighter/Lighter Teal
  secondary: "#38BDF8", // Sky 400 - Brighter Sky
  accent: "#818CF8", // Indigo 400

  /** Contenido sobre un relleno `primary`. En oscuro el teal sí admite blanco. */
  onPrimary: "#FFFFFF",

  // Functional
  success: "#34D399", // Emerald 400
  error: "#F87171", // Red 400
  warning: "#FBBF24", // Amber 400
  expense: "#FB7185", // Rose 400
  grey: "#64748B", // Slate 500
  border: "#334155", // Slate 700
};

/**
 * Nota de dirección estética (ver `docs/refactor-plan.md`):
 * `glass.*` y `gradients.*` — el vidrio *falso* (`rgba(...)` cross-platform,
 * distinto del Liquid Glass nativo de `GlassSurface`) — quedaron deprecados y,
 * al cerrar el pase visual de Budget (2026-09-03, su último consumidor real,
 * `BudgetDashboard`), **eliminados por completo** de la paleta. No reintroducir.
 */
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
    onPrimary: lightPalette.onPrimary,
    secondary: lightPalette.secondary,
    accent: lightPalette.accent,
    error: lightPalette.error,
    warning: lightPalette.warning,
    success: lightPalette.success,
    expense: lightPalette.expense,
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
    onPrimary: darkPalette.onPrimary,
    secondary: darkPalette.secondary,
    accent: darkPalette.accent,
    error: darkPalette.error,
    warning: darkPalette.warning,
    success: darkPalette.success,
    expense: darkPalette.expense,
  },
};
export type ThemeColors = typeof Colors.light | typeof Colors.dark;

/**
 * Spacing — 4pt base rhythm.
 * See "Dirección estética" in `docs/refactor-plan.md` for where each step is used.
 * `sm` (12) is the list-row step: it sits between `s` (8) and `m` (16).
 */
export const Spacing = {
  xs: 4,
  s: 8,
  sm: 12,
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

/**
 * Typography scale — system font, 4pt line-height grid.
 *
 * Roles (see `docs/refactor-plan.md` → Dirección estética):
 *   display     cifra protagonista de la pantalla (saldo del mes, total)
 *   title       título de pantalla
 *   heading     título de sección
 *   subheading  título de card / fila destacada
 *   body        texto por defecto
 *   bodySmall   texto secundario denso
 *   caption     metadatos, fechas, ayudas
 *   overline    etiqueta de sección en versalitas
 *   button      label de acción (sentence case, nunca uppercase)
 *   number      cifra en tabla/lista, dígitos tabulares y alineados a la derecha
 *
 * `h1`/`h2`/`h3` se mantienen como alias de `title`/`heading`/`subheading` para
 * los ~63 usos existentes; no usar en código nuevo.
 */
export const TypographyScale = {
  display: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "700",
    letterSpacing: -0.4,
  },
  title: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  heading: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  subheading: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "600",
    letterSpacing: -0.1,
  },
  body: { fontSize: 16, lineHeight: 24, fontWeight: "400", letterSpacing: 0 },
  bodySmall: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "400",
    letterSpacing: 0,
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "400",
    letterSpacing: 0.1,
  },
  overline: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "600",
    letterSpacing: 0.8,
  },
  button: { fontSize: 16, lineHeight: 24, fontWeight: "600", letterSpacing: 0 },
  number: { fontSize: 16, lineHeight: 24, fontWeight: "600", letterSpacing: 0 },
} as const;

export type TypographyVariant = keyof typeof TypographyScale;

/** Font weights — usar estos, no literales sueltos. */
export const FontWeight = {
  regular: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
} as const;

/**
 * Motion — solo tres duraciones en toda la app.
 * `fast` feedback de press, `enter` entrada de sheets/modales, `exit` salida.
 */
export const Motion = {
  fast: 120,
  exit: 180,
  enter: 220,
} as const;

/** Opacidad del backdrop de sheets/modales, sobre negro. */
export const BackdropOpacity = 0.45;
