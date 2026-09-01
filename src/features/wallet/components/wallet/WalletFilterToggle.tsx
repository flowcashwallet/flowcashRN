import { IconSymbol } from "@/components/ui/icon-symbol";
import React from "react";
import { TouchableOpacity } from "react-native";

interface WalletFilterToggleProps {
  hasActiveFilters: boolean;
  color: string;
  onPress: () => void;
}

export function WalletFilterToggle({
  hasActiveFilters,
  color,
  onPress,
}: WalletFilterToggleProps) {
  return (
    <TouchableOpacity onPress={onPress}>
      <IconSymbol
        name={
          hasActiveFilters
            ? "line.3.horizontal.decrease.circle.fill"
            : "line.3.horizontal.decrease.circle"
        }
        size={24}
        color={color}
      />
    </TouchableOpacity>
  );
}
