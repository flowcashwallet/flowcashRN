import { OnboardingTutorial } from "@/components/OnboardingTutorial";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useTheme } from "@/contexts/ThemeContext";
import { registerForPushNotificationsAsync } from "@/services/notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { useEffect, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabLayout() {
  const router = useRouter();
  const [isTutorialVisible, setIsTutorialVisible] = useState(false);
  const { colors } = useTheme();

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
  const insets = useSafeAreaInsets();

  const headerHeight = 60;
  const headerOffset = insets.top;
  const screenTopPadding = headerHeight + headerOffset;

  return (
    <>
      <View
        style={[
          styles.header,
          { paddingTop: headerOffset, height: screenTopPadding },
        ]}
      >
        <View style={styles.headerContent}>
          {/* Left: Menu Button */}
          <TouchableOpacity
            style={styles.profileButton}
            // onPress={() => router.push("/profile")}
          >
            <IconSymbol
              name="line.3.horizontal"
              size={28}
              color={colors.text}
            />
          </TouchableOpacity>

          {/* Center: Absolute Title */}

          {/* Right: Actions */}
          <View style={styles.headerActions}>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleNotificationPress}
              >
                <IconSymbol name="bell.fill" size={24} color={colors.text} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => router.push("/transaction-form")}
              >
                <IconSymbol
                  name="plus.circle.fill"
                  size={28}
                  color={colors.primary}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: "transparent",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    height: 60,
  },
  profileButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  titleContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
    height: 60,
  },
  titleText: {
    fontSize: 18,
    fontWeight: "600",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  screenContainer: {
    flex: 1,
    paddingTop: 0,
  },
});
