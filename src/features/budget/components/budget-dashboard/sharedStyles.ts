import { BorderRadius, Spacing } from "@/constants/theme";
import { StyleSheet } from "react-native";

/**
 * Filas de importe compartidas entre `BudgetDistributionCard` y
 * `BudgetStatsCard` (label a la izquierda, importe + punto de color a la
 * derecha, separador entre bloques). Antes duplicadas byte a byte dentro de
 * `BudgetDashboard.tsx`, mismo criterio que `sharedStyles.ts` en
 * `wallet/components/transaction-form/`.
 *
 * El importe se pinta con `<Typography variant="number">` en el sitio de
 * llamada (dígitos tabulares, alineado a la derecha — el elemento firma de la
 * app), así que este archivo ya no define un estilo de texto propio para él.
 */
export const rowStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.s,
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.s,
  },
  dot: {
    width: Spacing.s,
    height: Spacing.s,
    borderRadius: BorderRadius.round,
  },
  /** Color vía `colors.border` en el sitio de llamada — el tema no vive aquí. */
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: Spacing.s,
  },
});
