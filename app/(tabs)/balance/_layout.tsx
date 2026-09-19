import { IconSymbol } from "@/components/ui/icon-symbol";
import { useTheme } from "@/contexts/ThemeContext";
import { useMenuPanel } from "@/contexts/MenuPanelContext";
import STRINGS from "@/i18n/es.json";
import { Stack } from "expo-router";
import React from "react";
import { TouchableOpacity } from "react-native";

export default function BalanceLayout() {
  const { colors } = useTheme();
  const { open: openMenu } = useMenuPanel();

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: true,
          headerTransparent: true,
          headerTitle: "Balance",
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
      <Stack.Screen
        name="liability-payments"
        options={{
          headerShown: true,
          headerTransparent: false,
          headerStyle: { backgroundColor: colors.background },
          headerShadowVisible: false,
          headerTitle: "Pagos",
          presentation: "pageSheet",
          sheetAllowedDetents: [0.9],
          contentStyle: {
            backgroundColor: colors.background,
          },
        }}
      />
      <Stack.Screen
        name="liability-payments-management"
        options={{
          headerShown: true,
          headerTransparent: false,
          headerStyle: { backgroundColor: colors.background },
          headerShadowVisible: false,
          headerTitle: "Gestión de pagos",
          presentation: "pageSheet",
          sheetAllowedDetents: [0.9],
          contentStyle: {
            backgroundColor: colors.background,
          },
        }}
      />
    </Stack>
  );
}
