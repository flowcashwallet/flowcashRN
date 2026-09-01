import { Typography } from "@/components/atoms/Typography";
import { BorderRadius, Spacing, ThemeColors } from "@/constants/theme";
import * as Haptics from "expo-haptics";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

type TransactionType = "income" | "expense" | "transfer";

interface TransactionTypeSelectorProps {
  type: TransactionType;
  onSelectType: (type: TransactionType) => void;
  colors: ThemeColors;
}

const OPTIONS: { value: TransactionType; label: string }[] = [
  { value: "expense", label: "Gasto" },
  { value: "income", label: "Ingreso" },
  { value: "transfer", label: "Transf." },
];

export function TransactionTypeSelector({
  type,
  onSelectType,
  colors,
}: TransactionTypeSelectorProps) {
  return (
    <View
      style={[styles.container, { backgroundColor: colors.surfaceHighlight }]}
    >
      {OPTIONS.map((option) => {
        const selected = type === option.value;
        return (
          <TouchableOpacity
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            style={[
              styles.option,
              selected && { backgroundColor: colors.surfaceActive },
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onSelectType(option.value);
            }}
          >
            {/*
              El estado seleccionado se codifica con la superficie activa y el
              peso del texto, no con color de categoría: el verde/rojo por tipo
              competía con la señal de signo del importe.
            */}
            <Typography variant="button" muted={!selected}>
              {option.label}
            </Typography>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    marginBottom: Spacing.l,
    borderRadius: BorderRadius.m,
    padding: 2,
    gap: 2,
  },
  option: {
    flex: 1,
    paddingVertical: Spacing.s,
    alignItems: "center",
    borderRadius: BorderRadius.s,
  },
});
