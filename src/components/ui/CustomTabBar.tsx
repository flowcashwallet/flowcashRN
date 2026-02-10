import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
// import { BlurView } from "expo-blur"; // Commented out to avoid crash if native module missing
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import {
    LayoutChangeEvent,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";
import Animated, {
    SharedValue,
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withSpring,
    withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Separate component for individual tab item to use Hooks correctly
const TabItem = ({
  route,
  index,
  state,
  descriptors,
  onTabPress,
  colors,
}: {
  route: any;
  index: number;
  state: any;
  descriptors: any;
  onTabPress: (route: any, index: number) => void;
  colors: any;
}) => {
  const { options } = descriptors[route.key];
  const isFocused = state.index === index;

  // Animation for scaling active tab
  const scale = useSharedValue(1);

  useEffect(() => {
    if (isFocused) {
      // Subtle scale up for icon
      scale.value = withSpring(1.2, {
        mass: 0.5,
        damping: 12,
        stiffness: 250,
      });
    } else {
      scale.value = withSpring(1, { mass: 0.5 });
    }
  }, [isFocused]);

  const iconAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const onPress = () => {
    onTabPress(route, index);
  };

  const iconColor = isFocused ? colors.primary : colors.textSecondary;

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      accessibilityLabel={options.tabBarAccessibilityLabel}
      testID={options.tabBarButtonTestID}
      onPress={onPress}
      style={[styles.tabItem]}
    >
      <Animated.View style={iconAnimatedStyle}>
        {options.tabBarIcon
          ? options.tabBarIcon({
              focused: isFocused,
              color: iconColor,
              size: 24,
            })
          : null}
      </Animated.View>
    </TouchableOpacity>
  );
};

export function CustomTabBar({
  state,
  descriptors,
  navigation,
  onTabPress, // Optional prop for manual control
  scrollProgress, // New prop: SharedValue from Carousel
}: BottomTabBarProps & {
  onTabPress?: (route: any, index: number) => void;
  scrollProgress?: SharedValue<number>;
}) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const insets = useSafeAreaInsets();
  const [layout, setLayout] = useState({ width: 0, height: 0 });

  const translateX = useSharedValue(0);
  const indicatorScale = useSharedValue(1);

  // Calculate tab width based on container width
  const tabWidth = layout.width / state.routes.length;

  useEffect(() => {
    if (tabWidth > 0) {
      if (!scrollProgress) {
        // Fallback: Animate based on index if no scrollProgress provided
        translateX.value = withSpring(state.index * tabWidth, {
          damping: 15,
          stiffness: 200,
        });
      }

      // Indicator Bounce Effect: Scale up then settle
      indicatorScale.value = withSequence(
        withTiming(1.2, { duration: 150 }), // Stretch/Grow
        withSpring(1, { damping: 12, stiffness: 200 }), // Bounce back
      );
    }
  }, [state.index, tabWidth, scrollProgress]);

  // If scrollProgress is provided, drive animation directly from it
  const animatedStyle = useAnimatedStyle(() => {
    if (tabWidth > 0 && scrollProgress) {
      return {
        transform: [
          { translateX: scrollProgress.value * tabWidth },
          { scaleX: indicatorScale.value }, // Apply bounce scale
        ],
        width: tabWidth,
      };
    }
    return {
      transform: [
        { translateX: translateX.value },
        { scaleX: indicatorScale.value }, // Apply bounce scale
      ],
      width: tabWidth,
    };
  });

  const handleTabPress = (route: any, index: number) => {
    if (onTabPress) {
      onTabPress(route, index);
      return;
    }

    const event = navigation.emit({
      type: "tabPress",
      target: route.key,
      canPreventDefault: true,
    });

    if (state.index !== index && !event.defaultPrevented) {
      Haptics.selectionAsync();
      navigation.navigate(route.name, route.params);
    }
  };

  return (
    <View style={[styles.floatingContainer, { bottom: insets.bottom + 10 }]}>
      <View
        // Replaced BlurView with View for stability (Glassmorphism simulation)
        style={[
          styles.blurContainer,
          {
            backgroundColor:
              colorScheme === "dark"
                ? "rgba(30, 41, 59, 0.95)" // Dark Slate with high opacity
                : "rgba(255, 255, 255, 0.95)", // White with high opacity
            borderColor: colors.border,
            borderWidth: 1, // Ensure border is visible
          },
        ]}
        onLayout={(e: LayoutChangeEvent) => setLayout(e.nativeEvent.layout)}
      >
        {/* Sliding Indicator */}
        {layout.width > 0 && (
          <Animated.View style={[styles.indicatorContainer, animatedStyle]}>
            <View
              style={[
                styles.indicator,
                {
                  backgroundColor: colors.surfaceHighlight, // Subtle highlight for active tab
                },
              ]}
            />
          </Animated.View>
        )}

        {/* Tabs */}
        <View style={styles.tabsRow}>
          {state.routes.map((route: any, index: number) => (
            <TabItem
              key={route.key}
              route={route}
              index={index}
              state={state}
              descriptors={descriptors}
              onTabPress={handleTabPress}
              colors={colors}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  floatingContainer: {
    position: "absolute",
    left: 20,
    right: 20,
    height: 70,
    borderRadius: 35,
    overflow: "hidden", // Ensure blur respects border radius
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
  },
  blurContainer: {
    flex: 1,
    borderRadius: 35,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  tabsRow: {
    flexDirection: "row",
    height: "100%",
    alignItems: "center",
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
  },
  indicatorContainer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  indicator: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
});
