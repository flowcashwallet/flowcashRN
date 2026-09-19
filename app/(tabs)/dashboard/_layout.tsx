import { IconSymbol } from "@/components/ui/icon-symbol";
import { useTheme } from "@/contexts/ThemeContext";
import { useMenuPanel } from "@/contexts/MenuPanelContext";
import STRINGS from "@/i18n/es.json";
import { Stack, useRouter } from "expo-router";
import React from "react";
import { TouchableOpacity } from "react-native";

export default function DashboardLayout() {
  const { colors } = useTheme();
  const router = useRouter();
  const { open: openMenu } = useMenuPanel();

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: true,
          headerTransparent: true,
          headerShadowVisible: false,
          headerTitle: STRINGS.dashboard.title,
          headerTitleAlign: "center",
          headerLeft: () => (
            <TouchableOpacity onPress={openMenu} accessibilityRole="button" accessibilityLabel={STRINGS.menu.openMenu}>
              <IconSymbol
                name="line.3.horizontal"
                size={20}
                color={colors.text}
              />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity onPress={() => router.push("/notifications")}>
              <IconSymbol
                name="bell.fill"
                size={18}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          ),
        }}
      />
    </Stack>
  );
}
