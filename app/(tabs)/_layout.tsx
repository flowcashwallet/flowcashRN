import { OnboardingTutorial } from "@/components/OnboardingTutorial";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { useEffect, useState } from "react";

export default function TabLayout() {
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

  return (
    <>
      <NativeTabs>
        <NativeTabs.Trigger name="wallet">
          <NativeTabs.Trigger.Icon sf="wallet.bifold.fill" md="wallet" />
          <NativeTabs.Trigger.Label>Wallet</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="balance">
          <NativeTabs.Trigger.Icon sf="bahtsign.bank.building" md="build" />
          <NativeTabs.Trigger.Label>Balance</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="budget">
          <NativeTabs.Trigger.Icon sf="chart.bar.fill" md="chart_data" />
          <NativeTabs.Trigger.Label>Budget</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="statistics">
          <NativeTabs.Trigger.Icon sf="chart.pie.fill" md="pie_chart" />
          <NativeTabs.Trigger.Label>Statistics</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
      </NativeTabs>
      <OnboardingTutorial
        visible={isTutorialVisible}
        onClose={() => setIsTutorialVisible(false)}
      />
    </>
  );
}
