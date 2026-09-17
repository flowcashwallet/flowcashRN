import { GlassSurface } from "@/components/atoms/GlassSurface";
import { Typography } from "@/components/atoms/Typography";
import { BorderRadius, Spacing } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";
import { ChatMessage } from "@/features/ai-chat/data/aiChatSlice";
import React from "react";
import { StyleSheet, View } from "react-native";

interface ChatBubbleProps {
  message: ChatMessage;
}

/**
 * Burbuja de un turno del chat. Es una superficie propia, así que lleva
 * cristal por defecto (regla de `docs/refactor-plan.md`), igual que
 * `TransactionItem`. El usuario se tiñe con `colors.primary` y va a la
 * derecha; el asistente queda neutral (sin tinte) y a la izquierda. No es un
 * touch target, así que no lleva `isInteractive`.
 */
export function ChatBubble({ message }: ChatBubbleProps) {
  const { colors } = useTheme();
  const isUser = message.role === "user";

  return (
    <View style={[styles.row, isUser ? styles.rowUser : styles.rowAssistant]}>
      <GlassSurface
        style={styles.bubble}
        tintColor={isUser ? colors.primary : undefined}
        fallbackStyle={[
          !isUser && styles.flatBubbleAssistant,
          {
            backgroundColor: isUser ? colors.primary : colors.surface,
            borderColor: colors.border,
          },
        ]}
      >
        <Typography
          variant="body"
          style={{ color: isUser ? colors.onPrimary : colors.text }}
        >
          {message.content}
        </Typography>
      </GlassSurface>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    marginBottom: Spacing.sm,
  },
  rowUser: {
    justifyContent: "flex-end",
  },
  rowAssistant: {
    justifyContent: "flex-start",
  },
  /** Layout de la burbuja, común a la variante con cristal y a la plana. */
  bubble: {
    maxWidth: "80%",
    paddingVertical: Spacing.s,
    paddingHorizontal: Spacing.m,
    borderRadius: BorderRadius.l,
    overflow: "hidden",
  },
  /** Hairline solo para el asistente sin cristal — el del usuario ya contrasta por su relleno. */
  flatBubbleAssistant: {
    borderWidth: StyleSheet.hairlineWidth,
  },
});
