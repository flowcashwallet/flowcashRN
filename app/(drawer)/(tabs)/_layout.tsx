import { Tabs, useNavigation } from "expo-router";
import React from "react";
import { TouchableOpacity } from "react-native";
import { DrawerActions } from "@react-navigation/native";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import STRINGS from "@/i18n/es.json";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const navigation = useNavigation();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        headerShown: true,
        tabBarButton: HapticTab,
        headerLeft: () => (
          <TouchableOpacity
            onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
            style={{ marginLeft: 16 }}
          >
            <IconSymbol
              name="line.3.horizontal"
              size={24}
              color={Colors[colorScheme ?? "light"].text}
            />
          </TouchableOpacity>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: STRINGS.tabs.wallet,
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="creditcard.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="budget"
        options={{
          title: STRINGS.tabs.budget,
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="chart.pie.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="vision"
        options={{
          title: STRINGS.tabs.vision,
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="eye.fill" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
