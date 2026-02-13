import { Button } from "@/components/atoms/Button";
import { Card } from "@/components/atoms/Card";
import { Input } from "@/components/atoms/Input";
import { Typography } from "@/components/atoms/Typography";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { BorderRadius, Colors, Spacing } from "@/constants/theme";
import { VisionEntity } from "@/features/vision/data/visionSlice";
import { Transaction } from "@/features/wallet/data/walletSlice";
import { useColorScheme } from "@/hooks/use-color-scheme";
import STRINGS from "@/i18n/es.json";
import { formatAmountInput, formatCurrency } from "@/utils/format";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  Modal,
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
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

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
    ? transactions.filter((t) => t.relatedEntityId === entity.id)
    : [];

  if (!entity) return null;
  const onPressTransaction = (transaction: Transaction) => {
    onClose();
    router.push({
      pathname: "/transaction-form",
      params: { id: transaction.id },
    });
  };
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View
          style={[
            styles.modalContent,
            { backgroundColor: colors.background, height: "85%" },
          ]}
        >
          <View style={{ flex: 1, padding: Spacing.m }}>
            {/* Header with actions */}
            <View style={styles.header}>
              <TouchableOpacity onPress={onClose}>
                <Typography variant="body" style={{ color: colors.primary }}>
                  {STRINGS.common.close}
                </Typography>
              </TouchableOpacity>

              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <TouchableOpacity
                  onPress={onEdit}
                  style={{ marginRight: Spacing.m }}
                >
                  <IconSymbol name="pencil" size={24} color={colors.primary} />
                </TouchableOpacity>

                <TouchableOpacity onPress={onDelete}>
                  <IconSymbol
                    name="trash.fill"
                    size={24}
                    color={colors.error}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Entity Info */}
            <Typography variant="h1" weight="bold">
              {entity.name}
            </Typography>
            <Typography variant="h2" style={{ color: colors.primary }}>
              {formatCurrency(entity.amount)}
            </Typography>

            {entity.isCrypto && entity.cryptoAmount && entity.cryptoSymbol ? (
              <View style={{ alignItems: "flex-start", marginTop: Spacing.s }}>
                <Typography variant="body" weight="bold">
                  {entity.cryptoAmount} {entity.cryptoSymbol}
                </Typography>
                <Button
                  title="Actualizar Precio"
                  variant="outline"
                  onPress={() => onUpdateCryptoPrice(entity)}
                  loading={isSaving}
                  style={{ marginTop: Spacing.xs, alignSelf: "flex-start" }}
                />
              </View>
            ) : null}

            {entity.description ? (
              <Typography variant="body" style={{ marginTop: Spacing.xs }}>
                {entity.description}
              </Typography>
            ) : null}

            {/* Transaction History Section */}
            <View style={{ marginTop: Spacing.l, flex: 1 }}>
              <View style={styles.sectionHeader}>
                <Typography variant="h3" weight="bold">
                  {STRINGS.vision.transactionHistory}
                </Typography>
                <TouchableOpacity
                  onPress={() => setShowAddTransaction(!showAddTransaction)}
                >
                  <IconSymbol
                    name={
                      showAddTransaction
                        ? "minus.circle.fill"
                        : "plus.circle.fill"
                    }
                    size={24}
                    color={colors.primary}
                  />
                </TouchableOpacity>
              </View>

              {showAddTransaction && (
                <Card style={{ marginBottom: Spacing.m }}>
                  <Typography
                    variant="caption"
                    weight="bold"
                    style={{ marginBottom: Spacing.s }}
                  >
                    Nueva Transacción para {entity.name}
                  </Typography>
                  <View
                    style={{ flexDirection: "row", marginBottom: Spacing.s }}
                  >
                    {entity.type === "asset" ? (
                      <Button
                        title={STRINGS.wallet.income}
                        variant={
                          transactionType === "income" ? "primary" : "outline"
                        }
                        onPress={() => setTransactionType("income")}
                        style={{ flex: 1, marginRight: Spacing.xs }}
                      />
                    ) : (
                      <Button
                        title={STRINGS.wallet.expense}
                        variant={
                          transactionType === "expense" ? "primary" : "outline"
                        }
                        onPress={() => setTransactionType("expense")}
                        style={{ flex: 1, marginRight: Spacing.xs }}
                      />
                    )}
                    {/* Reverse logic buttons if needed, but for simplicity let's stick to simple type selection */}
                    {entity.type === "asset" && (
                      <Button
                        title={STRINGS.wallet.expense}
                        variant={
                          transactionType === "expense" ? "primary" : "outline"
                        }
                        onPress={() => setTransactionType("expense")}
                        style={{ flex: 1, marginLeft: Spacing.xs }}
                      />
                    )}
                    {entity.type === "liability" && (
                      <Button
                        title={STRINGS.wallet.income}
                        variant={
                          transactionType === "income" ? "primary" : "outline"
                        }
                        onPress={() => setTransactionType("income")}
                        style={{ flex: 1, marginLeft: Spacing.xs }}
                      />
                    )}
                  </View>
                  <Input
                    placeholder={STRINGS.wallet.amount}
                    value={transactionAmount}
                    onChangeText={(t) =>
                      setTransactionAmount(formatAmountInput(t))
                    }
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
                </Card>
              )}

              <FlatList
                data={entityTransactions}
                keyExtractor={(item) => item.id}
                style={{ flex: 1 }}
                contentContainerStyle={{
                  flexGrow: 1,
                  paddingBottom: Spacing.xl,
                }}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => (
                  <Pressable onPress={() => onPressTransaction(item)}>
                    <Card
                      style={{ marginBottom: Spacing.xs, padding: Spacing.s }}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                        }}
                      >
                        <View>
                          <Typography variant="body" weight="bold">
                            {item.description}
                          </Typography>
                          <Typography variant="caption">
                            {new Date(item.date).toLocaleDateString()}
                          </Typography>
                        </View>
                        <Typography
                          variant="body"
                          weight="bold"
                          style={{
                            color:
                              item.type === "income"
                                ? colors.success
                                : colors.error,
                          }}
                        >
                          {item.type === "income" ? "+" : "-"}{" "}
                          {formatCurrency(item.amount)}
                        </Typography>
                      </View>
                    </Card>
                  </Pressable>
                )}
                ListEmptyComponent={
                  <Typography
                    variant="caption"
                    style={{ textAlign: "center", marginTop: Spacing.m }}
                  >
                    {STRINGS.wallet.noRecentTransactions}
                  </Typography>
                }
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.l,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.m,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.s,
  },
});
