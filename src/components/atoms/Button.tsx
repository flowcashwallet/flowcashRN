import { BorderRadius, Spacing } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";
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
  gradient?: readonly [string, string];
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
  gradient,
}: ButtonProps) {
  const { colors } = useTheme();

  const getBackgroundColor = () => {
    if (disabled) return colors.icon; // Greyish
    if (gradient) return "transparent";
    switch (variant) {
      case "primary":
        return "transparent"; // We'll use LinearGradient for primary
      case "secondary":
        return colors.secondary;
      case "outline":
        return "transparent";
      case "ghost":
        return "transparent";
      default:
        return "transparent";
    }
  };

  /**
   * `onPrimary` codifica el aviso de contraste de la dirección estética: en claro
   * `primary` es un verde claro sobre el que el blanco no pasa AA, así que el
   * contenido va oscuro; en oscuro sí es blanco. `secondary` es un azul saturado
   * en ambos temas y admite blanco, pero se usa el mismo token por consistencia
   * de "contenido sobre relleno de marca".
   */
  const getTextColor = () => {
    // Deshabilitado el relleno es `colors.icon` (gris); `surface` es el token que
    // contrasta contra él en ambos temas.
    if (disabled) return colors.surface;
    switch (variant) {
      case "outline":
      case "ghost":
        return colors.primary;
      default:
        return colors.onPrimary;
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

  const Content = () => (
    <>
      {loading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <>
          {icon}
          <Typography
            variant="button"
            style={[
              { color: getTextColor(), marginLeft: icon ? Spacing.s : 0 },
              textStyle,
            ]}
          >
            {title}
          </Typography>
        </>
      )}
    </>
  );

  if (variant === "primary" && !disabled) {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.8}
        style={[
          styles.container,
          { backgroundColor: colors.primary }, // Solid primary color (Light Blue)
          size === "small" && styles.small,
          size === "medium" && styles.medium,
          size === "large" && styles.large,
          style,
        ]}
      >
        <Content />
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={containerStyles}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      <Content />
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
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.m,
  },
  large: {
    paddingVertical: Spacing.m,
    paddingHorizontal: Spacing.l,
  },
});
