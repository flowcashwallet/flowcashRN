import { BorderRadius, Colors, Spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import React from "react";
import {
    ActivityIndicator,
    StyleProp,
    StyleSheet,
    TextStyle,
    TouchableOpacity,
    ViewStyle,
} from "react-native";
import { Typography } from "./Typography";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "small" | "medium" | "large";
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  icon?: React.ReactNode;
}

export function Button({
  title,
  onPress,
  variant = "primary",
  size = "medium",
  disabled = false,
  loading = false,
  style,
  textStyle,
  icon,
}: ButtonProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const getBackgroundColor = () => {
    if (disabled) return colors.icon; // Greyish
    switch (variant) {
      case "primary":
        return colors.primary;
      case "secondary":
        return colors.secondary;
      case "outline":
        return "transparent";
      case "ghost":
        return "transparent";
      default:
        return colors.primary;
    }
  };

  const getTextColor = () => {
    if (disabled) return "#fff";
    switch (variant) {
      case "primary":
        return "#fff";
      case "secondary":
        return "#fff";
      case "outline":
        return colors.primary;
      case "ghost":
        return colors.primary;
      default:
        return "#fff";
    }
  };

  const containerStyles = [
    styles.container,
    { backgroundColor: getBackgroundColor() },
    variant === "outline" && { borderWidth: 1, borderColor: colors.primary },
    size === "small" && styles.small,
    size === "medium" && styles.medium,
    size === "large" && styles.large,
    style,
  ];

  return (
    <TouchableOpacity
      style={containerStyles}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <>
          {icon}
          <Typography
            variant="button"
            weight="medium"
            style={[
              { color: getTextColor(), marginLeft: icon ? Spacing.s : 0 },
              textStyle,
            ]}
          >
            {title}
          </Typography>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BorderRadius.m,
  },
  small: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.s,
  },
  medium: {
    paddingVertical: 12,
    paddingHorizontal: Spacing.m,
  },
  large: {
    paddingVertical: Spacing.m,
    paddingHorizontal: Spacing.l,
  },
});
