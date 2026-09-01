import { VoiceInputButton } from "@/components/atoms/VoiceInputButton";
import { Spacing } from "@/constants/theme";
import React from "react";
import { StyleSheet, View } from "react-native";

interface VoiceCommandBarProps {
  visible: boolean;
  isLoading: boolean;
  onCommandDetected: (text: string) => void;
}

export function VoiceCommandBar({
  visible,
  isLoading,
  onCommandDetected,
}: VoiceCommandBarProps) {
  if (!visible) return null;

  return (
    <View style={styles.fabContainer}>
      <VoiceInputButton
        onCommandDetected={onCommandDetected}
        isLoading={isLoading}
      />
    </View>
  );
}

/** Se apila por encima del FAB principal, que ocupa la esquina inferior derecha. */
const ABOVE_FAB = Spacing.xxl * 2 + Spacing.xl;

const styles = StyleSheet.create({
  fabContainer: {
    position: "absolute",
    bottom: ABOVE_FAB,
    right: Spacing.l,
    zIndex: 100,
  },
});
