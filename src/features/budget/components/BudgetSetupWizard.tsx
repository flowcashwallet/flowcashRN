import { Typography } from "@/components/atoms/Typography";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";
import { getWizardStepTitle } from "@/features/budget/components/BudgetHelpers";
import { BudgetExpensesStep } from "@/features/budget/components/budget-setup/BudgetExpensesStep";
import { BudgetIncomeStep } from "@/features/budget/components/budget-setup/BudgetIncomeStep";
import { BudgetSummaryStep } from "@/features/budget/components/budget-setup/BudgetSummaryStep";
import { useBudgetSetup } from "@/features/budget/hooks/useBudgetSetup";
import React from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/** Aire bajo la fila de navegación, sobre el inset seguro. */
const SCROLL_BOTTOM_INSET = 150;

export interface BudgetSetupWizardProps {
  onFinish?: () => void;
  onCancel?: () => void;
}

export const BudgetSetupWizard = ({
  onFinish,
  onCancel,
}: BudgetSetupWizardProps) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const {
    step,
    income,
    handleIncomeChange,
    expenses,
    expenseName,
    setExpenseName,
    expenseAmount,
    handleExpenseAmountChange,
    expenseCategory,
    isCategoryDropdownOpen,
    toggleCategoryDropdown,
    handleSelectExpenseCategory,
    categories,
    handleAddExpense,
    handleRemoveExpense,
    totalExpenses,
    parsedIncome,
    handleFinish,
    handleContinueFromIncome,
    goToIncomeStep,
    goToExpensesStep,
    goToSummaryStep,
  } = useBudgetSetup();

  const handleWizardFinish = async () => {
    await handleFinish();
    if (onFinish) {
      onFinish();
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.flex}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: SCROLL_BOTTOM_INSET + insets.bottom },
          ]}
        >
          <View style={styles.header}>
            <Typography variant="heading">
              {getWizardStepTitle(step)}
            </Typography>
            <Typography variant="bodySmall" muted>
              Paso {step} de 3
            </Typography>
          </View>

          {step === 1 && (
            <BudgetIncomeStep
              income={income}
              onChangeIncome={handleIncomeChange}
              onContinue={handleContinueFromIncome}
            />
          )}

          {step === 2 && (
            <BudgetExpensesStep
              colors={colors}
              categories={categories}
              expenses={expenses}
              expenseName={expenseName}
              onChangeExpenseName={setExpenseName}
              expenseAmount={expenseAmount}
              onChangeExpenseAmount={handleExpenseAmountChange}
              expenseCategory={expenseCategory}
              isCategoryDropdownOpen={isCategoryDropdownOpen}
              onToggleCategoryDropdown={toggleCategoryDropdown}
              onSelectCategory={handleSelectExpenseCategory}
              onAddExpense={handleAddExpense}
              onRemoveExpense={handleRemoveExpense}
              onBack={goToIncomeStep}
              onNext={goToSummaryStep}
            />
          )}

          {step === 3 && (
            <BudgetSummaryStep
              colors={colors}
              parsedIncome={parsedIncome}
              totalExpenses={totalExpenses}
              onBack={goToExpensesStep}
              onFinish={handleWizardFinish}
            />
          )}
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.m,
  },
  header: {
    marginVertical: Spacing.m,
  },
});
