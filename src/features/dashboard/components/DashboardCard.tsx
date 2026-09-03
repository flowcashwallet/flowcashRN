import { GlassSurface } from "@/components/atoms/GlassSurface";
import { BorderRadius, Spacing } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";
import React from "react";
import { StyleSheet, type StyleProp, type ViewStyle } from "react-native";

interface DashboardCardProps {
  children: React.ReactNode;
  /** Ajustes puntuales de layout (p. ej. apretar el margen inferior). */
  style?: StyleProp<ViewStyle>;
}

/**
 * La superficie de una sección del dashboard.
 *
 * Dashboard es una pila de cards, y desde la ampliación de alcance del
 * 2026-09-02 ("todo componente con superficie propia lleva vidrio en iOS 26+",
 * ver `docs/refactor-plan.md`) cada una de esas cards es una superficie de
 * cristal nativo. Se centraliza aquí en vez de repetir el par
 * `style`/`fallbackStyle` en las siete secciones: el contrato de `GlassSurface`
 * se escribe una vez y el ritmo de la pila (radio, padding, separación) queda
 * en un solo sitio.
 *
 * Sin cristal —Android/web, iOS sin la API, o "reducir transparencia"— la card
 * es `surface` + hairline en `border`, que es la identidad plana de la app.
 * Antes de este pase la card no tenía fondo y su `borderWidth: 1` se pintaba
 * con el negro por defecto de React Native.
 */
export function DashboardCard({ children, style }: DashboardCardProps) {
  const { colors } = useTheme();

  return (
    <GlassSurface
      style={[styles.card, style]}
      fallbackStyle={[
        styles.flatCard,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      {children}
    </GlassSurface>
  );
}

const styles = StyleSheet.create({
  /** Layout de la card, común a la variante con cristal y a la plana. */
  card: {
    borderRadius: BorderRadius.l,
    padding: Spacing.m,
    marginBottom: Spacing.l,
    overflow: "hidden",
  },
  /** Fondo opaco + hairline: solo cuando no hay cristal. */
  flatCard: {
    borderWidth: StyleSheet.hairlineWidth,
  },
});
