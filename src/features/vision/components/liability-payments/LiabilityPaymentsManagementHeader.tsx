import { GlassSurface } from "@/components/atoms/GlassSurface";
import { Typography } from "@/components/atoms/Typography";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { BorderRadius, Spacing } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";
import { formatCurrency } from "@/utils/format";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

interface LiabilityPaymentsManagementHeaderProps {
  monthLabel: string;
  summary: { paidCount: number; total: number; totalPaid: number };
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

/**
 * Cabecera de la pantalla de gestión de pagos: navegación de mes y resumen.
 *
 * **Sin título propio a propósito** (retirado 2026-09-02): duplicaba el
 * `headerTitle` nativo ("Gestión de pagos" en `_layout.tsx`) y, al no tener el
 * mismo padding-top que aplica `contentInsetAdjustmentBehavior="automatic"`
 * del scroll sobre un header nativo transparente, terminaba superpuesto con
 * él. Mismo criterio que `DashboardScreen.tsx`, que tampoco repite su propio
 * "Dashboard" en canvas — el `headerTitle` nativo ya cumple ese rol.
 *
 * El bloque de navegación + resumen es una superficie propia, así que lleva
 * Liquid Glass nativo en iOS 26+ vía `GlassSurface` — misma regla que la
 * píldora de `MonthSelector` en `WalletListHeader`. Los dos botones de mes se
 * quedan planos: están dentro de esa superficie y no se apila cristal sobre
 * cristal (lo aplica solo el guard de anidamiento).
 */
export const LiabilityPaymentsManagementHeader: React.FC<
  LiabilityPaymentsManagementHeaderProps
> = ({ monthLabel, summary, onPrevMonth, onNextMonth }) => {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <GlassSurface
        style={styles.panel}
        fallbackStyle={[
          styles.flatPanel,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <View style={styles.monthNav}>
          <TouchableOpacity
            onPress={onPrevMonth}
            style={styles.monthNavButton}
            accessibilityRole="button"
            accessibilityLabel="Mes anterior"
          >
            <IconSymbol name="chevron.left" size={20} color={colors.primary} />
          </TouchableOpacity>

          <Typography variant="subheading">{monthLabel}</Typography>

          <TouchableOpacity
            onPress={onNextMonth}
            style={styles.monthNavButton}
            accessibilityRole="button"
            accessibilityLabel="Mes siguiente"
          >
            <IconSymbol name="chevron.right" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <View style={styles.summary}>
          <View>
            <Typography variant="overline" muted>
              Total pagado
            </Typography>
            <Typography variant="caption" muted>
              {summary.paidCount}/{summary.total} pagados
            </Typography>
          </View>
          <Typography variant="number" style={{ color: colors.success }}>
            {formatCurrency(summary.totalPaid)}
          </Typography>
        </View>
      </GlassSurface>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: Spacing.m,
    paddingBottom: Spacing.s,
  },
  /** Layout del panel, común a la variante con cristal y a la plana. */
  panel: {
    borderRadius: BorderRadius.l,
    padding: Spacing.m,
    overflow: "hidden",
  },
  /** Fondo opaco + hairline: solo cuando no hay cristal. */
  flatPanel: {
    borderWidth: StyleSheet.hairlineWidth,
  },
  monthNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  monthNavButton: {
    padding: Spacing.xs,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: Spacing.sm,
  },
  summary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});
