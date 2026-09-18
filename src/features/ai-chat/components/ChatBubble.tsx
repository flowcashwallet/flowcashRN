import { GlassSurface } from "@/components/atoms/GlassSurface";
import { Typography } from "@/components/atoms/Typography";
import { BorderRadius, Spacing } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";
import { TransactionProposalCard } from "@/features/ai-chat/components/TransactionProposalCard";
import { ChatMessage } from "@/features/ai-chat/data/aiChatSlice";
import React from "react";
import { StyleSheet, View } from "react-native";

interface ChatBubbleProps {
  message: ChatMessage;
  /** Solo se usan si `message.transactionProposal` existe — siempre en turnos del asistente. */
  onConfirmProposal?: (messageId: string) => void;
  onCancelProposal?: (messageId: string) => void;
}

/**
 * Burbuja de un turno del chat. Es una superficie propia, así que lleva
 * cristal por defecto (regla de `docs/refactor-plan.md`), igual que
 * `TransactionItem`. El usuario se tiñe con `colors.primary` y va a la
 * derecha; el asistente queda neutral (sin tinte) y a la izquierda. No es un
 * touch target, así que no lleva `isInteractive`.
 *
 * Si el asistente propuso una transacción (`propose_transaction`), la tarjeta
 * de confirmación se renderiza debajo, dentro de la misma columna alineada —
 * pero como superficie propia aparte, no anidada en el `GlassSurface` de la
 * burbuja de texto.
 */
export function ChatBubble({
  message,
  onConfirmProposal,
  onCancelProposal,
}: ChatBubbleProps) {
  const { colors } = useTheme();
  const isUser = message.role === "user";

  return (
    <View style={[styles.row, isUser ? styles.rowUser : styles.rowAssistant]}>
      <View style={styles.column}>
        <GlassSurface
          style={[styles.bubble, { alignSelf: isUser ? "flex-end" : "flex-start" }]}
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

        {message.transactionProposal ? (
          <TransactionProposalCard
            proposal={message.transactionProposal}
            status={message.proposalStatus ?? "pending"}
            onConfirm={() => onConfirmProposal?.(message.id)}
            onCancel={() => onCancelProposal?.(message.id)}
          />
        ) : null}
      </View>
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
  /** Limita el ancho compartido de la burbuja y (si existe) su tarjeta de propuesta. */
  column: {
    maxWidth: "80%",
  },
  /** Layout de la burbuja, común a la variante con cristal y a la plana. */
  bubble: {
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
