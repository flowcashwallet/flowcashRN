import { useIsFocused } from "@react-navigation/native";
import React, { useEffect, useMemo } from "react";
import {
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

interface AnimatedCounterProps {
  value: number;
  style?: StyleProp<TextStyle>;
  duration?: number;
}

const NUMBERS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

// Single Digit Ticker Component
const TickerDigit = ({
  value,
  fontSize,
  lineHeight,
  color,
  fontFamily,
  fontWeight,
  isFocused,
}: {
  value: number;
  fontSize: number;
  lineHeight: number;
  color: string;
  fontFamily?: string;
  fontWeight?: string;
  isFocused: boolean;
}) => {
  // Animate the translateY based on the value
  // We want to translate UP, so negative value * lineHeight
  // Initialize with the current value to avoid "spinning from zero" on mount
  const translateY = useSharedValue(-value * lineHeight);

  useEffect(() => {
    // Only animate if the screen is focused
    // This prevents background animations (e.g. when adding transaction)
    // and ensures animation triggers when returning to the screen
    if (!isFocused) return;

    // Spring animation for a "mechanical" feel
    // Tuned for snappier response (higher stiffness, higher damping)
    translateY.value = withSpring(-value * lineHeight, {
      damping: 30, // Increased to 30 for almost no overshoot
      stiffness: 400, // Increased to 400 for very fast movement
      mass: 1,
    });
  }, [value, lineHeight, translateY, isFocused]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  return (
    <View
      style={{
        height: lineHeight,
        width: fontSize * 0.6, // Approximate width for tabular feel
        overflow: "hidden",
        alignItems: "center",
      }}
    >
      <Animated.View style={animatedStyle}>
        {NUMBERS.map((number) => (
          <Text
            key={number}
            style={{
              fontSize,
              lineHeight,
              height: lineHeight,
              color,
              fontFamily,
              fontWeight: fontWeight as any,
              textAlign: "center",
              fontVariant: ["tabular-nums"],
            }}
          >
            {number}
          </Text>
        ))}
      </Animated.View>
    </View>
  );
};

// Main Component
export function AnimatedCounter({ value, style }: AnimatedCounterProps) {
  // Extract styles to pass down
  const flattenedStyle = StyleSheet.flatten(style) || {};
  const fontSize = flattenedStyle.fontSize || 14;
  // Default lineHeight to 1.2x fontSize if not provided
  const lineHeight = flattenedStyle.lineHeight || fontSize * 1.2;
  const color = (flattenedStyle.color as string) || "#000";
  const fontFamily = flattenedStyle.fontFamily;
  const fontWeight = flattenedStyle.fontWeight;

  // Extract view styles (non-text styles) for the container
  // We explicitly cast to ViewStyle to avoid TS errors, as TextStyle includes ViewStyle
  // but TS is strict about assigning TextStyle to ViewStyle due to extra props.
  const containerStyle = { ...flattenedStyle } as ViewStyle;

  // Format the number to a string (e.g., "$1,234.56")
  // We handle the split manually to create components
  const formattedString = useMemo(() => {
    const absAmount = Math.abs(value);
    const intPart = Math.floor(absAmount);
    const decimalPart = Math.round((absAmount - intPart) * 100);

    const intStr = intPart.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    const decimalStr = decimalPart < 10 ? `0${decimalPart}` : `${decimalPart}`;
    const sign = value < 0 ? "-" : "";

    return `${sign}$${intStr}.${decimalStr}`;
  }, [value]);

  // Split into array of characters
  const characters = formattedString.split("");

  const isFocused = useIsFocused();

  return (
    <View style={[styles.row, containerStyle]}>
      {characters.map((char, index) => {
        // If it's a number, render the TickerDigit
        if (/[0-9]/.test(char)) {
          return (
            <TickerDigit
              key={`digit-${index}`} // Index key allows for "slot machine" replacement feel if length changes, or use stable ID if we tracked it
              value={parseInt(char, 10)}
              fontSize={fontSize}
              lineHeight={lineHeight}
              color={color}
              fontFamily={fontFamily}
              fontWeight={fontWeight as any}
              isFocused={isFocused}
            />
          );
        }

        // Otherwise render static text ($, ., ,)
        return (
          <Text
            key={`char-${index}`}
            style={[
              {
                fontSize,
                lineHeight,
                height: lineHeight,
                textAlign: "center",
                fontVariant: ["tabular-nums"],
                color,
                fontFamily,
                fontWeight: fontWeight as any,
              },
            ]}
          >
            {char}
          </Text>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden", // Ensure no bleed
  },
});
