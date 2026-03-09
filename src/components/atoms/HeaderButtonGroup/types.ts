import { ViewStyle } from "react-native";
import React from "react";

export interface HeaderButtonGroupProps {
  children: React.ReactNode;
  /**
   * Spacing between buttons in logical pixels.
   * Defaults to 16.
   */
  spacing?: number;
  style?: ViewStyle;
}
