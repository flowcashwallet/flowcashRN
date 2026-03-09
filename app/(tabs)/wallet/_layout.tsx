import { useTheme } from "@/contexts/ThemeContext";
import { registerForPushNotificationsAsync } from "@/services/notifications";
import { Stack, useRouter } from "expo-router";
import React from "react";
import {
  SafeAreaProvider,
  initialWindowMetrics,
} from "react-native-safe-area-context";
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
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <Stack>
        <Stack.Screen
          name="index"
          options={{
            headerShown: true,
            headerTransparent: true,
            // headerBlurEffect: "regular",
            headerTitle: "Wallet",
            headerLargeTitleEnabled: false,
            contentStyle: {
              backgroundColor: colors.background,
            },
            unstable_headerRightItems: () => [
              {
                type: "button",
                label: " ",
                icon: {
                  type: "sfSymbol",
                  name: "bell",
                },
                tintColor: colors.text,
                onPress: handleNotificationPress,
                sharesBackground: false,
              },
              {
                type: "menu",
                label: " ",
                icon: {
                  type: "sfSymbol",
                  name: "plus",
                },
                tintColor: colors.primary,
                menu: {
                  title: "Nueva Transacción",
                  items: [
                    {
                      id: "income",
                      type: "action",
                      label: "Ingreso",
                      title: "Ingreso",
                      icon: {
                        type: "sfSymbol",
                        name: "arrow.down.left",
                      },
                      onPress: () =>
                        router.push({
                          pathname: "/wallet/transaction-form",
                          params: { initialType: "income" },
                        }),
                    },
                    {
                      id: "expense",
                      type: "action",
                      label: "Gasto",
                      title: "Gasto",
                      icon: {
                        type: "sfSymbol",
                        name: "arrow.up.right",
                      },
                      onPress: () =>
                        router.push({
                          pathname: "/wallet/transaction-form",
                          params: { initialType: "expense" },
                        }),
                    },
                    {
                      id: "transfer",
                      type: "action",
                      label: "Transferir",
                      title: "Transferir",
                      icon: {
                        type: "sfSymbol",
                        name: "arrow.left.arrow.right",
                      },
                      onPress: () =>
                        router.push({
                          pathname: "/wallet/transaction-form",
                          params: { initialType: "transfer" },
                        }),
                    },
                  ],
                },
              },
            ],
            unstable_headerLeftItems: () => [
              {
                type: "button",
                label: " ",
                icon: {
                  type: "sfSymbol",
                  name: "line.3.horizontal",
                },
                tintColor: colors.text,
                onPress: () => {},
              },
            ],
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
    </SafeAreaProvider>
  );
}
