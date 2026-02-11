import { BorderRadius, Colors, Spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import React, { useState } from "react";
import {
  Platform,
  StyleProp,
  StyleSheet,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from "react-native";
import { Typography } from "./Typography";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  rightIcon?: React.ReactNode;
}

export function Input({
  label,
  error,
  style,
  rightIcon,
  onFocus,
  onBlur,
  ...rest
}: InputProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.container}>
      {label && (
        <Typography
          variant="caption"
          style={{ marginBottom: Spacing.xs, color: colors.text }}
        >
          {label}
        </Typography>
      )}
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: colors.surface,
            borderColor: error
              ? colors.error
              : isFocused
                ? colors.primary
                : colors.border,
            borderWidth: isFocused ? 2 : 1,
          },
          style as StyleProp<ViewStyle>,
        ]}
      >
        <TextInput
          style={[
            styles.input,
            {
              color: colors.text,
              ...(Platform.OS === "web"
                ? ({ outlineStyle: "none" } as any)
                : {}),
            },
          ]}
          placeholderTextColor={colors.icon}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          {...rest}
        />
        {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
      </View>
      {error && (
        <Typography
          variant="caption"
          style={{ marginTop: Spacing.xs, color: colors.error }}
        >
          {error}
        </Typography>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.m,
  },
  inputContainer: {
    height: 48,
    borderWidth: 1,
    borderRadius: BorderRadius.m,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.m,
  },
  input: {
    flex: 1,
    height: "100%",
    fontSize: 16,
  },
  rightIcon: {
    marginLeft: Spacing.s,
  },
});
