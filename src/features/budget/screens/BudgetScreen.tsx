import { ThemedView } from "@/components/themed-view";
import { BudgetDashboard } from "@/features/budget/components/BudgetDashboard";
import { BudgetSetupWizard } from "@/features/budget/components/BudgetSetupWizard";
import { useBudgetScreen } from "@/features/budget/hooks/useBudgetScreen";
import { Stack } from "expo-router";
import React from "react";
import { ActivityIndicator, StyleSheet } from "react-native";

export default function BudgetScreen() {
  const {
    isSetup,
    budgetLoading,
    colors,
    isEditing,
    onStartEditing,
    onCancelEditing,
  } = useBudgetScreen();

  if (budgetLoading) {
    return (
      <ThemedView
        lightColor="transparent"
        darkColor="transparent"
        style={[styles.container, styles.centered]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </ThemedView>
    );
  }

  return (
    <ThemedView lightColor="transparent" darkColor="transparent" style={styles.container}>
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
                    onPress: onStartEditing,
                  },
                ]
              : isEditing
                ? [
                    {
                      type: "button",
                      label: " ",
                      icon: {
                        type: "sfSymbol",
                        name: "xmark",
                      },
                      tintColor: colors.primary,
                      onPress: onCancelEditing,
                    },
                  ]
                : [],
        }}
      />
      {isSetup && !isEditing ? (
        <BudgetDashboard />
      ) : (
        <BudgetSetupWizard onFinish={onCancelEditing} />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
  },
  centered: {
    justifyContent: "center",
  },
});
