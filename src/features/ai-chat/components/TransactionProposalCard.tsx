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

/** "antes → ahora" cuando cambió, o solo el valor actual si no. `null` oculta la fila entera. */
function diffLine(previous: string | null | undefined, current: string | null): string | null {
  if (!current) return null;
  if (previous !== undefined && previous !== null && previous !== current) {
    return `${previous} → ${current}`;
  }
  return current;
}

/**
 * Tarjeta inline debajo de la burbuja del asistente cuando propuso crear,
 * editar o eliminar una transacción (`propose_transaction`/
 * `_edit`/`_delete`). Es una superficie propia (no vive dentro del
 * `GlassSurface` de la burbuja de texto), así que lleva cristal por defecto,
 * igual que el resto de cards de la app. El modelo nunca crea, edita ni
 * elimina nada — solo al tocar "Confirmar"/"Eliminar" se despacha la acción
 * real (ver `aiChatSlice.ts`'s `confirmTransactionProposal`).
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
  const isDelete = proposal.kind === "delete";
  const isEdit = proposal.kind === "edit";
  const previous = proposal.previous;

  const amountText = diffLine(
    previous ? formatCurrency(previous.amount) : undefined,
    `${sign}${formatCurrency(proposal.amount)}`,
  );
  const descriptionText = diffLine(previous?.description, proposal.description);
  const categoryText = diffLine(previous?.category, proposal.category);
  const accountText = diffLine(previous?.accountName, proposal.accountName);

  const confirmedLabel =
    proposal.kind === "delete"
      ? STRINGS.aiChat.proposalDeleted
      : proposal.kind === "edit"
        ? STRINGS.aiChat.proposalUpdated
        : STRINGS.aiChat.proposalConfirmed;

  return (
    <GlassSurface
      style={styles.card}
      fallbackStyle={[
        styles.flatCard,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      {isEdit || isDelete ? (
        <Typography variant="overline" muted style={styles.kindLabel}>
          {isDelete
            ? STRINGS.aiChat.deleteTransactionTitle
            : STRINGS.aiChat.editTransactionTitle}
        </Typography>
      ) : null}

      <View style={styles.row}>
        <Typography variant="bodySmall" muted>
          {isIncome ? STRINGS.wallet.income : STRINGS.wallet.expense}
        </Typography>
        <Typography variant="number" style={{ color: amountColor }}>
          {amountText}
        </Typography>
      </View>
      <Typography variant="body" weight="semibold" style={styles.description}>
        {descriptionText}
      </Typography>
      {categoryText ? (
        <Typography variant="caption" muted>
          {categoryText}
        </Typography>
      ) : null}
      {accountText ? (
        <Typography variant="caption" muted>
          {STRINGS.aiChat.accountLabel}: {accountText}
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
            title={isDelete ? STRINGS.aiChat.deleteConfirm : STRINGS.aiChat.confirmProposal}
            size="small"
            loading={status === "confirming"}
            onPress={onConfirm}
            style={[styles.actionButton, isDelete && { backgroundColor: colors.error }]}
          />
        </View>
      ) : (
        <Typography
          variant="caption"
          muted
          style={[styles.statusLabel, { color: colors.textSecondary }]}
        >
          {status === "confirmed" ? confirmedLabel : STRINGS.aiChat.proposalCancelled}
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
  kindLabel: {
    marginBottom: Spacing.xs,
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
