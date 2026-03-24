import { useTheme } from "@/contexts/ThemeContext";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
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
    <LinearGradient
      collapsable={false}
      colors={colors.gradients.background}
      style={[styles.container, style]}
    >
      <BlurView
        intensity={80}
        tint={colors.background.toLowerCase() === "#fff" ? "light" : "dark"}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.content}>{children}</View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});

