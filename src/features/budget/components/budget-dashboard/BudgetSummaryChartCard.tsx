import { ThemeColors, TypographyScale } from "@/constants/theme";
import { BudgetCollapsibleCard } from "@/features/budget/components/budget-dashboard/BudgetCollapsibleCard";
import STRINGS from "@/i18n/es.json";
import React from "react";
import { StyleSheet } from "react-native";
import { BarChart } from "react-native-gifted-charts";

interface BudgetBarDatum {
  value: number;
  label: string;
  frontColor: string;
  gradientColor: string;
  showGradient: boolean;
  topLabelComponent: () => React.ReactElement;
}

interface BudgetSummaryChartCardProps {
  colors: ThemeColors;
  expanded: boolean;
  onToggle: () => void;
  barData: BudgetBarDatum[];
  monthlyIncome: number;
  totalActualExpense: number;
  totalActualIncome: number;
}

/** `yAxisTextStyle`/`xAxisLabelTextStyle` de `BarChart` no son un `style` de React
 * Native (no está garantizado que soporten arreglos como los componentes core) —
 * se combina el color dinámico del tema con el tamaño de la escala tipográfica
 * a mano, mismo criterio que `axisLabelStyle()` en `WeeklySpendingSection.tsx`
 * (Dashboard). */
function axisTextStyle(color: string) {
  return { color, fontSize: TypographyScale.caption.fontSize };
}

/**
 * Card colapsable "Resumen Mensual": el `BarChart` de ingreso esperado vs.
 * gasto real vs. libre real.
 */
export const BudgetSummaryChartCard: React.FC<BudgetSummaryChartCardProps> = ({
  colors,
  expanded,
  onToggle,
  barData,
  monthlyIncome,
  totalActualExpense,
  totalActualIncome,
}) => {
  return (
    <BudgetCollapsibleCard
      title={STRINGS.budget.monthlySummary}
      titleColor={colors.text}
      expanded={expanded}
      onToggle={onToggle}
      chevronColor={colors.textSecondary}
      contentStyle={styles.chartContent}
    >
      <BarChart
        key={`${monthlyIncome}-${totalActualExpense}-${totalActualIncome}`}
        data={barData}
        barWidth={50}
        spacing={40}
        noOfSections={4}
        barBorderRadius={4}
        frontColor={colors.border}
        yAxisThickness={0}
        xAxisThickness={0}
        yAxisLabelWidth={60}
        height={200}
        width={300}
        isAnimated
        hideRules
        maxValue={
          Math.max(
            monthlyIncome,
            totalActualExpense,
            totalActualIncome,
            100,
          ) * 1.2
        }
        yAxisTextStyle={axisTextStyle(colors.textSecondary)}
        xAxisLabelTextStyle={axisTextStyle(colors.textSecondary)}
      />
    </BudgetCollapsibleCard>
  );
};

const styles = StyleSheet.create({
  chartContent: {
    alignItems: "center",
  },
});
