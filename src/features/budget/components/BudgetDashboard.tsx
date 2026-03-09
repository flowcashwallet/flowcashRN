import { Button } from "@/components/atoms/Button";
import { Card } from "@/components/atoms/Card";
import { Typography } from "@/components/atoms/Typography";
import { Spacing } from "@/constants/theme";
import { useBudgetDashboard } from "@/features/budget/hooks/useBudgetDashboard";
import { formatCurrency } from "@/utils/format";
import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { BarChart, PieChart } from "react-native-gifted-charts";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export const BudgetDashboard = () => {
  const insets = useSafeAreaInsets();
  const {
    colors,
    handleReset,
    pieData,
    barData,
    monthName,
    currentYear,
    remainingBudget,
    monthlyIncome,
    totalActualExpense,
    totalActualIncome,
    totalFixedExpenses,
  } = useBudgetDashboard();

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{
        paddingHorizontal: Spacing.m,
        paddingBottom: 200 + insets.bottom,
      }}
    >
      <View style={{ marginVertical: Spacing.m }}>
        <Typography variant="h2" weight="bold" style={{ color: colors.text }}>
          Tu Presupuesto
        </Typography>
        <Typography style={{ color: colors.textSecondary }}>
          {monthName} {currentYear}
        </Typography>
      </View>

      <Card style={{ marginBottom: Spacing.l, paddingVertical: Spacing.l }}>
        <Typography
          variant="h3"
          weight="bold"
          style={{ marginBottom: Spacing.m, textAlign: "center" }}
        >
          Distribución del Presupuesto
        </Typography>
        <View style={{ alignItems: "center" }}>
          <PieChart
            data={pieData}
            donut
            radius={80}
            innerRadius={60}
            centerLabelComponent={() => (
              <View style={{ alignItems: "center" }}>
                <Typography variant="caption">Libre</Typography>
                <Typography
                  variant="h3"
                  weight="bold"
                  style={{ color: colors.success }}
                >
                  {formatCurrency(remainingBudget)}
                </Typography>
              </View>
            )}
          />
        </View>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            marginTop: Spacing.m,
            gap: Spacing.l,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <View
              style={{
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: colors.error,
              }}
            />
            <Typography variant="caption">Fijos</Typography>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <View
              style={{
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: colors.success,
              }}
            />
            <Typography variant="caption">Libre</Typography>
          </View>
        </View>
      </Card>

      <Card style={{ marginBottom: Spacing.l, paddingVertical: Spacing.l }}>
        <Typography
          variant="h3"
          weight="bold"
          style={{ marginBottom: Spacing.m, textAlign: "center" }}
        >
          Resumen Mensual (Real vs Presupuesto)
        </Typography>
        <View style={{ alignItems: "center" }}>
          <BarChart
            key={`${monthlyIncome}-${totalActualExpense}-${totalActualIncome}`}
            data={barData}
            barWidth={50}
            spacing={40}
            noOfSections={4}
            barBorderRadius={4}
            frontColor="lightgray"
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
            yAxisTextStyle={{ color: colors.text, fontSize: 10 }}
            xAxisLabelTextStyle={{ color: colors.text, fontSize: 10 }}
          />
        </View>
      </Card>

      <View style={styles.statsGrid}>
        <Card style={styles.statCard}>
          <Typography variant="caption">Ingreso Esperado</Typography>
          <Typography
            variant="h3"
            weight="bold"
            style={{ color: colors.success }}
          >
            {formatCurrency(monthlyIncome)}
          </Typography>
        </Card>
        <Card style={styles.statCard}>
          <Typography variant="caption">Gastos Fijos</Typography>
          <Typography
            variant="h3"
            weight="bold"
            style={{ color: colors.error }}
          >
            {formatCurrency(totalFixedExpenses)}
          </Typography>
        </Card>
        <Card style={styles.statCard}>
          <Typography variant="caption">Ingreso Real</Typography>
          <Typography
            variant="h3"
            weight="bold"
            style={{ color: colors.success }}
          >
            {formatCurrency(totalActualIncome)}
          </Typography>
        </Card>
        <Card style={styles.statCard}>
          <Typography variant="caption">Gasto Real</Typography>
          <Typography
            variant="h3"
            weight="bold"
            style={{ color: colors.error }}
          >
            {formatCurrency(totalActualExpense)}
          </Typography>
        </Card>
      </View>

      <Card variant="outlined" style={{ marginTop: Spacing.m }}>
        <Typography
          variant="h3"
          weight="bold"
          style={{ marginBottom: Spacing.s }}
        >
          Análisis
        </Typography>
        <Typography variant="body">
          {totalActualExpense > monthlyIncome
            ? "⚠️ Has excedido tu presupuesto mensual. Revisa tus gastos variables."
            : totalActualExpense > monthlyIncome * 0.8
              ? "👀 Estás cerca de tu límite de presupuesto (80%). Ten cuidado con gastos hormiga."
              : "✅ Tu comportamiento financiero es saludable. ¡Sigue así!"}
        </Typography>
      </Card>

      <Button
        title="Reiniciar Presupuesto"
        variant="outline"
        onPress={handleReset}
        style={{ marginTop: Spacing.xl, borderColor: colors.error }}
        textStyle={{ color: colors.error }}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.m,
  },
  statCard: {
    width: "47%",
    alignItems: "center",
    padding: Spacing.m,
  },
});
