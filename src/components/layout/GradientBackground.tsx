import { useTheme } from "@/contexts/ThemeContext";
import React from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";

export function GradientBackground({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={[styles.container, { backgroundColor: colors.background }, style]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
