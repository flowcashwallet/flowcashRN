import { useTheme } from "@/contexts/ThemeContext";
import React from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";

/**
 * Fondo de pantalla plano, pintado con `colors.background`.
 *
 * Antes se llamaba `GradientBackground` pero nunca renderizó un gradiente. La
 * dirección estética de FlowCash es **superficie plana + hairline** (ver
 * "Dirección estética" en `docs/refactor-plan.md`), así que el componente se
 * renombró para que el nombre diga la verdad en lugar de añadirle un gradiente
 * que la dirección no pide.
 *
 * Envuelve el contenido de una ruta para que la pantalla ocupe todo el alto y
 * herede el color de fondo del tema activo.
 */
export function ScreenBackground({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={[styles.container, { backgroundColor: colors.background }, style]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
