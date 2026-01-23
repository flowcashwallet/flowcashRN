import { Button } from "@/components/atoms/Button";
import { Card } from "@/components/atoms/Card";
import { Input } from "@/components/atoms/Input";
import { Typography } from "@/components/atoms/Typography";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { BorderRadius, Colors, Spacing } from "@/constants/theme";
import {
  VisionEntity,
  addVisionEntity,
  deleteVisionEntity,
  fetchVisionEntities,
  updateVisionEntity,
} from "@/features/vision/visionSlice";
import {
  addTransaction,
  fetchTransactions,
} from "@/features/wallet/walletSlice";
import { useColorScheme } from "@/hooks/use-color-scheme";
import STRINGS from "@/i18n/es.json";
import { AppDispatch, RootState } from "@/store/store";
import { formatAmountInput, formatCurrency, parseAmount } from "@/utils/format";
import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";

export default function VisionScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const insets = useSafeAreaInsets();
  const { entities, loading: visionLoading } = useSelector(
    (state: RootState) => state.vision,
  );
  const { transactions } = useSelector((state: RootState) => state.wallet);
  const { user } = useSelector((state: RootState) => state.auth);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const [refreshing, setRefreshing] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedType, setSelectedType] = useState<"asset" | "liability">(
    "asset",
  );
  const [selectedEntity, setSelectedEntity] = useState<VisionEntity | null>(
    null,
  );

  // Form State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Add Transaction Form State (inside Detail Modal)
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [transactionAmount, setTransactionAmount] = useState("");
  const [transactionDescription, setTransactionDescription] = useState("");
  const [transactionType, setTransactionType] = useState<"income" | "expense">(
    "income",
  );

  useEffect(() => {
    if (user?.uid) {
      dispatch(fetchVisionEntities(user.uid));
      dispatch(fetchTransactions(user.uid));
    }
  }, [dispatch, user]);

  const onRefresh = React.useCallback(() => {
    if (user?.uid) {
      setRefreshing(true);
      Promise.all([
        dispatch(fetchVisionEntities(user.uid)).unwrap(),
        dispatch(fetchTransactions(user.uid)).unwrap(),
      ])
        .then(() => setRefreshing(false))
        .catch(() => setRefreshing(false));
    }
  }, [dispatch, user]);

  const assets = entities.filter((e) => e.type === "asset");
  const liabilities = entities.filter((e) => e.type === "liability");

  const totalAssets = assets.reduce((acc, curr) => acc + curr.amount, 0);
  const totalLiabilities = liabilities.reduce(
    (acc, curr) => acc + curr.amount,
    0,
  );
  const netWorth = totalAssets - totalLiabilities;

  const handleAddEntity = () => {
    if (!name || !amount || !user?.uid) return;
    setIsSaving(true);
    dispatch(
      addVisionEntity({
        userId: user.uid,
        name,
        description,
        amount: parseAmount(amount),
        type: selectedType,
        createdAt: Date.now(),
      }),
    )
      .unwrap()
      .then(() => {
        setAddModalVisible(false);
        setName("");
        setDescription("");
        setAmount("");
      })
      .catch((error) => {
        Alert.alert(STRINGS.common.error, error);
      })
      .finally(() => {
        setIsSaving(false);
      });
  };

  const handleAddTransactionToEntity = () => {
    if (
      !transactionAmount ||
      !transactionDescription ||
      !user?.uid ||
      !selectedEntity
    )
      return;
    setIsSaving(true);

    // Determine category based on entity type and transaction type automatically?
    // Or just generic. For now generic.

    dispatch(
      addTransaction({
        userId: user.uid,
        amount: parseAmount(transactionAmount),
        description: transactionDescription,
        type: transactionType,
        date: Date.now(),
        relatedEntityId: selectedEntity.id,
        category: "Vision", // Default category for now
      }),
    )
      .unwrap()
      .then(() => {
        // Update Entity Amount
        const transAmount = parseAmount(transactionAmount);
        let newAmount = selectedEntity.amount;

        if (selectedEntity.type === "asset") {
          if (transactionType === "income") {
            newAmount += transAmount;
          } else {
            newAmount -= transAmount;
          }
        } else {
          // Liability
          if (transactionType === "income") {
            // Paying debt (Income/Payment) decreases Liability
            newAmount -= transAmount;
          } else {
            // Spending (Expense) increases Liability
            newAmount += transAmount;
          }
        }

        dispatch(
          updateVisionEntity({
            ...selectedEntity,
            amount: newAmount,
          }),
        );

        // Update local selected entity to reflect change immediately in modal
        setSelectedEntity({
          ...selectedEntity,
          amount: newAmount,
        });

        setShowAddTransaction(false);
        setTransactionAmount("");
        setTransactionDescription("");
        // Refresh transactions to show in list
        dispatch(fetchTransactions(user.uid));
      })
      .catch((error) => {
        Alert.alert(STRINGS.common.error, STRINGS.wallet.saveError + error);
      })
      .finally(() => {
        setIsSaving(false);
      });
  };

  const handleDeleteEntity = (id: string) => {
    Alert.alert(
      STRINGS.common.warning,
      STRINGS.wallet.deleteTransactionMessage,
      [
        { text: STRINGS.common.cancel, style: "cancel" },
        {
          text: STRINGS.common.delete,
          style: "destructive",
          onPress: () => {
            dispatch(deleteVisionEntity(id));
            if (selectedEntity?.id === id) {
              setDetailModalVisible(false);
              setSelectedEntity(null);
            }
          },
        },
      ],
    );
  };

  const renderEntityItem = ({ item }: { item: VisionEntity }) => (
    <TouchableOpacity
      onPress={() => {
        if (item.type === "asset") {
          setTransactionType("income");
        } else {
          setTransactionType("expense");
        }
        setSelectedEntity(item);
        setDetailModalVisible(true);
      }}
    >
      <Card style={{ marginBottom: Spacing.s, padding: Spacing.m }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <View>
            <Typography variant="body" weight="bold">
              {item.name}
            </Typography>
            {item.description ? (
              <Typography variant="caption" style={{ color: colors.icon }}>
                {item.description}
              </Typography>
            ) : null}
          </View>
          <Typography
            variant="body"
            weight="bold"
            style={{
              color: item.type === "asset" ? colors.success : colors.error,
            }}
          >
            {formatCurrency(
              item.type === "liability" ? -item.amount : item.amount,
            )}
          </Typography>
        </View>
      </Card>
    </TouchableOpacity>
  );

  const getEntityTransactions = (entityId: string) => {
    return transactions.filter((t) => t.relatedEntityId === entityId);
  };

  return (
    <ThemedView
      style={[styles.container, { paddingTop: insets.top + Spacing.m }]}
    >
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <Typography
            variant="h1"
            weight="bold"
            style={{ textAlign: "center" }}
          >
            {STRINGS.vision.netWorth}
          </Typography>
          <Typography
            variant="h2"
            weight="bold"
            style={{
              textAlign: "center",
              color: netWorth >= 0 ? colors.success : colors.error,
              marginTop: Spacing.xs,
            }}
          >
            {formatCurrency(netWorth)}
          </Typography>
        </View>

        {/* Assets Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Typography variant="h3" weight="bold">
              {STRINGS.vision.assets}
            </Typography>
            <TouchableOpacity
              onPress={() => {
                setSelectedType("asset");
                setAddModalVisible(true);
              }}
            >
              <IconSymbol
                name="plus.circle.fill"
                size={24}
                color={colors.primary}
              />
            </TouchableOpacity>
          </View>
          {assets.length === 0 ? (
            <Typography variant="caption" style={{ fontStyle: "italic" }}>
              {STRINGS.vision.noAssets}
            </Typography>
          ) : (
            assets.map((item) => (
              <View key={item.id}>{renderEntityItem({ item })}</View>
            ))
          )}
        </View>

        {/* Liabilities Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Typography variant="h3" weight="bold">
              {STRINGS.vision.liabilities}
            </Typography>
            <TouchableOpacity
              onPress={() => {
                setSelectedType("liability");
                setAddModalVisible(true);
              }}
            >
              <IconSymbol
                name="plus.circle.fill"
                size={24}
                color={colors.primary}
              />
            </TouchableOpacity>
          </View>
          {liabilities.length === 0 ? (
            <Typography variant="caption" style={{ fontStyle: "italic" }}>
              {STRINGS.vision.noLiabilities}
            </Typography>
          ) : (
            liabilities.map((item) => (
              <View key={item.id}>{renderEntityItem({ item })}</View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Add Entity Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={addModalVisible}
        onRequestClose={() => setAddModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: colors.background },
            ]}
          >
            <Typography
              variant="h3"
              weight="bold"
              style={{ marginBottom: Spacing.m }}
            >
              {selectedType === "asset"
                ? STRINGS.vision.addAsset
                : STRINGS.vision.addLiability}
            </Typography>

            <Input
              label={STRINGS.vision.name}
              value={name}
              onChangeText={setName}
              placeholder="Ej: Casa, Préstamo..."
            />
            <Input
              label={STRINGS.vision.description}
              value={description}
              onChangeText={setDescription}
              placeholder="Opcional"
            />
            <Input
              label={STRINGS.wallet.amount}
              value={amount}
              onChangeText={(text) => setAmount(formatAmountInput(text))}
              keyboardType="numeric"
              placeholder="0.00"
            />

            <View style={styles.modalActions}>
              <Button
                title={STRINGS.common.cancel}
                variant="outline"
                onPress={() => setAddModalVisible(false)}
                style={{ flex: 1, marginRight: Spacing.s }}
              />
              <Button
                title={STRINGS.common.save}
                onPress={handleAddEntity}
                loading={isSaving}
                style={{ flex: 1, marginLeft: Spacing.s }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Detail Modal */}
      <Modal
        animationType="slide"
        visible={detailModalVisible}
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <ThemedView style={{ flex: 1, paddingTop: 50 }}>
          {selectedEntity && (
            <View style={{ flex: 1, padding: Spacing.m }}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: Spacing.m,
                }}
              >
                <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
                  <Typography variant="body" style={{ color: colors.primary }}>
                    {STRINGS.common.close}
                  </Typography>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDeleteEntity(selectedEntity.id)}
                >
                  <IconSymbol
                    name="trash.fill"
                    size={24}
                    color={colors.error}
                  />
                </TouchableOpacity>
              </View>

              <Typography variant="h1" weight="bold">
                {selectedEntity.name}
              </Typography>
              <Typography variant="h2" style={{ color: colors.primary }}>
                {formatCurrency(selectedEntity.amount)}
              </Typography>
              {selectedEntity.description ? (
                <Typography variant="body" style={{ marginTop: Spacing.xs }}>
                  {selectedEntity.description}
                </Typography>
              ) : null}

              <View style={{ marginTop: Spacing.l, flex: 1 }}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: Spacing.s,
                  }}
                >
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
                      Nueva Transacción para {selectedEntity.name}
                    </Typography>
                    <View
                      style={{ flexDirection: "row", marginBottom: Spacing.s }}
                    >
                      {selectedEntity.type === "asset" ? (
                        <Button
                          title={STRINGS.wallet.income}
                          variant="primary"
                          onPress={() => {}}
                          style={{ flex: 1 }}
                        />
                      ) : (
                        <Button
                          title={STRINGS.wallet.expense}
                          variant="primary"
                          onPress={() => {}}
                          style={{ flex: 1 }}
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
                      onPress={handleAddTransactionToEntity}
                      loading={isSaving}
                    />
                  </Card>
                )}

                <FlatList
                  data={getEntityTransactions(selectedEntity.id)}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
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
          )}
        </ThemedView>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.m,
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing.l,
    marginTop: Spacing.m,
  },
  section: {
    marginBottom: Spacing.l,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.s,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.l,
    minHeight: 400,
  },
  modalActions: {
    flexDirection: "row",
    marginTop: Spacing.m,
  },
});
