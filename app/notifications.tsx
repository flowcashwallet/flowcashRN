import { IconSymbol } from "@/components/ui/icon-symbol";
import { useTheme } from "@/contexts/ThemeContext";
import NotificationsScreen from "@/features/notifications/screens/NotificationsScreen";
import { Stack, useRouter } from "expo-router";
import { TouchableOpacity } from "react-native";

export default function NotificationsRoute() {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <>
      <Stack.Screen
        options={{
          title: "Recordatorios",
          headerLeft: () => (
            <TouchableOpacity
              accessibilityRole="button"
              hitSlop={20}
              onPress={() => router.back()}
              style={{ marginLeft: 5 }}
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
      <NotificationsScreen />
    </>
  );
}
