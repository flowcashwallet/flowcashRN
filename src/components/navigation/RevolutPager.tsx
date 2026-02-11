import { CustomTabBar } from "@/components/ui/CustomTabBar";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { DrawerActions } from "@react-navigation/native";
import { useNavigation, usePathname, useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  DeviceEventEmitter,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import Animated, {
  interpolateColor,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import Carousel from "react-native-reanimated-carousel";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Import Screens
import AnalyticsScreen from "@/features/analytics/screens/AnalyticsScreen";
import BudgetScreen from "@/features/budget/screens/BudgetScreen";
import VisionScreen from "@/features/vision/screens/VisionScreen";
import WalletScreen from "@/features/wallet/screens/WalletScreen";

const TABS = [
  {
    name: "balance",
    route: "/balance",
    component: VisionScreen,
    icon: "building.columns",
    title: "Balance",
    colorLight: "#F5F3FF", // Violet 50
    colorDark: "#4c1d95", // Violet 900
  },
  {
    name: "index",
    route: "/",
    component: WalletScreen,
    icon: "creditcard",
    title: "Wallet",
    colorLight: "#F1F5F9", // Slate 100
    colorDark: "#0f172a", // Slate 900
  },
  {
    name: "statistics",
    route: "/statistics",
    component: AnalyticsScreen,
    icon: "chart.bar",
    title: "Estadísticas",
    colorLight: "#FFF7ED", // Orange 50
    colorDark: "#7c2d12", // Orange 900
  },
  {
    name: "budget",
    route: "/budget",
    component: BudgetScreen,
    icon: "chart.pie",
    title: "Presupuesto",
    colorLight: "#ECFDF5", // Emerald 50
    colorDark: "#064e3b", // Emerald 900
  },
];

interface RevolutPagerProps {
  onNotificationPress?: () => void;
}

export function RevolutPager({ onNotificationPress }: RevolutPagerProps) {
  const { width, height } = useWindowDimensions();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const pathname = usePathname();
  const router = useRouter();

  // Calculate initial index based on pathname
  const initialIndex = useMemo(() => {
    const idx = TABS.findIndex((tab) => {
      if (tab.route === "/") return pathname === "/" || pathname === "";
      return pathname.startsWith(tab.route);
    });
    // Default to Wallet (index 1) if no match found
    return idx !== -1 ? idx : 1;
  }, []); // Run only once on mount

  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const carouselRef = useRef<any>(null);
  const isForcedSwitch = useRef(false);
  const isMounted = useRef(false);

  // Force scroll to initial index on mount to ensure Carousel is in sync
  useEffect(() => {
    if (carouselRef.current) {
      carouselRef.current.scrollTo({ index: initialIndex, animated: false });
    }
    // Allow a brief moment for layout before enabling URL updates from Carousel
    const timer = setTimeout(() => {
      isMounted.current = true;
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Sync Pager with URL on mount/update
  useEffect(() => {
    // Find tab index matching current pathname
    const tabIndex = TABS.findIndex((tab) => {
      if (tab.route === "/") return pathname === "/" || pathname === "";
      return pathname.startsWith(tab.route);
    });

    if (isForcedSwitch.current) {
      isForcedSwitch.current = false;
      return;
    }

    if (tabIndex !== -1 && tabIndex !== activeIndex) {
      setActiveIndex(tabIndex);
      carouselRef.current?.scrollTo({ index: tabIndex, animated: false });
    }
  }, [pathname]);

  // Listen for external tab switch events (e.g. from TransactionForm)
  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener(
      "event.switchTab",
      (index: number) => {
        isForcedSwitch.current = true;
        setActiveIndex(index);
        carouselRef.current?.scrollTo({ index, animated: false });
      },
    );
    return () => subscription.remove();
  }, []);

  // Animation Values
  const progress = useSharedValue(initialIndex);
  const buttonScale = useSharedValue(1);
  const buttonOpacity = useSharedValue(1);
  const textOpacity = useSharedValue(1);
  const textTranslateY = useSharedValue(0);

  // Background Interpolation
  const bgColors = TABS.map((t) =>
    colorScheme === "dark" ? t.colorDark : t.colorLight,
  );

  const animatedBgStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      progress.value,
      [0, 1, 2, 3],
      bgColors,
    );
    return { backgroundColor };
  });

  // Micro-interaction: Buttons animate on tab change
  useEffect(() => {
    buttonScale.value = 0.8;
    buttonOpacity.value = 0.5;
    buttonScale.value = withSpring(1, { damping: 12 });
    buttonOpacity.value = withTiming(1, { duration: 300 });

    // Text Transition
    textOpacity.value = 0;
    textTranslateY.value = 10;
    textOpacity.value = withTiming(1, { duration: 300 });
    textTranslateY.value = withSpring(0, { damping: 12 });
  }, [activeIndex]);

  const buttonAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: buttonScale.value }],
      opacity: buttonOpacity.value,
    };
  });

  const textAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: textOpacity.value,
      transform: [{ translateY: textTranslateY.value }],
    };
  });

  // Mock Descriptors for CustomTabBar
  const descriptors = useMemo(() => {
    return TABS.reduce((acc: any, tab) => {
      acc[tab.name] = {
        options: {
          tabBarIcon: ({ focused, color }: any) => (
            <IconSymbol
              name={focused ? ((tab.icon + ".fill") as any) : (tab.icon as any)}
              size={24}
              color={color}
            />
          ),
          tabBarAccessibilityLabel: tab.title,
          tabBarButtonTestID: `tab-btn-${tab.name}`,
        },
        key: tab.name,
      };
      return acc;
    }, {});
  }, []);

  const navigationState = {
    index: activeIndex,
    routes: TABS.map((t) => ({ key: t.name, name: t.name })),
  };

  const handleTabPress = (route: any, index: number) => {
    setActiveIndex(index);
    carouselRef.current?.scrollTo({ index, animated: false });

    // Sync URL with Tab Press
    const tab = TABS[index];
    const isAlreadyOnTab =
      tab.name === "index"
        ? pathname === "/" || pathname === ""
        : pathname.includes(tab.name);

    if (!isAlreadyOnTab) {
      router.replace(tab.route as any);
    }
  };

  const toggleDrawer = () => {
    navigation.dispatch(DrawerActions.toggleDrawer());
  };

  return (
    <Animated.View style={[styles.container, animatedBgStyle]}>
      <StatusBar
        barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
      />

      {/* Persistent Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerContent}>
          {/* Left: Menu Button */}
          <TouchableOpacity style={styles.profileButton} onPress={toggleDrawer}>
            <IconSymbol
              name="line.3.horizontal"
              size={28}
              color={colors.text}
            />
          </TouchableOpacity>

          {/* Center: Absolute Title */}
          <View style={styles.titleContainer} pointerEvents="none">
            <Animated.View style={textAnimatedStyle}>
              <Text style={[styles.titleText, { color: colors.text }]}>
                {TABS[activeIndex].title}
              </Text>
            </Animated.View>
          </View>

          {/* Right: Actions */}
          <View style={styles.headerActions}>
            <Animated.View
              style={[buttonAnimatedStyle, { flexDirection: "row", gap: 12 }]}
            >
              {onNotificationPress && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={onNotificationPress}
                >
                  <IconSymbol name="bell.fill" size={24} color={colors.text} />
                </TouchableOpacity>
              )}
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
            </Animated.View>
          </View>
        </View>
      </View>

      {/* Horizontal Pager */}
      <Carousel
        ref={carouselRef}
        key={initialIndex} // Force re-render if initialIndex changes
        defaultIndex={initialIndex}
        loop={false}
        enabled={true}
        width={width}
        height={height}
        data={TABS}
        onProgressChange={(_, absoluteProgress) => {
          progress.value = absoluteProgress;
        }}
        onSnapToItem={(index) => {
          runOnJS(setActiveIndex)(index);

          // Ignore URL updates during initial mount to prevent overwriting correct URL
          if (!isMounted.current) return;

          // Sync URL with Swipe
          const tab = TABS[index];
          const isAlreadyOnTab =
            tab.name === "index"
              ? pathname === "/" || pathname === ""
              : pathname.includes(tab.name);

          if (!isAlreadyOnTab) {
            router.replace(tab.route as any);
          }
        }}
        renderItem={({ item }) => {
          const ScreenComponent = item.component;
          return (
            <View style={[styles.screenContainer]}>
              <ScreenComponent />
            </View>
          );
        }}
      />

      {/* Floating Tab Bar */}
      <CustomTabBar
        state={navigationState as any}
        descriptors={descriptors}
        navigation={{ emit: () => ({ defaultPrevented: false }) } as any} // Mock navigation
        onTabPress={handleTabPress}
        insets={insets}
        scrollProgress={progress}
      />
    </Animated.View>
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
    paddingTop: 100, // Make space for header
  },
});
