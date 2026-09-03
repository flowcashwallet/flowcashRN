import { GlassSurface } from "@/components/atoms/GlassSurface";
import { Typography } from "@/components/atoms/Typography";
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
 * hairline sin él —, igual que su equivalente de `AnalyticsScreen`. La
 * separación entre cards la da el `gap` de la lista, no un `marginBottom` por
 * card. El total del mes es gasto: `−` y `colors.expense`.
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
          style={styles.expenseCard}
          fallbackStyle={[
            styles.flatCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.expenseHeader}>
            <Typography
              variant="body"
              weight="semibold"
              style={styles.expenseName}
              numberOfLines={1}
            >
              {expense.description}
            </Typography>
            <Typography variant="number" style={{ color: colors.expense }}>
              −{formatCurrency(expense.totalAmount)}
            </Typography>
          </View>
          <Typography variant="caption" muted style={styles.expenseFrequency}>
            Total del mes
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
  /** Layout de la card, común a la variante con cristal y a la plana. */
  expenseCard: {
    padding: Spacing.m,
    borderRadius: BorderRadius.l,
    overflow: "hidden",
  },
  /** Fondo opaco + hairline: solo cuando no hay cristal. */
  flatCard: {
    borderWidth: StyleSheet.hairlineWidth,
  },
  expenseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: Spacing.s,
  },
  expenseName: {
    flex: 1,
  },
  expenseFrequency: {
    marginTop: Spacing.xs,
  },
});
