import { Stack } from "expo-router";
import { useTheme } from "@/contexts/ThemeContext";

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
    </Stack>
  );
}
