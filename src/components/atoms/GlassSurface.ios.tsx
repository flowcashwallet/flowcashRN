import { useTheme } from "@/contexts/ThemeContext";
import { GlassView, isGlassEffectAPIAvailable } from "expo-glass-effect";
import React, { useEffect, useMemo, useState } from "react";
import { AccessibilityInfo, View } from "react-native";
import {
  GlassNestingProvider,
  useIsInsideGlassSurface,
} from "./GlassSurface.nesting";
import type { GlassSurfaceProps } from "./GlassSurface.types";

/**
 * Los dos gates obligatorios del Liquid Glass nativo, en un solo sitio.
 *
 * 1. `isGlassEffectAPIAvailable()` — algunas betas de iOS 26 no tienen la API y
 *    *crashean* en lugar de degradar con gracia.
 * 2. `AccessibilityInfo.isReduceTransparencyEnabled()` — si el usuario apagó la
 *    transparencia, no se le impone cristal.
 *
 * Se exporta además de usarse aquí porque hay decisiones **fuera** de la
 * superficie que dependen de si hay cristal o no; en concreto, el caveat de
 * `opacity: 0` (ver abajo) obliga a `BottomSheet` y a `FloatingActionMenu` a
 * saltarse su fundido de entrada cuando el panel es de cristal. La variante
 * genérica (`GlassSurface.tsx`) devuelve `false` sin tocar nada nativo.
 */
export function useGlassSurfaceActive(): boolean {
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

  return apiAvailable && !reduceTransparency;
}

/**
 * Superficie flotante compartida — variante iOS con Liquid Glass nativo.
 *
 * Ver "Liquid Glass nativo en iOS — toda la superficie flotante de la pantalla"
 * en `docs/refactor-plan.md` para el contrato completo. Resumen:
 *
 * - Vale para **cualquier superficie propia**: filas de lista, headers/toolbars,
 *   controles flotantes (segmented, FAB), el panel de un `BottomSheet`, el menú
 *   de un FAB y también las cards y paneles de sección. Solo hay dos
 *   excepciones: el fondo/canvas de la pantalla —es el opaco contra el que se
 *   lee el material— y cualquier cosa que ya viva dentro de otra superficie de
 *   cristal, porque nunca se apila cristal sobre cristal.
 * - **El anidamiento se resuelve solo**: cuando esta superficie renderiza
 *   cristal de verdad, publica `GlassNestingProvider` a sus hijos; si al montarse
 *   encuentra que ya hay cristal arriba, se renderiza plana aunque los dos gates
 *   pasen. Así `TransactionItem` puede ser cristal suelto en una pantalla y
 *   aplanarse dentro de una card vidriada sin que el llamante sepa nada.
 * - **`forceGlass` es la escotilla por instancia** de esa regla, para cualquier
 *   superficie propia que viva dentro de una card ya vidriada — incluidas las
 *   filas repetidas de una lista, desde que esa excepción se retiró
 *   (2026-09-02). Solo se salta el guard de anidamiento: los dos gates siguen
 *   mandando, y el subárbol de debajo sigue viendo "hay cristal encima", así que
 *   el tercer nivel se aplana solo.
 * - **Dos gates obligatorios** (`useGlassSurfaceActive()`), y si cualquiera
 *   falla se renderiza exactamente la misma superficie plana que ve Android.
 * - `glassEffectStyle="regular"`: `"clear"` es para overlays sobre contenido
 *   rico; una superficie sobre el fondo de la app usa `regular`.
 * - `colorScheme` se ata al tema **de la app**, no al del SO, porque FlowCash
 *   tiene su propio toggle de tema y puede ir en oscuro con el sistema en claro.
 *
 * Caveat del paquete: `opacity: 0` en este `GlassView` o en un padre rompe el
 * efecto. Por eso ningún llamante debe animar la opacidad de un ancestro de
 * esta superficie; si necesita saberlo para decidir, que use
 * `useGlassSurfaceActive()`.
 */
export function GlassSurface({
  style,
  fallbackStyle,
  tintColor,
  isInteractive = false,
  forceGlass = false,
  children,
  ...rest
}: GlassSurfaceProps) {
  const { theme } = useTheme();
  // El guard de anidamiento manda sobre los gates: dentro de otro cristal no se
  // vidria aunque el dispositivo lo soporte. `forceGlass` exime a *esta*
  // instancia de ese guard, y solo de ese guard: los dos gates de runtime
  // siguen decidiendo primero, porque son los que evitan el crash en betas sin
  // API y los que respetan "reducir transparencia".
  const insideGlass = useIsInsideGlassSurface();
  const glassActive = useGlassSurfaceActive() && (!insideGlass || forceGlass);

  if (!glassActive) {
    // Sin `GlassNestingProvider`: una superficie plana no es cristal, y si el
    // motivo de estar plana es que ya hay cristal arriba, el contexto sigue
    // valiendo `true` para los descendientes por el Provider del ancestro.
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
      {/*
        También cuando el cristal viene de `forceGlass`: aquí hay cristal de
        verdad, así que el subárbol tiene que verlo. La escotilla es por
        instancia, no para toda la rama — eso es `GlassNestingBoundary`.
      */}
      <GlassNestingProvider>{children}</GlassNestingProvider>
    </GlassView>
  );
}
