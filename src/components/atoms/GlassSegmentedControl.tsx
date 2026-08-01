import { BorderRadius } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";

type SegmentedOption<T extends string> = {
  value: T;
  label: string;
};

type GlassSegmentedControlProps<T extends string> = {
  value: T;
  options: readonly [SegmentedOption<T>, SegmentedOption<T>];
  onChange: (value: T) => void;
  width?: number;
  style?: StyleProp<ViewStyle>;
};

export function GlassSegmentedControl<T extends string>({
  value,
  options,
  onChange,
  width = 140,
  style,
}: GlassSegmentedControlProps<T>) {
  const { colors } = useTheme();
  const [containerWidth, setContainerWidth] = useState(0);
  const translateX = useRef(new Animated.Value(0)).current;

  const segmentWidth = useMemo(() => {
    if (!containerWidth) return 0;
    return (containerWidth - 4) / 2;
  }, [containerWidth]);

  const selectedIndex = useMemo(() => {
    return value === options[0].value ? 0 : 1;
  }, [options, value]);

  useEffect(() => {
    if (!segmentWidth) return;
    Animated.spring(translateX, {
      toValue: selectedIndex * segmentWidth,
      useNativeDriver: true,
      damping: 18,
      stiffness: 220,
      mass: 0.9,
    }).start();
  }, [segmentWidth, selectedIndex, translateX]);

  return (
    <View
      style={[
        {
          width,
          borderRadius: BorderRadius.round,
          overflow: "hidden",
          backgroundColor: colors.glass.cardBg,
          borderWidth: 1,
          borderColor: colors.glass.cardBorder,
          padding: 2,
        },
        style,
      ]}
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
    >
      {segmentWidth ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.indicator,
            {
              width: segmentWidth,
              borderRadius: BorderRadius.round,
              backgroundColor: colors.primary,
              transform: [{ translateX }],
            },
          ]}
        />
      ) : null}

      <View style={{ flexDirection: "row" }}>
        <TouchableOpacity
          onPress={() => onChange(options[0].value)}
          activeOpacity={0.85}
          style={{ flex: 1, paddingVertical: 8, alignItems: "center" }}
        >
          <Text
            style={{
              color: selectedIndex === 0 ? "#FFFFFF" : colors.textSecondary,
              fontWeight: "800",
              fontSize: 12,
              letterSpacing: 0.2,
            }}
          >
            {options[0].label}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onChange(options[1].value)}
          activeOpacity={0.85}
          style={{ flex: 1, paddingVertical: 8, alignItems: "center" }}
        >
          <Text
            style={{
              color: selectedIndex === 1 ? "#FFFFFF" : colors.textSecondary,
              fontWeight: "800",
              fontSize: 12,
              letterSpacing: 0.2,
            }}
          >
            {options[1].label}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  indicator: {
    position: "absolute",
    top: 2,
    bottom: 2,
    left: 2,
    borderWidth: 1,
    overflow: "hidden",
  },
});
