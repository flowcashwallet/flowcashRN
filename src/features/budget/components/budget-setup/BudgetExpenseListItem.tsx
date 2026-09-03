import { GlassSurface } from "@/components/atoms/GlassSurface";
import { Typography } from "@/components/atoms/Typography";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { BorderRadius, Spacing, ThemeColors } from "@/constants/theme";
import { FixedExpense } from "@/features/budget/budgetSlice";
import STRINGS from "@/i18n/es.json";
import { formatCurrency } from "@/utils/format";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

interface BudgetExpenseListItemProps {
  colors: ThemeColors;
  expense: FixedExpense;
  onRemove: (id: string) => void;
}

/**
 * Fila de un gasto fijo ya agregado en el paso 2 del wizard.
 *
 * Mismo patrón pill + disco de icono de 40 que `TransactionItem` (Wallet) y
 * `VisionEntityList` (Vision) — pedido explícito del usuario tras el pase de
 * Analytics ("quiero que esos items se vean como los de VisionScreen y los
 * de WalletScreen"): no una card de esquinas redondeadas suelta como antes.
 * Superficie de cristal nativo en iOS 26+ vía `GlassSurface`; `background` +
 * hairline sin él (opaco, como en `TransactionItem`, no una card sobre el
 * fondo). El importe usa `variant="number"` (tabular, a la derecha) en
 * `colors.expense` — es un gasto fijo, no un estado de error.
 */
export const BudgetExpenseListItem: React.FC<BudgetExpenseListItemProps> = ({
  colors,
  expense,
  onRemove,
}) => {
  // Categorías de presupuesto usan el mismo formato "emoji + nombre" que
  // las categorías de Wallet (`CATEGORIES = STRINGS.wallet.categories`).
  const emoji = expense.category ? expense.category.slice(0, 2) : null;

  return (
    <GlassSurface
      style={styles.row}
      fallbackStyle={[
        styles.flatRow,
        {
          backgroundColor: colors.background,
          borderBottomColor: colors.border,
          borderRadius: BorderRadius.round,
        },
      ]}
    >
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: colors.surfaceHighlight },
        ]}
      >
        {emoji ? (
          <Typography variant="body">{emoji}</Typography>
        ) : (
          <IconSymbol name="creditcard" size={20} color={colors.icon} />
        )}
      </View>

      <View style={styles.copy}>
        <Typography variant="body" weight="semibold" numberOfLines={1}>
          {expense.name}
        </Typography>
        <Typography variant="caption" muted numberOfLines={1}>
          {expense.category
            ? expense.category.replace(emoji || "", "").trim()
            : "General"}
        </Typography>
      </View>

      <Typography variant="number" style={{ color: colors.expense }}>
        {formatCurrency(expense.amount)}
      </Typography>

      <TouchableOpacity
        onPress={() => onRemove(expense.id)}
        hitSlop={Spacing.s}
        accessibilityRole="button"
        accessibilityLabel={STRINGS.common.delete}
      >
        <IconSymbol name="trash" size={20} color={colors.icon} />
      </TouchableOpacity>
    </GlassSurface>
  );
};

const styles = StyleSheet.create({
  /** Layout de la fila, común a la variante con cristal y a la plana. */
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.s,
    borderRadius: BorderRadius.round,
    marginBottom: Spacing.s,
  },
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
