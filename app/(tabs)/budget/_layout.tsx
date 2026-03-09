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
          headerTitle: "Presupuesto",
          headerLargeTitle: false,
          contentStyle: {
            backgroundColor: colors.background,
          },
        }}
      />
    </Stack>
  );
}
