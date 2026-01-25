import { Typography } from "@/components/atoms/Typography";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors, Spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import React from "react";
import { Pressable, View } from "react-native";
import { StreakInfo } from "../hooks/useStreak";

interface StreakBadgeProps {
  streak: StreakInfo;
  onPress?: () => void;
}

export const StreakBadge: React.FC<StreakBadgeProps> = ({ streak, onPress }) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const iconColor = streak.status === "hot" ? "#FF9500" : streak.status === "cold" ? "#5AC8FA" : "#8E8E93";

  return (
    <Pressable 
      onPress={onPress}
      style={({ pressed }) => ({ 
        flexDirection: "row", 
        alignItems: "center", 
        marginRight: Spacing.s,
        opacity: pressed ? 0.7 : 1
      })}
    >
      <IconSymbol
        name="flame.fill"
        size={20}
        color={iconColor}
      />
      <Typography
        variant="body"
        weight="bold"
        style={{ color: iconColor, marginLeft: 2 }}
      >
        {streak.count.toString()}
      </Typography>
    </Pressable>
  );
};
