import { GlassSurface } from "@/components/atoms/GlassSurface";
import { Typography } from "@/components/atoms/Typography";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { BorderRadius, Spacing, ThemeColors } from "@/constants/theme";
import React from "react";
import { StyleSheet } from "react-native";

interface AuthErrorBannerProps {
  error: string | null;
  colors: ThemeColors;
}

/** Ancho del acento de estado del borde izquierdo — mismo criterio con nombre que `ForecastCard.tsx`. */
const STATUS_ACCENT_WIDTH = 3;

/**
 * Real error state (login/register failure). Used to hardcode `#FFEBEE` as
 * its background — flagged since the very start of the refactor plan (see
 * `docs/refactor-plan.md`). That literal is gone; the card now reads the
 * theme's `error` token, the one reserved for a real failure (not a normal
 * expense — see the palette's sign rule).
 *
 * It's a card, not a list row, so it gets the same `GlassSurface` treatment
 * as the rest of the app's card-like surfaces (cristal nativo en iOS 26+,
 * `surface` + hairline sin él). Per the palette rules `error` colors what's
 * actually wrong — the accent (left border, icon, text, glass tint) — not
 * the fill: the fill stays `colors.surface`, same as every other card.
 */
export function AuthErrorBanner({ error, colors }: AuthErrorBannerProps) {
  if (!error) return null;

  return (
    <GlassSurface
      style={[styles.container, { borderLeftColor: colors.error }]}
      fallbackStyle={[
        styles.flatContainer,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
      tintColor={colors.error}
    >
      <IconSymbol
        name="exclamationmark.triangle.fill"
        size={16}
        color={colors.error}
      />
      <Typography
        variant="bodySmall"
        style={[styles.errorText, { color: colors.error }]}
      >
        {error}
      </Typography>
    </GlassSurface>
  );
}

const styles = StyleSheet.create({
  /** Layout de la card, común a la variante con cristal y a la plana. */
  container: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.s,
    width: "100%",
    padding: Spacing.sm,
    marginBottom: Spacing.m,
    borderRadius: BorderRadius.m,
    borderLeftWidth: STATUS_ACCENT_WIDTH,
    overflow: "hidden",
  },
  /** Fondo opaco + hairline: solo cuando no hay cristal. */
  flatContainer: {
    borderWidth: StyleSheet.hairlineWidth,
  },
  errorText: {
    flex: 1,
  },
});
