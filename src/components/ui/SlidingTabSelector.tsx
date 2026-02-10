import { Typography } from "@/components/atoms/Typography";
import { BorderRadius, Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import React, { useEffect, useState } from "react";
import {
    LayoutChangeEvent,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from "react-native-reanimated";

interface Tab {
  key: string;
  label: string;
}

interface SlidingTabSelectorProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (key: string) => void;
}

export const SlidingTabSelector: React.FC<SlidingTabSelectorProps> = ({
  tabs,
  activeTab,
  onTabChange,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const [layout, setLayout] = useState({ width: 0, height: 0 });

  const activeIndex = tabs.findIndex((t) => t.key === activeTab);
  const position = useSharedValue(activeIndex);

  useEffect(() => {
    position.value = withSpring(activeIndex, {
      damping: 15,
      stiffness: 150,
    });
  }, [activeIndex]);

  const indicatorStyle = useAnimatedStyle(() => {
    if (layout.width === 0) return {};
    const tabWidth = (layout.width - 8) / tabs.length; // 8 is padding * 2
    return {
      transform: [{ translateX: position.value * tabWidth }],
      width: tabWidth,
    };
  });

  return (
    <View
      style={[styles.container, { backgroundColor: colors.surface }]}
      onLayout={(e: LayoutChangeEvent) => setLayout(e.nativeEvent.layout)}
    >
      {/* Animated Indicator */}
      {layout.width > 0 && (
        <Animated.View
          style={[
            styles.indicator,
            {
              backgroundColor: colors.surfaceActive,
              height: layout.height - 8,
            },
            indicatorStyle,
          ]}
        />
      )}

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => onTabChange(tab.key)}
              style={styles.tab}
              activeOpacity={0.7}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={tab.label}
            >
              <Typography
                variant="body"
                weight="bold"
                style={{
                  color: isActive ? colors.text : colors.textSecondary,
                  zIndex: 1,
                }}
              >
                {tab.label}
              </Typography>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.l,
    padding: 4,
    height: 48,
    justifyContent: "center",
    marginBottom: 16, // Spacing.m
  },
  tabsContainer: {
    flexDirection: "row",
    position: "absolute",
    top: 4,
    left: 4,
    right: 4,
    bottom: 4,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BorderRadius.m,
  },
  indicator: {
    position: "absolute",
    left: 4,
    top: 4,
    borderRadius: BorderRadius.m,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
});
