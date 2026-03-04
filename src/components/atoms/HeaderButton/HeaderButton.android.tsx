import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { TouchableOpacity } from "react-native";
import { HeaderButtonProps } from "./types";

export const HeaderButton = ({
  imageProps,
  buttonProps,
  style,
}: HeaderButtonProps) => {
  return (
    <TouchableOpacity
      onPress={buttonProps?.onPress}
      style={[
        { padding: 8, justifyContent: "center", alignItems: "center" },
        style,
        buttonProps?.style,
      ]}
    >
      <Ionicons
        name={imageProps?.name || "help-circle-outline"}
        size={imageProps?.size || 24}
        color={imageProps?.color || "#000000"}
      />
    </TouchableOpacity>
  );
};
