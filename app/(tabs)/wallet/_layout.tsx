import { HeaderButton } from "@/components/atoms/HeaderButton";
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
      <Stack.Screen
        name="index"
        options={{
          headerShown: true,
          headerTransparent: true,
          headerTitle: "Wallet",
          headerRight: () => (
            <>
              <HeaderButton
                imageProps={{
                  systemName: "bell",
                  name: "notifications-outline",
                  color: colors.text,
                }}
                buttonProps={{ onPress: handleNotificationPress }}
              />
              <HeaderButton
                imageProps={{
                  systemName: "plus",
                  name: "add",
                  size: 26,
                  color: colors.primary,
                }}
                buttonProps={
                  {
                    // onPress: () => router.push("/wallet/transaction-form"),
                  }
                }
              />
            </>
          ),
          headerLeft: () => (
            <HeaderButton
              imageProps={{ systemName: "line.3.horizontal", name: "menu" }}
            />
          ),
        }}
      />
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
          headerTransparent: true,
          headerTitle: "Transacción",
          headerBlurEffect: "regular",
          sheetAllowedDetents: [0.9],
          contentStyle: {
            backgroundColor: "transparent",
          },
        }}
      />
    </Stack>
  );
}
