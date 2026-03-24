import { useTheme } from "@/contexts/ThemeContext";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
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
          backgroundColor:
            colors.background.toLowerCase() === "#fff"
              ? "rgba(255,255,255,0.75)"
              : "rgba(255,255,255,0.14)",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.08,
          shadowRadius: 16,
        },
        style,
      ]}
    >
      <BlurView
        intensity={20}
        tint={colors.background.toLowerCase() === "#fff" ? "light" : "dark"}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={["rgba(255,255,255,0.5)", "rgba(255,255,255,0.0)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          right: 0,
          height: 20,
          borderTopLeftRadius: 30,
          borderTopRightRadius: 30,
        }}
      />
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
