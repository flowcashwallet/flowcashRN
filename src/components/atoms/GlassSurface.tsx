import React from "react";
import { View } from "react-native";
import type { GlassSurfaceProps } from "./GlassSurface.types";

/**
 * Superficie flotante compartida — variante genérica (Android / web).
 *
 * Aquí no hay cristal: la superficie plana con hairline es la identidad
 * cross-platform de la app (ver "Dirección estética" en
 * `docs/refactor-plan.md`). Metro resuelve `GlassSurface.ios.tsx` en iOS, así
 * que `expo-glass-effect` **nunca entra en el bundle de Android/web**.
 *
 * `tintColor`, `isInteractive` y `forceGlass` se aceptan y se descartan a
 * propósito: son parte del contrato compartido y solo tienen sentido en la
 * variante iOS.
 *
 * Tampoco hay guard de anidamiento aquí, y no hace falta: el guard existe para
 * no apilar cristal sobre cristal, y fuera de iOS nunca hay cristal que apilar.
 * El contexto compartido vive en `GlassSurface.nesting.tsx` (sin
 * `expo-glass-effect`, así que es seguro en cualquier plataforma) y esta
 * variante simplemente nunca lo publica: `useIsInsideGlassSurface()` devuelve
 * `false` en todo el árbol. Por lo mismo `forceGlass` es aquí un no-op: es una
 * escotilla *sobre* ese guard, y sin guard no hay nada de lo que eximirse.
 */
export function GlassSurface({
  style,
  fallbackStyle,
  tintColor,
  isInteractive,
  forceGlass,
  children,
  ...rest
}: GlassSurfaceProps) {
  return (
    <View style={[style, fallbackStyle]} {...rest}>
      {children}
    </View>
  );
}

/**
 * Contraparte genérica de `useGlassSurfaceActive()`: fuera de iOS nunca hay
 * cristal, así que siempre `false`. Ver la variante `.ios.tsx` para qué decide.
 */
export function useGlassSurfaceActive(): boolean {
  return false;
}
