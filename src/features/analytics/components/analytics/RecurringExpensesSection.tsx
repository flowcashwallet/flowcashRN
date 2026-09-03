import { GlassSurface } from "@/components/atoms/GlassSurface";
import { Typography } from "@/components/atoms/Typography";
import { IconSymbol } from "@/components/ui/icon-symbol";
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
 * Ajuste 2026-09-03 (pedido explícito del usuario, misma píldora que
 * `TransactionItem`/`VisionEntityList`): cada recurrente pasa a fila-píldora
 * (`BorderRadius.round`) con disco de icono en `surfaceHighlight` —
 * `arrow.triangle.2.circlepath`, el símbolo de recurrencia que ya usa el resto
 * de la app — y amount en `variant="number"` a la derecha, terminando en la
 * misma forma que `TransactionItem`. Fallback plano en `colors.background`.
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
                <Typography
                  variant="body"
                  weight="semibold"
                  numberOfLines={1}
                >
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
  /** La separación entre filas la da el `gap`, no un `marginBottom` por fila. */
  list: {
    gap: Spacing.s,
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
