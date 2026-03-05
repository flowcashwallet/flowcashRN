import { useTheme } from "@/contexts/ThemeContext";
import { registerForPushNotificationsAsync } from "@/services/notifications";
import { Stack, useRouter } from "expo-router";
import React from "react";

export default function WalletLayout() {
  const router = useRouter();
  const { colors } = useTheme();

  const handleNotificationPress = async () => {
    const hasPermission = await registerForPushNotificationsAsync();
    if (hasPermission) {
      router.push("/notifications");
    }
  };

  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="categories"
        options={{
          headerShown: false,
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="subscriptions"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="transaction-form"
        options={{
          headerShown: true,
          presentation: "formSheet",
          headerTitle: "Transacción",
        }}
      />
    </Stack>
  );
}
