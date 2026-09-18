import { Button } from "@/components/atoms/Button";
import { GlassSurface } from "@/components/atoms/GlassSurface";
import { Typography } from "@/components/atoms/Typography";
import { BorderRadius, Spacing } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";
import {
  ProposalStatus,
  TransactionProposal,
} from "@/features/ai-chat/data/aiChatSlice";
import STRINGS from "@/i18n/es.json";
import { formatCurrency } from "@/utils/format";
import React from "react";
import { StyleSheet, View } from "react-native";

interface TransactionProposalCardProps {
  proposal: TransactionProposal;
  status: ProposalStatus;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Tarjeta inline debajo de la burbuja del asistente cuando propuso una
 * transacción vía `propose_transaction`. Es una superficie propia (no vive
 * dentro del `GlassSurface` de la burbuja de texto), así que lleva cristal
 * por defecto, igual que el resto de cards de la app. El modelo nunca crea
 * la transacción — solo al tocar "Confirmar" se despacha `addTransaction`
 * (ver `aiChatSlice.ts`'s `confirmTransactionProposal`).
 */
export function TransactionProposalCard({
  proposal,
  status,
  onConfirm,
  onCancel,
}: TransactionProposalCardProps) {
  const { colors } = useTheme();
  const isIncome = proposal.type === "income";
  const amountColor = isIncome ? colors.success : colors.expense;
  const sign = isIncome ? "+" : "−";
  const isActionable = status === "pending" || status === "confirming";

  return (
    <GlassSurface
      style={styles.card}
      fallbackStyle={[
        styles.flatCard,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <View style={styles.row}>
        <Typography variant="bodySmall" muted>
          {isIncome ? STRINGS.wallet.income : STRINGS.wallet.expense}
        </Typography>
        <Typography variant="number" style={{ color: amountColor }}>
          {sign}
          {formatCurrency(proposal.amount)}
        </Typography>
      </View>
      <Typography variant="body" weight="semibold" style={styles.description}>
        {proposal.description}
      </Typography>
      {proposal.category ? (
        <Typography variant="caption" muted>
          {proposal.category}
        </Typography>
      ) : null}

      {isActionable ? (
        <View style={styles.actions}>
          <Button
            title={STRINGS.common.cancel}
            variant="outline"
            size="small"
            disabled={status === "confirming"}
            onPress={onCancel}
            style={styles.actionButton}
          />
          <Button
            title={STRINGS.aiChat.confirmProposal}
            size="small"
            loading={status === "confirming"}
            onPress={onConfirm}
            style={styles.actionButton}
          />
        </View>
      ) : (
        <Typography
          variant="caption"
          muted
          style={[styles.statusLabel, { color: colors.textSecondary }]}
        >
          {status === "confirmed"
            ? STRINGS.aiChat.proposalConfirmed
            : STRINGS.aiChat.proposalCancelled}
        </Typography>
      )}
    </GlassSurface>
  );
}

const styles = StyleSheet.create({
  /**
   * Layout de la tarjeta, común a la variante con cristal y a la plana. Vive
   * dentro de la misma `column` con `maxWidth` que la burbuja en
   * `ChatBubble.tsx`, así que aquí no repite el límite de ancho.
   */
  card: {
    marginTop: Spacing.s,
    padding: Spacing.m,
    borderRadius: BorderRadius.l,
    overflow: "hidden",
    gap: Spacing.xs,
  },
  /** Fondo opaco + hairline: solo cuando no hay cristal. */
  flatCard: {
    borderWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  description: {
    marginTop: Spacing.xs,
  },
  actions: {
    flexDirection: "row",
    gap: Spacing.s,
    marginTop: Spacing.s,
  },
  actionButton: {
    flex: 1,
  },
  statusLabel: {
    marginTop: Spacing.s,
  },
});
