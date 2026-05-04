import { IconSymbol } from "@/components/ui/icon-symbol";
import { useTheme } from "@/contexts/ThemeContext";
import STRINGS from "@/i18n/es.json";
import { Stack, useRouter } from "expo-router";
import React from "react";
import { TouchableOpacity } from "react-native";

export default function DashboardLayout() {
  const { colors } = useTheme();
  const router = useRouter();

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
          headerTitleStyle: {
            color: colors.primary,
            fontWeight: "700",
          },
          contentStyle: {
            backgroundColor: colors.background,
          },

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
