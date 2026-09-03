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
import { GlassSurface } from "./GlassSurface";
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

  /**
   * El `style` del llamante puede traer tanto layout (`flex`, `alignSelf`,
   * `minWidth`, padding a medida) como una apariencia puntual
   * (`backgroundColor` para pintar el botón de éxito/error en
   * `TransactionModal.tsx`/`TransactionDetailModal.tsx`). El layout tiene que
   * aplicarse siempre, tenga o no cristal; el `backgroundColor` **no** —
   * cuando hay cristal real ese color se convierte en el tinte
   * (`tintColor`), no en un relleno plano debajo del material. Por eso se
   * separan: `layoutStyle` es el `style` del llamante sin `backgroundColor`,
   * y `customBackgroundColor` es ese color, reservado para `tintColor`/el
   * fallback plano.
   */
  const flatStyle = StyleSheet.flatten(style) as ViewStyle | undefined;
  const customBackgroundColor =
    typeof flatStyle?.backgroundColor === "string"
      ? flatStyle.backgroundColor
      : undefined;
  const layoutStyle = flatStyle
    ? (() => {
        const { backgroundColor: _backgroundColor, ...rest } = flatStyle;
        return rest;
      })()
    : undefined;

  /** Fondo plano — solo se usa sin cristal (fallback) o en `ghost`/`disabled`, que nunca lo tienen. */
  const getFallbackBackgroundColor = () => {
    if (disabled) return colors.icon; // Greyish
    if (gradient) return "transparent";
    if (customBackgroundColor) return customBackgroundColor;
    switch (variant) {
      case "primary":
        return colors.primary;
      case "secondary":
        return colors.secondary;
      default:
        return "transparent"; // outline, ghost
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

  const sizeStyle =
    size === "small"
      ? styles.small
      : size === "medium"
        ? styles.medium
        : styles.large;

  /**
   * Layout del botón, común a la variante con cristal y a la plana — el
   * mismo `style` que antes vivía en `containerStyles`, menos el fondo (que
   * ahora decide `fallbackStyle`/`tintColor`, no un valor fijo aquí). El
   * borde de `outline` sí va aquí: es la identidad visual del botón, tiene
   * que verse tanto con cristal como sin él, no solo en el fallback.
   */
  const baseStyle = [
    styles.container,
    sizeStyle,
    variant === "outline" && { borderWidth: 1, borderColor: colors.primary },
    layoutStyle,
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

  /**
   * `ghost` nunca lleva cristal — no tiene superficie propia por diseño (fondo
   * transparente a propósito), es el hueco de la regla "toda superficie propia
   * lleva cristal". `disabled` tampoco, en ningún variant: un control
   * deshabilitado no debe mostrar un material interactivo, el gris plano ya
   * comunica que no responde.
   */
  if (variant === "ghost" || disabled) {
    return (
      <TouchableOpacity
        style={[baseStyle, { backgroundColor: getFallbackBackgroundColor() }]}
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.7}
      >
        <Content />
      </TouchableOpacity>
    );
  }

  /**
   * `primary`/`secondary`/`outline`: `GlassSurface` **envuelve** `Content`
   * directamente, mismo patrón que `TransactionItem`/`CategoryCard`/
   * `BudgetCollapsibleCard` — no una capa `absoluteFill` hermana (así estaba
   * antes; el usuario pidió explícitamente seguir el mismo criterio que los
   * items de lista). El `TouchableOpacity` de afuera queda sin estilo propio,
   * la superficie completa —layout y apariencia— la decide `GlassSurface`.
   *
   * Tinte: `primary`/`secondary` van teñidos en su color (o el
   * `backgroundColor` que el llamante haya sobreescrito vía `style`, para no
   * imponer un vidrio verde sobre un botón pensado en rojo/verde de estado).
   * `outline` va sin tinte — su identidad es el borde, no un relleno.
   * Todo el botón es el área de toque, así que `isInteractive` va siempre.
   */
  const tintColor =
    variant === "outline"
      ? undefined
      : (customBackgroundColor ??
        (variant === "primary" ? colors.primary : colors.secondary));

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={loading}
      activeOpacity={variant === "primary" ? 0.8 : 0.7}
    >
      <GlassSurface
        testID="button-surface"
        style={baseStyle}
        isInteractive
        tintColor={tintColor}
        fallbackStyle={{ backgroundColor: getFallbackBackgroundColor() }}
      >
        <Content />
      </GlassSurface>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BorderRadius.m,
    // Necesario para que el cristal no se salga de las esquinas redondeadas.
    overflow: "hidden",
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
