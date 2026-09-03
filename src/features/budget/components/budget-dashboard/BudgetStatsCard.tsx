import { Typography } from "@/components/atoms/Typography";
import { ThemeColors } from "@/constants/theme";
import { BudgetCollapsibleCard } from "@/features/budget/components/budget-dashboard/BudgetCollapsibleCard";
import { rowStyles } from "@/features/budget/components/budget-dashboard/sharedStyles";
import STRINGS from "@/i18n/es.json";
import { formatCurrency } from "@/utils/format";
import React from "react";
import { View } from "react-native";

interface BudgetStatsCardProps {
  colors: ThemeColors;
  expanded: boolean;
  onToggle: () => void;
  monthlyIncome: number;
  totalFixedExpenses: number;
  totalActualIncome: number;
  totalActualExpense: number;
}

/** Card colapsable "Detalles": grilla de ingreso/gasto esperado vs. real. */
export const BudgetStatsCard: React.FC<BudgetStatsCardProps> = ({
  colors,
  expanded,
  onToggle,
  monthlyIncome,
  totalFixedExpenses,
  totalActualIncome,
  totalActualExpense,
}) => {
  return (
    <BudgetCollapsibleCard
      title="Detalles"
      titleColor={colors.text}
      icon="list.bullet"
      expanded={expanded}
      onToggle={onToggle}
      chevronColor={colors.textSecondary}
    >
      {/* Expected Income */}
      <View style={rowStyles.row}>
        <Typography variant="body" muted>
          {STRINGS.budget.expectedIncome}
        </Typography>
        <View style={rowStyles.amountRow}>
          <Typography variant="number" style={{ color: colors.success }}>
            {formatCurrency(monthlyIncome)}
          </Typography>
          <View style={[rowStyles.dot, { backgroundColor: colors.success }]} />
        </View>
      </View>

      {/* Fixed Expenses */}
      <View style={rowStyles.row}>
        <Typography variant="body" muted>
          {STRINGS.budget.fixedExpenses}
        </Typography>
        <View style={rowStyles.amountRow}>
          <Typography variant="number" style={{ color: colors.expense }}>
            −{formatCurrency(totalFixedExpenses)}
          </Typography>
          <View style={[rowStyles.dot, { backgroundColor: colors.expense }]} />
        </View>
      </View>

      <View style={[rowStyles.divider, { backgroundColor: colors.border }]} />

      {/* Actual Income */}
      <View style={rowStyles.row}>
        <Typography variant="body" muted>
          {STRINGS.budget.actualIncome}
        </Typography>
        <View style={rowStyles.amountRow}>
          <Typography variant="number" style={{ color: colors.success }}>
            {formatCurrency(totalActualIncome)}
          </Typography>
          <View style={[rowStyles.dot, { backgroundColor: colors.success }]} />
        </View>
      </View>

      {/* Actual Expenses */}
      <View style={rowStyles.row}>
        <Typography variant="body" muted>
          {STRINGS.budget.actualExpense}
        </Typography>
        <View style={rowStyles.amountRow}>
          <Typography variant="number" style={{ color: colors.expense }}>
            −{formatCurrency(totalActualExpense)}
          </Typography>
          <View style={[rowStyles.dot, { backgroundColor: colors.expense }]} />
        </View>
      </View>
    </BudgetCollapsibleCard>
  );
};
