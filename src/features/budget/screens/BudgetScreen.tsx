import { ThemedView } from "@/components/themed-view";
import { BudgetDashboard } from "@/features/budget/components/BudgetDashboard";
import { BudgetSetupWizard } from "@/features/budget/components/BudgetSetupWizard";
import { useBudgetData } from "@/features/budget/hooks/useBudgetData";
import React from "react";
import { ActivityIndicator, StyleSheet } from "react-native";

export default function BudgetScreen() {
  const { isSetup, budgetLoading, colors } = useBudgetData();

  if (budgetLoading) {
    return (
      <ThemedView style={[styles.container, { justifyContent: "center" }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {isSetup ? <BudgetDashboard /> : <BudgetSetupWizard />}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
