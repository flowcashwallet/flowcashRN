import { NotificationDashboardModal } from "@/components/NotificationDashboardModal";
import { OnboardingTutorial } from "@/components/OnboardingTutorial";
import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import STRINGS from "@/i18n/es.json";
import { registerForPushNotificationsAsync } from "@/services/notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DrawerActions } from "@react-navigation/native";
import { Tabs, useNavigation } from "expo-router";
import React, { useEffect, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const navigation = useNavigation();
  const colors = Colors[colorScheme ?? "light"];
  const [isNotificationModalVisible, setIsNotificationModalVisible] =
    useState(false);
  const [isTutorialVisible, setIsTutorialVisible] = useState(false);

  useEffect(() => {
    checkTutorial();
  }, []);

  const checkTutorial = async () => {
    try {
      const hasSeen = await AsyncStorage.getItem("has_seen_onboarding_v1");
      if (!hasSeen) {
        setIsTutorialVisible(true);
      }
    } catch (error) {
      console.error("Error checking tutorial status:", error);
    }
  };

  const handleNotificationPress = async () => {
    await registerForPushNotificationsAsync();
    setIsNotificationModalVisible(true);
  };

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: colors.primary, // Use theme primary (Light Blue in Dark Mode)
          tabBarInactiveTintColor: colors.textSecondary,
          headerShown: true,
          tabBarButton: HapticTab,
          headerBackground: () => (
            <View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: colors.surfaceHighlight }, // Solid dark header
              ]}
            />
          ),
          headerTintColor: colors.text,
          headerTitleStyle: {
            fontWeight: "bold",
          },
          tabBarBackground: () => (
            <View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: colors.surfaceHighlight || colors.surface }, // Solid dark tab bar
              ]}
            />
          ),
          tabBarStyle: {
            position: "absolute",
            bottom: 0,
            left: 16,
            right: 16,
            borderRadius: 20,
            height: 80,
            paddingBottom: 0,
            borderTopWidth: 0,
            backgroundColor: colors.surfaceHighlight || colors.surface, // Ensure background is set
            elevation: 0, // Flat design
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 10,
          },
          tabBarItemStyle: {
            paddingVertical: 10,
          },
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
              style={{ marginLeft: 16 }}
            >
              <IconSymbol
                name="line.3.horizontal"
                size={24}
                color={colors.text}
              />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <TouchableOpacity
                onPress={() => setIsTutorialVisible(true)}
                style={{ marginRight: 16 }}
              >
                <IconSymbol
                  name="questionmark.circle.fill"
                  size={24}
                  color={colors.text}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleNotificationPress}
                style={{ marginRight: 16 }}
              >
                <IconSymbol name="bell.fill" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
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
          name="balance"
          options={{
            title: STRINGS.tabs.vision,
            tabBarIcon: ({ color }) => (
              <IconSymbol
                size={24}
                name="building.columns.fill"
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="statistics"
          options={{
            title: STRINGS.tabs.statistics,
            tabBarIcon: ({ color }) => (
              <IconSymbol size={24} name="chart.bar.fill" color={color} />
            ),
          }}
        />
      </Tabs>
      <NotificationDashboardModal
        visible={isNotificationModalVisible}
        onClose={() => setIsNotificationModalVisible(false)}
      />
      <OnboardingTutorial
        visible={isTutorialVisible}
        onClose={() => setIsTutorialVisible(false)}
      />
    </>
  );
}
