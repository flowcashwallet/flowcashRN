import { Typography } from "@/components/atoms/Typography";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { BorderRadius, Spacing } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";
import { BlurView } from "expo-blur";
import React from "react";
import { Platform, StyleSheet, TouchableOpacity } from "react-native";

interface MonthSelectorProps {
  currentMonthName: string;
  year: number;
  showYear?: boolean;
  onPress: () => void;
}

export function MonthSelector({
  currentMonthName,
  year,
  showYear = false,
  onPress,
}: MonthSelectorProps) {
  const { colors, theme } = useTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        alignSelf: "flex-start",
      }}
    >
      <BlurView
        intensity={Platform.OS === "ios" ? 40 : 0}
        tint={theme === "dark" ? "dark" : "light"}
        style={[
          styles.container,
          {
            backgroundColor:
              Platform.OS === "ios"
                ? theme === "dark"
                  ? "rgba(255,255,255,0.1)"
                  : "rgba(0,0,0,0.05)"
                : colors.surfaceHighlight,
            borderColor: "rgba(150, 150, 150, 0.2)",
          },
        ]}
      >
        <IconSymbol
          name="calendar"
          size={16}
          color={colors.primary}
          style={{ marginRight: Spacing.xs }}
        />
        <Typography
          variant="h3"
          weight="bold"
          style={{ color: colors.text, textTransform: "capitalize" }}
        >
          {currentMonthName} {showYear ? year : ""}
        </Typography>
        <IconSymbol
          name="chevron.down"
          size={14}
          color={colors.textSecondary}
          style={{ marginLeft: Spacing.s }}
        />
      </BlurView>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    overflow: "hidden",
  },
});
