import React from "react";
import { View } from "react-native";
import { HeaderButtonGroupProps } from "./types";

export function HeaderButtonGroup({
  children,
  spacing = 16,
  style,
}: HeaderButtonGroupProps) {
  return (
    <View
      style={[
        { flexDirection: "row", alignItems: "center", gap: spacing },
        style,
      ]}
    >
      {children}
    </View>
  );
}
