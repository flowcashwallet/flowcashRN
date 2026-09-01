import { HeaderButton } from "@/components/atoms/HeaderButton";
import * as Haptics from "expo-haptics";
import React from "react";

interface DeleteHeaderButtonProps {
  visible: boolean;
  color: string;
  onDelete: () => void;
}

export function DeleteHeaderButton({
  visible,
  color,
  onDelete,
}: DeleteHeaderButtonProps) {
  if (!visible) return null;
  return (
    <HeaderButton
      imageProps={{
        systemName: "trash",
        name: "trash-outline",
        color,
      }}
      buttonProps={{
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          onDelete();
        },
      }}
    />
  );
}
