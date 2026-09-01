import React from "react";
import { View } from "react-native";
import type { GlassSurfaceProps } from "./GlassSurface.types";

/**
 * Superficie de una fila de lista — variante genérica (Android / web).
 *
 * Aquí no hay cristal: la fila plana con hairline es la identidad
 * cross-platform de la app (ver "Dirección estética" en
 * `docs/refactor-plan.md`). Metro resuelve `GlassSurface.ios.tsx` en iOS, así
 * que `expo-glass-effect` **nunca entra en el bundle de Android/web**.
 *
 * `tintColor` e `isInteractive` se aceptan y se descartan a propósito: son
 * parte del contrato compartido y solo tienen sentido en la variante iOS.
 */
export function GlassSurface({
  style,
  fallbackStyle,
  tintColor,
  isInteractive,
  children,
  ...rest
}: GlassSurfaceProps) {
  return (
    <View style={[style, fallbackStyle]} {...rest}>
      {children}
    </View>
  );
}
