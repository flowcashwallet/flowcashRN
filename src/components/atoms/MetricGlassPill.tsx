import { useTheme } from "@/contexts/ThemeContext";
import React from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";

export function MetricGlassPill({
  children,
  style,
  borderColor,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  borderColor?: string;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.container,
        {
          borderColor: borderColor ?? colors.border + "66",
          backgroundColor: colors.surfaceHighlight,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.08,
          shadowRadius: 16,
        },
        style,
      ]}
    >
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 30,
    overflow: "hidden",
    borderWidth: 1,
  },
  content: {
    padding: 16,
  },
});
