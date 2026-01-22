import { BorderRadius, Colors, Spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import React from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: "elevated" | "outlined" | "flat";
}

export function Card({ children, style, variant = "elevated" }: CardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const getStyle = (): ViewStyle => {
    switch (variant) {
      case "elevated":
        return {
          backgroundColor: colors.surface,
          shadowColor: "#000",
          ...styles.elevated,
        };
      case "outlined":
        return {
          borderColor: colors.border,
          backgroundColor: colors.surface,
          ...styles.outlined,
        };
      case "flat":
        return {
          backgroundColor: colors.background,
          ...styles.flat,
        };
      default:
        return {};
    }
  };

  return <View style={[styles.container, getStyle(), style]}>{children}</View>;
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.l,
    padding: Spacing.m,
  },
  elevated: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  outlined: {
    borderWidth: 1,
  },
  flat: {},
});
