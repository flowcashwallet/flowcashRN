import { useTheme } from "@/contexts/ThemeContext";
import { Stack } from "expo-router";

export default function BalanceLayout() {
  const { colors } = useTheme();

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: true,
          headerTransparent: true,
          headerTitle: "Balance",
          headerLargeTitle: false,
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
          headerTitle: "Pagos",
          presentation: "formSheet",
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
          headerTransparent: true,
          headerTitle: "Gestión de pagos",
          presentation: "formSheet",
          sheetAllowedDetents: [0.9],
          contentStyle: {
            backgroundColor: colors.background,
          },
        }}
      />
    </Stack>
  );
}
