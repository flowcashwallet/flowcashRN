import { useTheme } from "@/contexts/ThemeContext";
import { GlassView, isGlassEffectAPIAvailable } from "expo-glass-effect";
import React, { useEffect, useMemo, useState } from "react";
import { AccessibilityInfo, View } from "react-native";
import type { GlassSurfaceProps } from "./GlassSurface.types";

/**
 * Superficie de una fila de lista — variante iOS con Liquid Glass nativo.
 *
 * Ver "Liquid Glass nativo en iOS — items de lista" en `docs/refactor-plan.md`
 * para el contrato completo. Resumen:
 *
 * - Solo items de lista. No pantallas, ni sheets, ni cards de resumen.
 * - **Dos gates obligatorios**, y si cualquiera falla se renderiza exactamente
 *   la misma fila plana que ve Android:
 *   1. `isGlassEffectAPIAvailable()` — algunas betas de iOS 26 no tienen la API
 *      y *crashean* en lugar de degradar con gracia.
 *   2. `AccessibilityInfo.isReduceTransparencyEnabled()` — si el usuario apagó
 *      la transparencia, no se le impone cristal.
 * - `glassEffectStyle="regular"`: `"clear"` es para overlays sobre contenido
 *   rico; una fila sobre el fondo de la app usa `regular`.
 * - `colorScheme` se ata al tema **de la app**, no al del SO, porque FlowCash
 *   tiene su propio toggle de tema y puede ir en oscuro con el sistema en claro.
 *
 * Caveat del paquete: `opacity: 0` en este `GlassView` o en un padre rompe el
 * efecto. Para animar una fila con cristal se anima un wrapper y se alterna
 * `glassEffectStyle`, nunca la opacidad.
 */
export function GlassSurface({
  style,
  fallbackStyle,
  tintColor,
  isInteractive = false,
  children,
  ...rest
}: GlassSurfaceProps) {
  const { theme } = useTheme();

  // Constante del dispositivo: basta con resolverla una vez por montaje.
  const apiAvailable = useMemo(() => isGlassEffectAPIAvailable(), []);

  const [reduceTransparency, setReduceTransparency] = useState(false);

  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceTransparencyEnabled().then((enabled) => {
      if (active) setReduceTransparency(enabled);
    });
    const sub = AccessibilityInfo.addEventListener(
      "reduceTransparencyChanged",
      setReduceTransparency,
    );
    return () => {
      active = false;
      sub.remove();
    };
  }, []);

  if (!apiAvailable || reduceTransparency) {
    return (
      <View style={[style, fallbackStyle]} {...rest}>
        {children}
      </View>
    );
  }

  return (
    <GlassView
      glassEffectStyle="regular"
      colorScheme={theme}
      tintColor={tintColor}
      isInteractive={isInteractive}
      style={style}
      {...rest}
    >
      {children}
    </GlassView>
  );
}
