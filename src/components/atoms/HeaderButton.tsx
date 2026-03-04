import { IconSymbol } from "@/components/ui/icon-symbol";
import { useTheme } from "@/contexts/ThemeContext";
import React from "react";
import { StyleSheet, TouchableOpacity, ViewStyle } from "react-native";

interface HeaderButtonProps {
  icon: string;
  onPress?: () => void;
  size?: number;
  color?: string;
  backgroundColor?: string;
  style?: ViewStyle;
  disabled?: boolean;
}

export const HeaderButton: React.FC<HeaderButtonProps> = ({
  icon,
  onPress,
  size = 24,
  color,
  backgroundColor,
  style,
  disabled,
}) => {
  const { colors } = useTheme();
  const iconColor = color ?? colors.text;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.button, style]}
      activeOpacity={0.7}
      disabled={disabled || !onPress}
    >
      <IconSymbol name={icon as any} size={size} color={iconColor} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    padding: 8,
    borderRadius: 20,
  },
});
