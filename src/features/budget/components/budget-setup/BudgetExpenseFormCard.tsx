import { Button } from "@/components/atoms/Button";
import { GlassSurface } from "@/components/atoms/GlassSurface";
import { Input } from "@/components/atoms/Input";
import { BorderRadius, Spacing, ThemeColors } from "@/constants/theme";
import { CategoryDropdownField } from "@/features/budget/components/budget-setup/CategoryDropdownField";
import { Category } from "@/features/wallet/data/categoriesSlice";
import React from "react";
import { StyleSheet } from "react-native";

interface BudgetExpenseFormCardProps {
  colors: ThemeColors;
  categories: Category[];
  expenseName: string;
  onChangeExpenseName: (text: string) => void;
  expenseAmount: string;
  onChangeExpenseAmount: (text: string) => void;
  expenseCategory: string;
  isCategoryDropdownOpen: boolean;
  onToggleCategoryDropdown: () => void;
  onSelectCategory: (name: string) => void;
  onAddExpense: () => void;
}

/** Formulario para agregar un gasto fijo: nombre, categoría (dropdown) y monto. */
export const BudgetExpenseFormCard: React.FC<BudgetExpenseFormCardProps> = ({
  colors,
  categories,
  expenseName,
  onChangeExpenseName,
  expenseAmount,
  onChangeExpenseAmount,
  expenseCategory,
  isCategoryDropdownOpen,
  onToggleCategoryDropdown,
  onSelectCategory,
  onAddExpense,
}) => {
  return (
    <GlassSurface
      style={styles.card}
      fallbackStyle={[
        styles.flatCard,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <Input
        label="Nombre del Gasto"
        placeholder="Ej. Internet"
        value={expenseName}
        onChangeText={onChangeExpenseName}
      />

      <CategoryDropdownField
        colors={colors}
        categories={categories}
        value={expenseCategory}
        isOpen={isCategoryDropdownOpen}
        onToggle={onToggleCategoryDropdown}
        onSelect={onSelectCategory}
      />

      <Input
        label="Monto"
        placeholder="0.00"
        keyboardType="numeric"
        value={expenseAmount}
        onChangeText={onChangeExpenseAmount}
      />
      <Button
        title="Agregar Gasto"
        variant="outline"
        onPress={onAddExpense}
        style={styles.addButton}
      />
    </GlassSurface>
  );
};

const styles = StyleSheet.create({
  /** Layout de la card, común a la variante con cristal y a la plana. */
  card: {
    borderRadius: BorderRadius.l,
    padding: Spacing.m,
    marginBottom: Spacing.m,
    overflow: "hidden",
  },
  /** Fondo opaco + hairline: solo cuando no hay cristal. */
  flatCard: {
    borderWidth: StyleSheet.hairlineWidth,
  },
  addButton: {
    marginTop: Spacing.s,
  },
});
