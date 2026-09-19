import { IconSymbol } from "@/components/ui/icon-symbol";
import { useTheme } from "@/contexts/ThemeContext";
import { useMenuPanel } from "@/contexts/MenuPanelContext";
import STRINGS from "@/i18n/es.json";
import { Stack } from "expo-router";
import React from "react";
import { TouchableOpacity } from "react-native";

/**
 * Antes `app/(tabs)/statistics.tsx` era un archivo plano sin ningún Stack
 * propio, así que no tenía header/chrome nativo — no había dónde colgar el
 * ícono de menú. Convertirlo en carpeta (mismo patrón que budget/balance)
 * le da ese header sin cambiar el nombre de ruta que ya usa
 * `NativeTabs.Trigger name="statistics"` en `(tabs)/_layout.tsx`.
 */
export default function StatisticsLayout() {
  const { colors } = useTheme();
  const { open: openMenu } = useMenuPanel();

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: true,
          headerTransparent: true,
          headerTitle: STRINGS.tabs.statistics,
          headerLargeTitle: false,
          headerLeft: () => (
            <TouchableOpacity onPress={openMenu} accessibilityRole="button" accessibilityLabel={STRINGS.menu.openMenu}>
              <IconSymbol name="line.3.horizontal" size={20} color={colors.text} />
            </TouchableOpacity>
          ),
          contentStyle: {
            backgroundColor: colors.background,
          },
        }}
      />
    </Stack>
  );
}
