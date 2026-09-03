import { GlassSurface } from "@/components/atoms/GlassSurface";
import { Typography } from "@/components/atoms/Typography";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { BorderRadius, Spacing } from "@/constants/theme";
import STRINGS from "@/i18n/es.json";
import { formatCurrency } from "@/utils/format";
import React from "react";
import { StyleSheet, View } from "react-native";
import { DashboardCard } from "./DashboardCard";
import { DashboardColors } from "./types";

interface BalanceOverviewSectionProps {
  colors: DashboardColors;
  periodView: "month" | "year";
  income: number;
  expense: number;
  balance: number;
  savings: number;
}

interface BalanceOverviewPill {
  key: string;
  label: string;
  amount: number;
  accent: string;
  icon: "arrow.down.left" | "arrow.up.right" | "banknote.fill";
}

/**
 * La cifra protagonista de la pantalla y sus tres desgloses.
 *
 * El saldo va en `variant="display"` porque es *la* cifra que responde "¿cómo
 * voy?"; los tres importes de abajo en `variant="number"` (tabulares, a la
 * derecha) para que la columna cuadre. El saldo negativo se pinta en `expense`,
 * no en `error`: un mes en rojo contable no es un fallo — mismo criterio que el
 * saldo del día de `TransactionList`.
 *
 * La card y cada píldora son superficies propias y hermanas entre sí, así que
 * las cuatro llevan cristal en iOS 26+; no hay anidamiento.
 */
export function BalanceOverviewSection({
  colors,
  periodView,
  income,
  expense,
  balance,
  savings,
}: BalanceOverviewSectionProps) {
  const pills: BalanceOverviewPill[] = [
    {
      key: "income",
      label:
        periodView === "year"
          ? STRINGS.dashboard.yearlyIncome
          : STRINGS.dashboard.monthlyIncome,
      amount: income,
      accent: colors.success,
      icon: "arrow.down.left",
    },
    {
      key: "expense",
      label:
        periodView === "year"
          ? STRINGS.dashboard.yearlyOutflow
          : STRINGS.dashboard.monthlyOutflow,
      amount: expense,
      accent: colors.expense,
      icon: "arrow.up.right",
    },
    {
      key: "savings",
      label: STRINGS.dashboard.projectedSavings,
      amount: savings,
      accent: colors.primary,
      icon: "banknote.fill",
    },
  ];

  return (
    <>
      <DashboardCard style={styles.balanceCard}>
        <Typography variant="overline" muted>
          {STRINGS.dashboard.total}
        </Typography>
        <Typography
          variant="display"
          style={{ color: balance >= 0 ? colors.success : colors.expense }}
        >
          {formatCurrency(balance)}
        </Typography>
      </DashboardCard>

      <View style={styles.pills}>
        {pills.map((pill) => (
          <GlassSurface
            key={pill.key}
            style={[styles.pill, { borderLeftColor: pill.accent }]}
            fallbackStyle={[
              styles.flatPill,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderLeftColor: pill.accent,
              },
            ]}
          >
            <View style={[styles.pillIcon, { borderColor: pill.accent }]}>
              <IconSymbol name={pill.icon} size={16} color={pill.accent} />
            </View>
            <View style={styles.pillCopy}>
              <Typography variant="overline" muted>
                {pill.label}
              </Typography>
              <Typography variant="number" style={styles.pillAmount}>
                {formatCurrency(pill.amount)}
              </Typography>
            </View>
          </GlassSurface>
        ))}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  /** El bloque de píldoras es la continuación de esta card, no otra sección. */
  balanceCard: {
    marginBottom: Spacing.sm,
  },
  pills: {
    gap: Spacing.sm,
    marginBottom: Spacing.l,
  },
  /**
   * Layout de la píldora, común a la variante con cristal y a la plana. El
   * `borderLeftWidth` se queda aquí (y no en `flatPill`) porque es el acento de
   * estado —ingreso / gasto / ahorro—, no el borde de la superficie.
   */
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    padding: Spacing.m,
    borderRadius: BorderRadius.round,
    borderLeftWidth: 2,
    overflow: "hidden",
  },
  /** Fondo opaco + hairline: solo cuando no hay cristal. */
  flatPill: {
    borderWidth: StyleSheet.hairlineWidth,
    borderLeftWidth: 2,
  },
  pillIcon: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.round,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
  pillCopy: {
    flex: 1,
  },
  /** La cifra sigue la columna del bloque, pegada al borde izquierdo del texto. */
  pillAmount: {
    textAlign: "left",
  },
});
