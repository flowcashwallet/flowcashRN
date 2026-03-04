import { View, type ViewProps } from "react-native";

import { useTheme } from "@/contexts/ThemeContext";
import { SafeAreaView } from "react-native-safe-area-context";

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
    <View style={[{ backgroundColor, flex: 1 }]}>
      <SafeAreaView
        edges={["top", "bottom"]}
        style={[{ flex: 1 }, style]}
        {...otherProps}
      >
        {children}
      </SafeAreaView>
    </View>
  );
}
