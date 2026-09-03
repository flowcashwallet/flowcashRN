import { Typography } from "@/components/atoms/Typography";
import { Spacing, ThemeColors } from "@/constants/theme";
import { FixedExpense } from "@/features/budget/budgetSlice";
import { BudgetExpenseFormCard } from "@/features/budget/components/budget-setup/BudgetExpenseFormCard";
import { BudgetExpenseListItem } from "@/features/budget/components/budget-setup/BudgetExpenseListItem";
import { stepStyles } from "@/features/budget/components/budget-setup/sharedStyles";
import { WizardNavRow } from "@/features/budget/components/budget-setup/WizardNavRow";
import { Category } from "@/features/wallet/data/categoriesSlice";
import React from "react";
import { StyleSheet, View } from "react-native";

interface BudgetExpensesStepProps {
  colors: ThemeColors;
  categories: Category[];
  expenses: FixedExpense[];
  expenseName: string;
  onChangeExpenseName: (text: string) => void;
  expenseAmount: string;
  onChangeExpenseAmount: (text: string) => void;
  expenseCategory: string;
  isCategoryDropdownOpen: boolean;
  onToggleCategoryDropdown: () => void;
  onSelectCategory: (name: string) => void;
  onAddExpense: () => void;
  onRemoveExpense: (id: string) => void;
  onBack: () => void;
  onNext: () => void;
}

/** Paso 2 del wizard: gastos fijos mensuales. */
export const BudgetExpensesStep: React.FC<BudgetExpensesStepProps> = ({
  colors,
  categories,
  expenses,
  expenseName,
  onChangeExpenseName,
  expenseAmount,
  onChangeExpenseAmount,
  expenseCategory,
  isCategoryDropdownOpen,
  onToggleCategoryDropdown,
  onSelectCategory,
  onAddExpense,
  onRemoveExpense,
  onBack,
  onNext,
}) => {
  return (
    <View style={stepStyles.stepContainer}>
      <Typography variant="body" style={styles.intro}>
        ¿Tienes gastos fijos mensuales? (Renta, Internet, Netflix, etc.)
        Agrégalos aquí.
      </Typography>

      <BudgetExpenseFormCard
        colors={colors}
        categories={categories}
        expenseName={expenseName}
        onChangeExpenseName={onChangeExpenseName}
        expenseAmount={expenseAmount}
        onChangeExpenseAmount={onChangeExpenseAmount}
        expenseCategory={expenseCategory}
        isCategoryDropdownOpen={isCategoryDropdownOpen}
        onToggleCategoryDropdown={onToggleCategoryDropdown}
        onSelectCategory={onSelectCategory}
        onAddExpense={onAddExpense}
      />

      {expenses.length > 0 && (
        <View>
          <Typography variant="subheading" style={styles.listTitle}>
            Gastos Agregados:
          </Typography>
          {expenses.map((expense) => (
            <BudgetExpenseListItem
              key={expense.id}
              colors={colors}
              expense={expense}
              onRemove={onRemoveExpense}
            />
          ))}
        </View>
      )}

      <WizardNavRow
        onBack={onBack}
        nextLabel="Siguiente"
        onNext={onNext}
        style={styles.navRow}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  intro: {
    marginBottom: Spacing.m,
  },
  listTitle: {
    marginBottom: Spacing.s,
  },
  navRow: {
    marginTop: Spacing.l,
  },
});
