import { Typography } from "@/components/atoms/Typography";
import { ThemeColors } from "@/constants/theme";
import { BudgetCollapsibleCard } from "@/features/budget/components/budget-dashboard/BudgetCollapsibleCard";
import { rowStyles } from "@/features/budget/components/budget-dashboard/sharedStyles";
import STRINGS from "@/i18n/es.json";
import { formatCurrency } from "@/utils/format";
import React from "react";
import { View } from "react-native";

interface BudgetDistributionCardProps {
  colors: ThemeColors;
  expanded: boolean;
  onToggle: () => void;
  remainingBudget: number;
  totalFixedExpenses: number;
}

/**
 * Card colapsable "Distribución": fijos vs. libre del presupuesto mensual.
 * Cuando está colapsada muestra el libre restante junto al chevron.
 */
export const BudgetDistributionCard: React.FC<BudgetDistributionCardProps> = ({
  colors,
  expanded,
  onToggle,
  remainingBudget,
  totalFixedExpenses,
}) => {
  return (
    <BudgetCollapsibleCard
      title={STRINGS.budget.distribution}
      icon="chart.pie.fill"
      expanded={expanded}
      onToggle={onToggle}
      chevronColor={colors.icon}
      headerAccessory={
        <Typography variant="number" style={{ color: colors.success }}>
          {formatCurrency(remainingBudget)}
        </Typography>
      }
    >
      {/* Fixed Expenses Row */}
      <View style={rowStyles.row}>
        <Typography variant="body">{STRINGS.budget.fixed}</Typography>
        <View style={rowStyles.amountRow}>
          <Typography variant="number" style={{ color: colors.expense }}>
            {formatCurrency(totalFixedExpenses)}
          </Typography>
          <View style={[rowStyles.dot, { backgroundColor: colors.expense }]} />
        </View>
      </View>

      <View style={[rowStyles.divider, { backgroundColor: colors.border }]} />

      {/* Remaining Budget Row */}
      <View style={rowStyles.row}>
        <Typography variant="body">{STRINGS.budget.free}</Typography>
        <View style={rowStyles.amountRow}>
          <Typography variant="number" style={{ color: colors.success }}>
            {formatCurrency(remainingBudget)}
          </Typography>
          <View
            style={[rowStyles.dot, { backgroundColor: colors.success }]}
          />
        </View>
      </View>
    </BudgetCollapsibleCard>
  );
};
