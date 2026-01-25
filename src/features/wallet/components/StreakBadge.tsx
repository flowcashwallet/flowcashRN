import { Typography } from "@/components/atoms/Typography";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors, Spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import React from "react";
import { View } from "react-native";
import { StreakInfo } from "../hooks/useStreak";

interface StreakBadgeProps {
  streak: StreakInfo;
}

export const StreakBadge: React.FC<StreakBadgeProps> = ({ streak }) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const getStreakConfig = () => {
    switch (streak.status) {
      case "hot":
        return {
          color: "#FF9500", // Orange
          icon: "flame.fill" as const,
        };
      case "pending":
        return {
          color: "#8E8E93", // Grey
          icon: "flame.fill" as const,
        };
      case "cold":
        return {
          color: "#5AC8FA", // Ice Blue
          icon: "snow" as const, // Or flame if user prefers, but snow makes sense for cold. User said "racha fria", implying a cold state. But maybe flame.fill with blue color? User said "racha fria con el '2'". Let's stick to flame for consistency or snow if available. IconSymbol usually maps to SF Symbols. 'snowflake' is common. Let's use 'flame.fill' with blue color as user mentioned "llamita" generally.
        };
    }
  };

  const config = getStreakConfig();
  
  // Override for cold to use snowflake if available or just blue flame
  // User asked for "racha fria" but previously mentioned "llamita". 
  // "quiero que este encendida... apagada... racha fria".
  // Let's use flame for all but change color.
  
  const iconColor = streak.status === "hot" ? "#FF9500" : streak.status === "cold" ? "#5AC8FA" : "#8E8E93";

  return (
    <View style={{ flexDirection: "row", alignItems: "center", marginRight: Spacing.s }}>
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
    </View>
  );
};
