import React, { useEffect } from "react";
import { StyleProp, TextInput, TextStyle } from "react-native";
import Animated, {
    Easing,
    useAnimatedProps,
    useSharedValue,
    withTiming
} from "react-native-reanimated";

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

interface AnimatedCounterProps {
  value: number;
  style?: StyleProp<TextStyle>;
  duration?: number;
}

// Worklet to format currency on UI thread
const formatCurrencyWorklet = (amount: number) => {
  "worklet";
  const absAmount = Math.abs(amount);
  const intPart = Math.floor(absAmount);
  const decimalPart = Math.round((absAmount - intPart) * 100);

  // Format integer part with commas
  const intStr = intPart.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  // Format decimal part
  const decimalStr = decimalPart < 10 ? `0${decimalPart}` : `${decimalPart}`;

  const sign = amount < 0 ? "-" : "";
  return `${sign}$${intStr}.${decimalStr}`;
};

export function AnimatedCounter({
  value,
  style,
  duration = 2000,
}: AnimatedCounterProps) {
  const animatedValue = useSharedValue(value);

  useEffect(() => {
    animatedValue.value = withTiming(value, {
      duration: duration,
      easing: Easing.out(Easing.exp),
    });
  }, [value, duration]);

  const animatedProps = useAnimatedProps(() => {
    return {
      text: formatCurrencyWorklet(animatedValue.value),
    } as any;
  });

  return (
    <AnimatedTextInput
      underlineColorAndroid="transparent"
      editable={false}
      value={formatCurrencyWorklet(value)} // Initial value fallback
      animatedProps={animatedProps}
      style={[
        {
          padding: 0,
          margin: 0,
        },
        style,
        {
          color: (style as any)?.color || "#000", // Ensure color is passed
        },
      ]}
    />
  );
}
