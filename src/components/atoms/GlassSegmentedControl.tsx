import { Typography } from "@/components/atoms/Typography";
import { BorderRadius, Spacing } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  StyleProp,
  StyleSheet,
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
        styles.container,
        {
          width,
          backgroundColor: colors.surfaceHighlight,
          borderColor: colors.border,
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
              backgroundColor: colors.primary,
              transform: [{ translateX }],
            },
          ]}
        />
      ) : null}

      <View style={styles.row}>
        {options.map((option, index) => {
          const selected = selectedIndex === index;
          return (
            <TouchableOpacity
              key={option.value}
              onPress={() => onChange(option.value)}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              style={styles.segment}
            >
              <Typography
                variant="overline"
                muted={!selected}
                // `onPrimary` respeta el aviso de contraste sobre `primary`.
                style={selected ? { color: colors.onPrimary } : undefined}
              >
                {option.label}
              </Typography>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.round,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    padding: 2,
  },
  indicator: {
    position: "absolute",
    top: 2,
    bottom: 2,
    left: 2,
    borderRadius: BorderRadius.round,
  },
  row: {
    flexDirection: "row",
  },
  segment: {
    flex: 1,
    paddingVertical: Spacing.s,
    alignItems: "center",
  },
});
