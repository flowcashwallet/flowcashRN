import { ThemedView } from "@/components/themed-view";
import { BudgetDashboard } from "@/features/budget/components/BudgetDashboard";
import { BudgetSetupWizard } from "@/features/budget/components/BudgetSetupWizard";
import { useBudgetData } from "@/features/budget/hooks/useBudgetData";
import { Stack } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, StyleSheet } from "react-native";

export default function BudgetScreen() {
  const { isSetup, budgetLoading, colors } = useBudgetData();
  const [isEditing, setIsEditing] = useState(false);

  if (budgetLoading) {
    return (
      <ThemedView style={[styles.container, { justifyContent: "center" }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTransparent: true,
          headerTitle: "Presupuesto",
          unstable_headerRightItems: () =>
            isSetup && !isEditing
              ? [
                  {
                    type: "button",
                    label: " ",
                    icon: {
                      type: "sfSymbol",
                      name: "pencil",
                    },
                    tintColor: colors.primary,
                    onPress: () => setIsEditing(true),
                  },
                ]
              : [
                  // cancel edit
                  {
                    type: "button",
                    label: " ",
                    icon: {
                      type: "sfSymbol",
                      name: "xmark",
                    },
                    tintColor: colors.primary,
                    onPress: () => setIsEditing(false),
                  },
                ],
        }}
      />
      {isSetup && !isEditing ? (
        <BudgetDashboard />
      ) : (
        <BudgetSetupWizard onFinish={() => setIsEditing(false)} />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
  },
});
