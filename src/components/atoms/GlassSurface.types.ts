import type { StyleProp, ViewProps, ViewStyle } from "react-native";

export type GlassSurfaceProps = ViewProps & {
  /**
   * Estilos que **solo** se aplican cuando no hay cristal: el fondo opaco y el
   * hairline de la fila plana. Con `GlassView` activo el material del sistema
   * sustituye a ambos, así que no deben ir en `style`.
   */
  fallbackStyle?: StyleProp<ViewStyle>;
  /**
   * Tinte opcional del cristal. Debe salir de un token del tema
   * (`colors.surface` / `colors.surfaceHighlight`), nunca un hex suelto.
   */
  tintColor?: string;
  /** Solo `true` si la fila entera es pulsable. */
  isInteractive?: boolean;
};
