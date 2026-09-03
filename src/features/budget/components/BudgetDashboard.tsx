import { Button } from "@/components/atoms/Button";
import { Typography } from "@/components/atoms/Typography";
import { Spacing } from "@/constants/theme";
import { BudgetDistributionCard } from "@/features/budget/components/budget-dashboard/BudgetDistributionCard";
import { BudgetStatsCard } from "@/features/budget/components/budget-dashboard/BudgetStatsCard";
import { BudgetSummaryChartCard } from "@/features/budget/components/budget-dashboard/BudgetSummaryChartCard";
import { useBudgetDashboard } from "@/features/budget/hooks/useBudgetDashboard";
import STRINGS from "@/i18n/es.json";
import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/** Aire bajo el botón de reinicio, sobre el inset seguro — mismo patrón que
 * `SCROLL_BOTTOM_INSET` en `DashboardScreen.tsx`. */
const SCROLL_BOTTOM_INSET = 200;

export const BudgetDashboard = () => {
  const insets = useSafeAreaInsets();
  const {
    colors,
    handleReset,
    barData,
    monthName,
    currentYear,
    remainingBudget,
    monthlyIncome,
    totalActualExpense,
    totalActualIncome,
    totalFixedExpenses,
    isPieExpanded,
    isBarExpanded,
    isStatsExpanded,
    onTogglePieExpanded,
    onToggleBarExpanded,
    onToggleStatsExpanded,
  } = useBudgetDashboard();

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={[
        styles.scrollContent,
        { paddingBottom: SCROLL_BOTTOM_INSET + insets.bottom },
      ]}
    >
      <View style={styles.header}>
        <Typography variant="heading">{STRINGS.budget.yourBudget}</Typography>
        <Typography variant="bodySmall" muted>
          {monthName} {currentYear}
        </Typography>
      </View>

      <BudgetDistributionCard
        colors={colors}
        expanded={isPieExpanded}
        onToggle={onTogglePieExpanded}
        remainingBudget={remainingBudget}
        totalFixedExpenses={totalFixedExpenses}
      />

      <BudgetSummaryChartCard
        colors={colors}
        expanded={isBarExpanded}
        onToggle={onToggleBarExpanded}
        barData={barData}
        monthlyIncome={monthlyIncome}
        totalActualExpense={totalActualExpense}
        totalActualIncome={totalActualIncome}
      />

      <BudgetStatsCard
        colors={colors}
        expanded={isStatsExpanded}
        onToggle={onToggleStatsExpanded}
        monthlyIncome={monthlyIncome}
        totalFixedExpenses={totalFixedExpenses}
        totalActualIncome={totalActualIncome}
        totalActualExpense={totalActualExpense}
      />

      <Button
        title={STRINGS.budget.resetBudget}
        variant="outline"
        onPress={handleReset}
        style={[styles.resetButton, { borderColor: colors.error }]}
        textStyle={{ color: colors.error }}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: Spacing.m,
  },
  header: {
    marginVertical: Spacing.m,
  },
  resetButton: {
    marginTop: Spacing.xl,
  },
});
