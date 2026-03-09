import { HStack, Host, Text } from "@expo/ui/swift-ui";
import { frame } from "@expo/ui/swift-ui/modifiers";
import React from "react";
import { HeaderButtonGroupProps } from "./types";

export function HeaderButtonGroup({
  // children,
  spacing = 16,
  style = {},
}: HeaderButtonGroupProps) {
  console.log("render HeaderButtonGroup ios");
  return (
    <Host modifiers={[frame({ width: 200, height: 44 })]}>
      <HStack>
        <Text>Wallet</Text>
        <Text>Send</Text>
      </HStack>
    </Host>
  );
}
