import CategoriesScreen from "@/features/wallet/screens/CategoriesScreen";
import { Stack } from "expo-router";
import React from "react";

export default function CategoriesRoute() {
  return (
    <>
      <Stack.Screen
        options={{
          title: "Categorías",
          headerShown: true,
          presentation: "card",
        }}
      />
      <CategoriesScreen />
    </>
  );
}
