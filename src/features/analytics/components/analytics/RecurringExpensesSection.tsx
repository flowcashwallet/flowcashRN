import { GlassSurface } from "@/components/atoms/GlassSurface";
import { Typography } from "@/components/atoms/Typography";
import { BorderRadius, Spacing, ThemeColors } from "@/constants/theme";
import { RecurringExpense } from "@/features/analytics/utils/analyticsUtils";
import { formatCurrency } from "@/utils/format";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

interface RecurringExpensesSectionProps {
  colors: ThemeColors;
  expenses: RecurringExpense[];
  onViewAllPress: () => void;
}

/**
 * Cada recurrente es una card hermana sobre el canvas → superficie propia, y
 * por tanto cristal nativo en iOS 26+ (`surface` + hairline sin él). Antes eran
 * `borderWidth: 1` sin `borderColor`: el negro por defecto de RN.
 *
 * El total del mes es gasto: `−` y `colors.expense`.
 */
export const RecurringExpensesSection: React.FC<
  RecurringExpensesSectionProps
> = ({ colors, expenses, onViewAllPress }) => {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeaderRow}>
        <Typography variant="heading" style={styles.sectionTitle}>
          Gastos Recurrentes
        </Typography>
        <TouchableOpacity onPress={onViewAllPress} accessibilityRole="button">
          <Typography variant="button" style={{ color: colors.primary }}>
            Ver más
          </Typography>
        </TouchableOpacity>
      </View>
      {expenses.length === 0 ? (
        <Typography muted>No hay gastos recurrentes detectados.</Typography>
      ) : (
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
              <Typography variant="caption" muted>
                Total del mes
              </Typography>
            </GlassSurface>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: Spacing.l,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    marginBottom: Spacing.s,
  },
  /** La separación entre cards la da el `gap`, no un `marginBottom` por card. */
  list: {
    gap: Spacing.s,
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
    marginBottom: Spacing.xs,
  },
  expenseName: {
    flex: 1,
  },
});
