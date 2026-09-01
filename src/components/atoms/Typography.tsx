import {
  FontWeight,
  TypographyScale,
  type TypographyVariant,
} from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";
import { StyleSheet, Text, type TextProps, type TextStyle } from "react-native";

/**
 * Alias legados. `h1`/`h2`/`h3` mapean a `title`/`heading`/`subheading` para no
 * romper los usos existentes. No usar en código nuevo — ver la escala tipográfica
 * en `src/constants/theme.ts` y la sección "Dirección estética" del plan.
 */
const LEGACY_VARIANTS = {
  h1: "title",
  h2: "heading",
  h3: "subheading",
} as const;

type LegacyVariant = keyof typeof LEGACY_VARIANTS;

export type TypographyProps = TextProps & {
  /** Override de color para tema claro. Preferir tokens sobre literales. */
  lightColor?: string;
  /** Override de color para tema oscuro. Preferir tokens sobre literales. */
  darkColor?: string;
  variant?: TypographyVariant | LegacyVariant;
  /** Override del peso que trae la variante. */
  weight?: keyof typeof FontWeight;
  /** Usa el color secundario del tema en lugar del color de texto principal. */
  muted?: boolean;
};

function resolveVariant(
  variant: TypographyVariant | LegacyVariant,
): TypographyVariant {
  return variant in LEGACY_VARIANTS
    ? LEGACY_VARIANTS[variant as LegacyVariant]
    : (variant as TypographyVariant);
}

export function Typography({
  style,
  lightColor,
  darkColor,
  variant = "body",
  weight,
  muted = false,
  ...rest
}: TypographyProps) {
  const { colors, theme } = useTheme();

  const override = theme === "light" ? lightColor : darkColor;
  const color = override ?? (muted ? colors.textSecondary : colors.text);

  const resolved = resolveVariant(variant);

  return (
    <Text
      style={[
        { color },
        styles[resolved],
        weight ? { fontWeight: FontWeight[weight] } : null,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  display: TypographyScale.display as TextStyle,
  title: TypographyScale.title as TextStyle,
  heading: TypographyScale.heading as TextStyle,
  subheading: TypographyScale.subheading as TextStyle,
  body: TypographyScale.body as TextStyle,
  bodySmall: TypographyScale.bodySmall as TextStyle,
  caption: TypographyScale.caption as TextStyle,
  overline: {
    ...(TypographyScale.overline as TextStyle),
    textTransform: "uppercase",
  },
  button: TypographyScale.button as TextStyle,
  /**
   * Firma visual: toda cifra en listas y tablas usa dígitos tabulares y se alinea
   * a la derecha, para que las columnas de importes cuadren como en un libro contable.
   */
  number: {
    ...(TypographyScale.number as TextStyle),
    fontVariant: ["tabular-nums"],
    textAlign: "right",
  },
});
