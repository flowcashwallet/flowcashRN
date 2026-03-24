import { BorderRadius } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";
import { BlurView } from "expo-blur";
import React from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";

export function GlassCard({
  children,
  style,
  accentColor,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  accentColor?: string;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.container,
        {
          borderColor: colors.glass.cardBorder,
          backgroundColor: colors.glass.cardBg,
        },
        style,
      ]}
    >
      <BlurView
        intensity={25}
        tint={colors.background.toLowerCase() === "#fff" ? "light" : "dark"}
        style={StyleSheet.absoluteFill}
      />
      {accentColor ? (
        <View
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: 6,
            backgroundColor: accentColor,
            opacity: 0.6,
          }}
        />
      ) : null}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 1,
          backgroundColor: colors.glass.specularTop,
        }}
      />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
    borderWidth: 1,
  },
  content: {
    padding: 20,
  },
});
