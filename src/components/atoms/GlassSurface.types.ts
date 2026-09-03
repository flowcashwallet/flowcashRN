import type { StyleProp, ViewProps, ViewStyle } from "react-native";

export type GlassSurfaceProps = ViewProps & {
  /**
   * Estilos que **solo** se aplican cuando no hay cristal: el fondo opaco y el
   * hairline de la superficie plana. Con `GlassView` activo el material del
   * sistema sustituye a ambos, así que no deben ir en `style`.
   */
  fallbackStyle?: StyleProp<ViewStyle>;
  /**
   * Tinte opcional del cristal. Debe salir de un token del tema
   * (`colors.surface` / `colors.surfaceHighlight` / `colors.primary`), nunca un
   * hex suelto.
   */
  tintColor?: string;
  /** Solo `true` si la superficie entera es pulsable (fila, FAB, chip). */
  isInteractive?: boolean;
  /**
   * Escotilla **por instancia** sobre el guard de anidamiento: con `true`, esta
   * superficie pide cristal aunque ya haya cristal por encima.
   *
   * No se salta los dos gates de runtime (API disponible y "reducir
   * transparencia"); lo único que ignora es `useIsInsideGlassSurface()`. Y a
   * diferencia de `GlassNestingBoundary`, **no** resetea el contexto para sus
   * hijos: sigue publicando "hay cristal encima", así que un `GlassSurface` sin
   * `forceGlass` anidado más abajo se aplana igual.
   *
   * Es la forma de vidriar cualquier superficie propia que viva dentro de una
   * card ya vidriada: la caja de una alerta, el panel de un total, el botón que
   * despliega contenido y **también cada fila de una lista repetida** (las
   * transacciones recientes del dashboard, los bloques del desglose semanal).
   * La distinción "destacado vs. repetido" se retiró el 2026-09-02: si tiene
   * superficie propia, lleva cristal.
   *
   * El criterio que queda es de profundidad, no de contenido: se vidria **un
   * nivel** por debajo de la card, no dos. Lo que hay dentro de esa fila ya
   * vidriada (su icono, su toggle, su panel de totales) se queda plano por el
   * guard — apilar un tercer material va contra la guía de Apple y se lee
   * lavado. Ver la sección de anidamiento de `docs/refactor-plan.md`.
   */
  forceGlass?: boolean;
};
