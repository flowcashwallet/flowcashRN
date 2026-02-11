import { OnboardingTutorial } from "@/components/OnboardingTutorial";
import { RevolutPager } from "@/components/navigation/RevolutPager";
import { registerForPushNotificationsAsync } from "@/services/notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";

export default function TabLayout() {
  const router = useRouter();
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
    const hasPermission = await registerForPushNotificationsAsync();
    if (hasPermission) {
      router.push("/notifications");
    }
  };

  return (
    <>
      <RevolutPager onNotificationPress={handleNotificationPress} />
      <OnboardingTutorial
        visible={isTutorialVisible}
        onClose={() => setIsTutorialVisible(false)}
      />
    </>
  );
}
