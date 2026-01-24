import { Stack } from "expo-router";
import React from "react";

export default function WalletLayout() {
  return (
    <Stack>
      <Stack.Screen name="categories" />
    </Stack>
  );
}
