import { NotificationDashboardModal } from "@/components/NotificationDashboardModal";
import { OnboardingTutorial } from "@/components/OnboardingTutorial";
import { RevolutPager } from "@/components/navigation/RevolutPager";
import { registerForPushNotificationsAsync } from "@/services/notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";

export default function TabLayout() {
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
      <RevolutPager onNotificationPress={handleNotificationPress} />
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
