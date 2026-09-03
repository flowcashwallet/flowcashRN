import { Button } from "@/components/atoms/Button";
import { GlassSurface } from "@/components/atoms/GlassSurface";
import { Input } from "@/components/atoms/Input";
import { Typography } from "@/components/atoms/Typography";
import { BottomSheet } from "@/components/molecules/BottomSheet";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { BorderRadius, Spacing } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";
import { VisionEntity } from "@/features/vision/data/visionSlice";
import { Transaction } from "@/features/wallet/data/walletSlice";
import STRINGS from "@/i18n/es.json";
import { formatAmountInput, formatCurrency } from "@/utils/format";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

interface EntityDetailModalProps {
  visible: boolean;
  onClose: () => void;
  entity: VisionEntity | null;
  transactions: Transaction[];
  onEdit: () => void;
  onDelete: () => void;
  onUpdateCryptoPrice: (entity: VisionEntity) => void;
  onAddTransaction: (data: {
    amount: string;
    description: string;
    type: "income" | "expense";
    entity: VisionEntity;
  }) => Promise<any>;
  isSaving: boolean;
}

/**
 * Detalle de un activo/pasivo.
 *
 * Migrado a `BottomSheet` en el pase visual de Vision: antes era un `Modal`
 * propio con backdrop `rgba(0,0,0,0.5)` y un botón "Cerrar" de texto que ahora
 * pone la primitiva (la X del header). Las acciones de editar/borrar/pagos
 * viven en el slot `headerRight`.
 *
 * Su historial usa la misma fila del libro contable que `TransactionItem`, por
 * pedido explícito del usuario: `GlassSurface` con `forceGlass` (la fila está
 * dentro del panel del sheet, que ya es cristal, y desde el 2026-09-02 el
 * contenido repetido con superficie propia también se vidria), importe en
 * `variant="number"`, y el signo en `success` para lo que entra a la entidad y
 * `expense` para lo que sale. Antes lo saliente iba en `colors.error`, que la
 * dirección estética reserva para un fallo real.
 */
export const EntityDetailModal: React.FC<EntityDetailModalProps> = ({
  visible,
  onClose,
  entity,
  transactions,
  onEdit,
  onDelete,
  onUpdateCryptoPrice,
  onAddTransaction,
  isSaving,
}) => {
  const { colors } = useTheme();

  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [transactionAmount, setTransactionAmount] = useState("");
  const [transactionDescription, setTransactionDescription] = useState("");
  const [transactionType, setTransactionType] = useState<"income" | "expense">(
    "income",
  );

  const handleAddTransaction = async () => {
    if (!entity) return;
    const success = await onAddTransaction({
      amount: transactionAmount,
      description: transactionDescription,
      type: transactionType,
      entity,
    });

    if (success) {
      setShowAddTransaction(false);
      setTransactionAmount("");
      setTransactionDescription("");
    }
  };

  const entityTransactions = entity
    ? transactions.filter(
        (t) =>
          t.relatedEntityId === entity.id ||
          t.transferRelatedEntityId === entity.id,
      )
    : [];

  if (!entity) return null;

  const onPressTransaction = (transaction: Transaction) => {
    onClose();
    router.push({
      pathname: "/wallet/transaction-form",
      params: { id: transaction.id },
    });
  };

  const headerActions = (
    <View style={styles.headerActions}>
      {entity.type === "liability" && (
        <TouchableOpacity
          onPress={() => {
            onClose();
            router.push({
              pathname: "/balance/liability-payments",
              params: { id: entity.id },
            });
          }}
          accessibilityRole="button"
          accessibilityLabel="Ver pagos"
        >
          <IconSymbol
            name="calendar.badge.checkmark"
            size={24}
            color={colors.primary}
          />
        </TouchableOpacity>
      )}
      <TouchableOpacity
        onPress={onEdit}
        accessibilityRole="button"
        accessibilityLabel={STRINGS.common.edit}
      >
        <IconSymbol name="pencil" size={24} color={colors.primary} />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={onDelete}
        accessibilityRole="button"
        accessibilityLabel={STRINGS.common.delete}
      >
        <IconSymbol name="trash.fill" size={24} color={colors.error} />
      </TouchableOpacity>
      {/*
        `headerRight` sustituye al botón de cerrar por defecto de la primitiva,
        así que la X se repone aquí: el sheet no puede quedarse sin afordancia
        de cierre (antes era un botón de texto "Cerrar" a la izquierda).
      */}
      <TouchableOpacity
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel={STRINGS.common.close}
        style={[
          styles.closeButton,
          { backgroundColor: colors.surfaceHighlight },
        ]}
      >
        <IconSymbol name="xmark" size={14} color={colors.icon} />
      </TouchableOpacity>
    </View>
  );

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={entity.name}
      headerRight={headerActions}
      contentStyle={styles.sheetContent}
    >
      {/*
        La cifra de la entidad es la protagonista del sheet: `display`, y en
        `expense` si es un pasivo (sale del patrimonio), nunca en `error`.
      */}
      <Typography
        variant="display"
        style={{
          color: entity.type === "liability" ? colors.expense : colors.text,
        }}
      >
        {entity.type === "liability" ? "−" : ""}
        {formatCurrency(entity.amount)}
      </Typography>

      {entity.isCrypto && entity.cryptoAmount && entity.cryptoSymbol ? (
        <View style={styles.cryptoBlock}>
          <Typography variant="body" weight="semibold">
            {entity.cryptoAmount} {entity.cryptoSymbol}
          </Typography>
          <Button
            title="Actualizar precio"
            variant="outline"
            onPress={() => onUpdateCryptoPrice(entity)}
            loading={isSaving}
            style={styles.cryptoButton}
          />
        </View>
      ) : null}

      {entity.description ? (
        <Typography variant="bodySmall" muted style={styles.description}>
          {entity.description}
        </Typography>
      ) : null}

      <View style={styles.history}>
        <View style={styles.sectionHeader}>
          <Typography variant="overline" muted>
            {STRINGS.vision.transactionHistory}
          </Typography>
          <TouchableOpacity
            onPress={() => setShowAddTransaction(!showAddTransaction)}
            accessibilityRole="button"
            accessibilityLabel="Nueva transacción"
          >
            <IconSymbol
              name={
                showAddTransaction ? "minus.circle.fill" : "plus.circle.fill"
              }
              size={24}
              color={colors.primary}
            />
          </TouchableOpacity>
        </View>

        {showAddTransaction && (
          <View
            style={[
              styles.addForm,
              {
                backgroundColor: colors.surfaceHighlight,
                borderColor: colors.border,
              },
            ]}
          >
            <Typography variant="caption" muted style={styles.addFormTitle}>
              Nueva transacción para {entity.name}
            </Typography>
            <View style={styles.addFormTypes}>
              {entity.type === "asset" ? (
                <Button
                  title={STRINGS.wallet.income}
                  variant={transactionType === "income" ? "primary" : "outline"}
                  onPress={() => setTransactionType("income")}
                  style={styles.addFormTypeButton}
                />
              ) : (
                <Button
                  title={STRINGS.wallet.expense}
                  variant={
                    transactionType === "expense" ? "primary" : "outline"
                  }
                  onPress={() => setTransactionType("expense")}
                  style={styles.addFormTypeButton}
                />
              )}
              {entity.type === "asset" && (
                <Button
                  title={STRINGS.wallet.expense}
                  variant={
                    transactionType === "expense" ? "primary" : "outline"
                  }
                  onPress={() => setTransactionType("expense")}
                  style={styles.addFormTypeButton}
                />
              )}
              {entity.type === "liability" && (
                <Button
                  title={STRINGS.wallet.income}
                  variant={transactionType === "income" ? "primary" : "outline"}
                  onPress={() => setTransactionType("income")}
                  style={styles.addFormTypeButton}
                />
              )}
            </View>
            <Input
              placeholder={STRINGS.wallet.amount}
              value={transactionAmount}
              onChangeText={(t) => setTransactionAmount(formatAmountInput(t))}
              keyboardType="numeric"
            />
            <Input
              placeholder={STRINGS.wallet.description}
              value={transactionDescription}
              onChangeText={setTransactionDescription}
            />
            <Button
              title={STRINGS.common.save}
              onPress={handleAddTransaction}
              loading={isSaving}
            />
          </View>
        )}

        <FlatList
          data={entityTransactions}
          keyExtractor={(item) => item.id}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => {
            const isIncoming =
              item.type === "income" ||
              (item.type === "transfer" &&
                item.transferRelatedEntityId === entity.id);
            const amountColor = isIncoming ? colors.success : colors.expense;

            return (
              <Pressable onPress={() => onPressTransaction(item)}>
                <GlassSurface
                  forceGlass
                  isInteractive
                  style={styles.row}
                  fallbackStyle={[
                    styles.flatRow,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View style={styles.rowCopy}>
                    <Typography
                      variant="body"
                      weight="semibold"
                      numberOfLines={1}
                    >
                      {item.description}
                    </Typography>
                    <Typography variant="caption" muted>
                      {new Date(item.date).toLocaleDateString()}
                    </Typography>
                  </View>
                  <Typography variant="number" style={{ color: amountColor }}>
                    {isIncoming ? "+" : "−"}
                    {formatCurrency(item.amount)}
                  </Typography>
                </GlassSurface>
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <Typography variant="caption" muted style={styles.emptyCopy}>
              {STRINGS.wallet.noRecentTransactions}
            </Typography>
          }
        />
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  /**
   * `flexShrink` encadenado: el panel del sheet ya lo tiene, así el contenido y
   * la lista de dentro se ajustan al tope de altura del sheet y la lista scrollea
   * en vez de desbordarse.
   */
  sheetContent: {
    flexShrink: 1,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.m,
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.round,
    alignItems: "center",
    justifyContent: "center",
  },
  cryptoBlock: {
    alignItems: "flex-start",
    marginTop: Spacing.s,
    gap: Spacing.xs,
  },
  cryptoButton: {
    alignSelf: "flex-start",
  },
  description: {
    marginTop: Spacing.xs,
  },
  history: {
    marginTop: Spacing.l,
    flexShrink: 1,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.s,
  },
  /**
   * Formulario rápido: plano a propósito. Es un bloque **dentro** del panel del
   * sheet, que ya es la superficie de cristal.
   */
  addForm: {
    padding: Spacing.m,
    borderRadius: BorderRadius.l,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: Spacing.m,
  },
  addFormTitle: {
    marginBottom: Spacing.s,
  },
  addFormTypes: {
    flexDirection: "row",
    gap: Spacing.s,
    marginBottom: Spacing.s,
  },
  addFormTypeButton: {
    flex: 1,
  },
  list: {
    flexShrink: 1,
  },
  listContent: {
    gap: Spacing.s,
    paddingBottom: Spacing.m,
  },
  /** Layout de la fila, común a la variante con cristal y a la plana. */
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.l,
    overflow: "hidden",
  },
  /** Fondo opaco + hairline: solo cuando no hay cristal. */
  flatRow: {
    borderWidth: StyleSheet.hairlineWidth,
  },
  rowCopy: {
    flex: 1,
  },
  emptyCopy: {
    textAlign: "center",
    marginTop: Spacing.m,
  },
});
