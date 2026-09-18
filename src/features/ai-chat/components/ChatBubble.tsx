import { GlassSurface } from "@/components/atoms/GlassSurface";
import { Typography } from "@/components/atoms/Typography";
import { BorderRadius, Spacing } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";
import { TransactionProposalCard } from "@/features/ai-chat/components/TransactionProposalCard";
import { ChatMessage } from "@/features/ai-chat/data/aiChatSlice";
import { VisionEntity } from "@/features/vision/data/visionSlice";
import React from "react";
import { Image, StyleSheet, View } from "react-native";

interface ChatBubbleProps {
  message: ChatMessage;
  /** Solo se usan si `message.proposals` trae algo — siempre en turnos del asistente. */
  onConfirmProposal?: (messageId: string, proposalId: string) => void;
  onCancelProposal?: (messageId: string, proposalId: string) => void;
  onSelectProposalAccount?: (
    messageId: string,
    proposalId: string,
    accountId: string | null,
    accountName: string | null,
  ) => void;
  /** Cuentas del usuario, para el selector inline de cada tarjeta de propuesta. */
  visionEntities?: VisionEntity[];
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
  onSelectProposalAccount,
  visionEntities,
}: ChatBubbleProps) {
  const { colors } = useTheme();
  const isUser = message.role === "user";
  const hasAttachments = isUser && !!message.attachments && message.attachments.length > 0;
  // Una foto sola (sin texto) no tiene nada que mostrar en la burbuja de
  // texto — el placeholder evita una burbuja vacía y deja claro qué se mandó.
  const bubbleText = message.content || (hasAttachments ? "📷" : "");

  return (
    <View style={[styles.row, isUser ? styles.rowUser : styles.rowAssistant]}>
      <View style={styles.column}>
        {hasAttachments ? (
          <View style={[styles.attachmentsRow, { alignSelf: "flex-end" }]}>
            {message.attachments!.map((uri, index) => (
              <Image key={`${uri}-${index}`} source={{ uri }} style={styles.attachmentThumb} />
            ))}
          </View>
        ) : null}

        {bubbleText ? (
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
              {bubbleText}
            </Typography>
          </GlassSurface>
        ) : null}

        {message.proposals?.map((entry) => (
          <TransactionProposalCard
            key={entry.id}
            proposal={entry.proposal}
            status={entry.status}
            onConfirm={() => onConfirmProposal?.(message.id, entry.id)}
            onCancel={() => onCancelProposal?.(message.id, entry.id)}
            visionEntities={visionEntities}
            onSelectAccount={(accountId, accountName) =>
              onSelectProposalAccount?.(message.id, entry.id, accountId, accountName)
            }
          />
        ))}
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
  attachmentsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  attachmentThumb: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius.m,
  },
});
