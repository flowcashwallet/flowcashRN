import React, { createContext, useContext, type ReactNode } from "react";

/**
 * "Ya hay cristal por encima de ti."
 *
 * La regla de "nunca apilar vidrio sobre vidrio" (ver "Qué NO lleva vidrio" en
 * `docs/refactor-plan.md`) no se puede resolver a mano pantalla por pantalla:
 * desde que el alcance es "toda superficie propia lleva cristal", el mismo
 * componente tiene que comportarse distinto según dónde se monte —
 * `TransactionItem` es cristal suelto en `WalletScreen` y debe aplanarse dentro
 * de una card de sección que ya es cristal.
 *
 * Por eso el estado vive en el árbol de React y no en el llamante: la variante
 * iOS de `GlassSurface` publica `true` a sus hijos cuando de verdad renderiza
 * `GlassView`, y cualquier `GlassSurface` que se monte debajo lo lee y se
 * renderiza plana sin preguntar nada más. Un componente sigue pudiendo pedir
 * cristal sin saber en qué pantalla vive; decide el primitivo.
 *
 * Se define en un archivo aparte —y no en `GlassSurface.ios.tsx`— porque Metro
 * resuelve una variante distinta por plataforma y ambas deben compartir el
 * *mismo* objeto de contexto. Este archivo no importa `expo-glass-effect`, así
 * que sigue siendo seguro en Android/web.
 */
const GlassNestingContext = createContext(false);

/** `true` si algún ancestro ya está renderizando cristal nativo. */
export function useIsInsideGlassSurface(): boolean {
  return useContext(GlassNestingContext);
}

/**
 * Marca su subárbol como "dentro de cristal". Lo usa la variante iOS de
 * `GlassSurface` cuando de verdad renderiza `GlassView`.
 */
export function GlassNestingProvider({ children }: { children: ReactNode }) {
  return (
    <GlassNestingContext.Provider value={true}>
      {children}
    </GlassNestingContext.Provider>
  );
}

/**
 * Reinicia el marcador para su subárbol.
 *
 * Solo tiene sentido cuando el contenido se pinta en **otra ventana** y por
 * tanto no está visualmente encima de la superficie del ancestro, aunque sí lo
 * esté en el árbol de React: hoy, el `Modal` de `BottomSheet`. Un sheet abierto
 * desde dentro de otro sheet se lee contra el backdrop oscurecido del de
 * fuera, no contra su cristal, así que sí puede (y debe) ser cristal — es el
 * apilado de sheets de iOS, y está documentado como correcto en la "Auditoría
 * de anidamiento" del plan.
 */
export function GlassNestingBoundary({ children }: { children: ReactNode }) {
  return (
    <GlassNestingContext.Provider value={false}>
      {children}
    </GlassNestingContext.Provider>
  );
}
