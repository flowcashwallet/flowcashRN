import { IconSymbol } from "@/components/ui/icon-symbol";
import { Spacing, ThemeColors } from "@/constants/theme";
import { Stack } from "expo-router";
import React from "react";
import { StyleSheet, TouchableOpacity } from "react-native";

interface StatisticsScreenStackHeaderProps {
  title: string;
  colors: ThemeColors;
  onBack: () => void;
}

/**
 * Header de `Stack.Screen` compartido por `StatisticsCategoriesScreen` y
 * `StatisticsRecurringScreen` — antes duplicado byte a byte entre ambos.
 *
 * Es configuración del header **nativo**, no una superficie que renderice la
 * app: cae en la primera de las dos excepciones del cristal (el canvas de la
 * pantalla), así que no lleva `GlassSurface`. El pase visual solo le quita el
 * número crudo de espaciado.
 */
export const StatisticsScreenStackHeader: React.FC<
  StatisticsScreenStackHeaderProps
> = ({ title, colors, onBack }) => {
  return (
    <Stack.Screen
      options={{
        title,
        headerLeft: () => (
          <TouchableOpacity
            accessibilityRole="button"
            hitSlop={20}
            onPress={onBack}
            style={styles.backButton}
          >
            <IconSymbol name="chevron.left" size={24} color={colors.text} />
          </TouchableOpacity>
        ),
        headerTintColor: colors.text,
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerShadowVisible: false,
      }}
    />
  );
};

const styles = StyleSheet.create({
  backButton: {
    marginLeft: Spacing.xs,
  },
});
