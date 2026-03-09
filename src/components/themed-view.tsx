import { View, type ViewProps } from "react-native";

import { useTheme } from "@/contexts/ThemeContext";

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
};

export function ThemedView({
  style,
  lightColor,
  darkColor,
  children,
  ...otherProps
}: ThemedViewProps) {
  const { colors } = useTheme();
  const backgroundColor = colors.background;

  return (
    <View {...otherProps} style={[{ backgroundColor, flex: 1 }, style]}>
      {children}
    </View>
  );
}
