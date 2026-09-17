import { GlassSurface } from "@/components/atoms/GlassSurface";
import { BorderRadius, Spacing } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";
import React from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

/**
 * Burbuja de "el asistente está escribiendo". Al no haber streaming (v1), es
 * la única señal de progreso entre enviar el mensaje y recibir la respuesta.
 */
export function ChatTypingIndicator() {
  const { colors } = useTheme();

  return (
    <View style={styles.row}>
      <GlassSurface
        style={styles.bubble}
        fallbackStyle={[
          styles.flatBubble,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <ActivityIndicator size="small" color={colors.icon} />
      </GlassSurface>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "flex-start",
    marginBottom: Spacing.sm,
  },
  bubble: {
    paddingVertical: Spacing.s,
    paddingHorizontal: Spacing.m,
    borderRadius: BorderRadius.l,
    overflow: "hidden",
  },
  flatBubble: {
    borderWidth: StyleSheet.hairlineWidth,
  },
});
