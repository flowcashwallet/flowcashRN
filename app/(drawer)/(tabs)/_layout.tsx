import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import STRINGS from "@/i18n/es.json";
import { DrawerActions } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { Tabs, useNavigation } from "expo-router";
import React from "react";
import { StyleSheet, TouchableOpacity } from "react-native";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const navigation = useNavigation();
  const colors = Colors[colorScheme ?? "light"];

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#FFF",
        tabBarInactiveTintColor: "rgba(255,255,255,0.6)",
        headerShown: true,
        tabBarButton: HapticTab,
        headerBackground: () => (
          <LinearGradient
            colors={["#8E2DE2", "#4A00E0"]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
        ),
        headerTintColor: "#FFF",
        headerTitleStyle: {
          fontWeight: "bold",
        },
        tabBarBackground: () => (
          <LinearGradient
            colors={["#8E2DE2", "#4A00E0"]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
        ),
        tabBarStyle: {
          position: "absolute",
          bottom: 0,
          left: 16,
          right: 16,
          borderRadius: 15,
          height: 80,
          paddingBottom: 0, // Remove default padding for icon centering
          borderTopWidth: 0,
          elevation: 10,
          shadowColor: "#4A00E0",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          overflow: "hidden", // Clip the gradient to border radius
        },
        tabBarItemStyle: {
          paddingVertical: 8,
        },
        headerLeft: () => (
          <TouchableOpacity
            onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
            style={{ marginLeft: 16 }}
          >
            <IconSymbol name="line.3.horizontal" size={24} color="#FFF" />
          </TouchableOpacity>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: STRINGS.tabs.wallet,
          tabBarIcon: ({ color }) => (
            <IconSymbol size={24} name="creditcard.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="budget"
        options={{
          title: STRINGS.tabs.budget,
          tabBarIcon: ({ color }) => (
            <IconSymbol size={24} name="chart.pie.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="vision"
        options={{
          title: STRINGS.tabs.vision,
          tabBarIcon: ({ color }) => (
            <IconSymbol size={24} name="eye.fill" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
