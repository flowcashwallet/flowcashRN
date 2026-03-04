import { HeaderButton } from "@/components/atoms/HeaderButton";
import { useTheme } from "@/contexts/ThemeContext";
import { registerForPushNotificationsAsync } from "@/services/notifications";
import { Stack, useRouter } from "expo-router";
import React from "react";
import { View } from "react-native";

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
          headerTitle: "",

          headerStyle: {
            backgroundColor: "transparent",
          },
          headerTransparent: true,

          headerLeft: () => (
            <HeaderButton
              imageProps={{ systemName: "line.3.horizontal", name: "menu" }}
            />
          ),
          headerRight: () => (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <HeaderButton
                imageProps={{
                  systemName: "bell",
                  name: "notifications-outline",
                  color: colors.text,
                }}
                buttonProps={{ onPress: handleNotificationPress }}
                style={{ marginRight: 14 }}
              />
              <HeaderButton
                imageProps={{
                  systemName: "plus",
                  name: "add",
                  size: 26,
                  color: colors.primary,
                }}
                buttonProps={{
                  onPress: () => router.push("/transaction-form"),
                }}
              />
            </View>
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
    </Stack>
  );
}
