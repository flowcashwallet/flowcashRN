/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";

type ThemeName = keyof typeof Colors;
type StringColorKey = {
  [K in keyof typeof Colors.light & keyof typeof Colors.dark]: typeof Colors.light[K] extends string
    ? (typeof Colors.dark[K] extends string ? K : never)
    : never;
}[keyof typeof Colors.light & keyof typeof Colors.dark];

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: StringColorKey,
): string {
  const { theme } = useTheme();
  const colorFromProps = props[theme as ThemeName];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return Colors[theme as ThemeName][colorName] as string;
  }
}
