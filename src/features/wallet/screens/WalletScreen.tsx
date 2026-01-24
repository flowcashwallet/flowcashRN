import {
  fetchVisionEntities,
  updateVisionEntity,
} from "@/features/vision/visionSlice";
import { AppDispatch, RootState } from "@/store/store";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { PieChart } from "react-native-gifted-charts";
import { useDispatch, useSelector } from "react-redux";
import {
  Transaction,
  addTransaction,
  deleteMultipleTransactions,
  deleteTransaction,
  fetchTransactions,
  updateTransaction,
} from "../walletSlice";

// Atomic Components
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Typography } from "@/components/atoms/Typography";
import { TransactionList } from "@/components/organisms/TransactionList";
import { IconSymbol } from "@/components/ui/icon-symbol";
import STRINGS from "@/i18n/es.json";
import { formatAmountInput, formatCurrency, parseAmount } from "@/utils/format";

import { ThemedView } from "@/components/themed-view";
import { BorderRadius, Colors, Spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

const CATEGORIES = STRINGS.wallet.categories;

export default function WalletScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const { transactions } = useSelector((state: RootState) => state.wallet);
  const { entities: visionEntities } = useSelector(
    (state: RootState) => state.vision,
  );
  const { user } = useSelector((state: RootState) => state.auth);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const [modalVisible, setModalVisible] = useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isEntityDropdownOpen, setIsEntityDropdownOpen] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);

  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editEntityId, setEditEntityId] = useState<string | null>(null);
  const [isEditCategoryDropdownOpen, setIsEditCategoryDropdownOpen] =
    useState(false);
  const [isEditEntityDropdownOpen, setIsEditEntityDropdownOpen] =
    useState(false);

  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"income" | "expense">("expense");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Clear selected entity when transaction type changes
  useEffect(() => {
    setSelectedEntityId(null);
  }, [type]);

  const onRefresh = React.useCallback(() => {
    if (user?.uid) {
      setRefreshing(true);
      dispatch(fetchTransactions(user.uid))
        .unwrap()
        .then(() => setRefreshing(false))
        .catch(() => setRefreshing(false));
    }
  }, [dispatch, user]);

  useEffect(() => {
    if (user?.uid) {
      dispatch(fetchTransactions(user.uid));
      dispatch(fetchVisionEntities(user.uid));
    }
  }, [dispatch, user]);

  // Filter transactions for current month
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const currentMonthName = STRINGS.wallet.months[currentMonth];

  const currentMonthTransactions = transactions.filter((t) => {
    const tDate = new Date(t.date);
    return (
      tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear
    );
  });

  const balance = currentMonthTransactions.reduce((acc, curr) => {
    return curr.type === "income" ? acc + curr.amount : acc - curr.amount;
  }, 0);

  const income = currentMonthTransactions
    .filter((t) => t.type === "income")
    .reduce((acc, curr) => acc + curr.amount, 0);
  const expense = currentMonthTransactions
    .filter((t) => t.type === "expense")
    .reduce((acc, curr) => acc + curr.amount, 0);

  const chartData = [
    {
      value: income > 0 ? income : 0.01,
      color: colors.success,
      text: STRINGS.wallet.incomes,
    },
    {
      value: expense > 0 ? expense : 0.01,
      color: colors.error,
      text: STRINGS.wallet.expenses,
    },
  ];

  const handleAmountChange = (text: string) => {
    setAmount(formatAmountInput(text));
  };

  const handleDeleteTransaction = (id: string) => {
    Alert.alert(
      STRINGS.wallet.deleteTransactionTitle,
      STRINGS.wallet.deleteTransactionMessage,
      [
        {
          text: STRINGS.common.cancel,
          style: "cancel",
        },
        {
          text: STRINGS.common.delete,
          style: "destructive",
          onPress: () => {
            dispatch(deleteTransaction(id))
              .unwrap()
              .catch((error: any) => {
                console.error("Error deleting transaction:", error);
              });
          },
        },
      ],
    );
  };

  const handleAddTransaction = () => {
    if (!amount || !description || !user?.uid) return;
    setIsSaving(true);
    dispatch(
      addTransaction({
        userId: user.uid,
        amount: parseAmount(amount),
        description,
        type,
        ...(selectedCategory ? { category: selectedCategory } : {}),
        ...(selectedEntityId ? { relatedEntityId: selectedEntityId } : {}),
        date: Date.now(),
      }),
    )
      .unwrap()
      .then(() => {
        // Update Vision Entity if associated
        if (selectedEntityId) {
          const entity = visionEntities.find((e) => e.id === selectedEntityId);
          if (entity) {
            const transAmount = parseAmount(amount);
            let newAmount = entity.amount;

            if (entity.type === "asset") {
              if (type === "income") {
                newAmount += transAmount;
              } else {
                newAmount -= transAmount;
              }
            } else {
              // Liability
              if (type === "income") {
                newAmount -= transAmount;
              } else {
                newAmount += transAmount;
              }
            }
            dispatch(updateVisionEntity({ ...entity, amount: newAmount }));
          }
        }

        setModalVisible(false);
        setAmount("");
        setDescription("");
        setSelectedCategory(null);
        setSelectedEntityId(null);
      })
      .catch((error) => {
        console.error("Error adding transaction:", error);
        alert(STRINGS.wallet.saveError + error);
      })
      .finally(() => {
        setIsSaving(false);
      });
  };

  const handleDeleteMonthlyTransactions = () => {
    if (currentMonthTransactions.length === 0) {
      Alert.alert(
        STRINGS.common.warning,
        STRINGS.wallet.noTransactionsToDelete,
      );
      return;
    }

    Alert.alert(
      STRINGS.wallet.deleteMonthTitle,
      STRINGS.wallet.deleteMonthMessage.replace("{month}", currentMonthName),
      [
        {
          text: STRINGS.common.cancel,
          style: "cancel",
        },
        {
          text: STRINGS.wallet.deleteAll,
          style: "destructive",
          onPress: () => {
            const idsToDelete = currentMonthTransactions.map((t) => t.id);
            dispatch(deleteMultipleTransactions(idsToDelete))
              .unwrap()
              .catch((error: any) => {
                console.error("Error deleting monthly transactions:", error);
                alert(STRINGS.wallet.deleteError + error);
              });
          },
        },
      ],
    );
  };

  const handleTransactionPress = (transaction: Transaction) => {
    console.log("TRANSACTION PRESSED", transaction.id);
    setSelectedTransaction(transaction);
    setEditDescription(transaction.description);
    setEditCategory(transaction.category || CATEGORIES[0]);
    setEditAmount(transaction.amount.toString());
    setEditEntityId(transaction.relatedEntityId || null);
    setIsEditing(false);
    setDetailModalVisible(true);
  };

  const handleUpdateTransaction = () => {
    if (!selectedTransaction || !user?.uid) return;
    setIsSaving(true);

    const newAmount = parseAmount(editAmount);
    const oldAmount = selectedTransaction.amount;
    const type = selectedTransaction.type;
    const oldEntityId = selectedTransaction.relatedEntityId;
    const newEntityId = editEntityId;

    // Handle Entity Updates if changed or amount changed
    if (oldEntityId !== newEntityId || oldAmount !== newAmount) {
      // Case 1: Entity Changed (A -> B) or (A -> null) or (null -> B)
      if (oldEntityId !== newEntityId) {
        // Revert Old Entity
        if (oldEntityId) {
          const oldEntity = visionEntities.find((e) => e.id === oldEntityId);
          if (oldEntity) {
            let updatedOldAmount = oldEntity.amount;
            if (oldEntity.type === "asset") {
              if (type === "income") updatedOldAmount -= oldAmount;
              else updatedOldAmount += oldAmount;
            } else {
              // Liability
              if (type === "income") updatedOldAmount += oldAmount;
              else updatedOldAmount -= oldAmount;
            }
            dispatch(
              updateVisionEntity({ ...oldEntity, amount: updatedOldAmount }),
            );
          }
        }

        // Apply New Entity
        if (newEntityId) {
          const newEntity = visionEntities.find((e) => e.id === newEntityId);
          if (newEntity) {
            let updatedNewAmount = newEntity.amount;
            if (newEntity.type === "asset") {
              if (type === "income") updatedNewAmount += newAmount;
              else updatedNewAmount -= newAmount;
            } else {
              // Liability
              if (type === "income") updatedNewAmount -= newAmount;
              else updatedNewAmount += newAmount;
            }
            dispatch(
              updateVisionEntity({ ...newEntity, amount: updatedNewAmount }),
            );
          }
        }
      }
      // Case 2: Entity Same (A -> A), but Amount Changed
      else if (oldEntityId && newEntityId) {
        const entity = visionEntities.find((e) => e.id === oldEntityId);
        if (entity) {
          let finalAmount = entity.amount;

          // Revert old
          if (entity.type === "asset") {
            if (type === "income") finalAmount -= oldAmount;
            else finalAmount += oldAmount;
          } else {
            if (type === "income") finalAmount += oldAmount;
            else finalAmount -= oldAmount;
          }

          // Apply new
          if (entity.type === "asset") {
            if (type === "income") finalAmount += newAmount;
            else finalAmount -= newAmount;
          } else {
            if (type === "income") finalAmount -= newAmount;
            else finalAmount += newAmount;
          }

          dispatch(updateVisionEntity({ ...entity, amount: finalAmount }));
        }
      }
    }

    dispatch(
      updateTransaction({
        id: selectedTransaction.id,
        updates: {
          description: editDescription,
          category: editCategory,
          relatedEntityId: editEntityId || null,
          amount: newAmount,
        },
      }),
    )
      .unwrap()
      .then(() => {
        setDetailModalVisible(false);
        setIsEditing(false);
      })
      .catch((error: any) => {
        console.error("Error updating transaction:", error);
        alert(STRINGS.wallet.updateError + error);
      })
      .finally(() => {
        setIsSaving(false);
      });
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]} // Android
          />
        }
      >
        {/* Header / Balance Card */}
        <View
          style={[
            styles.balanceCard,
            {
              padding: Spacing.l,
              borderRadius: BorderRadius.xl,
              backgroundColor: colors.surfaceHighlight,
              ...Platform.select({
                ios: {
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 10 },
                  shadowOpacity: 0.3,
                  shadowRadius: 20,
                },
                android: { elevation: 10 },
              }),
            },
          ]}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              width: "100%",
              alignItems: "center",
              marginBottom: Spacing.s,
            }}
          >
            <Typography
              variant="h3"
              weight="bold"
              style={{ color: colors.textSecondary }}
            >
              {currentMonthName}
            </Typography>
            <TouchableOpacity onPress={handleDeleteMonthlyTransactions}>
              <IconSymbol
                name="trash.fill"
                size={24}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
          <Typography variant="caption" style={{ color: colors.textSecondary }}>
            {STRINGS.wallet.balanceTotal}
          </Typography>
          <Typography
            variant="h1"
            weight="bold"
            style={{ color: colors.text, marginTop: Spacing.xs }}
          >
            {formatCurrency(balance)}
          </Typography>
          <View style={styles.chartContainer}>
            <PieChart
              data={chartData}
              donut
              radius={60}
              innerRadius={45}
              backgroundColor="transparent"
              centerLabelComponent={() => (
                <Typography
                  variant="caption"
                  weight="medium"
                  style={{ color: colors.text }}
                >
                  {STRINGS.wallet.summary}
                </Typography>
              )}
            />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            onPress={() => {
              console.log("OPENING MODAL: INCOME");
              setType("income");
              setAmount("");
              setDescription("");
              setSelectedCategory(null);
              setSelectedEntityId(null);
              setModalVisible(true);
            }}
            style={{ flex: 1, marginRight: Spacing.s }}
            activeOpacity={0.8}
          >
            <View
              style={{
                backgroundColor: "rgba(0, 242, 96, 0.1)",
                borderColor: colors.success,
                borderWidth: 1,
                paddingVertical: Spacing.m,
                alignItems: "center",
                borderRadius: BorderRadius.m,
              }}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                <IconSymbol
                  name="arrow.down.left"
                  size={20}
                  color={colors.success}
                />
                <Typography
                  variant="body"
                  weight="bold"
                  style={{ color: colors.success }}
                >
                  {STRINGS.wallet.income}
                </Typography>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              console.log("OPENING MODAL: EXPENSE");
              setType("expense");
              setAmount("");
              setDescription("");
              setSelectedCategory(null);
              setSelectedEntityId(null);
              setModalVisible(true);
            }}
            style={{ flex: 1, marginLeft: Spacing.s }}
            activeOpacity={0.8}
          >
            <View
              style={{
                backgroundColor: "rgba(255, 65, 108, 0.1)",
                borderColor: colors.error,
                borderWidth: 1,
                paddingVertical: Spacing.m,
                alignItems: "center",
                borderRadius: BorderRadius.m,
              }}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                <IconSymbol
                  name="arrow.up.right"
                  size={20}
                  color={colors.error}
                />
                <Typography
                  variant="body"
                  weight="bold"
                  style={{ color: colors.error }}
                >
                  {STRINGS.wallet.expense}
                </Typography>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Transactions List */}
        <TransactionList
          transactions={currentMonthTransactions}
          onDelete={handleDeleteTransaction}
          onTransactionPress={handleTransactionPress}
        />
      </ScrollView>

      {/* Add Transaction Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <TouchableOpacity
            style={{ flex: 1, justifyContent: "flex-end" }}
            activeOpacity={1}
            onPress={() => setModalVisible(false)}
          >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <TouchableOpacity
                activeOpacity={1}
                onPress={(e) => e.stopPropagation()}
                style={[
                  styles.modalContent,
                  { backgroundColor: colors.background },
                ]}
              >
                <Typography
                  variant="h3"
                  weight="bold"
                  style={{ marginBottom: Spacing.l }}
                >
                  {type === "income"
                    ? STRINGS.wallet.newIncome
                    : STRINGS.wallet.newExpense}
                </Typography>

                <Input
                  label={STRINGS.wallet.description}
                  placeholder={STRINGS.wallet.descriptionPlaceholder}
                  value={description}
                  onChangeText={setDescription}
                />

                <Input
                  label={STRINGS.wallet.amount}
                  placeholder="0.00"
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={handleAmountChange}
                />

                <Typography
                  variant="caption"
                  style={{ marginBottom: Spacing.xs, color: colors.text }}
                >
                  {STRINGS.wallet.category}
                </Typography>

                <TouchableOpacity
                  onPress={() =>
                    setIsCategoryDropdownOpen(!isCategoryDropdownOpen)
                  }
                  style={{
                    paddingHorizontal: Spacing.m,
                    paddingVertical: Spacing.m,
                    borderRadius: BorderRadius.m,
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: colors.border,
                    marginBottom: isCategoryDropdownOpen ? 0 : Spacing.m,
                    borderBottomLeftRadius: isCategoryDropdownOpen
                      ? 0
                      : BorderRadius.m,
                    borderBottomRightRadius: isCategoryDropdownOpen
                      ? 0
                      : BorderRadius.m,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Typography
                      variant="body"
                      style={{
                        color: selectedCategory
                          ? colors.text
                          : colors.text + "80",
                      }}
                    >
                      {selectedCategory || STRINGS.wallet.selectCategory}
                    </Typography>
                    <Typography variant="body" style={{ color: colors.text }}>
                      {isCategoryDropdownOpen ? "▲" : "▼"}
                    </Typography>
                  </View>
                </TouchableOpacity>

                {isCategoryDropdownOpen && (
                  <View
                    style={{
                      borderWidth: 1,
                      borderColor: colors.border,
                      borderTopWidth: 0,
                      borderBottomLeftRadius: BorderRadius.m,
                      borderBottomRightRadius: BorderRadius.m,
                      backgroundColor: colors.surface,
                      marginBottom: Spacing.m,
                      maxHeight: 200,
                    }}
                  >
                    <ScrollView nestedScrollEnabled>
                      {CATEGORIES.map((cat, index) => (
                        <TouchableOpacity
                          key={cat}
                          onPress={() => {
                            setSelectedCategory(cat);
                            setIsCategoryDropdownOpen(false);
                          }}
                          style={{
                            padding: Spacing.m,
                            borderTopWidth: index > 0 ? 1 : 0,
                            borderTopColor: colors.border,
                          }}
                        >
                          <Typography
                            variant="body"
                            style={{ color: colors.text }}
                          >
                            {cat}
                          </Typography>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}

                {/* Entity Selector */}
                <Typography
                  variant="caption"
                  style={{ marginBottom: Spacing.xs, color: colors.text }}
                >
                  {STRINGS.vision.selectEntity}
                </Typography>

                <TouchableOpacity
                  onPress={() => setIsEntityDropdownOpen(!isEntityDropdownOpen)}
                  style={{
                    paddingHorizontal: Spacing.m,
                    paddingVertical: Spacing.m,
                    borderRadius: BorderRadius.m,
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: colors.border,
                    marginBottom: isEntityDropdownOpen ? 0 : Spacing.m,
                    borderBottomLeftRadius: isEntityDropdownOpen
                      ? 0
                      : BorderRadius.m,
                    borderBottomRightRadius: isEntityDropdownOpen
                      ? 0
                      : BorderRadius.m,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Typography
                      variant="body"
                      style={{
                        color: selectedEntityId
                          ? colors.text
                          : colors.text + "80",
                      }}
                    >
                      {selectedEntityId
                        ? visionEntities.find((e) => e.id === selectedEntityId)
                            ?.name || STRINGS.vision.entityPlaceholder
                        : STRINGS.vision.entityPlaceholder}
                    </Typography>
                    <Typography variant="body" style={{ color: colors.text }}>
                      {isEntityDropdownOpen ? "▲" : "▼"}
                    </Typography>
                  </View>
                </TouchableOpacity>

                {isEntityDropdownOpen && (
                  <View
                    style={{
                      borderWidth: 1,
                      borderColor: colors.border,
                      borderTopWidth: 0,
                      borderBottomLeftRadius: BorderRadius.m,
                      borderBottomRightRadius: BorderRadius.m,
                      backgroundColor: colors.surface,
                      marginBottom: Spacing.m,
                      maxHeight: 200,
                    }}
                  >
                    <ScrollView nestedScrollEnabled>
                      {visionEntities.filter((e) =>
                        type === "income"
                          ? e.type === "asset"
                          : e.type === "liability",
                      ).length === 0 ? (
                        <Typography
                          variant="body"
                          style={{ padding: Spacing.m, color: colors.icon }}
                        >
                          {type === "income"
                            ? "No hay activos disponibles"
                            : "No hay pasivos disponibles"}
                        </Typography>
                      ) : (
                        visionEntities
                          .filter((e) =>
                            type === "income"
                              ? e.type === "asset"
                              : e.type === "liability",
                          )
                          .map((entity, index) => (
                            <TouchableOpacity
                              key={entity.id}
                              onPress={() => {
                                setSelectedEntityId(entity.id);
                                setIsEntityDropdownOpen(false);
                              }}
                              style={{
                                padding: Spacing.m,
                                borderTopWidth: index > 0 ? 1 : 0,
                                borderTopColor: colors.border,
                              }}
                            >
                              <View
                                style={{
                                  flexDirection: "row",
                                  justifyContent: "space-between",
                                }}
                              >
                                <Typography
                                  variant="body"
                                  style={{ color: colors.text }}
                                >
                                  {entity.name}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  style={{
                                    color:
                                      entity.type === "asset"
                                        ? colors.success
                                        : colors.error,
                                  }}
                                >
                                  {entity.type === "asset"
                                    ? STRINGS.vision.assets
                                    : STRINGS.vision.liabilities}
                                </Typography>
                              </View>
                            </TouchableOpacity>
                          ))
                      )}
                    </ScrollView>
                  </View>
                )}

                <View style={styles.modalButtons}>
                  <Button
                    title={STRINGS.common.cancel}
                    variant="ghost"
                    onPress={() => setModalVisible(false)}
                    style={{ flex: 1, marginRight: Spacing.s }}
                  />
                  <Button
                    title={STRINGS.common.save}
                    loading={isSaving}
                    onPress={handleAddTransaction}
                    gradient={
                      type === "income"
                        ? (colors.gradients.success as unknown as readonly [
                            string,
                            string,
                          ])
                        : (colors.gradients.error as unknown as readonly [
                            string,
                            string,
                          ])
                    }
                    style={{
                      flex: 1,
                      marginLeft: Spacing.s,
                    }}
                  />
                </View>
              </TouchableOpacity>
            </TouchableWithoutFeedback>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>

      {/* Transaction Detail Modal */}
      <Modal visible={detailModalVisible} animationType="fade" transparent>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setDetailModalVisible(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={[
              styles.modalContent,
              { backgroundColor: colors.background, paddingBottom: Spacing.l },
            ]}
          >
            {selectedTransaction && (
              <>
                <View style={{ alignItems: "center", marginBottom: Spacing.l }}>
                  <Typography
                    variant="h2"
                    weight="bold"
                    style={{ marginBottom: Spacing.s }}
                  >
                    {selectedTransaction.category?.split(" ")[0] ||
                      (selectedTransaction.type === "income" ? "💰" : "💸")}
                  </Typography>
                  <Typography
                    variant="h1"
                    weight="bold"
                    style={{
                      color:
                        selectedTransaction.type === "income"
                          ? colors.success
                          : colors.error,
                    }}
                  >
                    {selectedTransaction.type === "income" ? "+" : "-"}
                    {formatCurrency(selectedTransaction.amount)}
                  </Typography>
                  <Typography
                    variant="body"
                    style={{
                      color: colors.text,
                      opacity: 0.7,
                      marginTop: Spacing.xs,
                    }}
                  >
                    {selectedTransaction.category}
                  </Typography>
                </View>

                <View style={{ gap: Spacing.m, marginBottom: Spacing.xl }}>
                  {isEditing ? (
                    <>
                      <View>
                        <Typography
                          variant="caption"
                          style={{ color: colors.text, opacity: 0.6 }}
                        >
                          {STRINGS.wallet.amount}
                        </Typography>
                        <Input
                          value={editAmount}
                          onChangeText={(text) =>
                            setEditAmount(formatAmountInput(text))
                          }
                          placeholder="0.00"
                          keyboardType="numeric"
                        />
                      </View>
                      <View>
                        <Typography
                          variant="caption"
                          style={{ color: colors.text, opacity: 0.6 }}
                        >
                          {STRINGS.wallet.description}
                        </Typography>
                        <Input
                          value={editDescription}
                          onChangeText={setEditDescription}
                          placeholder={STRINGS.wallet.description}
                        />
                      </View>
                      <View>
                        <Typography
                          variant="caption"
                          style={{
                            color: colors.text,
                            opacity: 0.6,
                            marginBottom: Spacing.xs,
                          }}
                        >
                          {STRINGS.wallet.category}
                        </Typography>
                        <TouchableOpacity
                          onPress={() =>
                            setIsEditCategoryDropdownOpen(
                              !isEditCategoryDropdownOpen,
                            )
                          }
                          style={{
                            paddingHorizontal: Spacing.m,
                            paddingVertical: Spacing.m,
                            borderRadius: BorderRadius.m,
                            backgroundColor: colors.surface,
                            borderWidth: 1,
                            borderColor: colors.border,
                            marginBottom: isEditCategoryDropdownOpen
                              ? 0
                              : Spacing.m,
                            borderBottomLeftRadius: isEditCategoryDropdownOpen
                              ? 0
                              : BorderRadius.m,
                            borderBottomRightRadius: isEditCategoryDropdownOpen
                              ? 0
                              : BorderRadius.m,
                          }}
                        >
                          <View
                            style={{
                              flexDirection: "row",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <Typography
                              variant="body"
                              style={{
                                color: editCategory
                                  ? colors.text
                                  : colors.text + "80",
                              }}
                            >
                              {editCategory || STRINGS.wallet.selectCategory}
                            </Typography>
                            <Typography
                              variant="body"
                              style={{ color: colors.text }}
                            >
                              {isEditCategoryDropdownOpen ? "▲" : "▼"}
                            </Typography>
                          </View>
                        </TouchableOpacity>

                        {isEditCategoryDropdownOpen && (
                          <View
                            style={{
                              borderWidth: 1,
                              borderColor: colors.border,
                              borderTopWidth: 0,
                              borderBottomLeftRadius: BorderRadius.m,
                              borderBottomRightRadius: BorderRadius.m,
                              backgroundColor: colors.surface,
                              marginBottom: Spacing.m,
                              maxHeight: 200,
                            }}
                          >
                            <ScrollView nestedScrollEnabled>
                              {CATEGORIES.map((cat, index) => (
                                <TouchableOpacity
                                  key={cat}
                                  onPress={() => {
                                    setEditCategory(cat);
                                    setIsEditCategoryDropdownOpen(false);
                                  }}
                                  style={{
                                    padding: Spacing.m,
                                    borderTopWidth: index > 0 ? 1 : 0,
                                    borderTopColor: colors.border,
                                  }}
                                >
                                  <Typography
                                    variant="body"
                                    style={{ color: colors.text }}
                                  >
                                    {cat}
                                  </Typography>
                                </TouchableOpacity>
                              ))}
                            </ScrollView>
                          </View>
                        )}
                      </View>

                      {/* Entity Selector (Edit Mode) */}
                      <View style={{ marginTop: Spacing.m }}>
                        <Typography
                          variant="caption"
                          style={{
                            color: colors.text,
                            opacity: 0.6,
                            marginBottom: Spacing.xs,
                          }}
                        >
                          {STRINGS.vision.selectEntity}
                        </Typography>
                        <TouchableOpacity
                          onPress={() =>
                            setIsEditEntityDropdownOpen(
                              !isEditEntityDropdownOpen,
                            )
                          }
                          style={{
                            paddingHorizontal: Spacing.m,
                            paddingVertical: Spacing.m,
                            borderRadius: BorderRadius.m,
                            backgroundColor: colors.surface,
                            borderWidth: 1,
                            borderColor: colors.border,
                            marginBottom: isEditEntityDropdownOpen
                              ? 0
                              : Spacing.m,
                            borderBottomLeftRadius: isEditEntityDropdownOpen
                              ? 0
                              : BorderRadius.m,
                            borderBottomRightRadius: isEditEntityDropdownOpen
                              ? 0
                              : BorderRadius.m,
                          }}
                        >
                          <View
                            style={{
                              flexDirection: "row",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <Typography
                              variant="body"
                              style={{
                                color: editEntityId
                                  ? colors.text
                                  : colors.text + "80",
                              }}
                            >
                              {editEntityId
                                ? visionEntities.find(
                                    (e) => e.id === editEntityId,
                                  )?.name || STRINGS.vision.entityPlaceholder
                                : STRINGS.vision.entityPlaceholder}
                            </Typography>
                            <Typography
                              variant="body"
                              style={{ color: colors.text }}
                            >
                              {isEditEntityDropdownOpen ? "▲" : "▼"}
                            </Typography>
                          </View>
                        </TouchableOpacity>

                        {isEditEntityDropdownOpen && (
                          <View
                            style={{
                              borderWidth: 1,
                              borderColor: colors.border,
                              borderTopWidth: 0,
                              borderBottomLeftRadius: BorderRadius.m,
                              borderBottomRightRadius: BorderRadius.m,
                              backgroundColor: colors.surface,
                              marginBottom: Spacing.m,
                              maxHeight: 200,
                            }}
                          >
                            <ScrollView nestedScrollEnabled>
                              <TouchableOpacity
                                onPress={() => {
                                  setEditEntityId(null);
                                  setIsEditEntityDropdownOpen(false);
                                }}
                                style={{
                                  padding: Spacing.m,
                                  borderBottomWidth: 1,
                                  borderBottomColor: colors.border,
                                }}
                              >
                                <Typography
                                  variant="body"
                                  style={{
                                    color: colors.text,
                                    fontStyle: "italic",
                                  }}
                                >
                                  Ninguno
                                </Typography>
                              </TouchableOpacity>
                              {visionEntities
                                .filter((e) =>
                                  selectedTransaction.type === "income"
                                    ? e.type === "asset"
                                    : e.type === "liability",
                                )
                                .map((entity, index) => (
                                  <TouchableOpacity
                                    key={entity.id}
                                    onPress={() => {
                                      setEditEntityId(entity.id);
                                      setIsEditEntityDropdownOpen(false);
                                    }}
                                    style={{
                                      padding: Spacing.m,
                                      borderTopWidth: index > 0 ? 1 : 0,
                                      borderTopColor: colors.border,
                                    }}
                                  >
                                    <View
                                      style={{
                                        flexDirection: "row",
                                        justifyContent: "space-between",
                                      }}
                                    >
                                      <Typography
                                        variant="body"
                                        style={{ color: colors.text }}
                                      >
                                        {entity.name}
                                      </Typography>
                                      <Typography
                                        variant="caption"
                                        style={{
                                          color:
                                            entity.type === "asset"
                                              ? colors.success
                                              : colors.error,
                                        }}
                                      >
                                        {entity.type === "asset"
                                          ? STRINGS.vision.assets
                                          : STRINGS.vision.liabilities}
                                      </Typography>
                                    </View>
                                  </TouchableOpacity>
                                ))}
                            </ScrollView>
                          </View>
                        )}
                      </View>
                    </>
                  ) : (
                    <>
                      <View>
                        <Typography
                          variant="caption"
                          style={{ color: colors.text, opacity: 0.6 }}
                        >
                          {STRINGS.wallet.description}
                        </Typography>
                        <Typography variant="body" weight="medium">
                          {selectedTransaction.description}
                        </Typography>
                      </View>
                      <View>
                        <Typography
                          variant="caption"
                          style={{ color: colors.text, opacity: 0.6 }}
                        >
                          {STRINGS.wallet.category}
                        </Typography>
                        <Typography variant="body" weight="medium">
                          {selectedTransaction.category ||
                            STRINGS.wallet.noCategory}
                        </Typography>
                      </View>
                    </>
                  )}
                  <View>
                    <Typography
                      variant="caption"
                      style={{ color: colors.text, opacity: 0.6 }}
                    >
                      {STRINGS.wallet.date}
                    </Typography>
                    <Typography variant="body" weight="medium">
                      {new Date(selectedTransaction.date).toLocaleString()}
                    </Typography>
                  </View>
                  <View>
                    <Typography
                      variant="caption"
                      style={{ color: colors.text, opacity: 0.6 }}
                    >
                      {STRINGS.wallet.type}
                    </Typography>
                    <Typography variant="body" weight="medium">
                      {selectedTransaction.type === "income"
                        ? STRINGS.wallet.income
                        : STRINGS.wallet.expense}
                    </Typography>
                  </View>
                  {selectedTransaction.relatedEntityId && (
                    <View>
                      <Typography
                        variant="caption"
                        style={{ color: colors.text, opacity: 0.6 }}
                      >
                        Asociado a
                      </Typography>
                      <Typography variant="body" weight="medium">
                        {visionEntities.find(
                          (e) => e.id === selectedTransaction.relatedEntityId,
                        )?.name || "Entidad desconocida"}
                      </Typography>
                    </View>
                  )}
                </View>

                <View style={{ flexDirection: "row", gap: Spacing.m }}>
                  {isEditing ? (
                    <>
                      <Button
                        title={STRINGS.common.cancel}
                        variant="ghost"
                        onPress={() => setIsEditing(false)}
                        style={{ flex: 1 }}
                      />
                      <Button
                        title={STRINGS.common.save}
                        variant="primary"
                        loading={isSaving}
                        onPress={handleUpdateTransaction}
                        gradient={
                          selectedTransaction.type === "income"
                            ? (colors.gradients.success as unknown as readonly [
                                string,
                                string,
                              ])
                            : (colors.gradients.error as unknown as readonly [
                                string,
                                string,
                              ])
                        }
                        style={{ flex: 1 }}
                      />
                    </>
                  ) : (
                    <>
                      <Button
                        title={STRINGS.common.close}
                        variant="secondary"
                        onPress={() => setDetailModalVisible(false)}
                        style={{ flex: 1 }}
                      />
                      <Button
                        title={STRINGS.common.edit}
                        variant="secondary"
                        onPress={() => setIsEditing(true)}
                        style={{ flex: 1, backgroundColor: colors.accent }}
                      />
                      <Button
                        title={STRINGS.common.delete}
                        variant="primary" // Should be destructive style ideally
                        gradient={
                          colors.gradients.error as unknown as readonly [
                            string,
                            string,
                          ]
                        }
                        style={{ flex: 1 }}
                        onPress={() => {
                          setDetailModalVisible(false);
                          setTimeout(
                            () =>
                              handleDeleteTransaction(selectedTransaction.id),
                            500,
                          );
                        }}
                      />
                    </>
                  )}
                </View>
              </>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.m,
    paddingTop: 10,
  },
  balanceCard: {
    alignItems: "center",
    padding: Spacing.l,
    marginBottom: Spacing.l,
    borderRadius: BorderRadius.xl,
  },
  chartContainer: {
    marginTop: Spacing.m,
    height: 150,
    alignItems: "center",
    justifyContent: "center",
  },
  actions: {
    flexDirection: "row",
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    marginBottom: Spacing.m,
  },
  listContent: {
    paddingBottom: Spacing.xl,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.l,
    paddingBottom: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  modalButtons: {
    flexDirection: "row",
    marginTop: Spacing.m,
  },
});
