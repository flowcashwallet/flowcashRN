import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Typography } from "@/components/atoms/Typography";
import { Spacing } from "@/constants/theme";
import { stepStyles } from "@/features/budget/components/budget-setup/sharedStyles";
import React from "react";
import { StyleSheet, View } from "react-native";

interface BudgetIncomeStepProps {
  income: string;
  onChangeIncome: (text: string) => void;
  onContinue: () => void;
}

/** Paso 1 del wizard: ingreso mensual estimado. */
export const BudgetIncomeStep: React.FC<BudgetIncomeStepProps> = ({
  income,
  onChangeIncome,
  onContinue,
}) => {
  return (
    <View style={stepStyles.stepContainer}>
      <Typography variant="body" style={styles.intro}>
        Para comenzar, dinos cuál es tu ingreso mensual estimado. Esto nos
        ayudará a calcular tu capacidad de ahorro.
      </Typography>
      <Input
        label="Ingreso Mensual"
        placeholder="Ej. 2,500.00"
        keyboardType="numeric"
        value={income}
        onChangeText={onChangeIncome}
      />
      <Button title="Siguiente" onPress={onContinue} style={styles.button} />
    </View>
  );
};

const styles = StyleSheet.create({
  intro: {
    marginBottom: Spacing.m,
  },
  button: {
    marginTop: Spacing.l,
  },
});
