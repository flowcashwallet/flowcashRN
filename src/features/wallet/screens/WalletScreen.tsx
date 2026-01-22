import { AppDispatch, RootState } from "@/store/store";
import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { PieChart } from "react-native-gifted-charts";
import { useDispatch, useSelector } from "react-redux";
import {
  Transaction,
  addTransaction,
  deleteTransaction,
  fetchTransactions,
  updateTransaction,
} from "../walletSlice";

// Atomic Components
import { Button } from "@/components/atoms/Button";
import { Card } from "@/components/atoms/Card";
import { Input } from "@/components/atoms/Input";
import { Typography } from "@/components/atoms/Typography";
import { TransactionList } from "@/components/organisms/TransactionList";

import { ThemedView } from "@/components/themed-view";
import { BorderRadius, Colors, Spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

const CATEGORIES = [
  "🍔 Comida",
  "🏠 Casa",
  "🚗 Transporte",
  "💰 Salario",
  "🎁 Regalo",
  "🛒 Supermercado",
  "💊 Salud",
  "🎮 Entretenimiento",
  "🎓 Educación",
  "✈️ Viajes",
  "🧾 Servicios",
  "🔁 Otros",
];

export default function WalletScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const { transactions } = useSelector((state: RootState) => state.wallet);
  const { user } = useSelector((state: RootState) => state.auth);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const [modalVisible, setModalVisible] = useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);

  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [isEditCategoryDropdownOpen, setIsEditCategoryDropdownOpen] =
    useState(false);

  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"income" | "expense">("expense");
  const [selectedCategory, setSelectedCategory] = useState<string>(
    CATEGORIES[0],
  );
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user?.uid) {
      dispatch(fetchTransactions(user.uid));
    }
  }, [dispatch, user]);

  // Filter transactions for current month
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const monthNames = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];
  const currentMonthName = monthNames[currentMonth];

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
      text: "Ingresos",
    },
    {
      value: expense > 0 ? expense : 0.01,
      color: colors.error,
      text: "Gastos",
    },
  ];

  const handleAmountChange = (text: string) => {
    // Only allow numbers and one decimal point
    if (/^\d*\.?\d*$/.test(text)) {
      setAmount(text);
    }
  };

  const handleDeleteTransaction = (id: string) => {
    Alert.alert(
      "Confirmar eliminación",
      "¿Estás seguro de que quieres eliminar este movimiento?",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Eliminar",
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
        amount: parseFloat(amount),
        description,
        type,
        category: selectedCategory,
        date: Date.now(),
      }),
    )
      .unwrap()
      .then(() => {
        setModalVisible(false);
        setAmount("");
        setDescription("");
        setSelectedCategory(CATEGORIES[0]);
      })
      .catch((error) => {
        console.error("Error adding transaction:", error);
        alert("Error al guardar: " + error);
      })
      .finally(() => {
        setIsSaving(false);
      });
  };

  const handleTransactionPress = (transaction: Transaction) => {
    console.log("TRANSACTION PRESSED", transaction.id);
    setSelectedTransaction(transaction);
    setEditDescription(transaction.description);
    setEditCategory(transaction.category || CATEGORIES[0]);
    setIsEditing(false);
    setDetailModalVisible(true);
  };

  const handleUpdateTransaction = () => {
    if (!selectedTransaction || !user?.uid) return;
    setIsSaving(true);
    dispatch(
      updateTransaction({
        id: selectedTransaction.id,
        updates: {
          description: editDescription,
          category: editCategory,
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
        alert("Error al actualizar: " + error);
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
      >
        {/* Header / Balance Card */}
        <Card variant="elevated" style={styles.balanceCard}>
          <Typography
            variant="h3"
            weight="bold"
            style={{ color: colors.primary, marginBottom: Spacing.s }}
          >
            {currentMonthName}
          </Typography>
          <Typography
            variant="caption"
            style={{ color: colors.text, opacity: 0.7 }}
          >
            Balance Total
          </Typography>
          <Typography
            variant="h1"
            weight="bold"
            style={{ color: colors.primary, marginTop: Spacing.xs }}
          >
            ${balance.toFixed(2)}
          </Typography>
          <View style={styles.chartContainer}>
            <PieChart
              data={chartData}
              donut
              radius={60}
              innerRadius={45}
              centerLabelComponent={() => (
                <Typography variant="caption" weight="medium">
                  Resumen
                </Typography>
              )}
            />
          </View>
        </Card>

        {/* Quick Actions */}
        <View style={styles.actions}>
          <Button
            title="Ingreso"
            variant="secondary"
            onPress={() => {
              console.log("OPENING MODAL: INCOME");
              setType("income");
              setModalVisible(true);
            }}
            style={{
              flex: 1,
              marginRight: Spacing.s,
              backgroundColor: colors.success,
            }}
          />
          <Button
            title="Gasto"
            variant="secondary"
            onPress={() => {
              console.log("OPENING MODAL: EXPENSE");
              setType("expense");
              setModalVisible(true);
            }}
            style={{
              flex: 1,
              marginLeft: Spacing.s,
              backgroundColor: colors.error,
            }}
          />
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
          <View
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
              {type === "income" ? "Nuevo Ingreso" : "Nuevo Gasto"}
            </Typography>

            <Input
              label="Descripción"
              placeholder="Ej: Comida, Salario..."
              value={description}
              onChangeText={setDescription}
            />

            <Input
              label="Monto"
              placeholder="0.00"
              keyboardType="numeric"
              value={amount}
              onChangeText={handleAmountChange}
            />

            <Typography
              variant="caption"
              style={{ marginBottom: Spacing.xs, color: colors.text }}
            >
              Categoría
            </Typography>

            <TouchableOpacity
              onPress={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
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
                <Typography variant="body" style={{ color: colors.text }}>
                  {selectedCategory}
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
                      <Typography variant="body" style={{ color: colors.text }}>
                        {cat}
                      </Typography>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            <View style={styles.modalButtons}>
              <Button
                title="Cancelar"
                variant="ghost"
                onPress={() => setModalVisible(false)}
                style={{ flex: 1, marginRight: Spacing.s }}
              />
              <Button
                title="Guardar"
                loading={isSaving}
                onPress={handleAddTransaction}
                style={{
                  flex: 1,
                  marginLeft: Spacing.s,
                  backgroundColor:
                    type === "income" ? colors.success : colors.error,
                }}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Transaction Detail Modal */}
      <Modal visible={detailModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View
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
                    {selectedTransaction.type === "income" ? "+" : "-"}$
                    {selectedTransaction.amount.toFixed(2)}
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
                          Descripción
                        </Typography>
                        <Input
                          value={editDescription}
                          onChangeText={setEditDescription}
                          placeholder="Descripción"
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
                          Categoría
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
                              style={{ color: colors.text }}
                            >
                              {editCategory}
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
                    </>
                  ) : (
                    <>
                      <View>
                        <Typography
                          variant="caption"
                          style={{ color: colors.text, opacity: 0.6 }}
                        >
                          Descripción
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
                          Categoría
                        </Typography>
                        <Typography variant="body" weight="medium">
                          {selectedTransaction.category || "Sin categoría"}
                        </Typography>
                      </View>
                    </>
                  )}
                  <View>
                    <Typography
                      variant="caption"
                      style={{ color: colors.text, opacity: 0.6 }}
                    >
                      Fecha
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
                      Tipo
                    </Typography>
                    <Typography variant="body" weight="medium">
                      {selectedTransaction.type === "income"
                        ? "Ingreso"
                        : "Gasto"}
                    </Typography>
                  </View>
                </View>

                <View style={{ flexDirection: "row", gap: Spacing.m }}>
                  {isEditing ? (
                    <>
                      <Button
                        title="Cancelar"
                        variant="ghost"
                        onPress={() => setIsEditing(false)}
                        style={{ flex: 1 }}
                      />
                      <Button
                        title="Guardar"
                        variant="primary"
                        loading={isSaving}
                        onPress={handleUpdateTransaction}
                        style={{ flex: 1 }}
                      />
                    </>
                  ) : (
                    <>
                      <Button
                        title="Cerrar"
                        variant="secondary"
                        onPress={() => setDetailModalVisible(false)}
                        style={{ flex: 1 }}
                      />
                      <Button
                        title="Editar"
                        variant="secondary"
                        onPress={() => setIsEditing(true)}
                        style={{ flex: 1, backgroundColor: colors.accent }}
                      />
                      <Button
                        title="Eliminar"
                        variant="primary" // Should be destructive style ideally
                        style={{ flex: 1, backgroundColor: colors.error }}
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
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.m,
    paddingTop: 60,
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
