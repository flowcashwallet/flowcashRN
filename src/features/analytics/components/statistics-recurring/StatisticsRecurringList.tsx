import { GlassSurface } from "@/components/atoms/GlassSurface";
import { Typography } from "@/components/atoms/Typography";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { BorderRadius, Spacing, ThemeColors } from "@/constants/theme";
import { RecurringExpense } from "@/features/analytics/utils/analyticsUtils";
import { formatCurrency } from "@/utils/format";
import React from "react";
import { StyleSheet, View } from "react-native";

interface StatisticsRecurringListProps {
  colors: ThemeColors;
  expenses: RecurringExpense[];
}

/**
 * Pase visual 2026-09-02: cada recurrente era `Card variant="outlined"` y pasa
 * a `GlassSurface` directamente — cristal nativo en iOS 26+, `surface` +
 * hairline sin él —, igual que su equivalente de `AnalyticsScreen`.
 *
 * Ajuste 2026-09-03 (pedido explícito del usuario, misma píldora que
 * `TransactionItem`/`VisionEntityList`): cada recurrente pasa a fila-píldora
 * (`BorderRadius.round`) con disco de icono en `surfaceHighlight` —
 * `arrow.triangle.2.circlepath`, símbolo de recurrencia — y amount en
 * `variant="number"` a la derecha. Fallback plano en `colors.background`,
 * igual convención que las filas del libro contable. La separación entre
 * filas la da el `gap` de la lista, no un `marginBottom` por fila. El total
 * del mes es gasto: `−` y `colors.expense`.
 */
export const StatisticsRecurringList: React.FC<
  StatisticsRecurringListProps
> = ({ colors, expenses }) => {
  if (expenses.length === 0) {
    return <Typography muted>No hay gastos recurrentes detectados.</Typography>;
  }

  return (
    <View style={styles.list}>
      {expenses.map((expense, index) => (
        <GlassSurface
          key={index}
          style={styles.row}
          fallbackStyle={[
            styles.flatRow,
            {
              backgroundColor: colors.background,
              borderBottomColor: colors.border,
            },
          ]}
        >
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: colors.surfaceHighlight },
            ]}
          >
            <IconSymbol
              name="arrow.triangle.2.circlepath"
              size={20}
              color={colors.icon}
            />
          </View>

          <View style={styles.copy}>
            <Typography variant="body" weight="semibold" numberOfLines={1}>
              {expense.description}
            </Typography>
            <Typography variant="caption" muted>
              Total del mes
            </Typography>
          </View>

          <Typography variant="number" style={{ color: colors.expense }}>
            −{formatCurrency(expense.totalAmount)}
          </Typography>
        </GlassSurface>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  list: {
    gap: Spacing.sm,
  },
  /** Layout de la fila, común a la variante con cristal y a la plana. */
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.s,
    borderRadius: BorderRadius.round,
    overflow: "hidden",
  },
  /**
   * Fondo de la fila **sin** cristal: opaco y del color del lienzo, igual
   * convención que `TransactionItem`/`VisionEntityList`.
   */
  flatRow: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.round,
    justifyContent: "center",
    alignItems: "center",
  },
  copy: {
    flex: 1,
  },
});
