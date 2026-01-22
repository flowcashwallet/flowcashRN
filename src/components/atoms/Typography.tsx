import { StyleSheet, Text, type TextProps } from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';

export type TypographyProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  variant?: 'h1' | 'h2' | 'h3' | 'body' | 'bodySmall' | 'caption' | 'button';
  weight?: 'regular' | 'medium' | 'bold';
};

export function Typography({
  style,
  lightColor,
  darkColor,
  variant = 'body',
  weight = 'regular',
  ...rest
}: TypographyProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

  return (
    <Text
      style={[
        { color },
        styles[variant],
        styles[weight],
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  h1: { fontSize: 32, lineHeight: 40 },
  h2: { fontSize: 24, lineHeight: 32 },
  h3: { fontSize: 20, lineHeight: 28 },
  body: { fontSize: 16, lineHeight: 24 },
  bodySmall: { fontSize: 14, lineHeight: 20 },
  caption: { fontSize: 12, lineHeight: 16 },
  button: { fontSize: 16, lineHeight: 24, textTransform: 'uppercase' },

  regular: { fontWeight: '400' },
  medium: { fontWeight: '500' },
  bold: { fontWeight: '700' },
});
