import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Typography } from "@/components/atoms/Typography";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { BorderRadius, Colors, Spacing } from "@/constants/theme";
import { useVisionData } from "@/features/vision/hooks/useVisionData";
import { fetchCategories } from "@/features/wallet/data/categoriesSlice";
import {
  addTransaction,
  deleteTransaction,
  updateTransaction,
} from "@/features/wallet/data/walletSlice";
import { useColorScheme } from "@/hooks/use-color-scheme";
import STRINGS from "@/i18n/es.json";
import { AppDispatch, RootState } from "@/store/store";
import { formatAmountInput } from "@/utils/format";
import { determineDefaultPaymentType } from "@/utils/transactionUtils";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Keyboard,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { EntitySelectionModal } from "../components/EntitySelectionModal";

export default function TransactionFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { id, initialType } = params;

  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { categories } = useSelector((state: RootState) => state.categories);
  const { transactions } = useSelector((state: RootState) => state.wallet);
  // Destructure entities correctly from useVisionData
  const { entities } = useVisionData();

  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const isEditing = !!id;
  const existingTransaction = isEditing
    ? transactions.find((t) => t.id === id)
    : null;

  const [type, setType] = useState<"income" | "expense">(
    (existingTransaction?.type as "income" | "expense") ||
      (initialType as "income" | "expense") ||
      "expense",
  );
  const [amount, setAmount] = useState(
    existingTransaction
      ? formatAmountInput(existingTransaction.amount.toFixed(2))
      : "",
  );
  const [description, setDescription] = useState(
    existingTransaction?.description || "",
  );
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    existingTransaction?.category || null,
  );
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(
    existingTransaction?.relatedEntityId || null,
  );
  const [selectedPaymentType, setSelectedPaymentType] = useState<
    "credit_card" | "debit_card" | "cash" | "transfer" | "payroll" | null
  >(
    existingTransaction?.paymentType ||
      (!isEditing ? determineDefaultPaymentType(transactions, type) : null),
  );

  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isPaymentTypeDropdownOpen, setIsPaymentTypeDropdownOpen] =
    useState(false);
  const [isEntityModalVisible, setIsEntityModalVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user?.uid && categories.length === 0) {
      dispatch(fetchCategories(user.uid));
    }
  }, [user, dispatch, categories.length]);

  // Update default payment type when type changes (only if creating and not manually set - strictly speaking, we just want to follow the "default" logic)
  // However, the user requirement is to just "check the last 10 transactions...".
  // If the user switches types, we should probably re-suggest the default payment type for that new transaction type.
  useEffect(() => {
    if (!isEditing) {
      const suggestedPaymentType = determineDefaultPaymentType(
        transactions,
        type,
      );
      // We only update if the user hasn't selected a payment type yet?
      // Or we can always update it since switching types (Income <-> Expense) implies a context switch.
      // Let's go with updating it.
      setSelectedPaymentType(suggestedPaymentType);
    }
  }, [type, transactions, isEditing]);

  const handleSave = async () => {
    if (!amount || !description || !user?.uid) {
      Alert.alert("Error", "Por favor completa los campos requeridos");
      return;
    }

    setIsSaving(true);
    try {
      const numericAmount = parseFloat(amount.replace(/,/g, ""));

      if (isEditing && existingTransaction) {
        await dispatch(
          updateTransaction({
            id: existingTransaction.id,
            updates: {
              amount: numericAmount,
              description,
              type,
              category: selectedCategory || "General",
              relatedEntityId: selectedEntityId || null,
              paymentType: selectedPaymentType,
            },
          }),
        ).unwrap();
      } else {
        await dispatch(
          addTransaction({
            userId: user.uid,
            amount: numericAmount,
            description,
            type,
            category: selectedCategory || "General",
            relatedEntityId: selectedEntityId || null,
            date: Date.now(),
            paymentType: selectedPaymentType,
          }),
        ).unwrap();
      }
      router.back();
    } catch (error) {
      console.error("Error saving transaction:", error);
      Alert.alert("Error", "No se pudo guardar la transacción");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!existingTransaction || !user?.uid) return;

    Alert.alert(
      STRINGS.wallet.deleteTransactionTitle,
      STRINGS.wallet.deleteTransactionMessage,
      [
        { text: STRINGS.common.cancel, style: "cancel" },
        {
          text: STRINGS.common.delete,
          style: "destructive",
          onPress: async () => {
            try {
              await dispatch(
                deleteTransaction(existingTransaction.id),
              ).unwrap();
              router.back();
            } catch (error) {
              console.error("Error deleting transaction:", error);
              Alert.alert("Error", "No se pudo eliminar la transacción");
            }
          },
        },
      ],
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.headerButton}
        >
          <IconSymbol name="chevron.left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Typography variant="h3" weight="bold">
          {isEditing
            ? "Editar Transacción"
            : type === "income"
              ? STRINGS.wallet.newIncome
              : STRINGS.wallet.newExpense}
        </Typography>
        <View style={styles.headerButton}>
          {isEditing && (
            <TouchableOpacity onPress={handleDelete}>
              <IconSymbol name="trash" size={24} color={colors.error} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View>
            {/* Amount Input */}
            <View style={{ marginVertical: Spacing.l }}>
              <Typography
                variant="caption"
                style={{
                  color: colors.textSecondary,
                  marginBottom: Spacing.xs,
                  textAlign: "center",
                }}
              >
                {STRINGS.wallet.amount}
              </Typography>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: colors.surface,
                  borderRadius: BorderRadius.m,
                  borderWidth: 1,
                  borderColor: colors.border,
                  paddingVertical: Spacing.s,
                  paddingHorizontal: Spacing.m,
                }}
              >
                <Typography
                  variant="h2"
                  style={{
                    color: type === "income" ? colors.success : colors.error,
                    marginRight: Spacing.s,
                  }}
                >
                  {type === "income" ? "+" : "-"}
                </Typography>
                <TextInput
                  value={amount}
                  onChangeText={(text) => setAmount(formatAmountInput(text))}
                  placeholder="0.00"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                  style={{
                    fontSize: 36,
                    fontWeight: "bold",
                    color: colors.text,
                    textAlign: "center",
                    minWidth: 100,
                    padding: 0,
                  }}
                  autoFocus={!isEditing}
                />
              </View>
            </View>

            {/* Type Selector (if creating) */}
            {!isEditing && (
              <View
                style={{
                  flexDirection: "row",
                  marginBottom: Spacing.l,
                  backgroundColor: colors.surfaceHighlight,
                  borderRadius: BorderRadius.m,
                  padding: 4,
                }}
              >
                <TouchableOpacity
                  style={{
                    flex: 1,
                    padding: Spacing.s,
                    alignItems: "center",
                    backgroundColor:
                      type === "expense" ? colors.surface : "transparent",
                    borderRadius: BorderRadius.s,
                  }}
                  onPress={() => setType("expense")}
                >
                  <Typography
                    weight="bold"
                    style={{
                      color:
                        type === "expense"
                          ? colors.error
                          : colors.textSecondary,
                    }}
                  >
                    Gasto
                  </Typography>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    padding: Spacing.s,
                    alignItems: "center",
                    backgroundColor:
                      type === "income" ? colors.surface : "transparent",
                    borderRadius: BorderRadius.s,
                  }}
                  onPress={() => setType("income")}
                >
                  <Typography
                    weight="bold"
                    style={{
                      color:
                        type === "income"
                          ? colors.success
                          : colors.textSecondary,
                    }}
                  >
                    Ingreso
                  </Typography>
                </TouchableOpacity>
              </View>
            )}

            {/* Description */}
            <Input
              label={STRINGS.wallet.description}
              placeholder={STRINGS.wallet.descriptionPlaceholder}
              value={description}
              onChangeText={setDescription}
            />

            {/* Payment Type Selector */}
            <View style={{ marginBottom: Spacing.m }}>
              <Typography
                variant="caption"
                style={{ marginBottom: Spacing.xs, color: colors.text }}
              >
                Tipo de pago
              </Typography>
              <TouchableOpacity
                onPress={() =>
                  setIsPaymentTypeDropdownOpen(!isPaymentTypeDropdownOpen)
                }
                style={[
                  styles.dropdown,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    marginBottom: isPaymentTypeDropdownOpen ? 0 : Spacing.m,
                  },
                ]}
              >
                <View style={styles.dropdownHeader}>
                  <Typography
                    style={{
                      color: selectedPaymentType
                        ? colors.text
                        : colors.textSecondary,
                    }}
                  >
                    {selectedPaymentType
                      ? selectedPaymentType === "credit_card"
                        ? "Tarjeta de crédito"
                        : selectedPaymentType === "debit_card"
                          ? "Tarjeta de débito"
                          : selectedPaymentType === "cash"
                            ? "Efectivo"
                            : selectedPaymentType === "transfer"
                              ? "Transferencia"
                              : "Nómina"
                      : "Seleccionar tipo de pago (opcional)"}
                  </Typography>
                  <IconSymbol
                    name="chevron.down"
                    size={16}
                    color={colors.text}
                  />
                </View>
              </TouchableOpacity>

              {isPaymentTypeDropdownOpen && (
                <View
                  style={[
                    styles.dropdownList,
                    {
                      borderColor: colors.border,
                      backgroundColor: colors.surface,
                    },
                  ]}
                >
                  {[
                    { id: "credit_card", label: "Tarjeta de crédito" },
                    { id: "debit_card", label: "Tarjeta de débito" },
                    { id: "cash", label: "Efectivo" },
                    { id: "transfer", label: "Transferencia" },
                    { id: "payroll", label: "Nómina" },
                  ].map((pt, index) => (
                    <TouchableOpacity
                      key={pt.id}
                      onPress={() => {
                        setSelectedPaymentType(pt.id as any);
                        setIsPaymentTypeDropdownOpen(false);
                      }}
                      style={{
                        padding: Spacing.m,
                        borderTopWidth: index > 0 ? 1 : 0,
                        borderTopColor: colors.border,
                      }}
                    >
                      <Typography variant="body">{pt.label}</Typography>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Category Selector */}
            <View style={{ marginBottom: Spacing.m }}>
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
                style={[
                  styles.dropdown,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    marginBottom: isCategoryDropdownOpen ? 0 : Spacing.m,
                  },
                ]}
              >
                <View style={styles.dropdownHeader}>
                  <Typography
                    style={{
                      color: selectedCategory
                        ? colors.text
                        : colors.textSecondary,
                    }}
                  >
                    {selectedCategory || STRINGS.wallet.selectCategory}
                  </Typography>
                  <IconSymbol
                    name="chevron.down"
                    size={16}
                    color={colors.text}
                  />
                </View>
              </TouchableOpacity>

              {isCategoryDropdownOpen && (
                <View
                  style={[
                    styles.dropdownList,
                    {
                      borderColor: colors.border,
                      backgroundColor: colors.surface,
                    },
                  ]}
                >
                  <ScrollView nestedScrollEnabled style={{ maxHeight: 200 }}>
                    {categories.map((cat, index) => (
                      <TouchableOpacity
                        key={cat.id}
                        onPress={() => {
                          setSelectedCategory(cat.name);
                          setIsCategoryDropdownOpen(false);
                        }}
                        style={{
                          padding: Spacing.m,
                          borderTopWidth: index > 0 ? 1 : 0,
                          borderTopColor: colors.border,
                        }}
                      >
                        <Typography variant="body">{cat.name}</Typography>
                      </TouchableOpacity>
                    ))}
                    <TouchableOpacity
                      onPress={() => {
                        router.push("/wallet/categories");
                        setIsCategoryDropdownOpen(false);
                      }}
                      style={{
                        padding: Spacing.m,
                        borderTopWidth: 1,
                        borderTopColor: colors.border,
                        flexDirection: "row",
                        alignItems: "center",
                      }}
                    >
                      <IconSymbol
                        name="plus"
                        size={16}
                        color={colors.primary}
                      />
                      <Typography
                        variant="body"
                        style={{ color: colors.primary, marginLeft: Spacing.s }}
                      >
                        Administrar Categorías
                      </Typography>
                    </TouchableOpacity>
                  </ScrollView>
                </View>
              )}
            </View>

            {/* Entity Selector */}
            <View style={{ marginBottom: Spacing.xl }}>
              <Typography
                variant="caption"
                style={{ marginBottom: Spacing.xs, color: colors.text }}
              >
                {STRINGS.vision.selectEntity}
              </Typography>
              <TouchableOpacity
                onPress={() => setIsEntityModalVisible(true)}
                style={[
                  styles.dropdown,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View style={styles.dropdownHeader}>
                  <Typography
                    style={{
                      color: selectedEntityId
                        ? colors.text
                        : colors.textSecondary,
                    }}
                  >
                    {selectedEntityId
                      ? entities.find((e) => e.id === selectedEntityId)?.name ||
                        STRINGS.vision.entityPlaceholder
                      : STRINGS.vision.entityPlaceholder}
                  </Typography>
                  <IconSymbol
                    name="chevron.down"
                    size={16}
                    color={colors.text}
                  />
                </View>
              </TouchableOpacity>
            </View>

            <Button
              title={STRINGS.common.save}
              onPress={handleSave}
              loading={isSaving}
              variant="primary"
            />
          </View>
        </TouchableWithoutFeedback>
      </ScrollView>

      <EntitySelectionModal
        visible={isEntityModalVisible}
        onClose={() => setIsEntityModalVisible(false)}
        onSelect={setSelectedEntityId}
        visionEntities={entities}
        selectedEntityId={selectedEntityId}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.m,
    paddingTop: 60, // Adjust for status bar
    paddingBottom: Spacing.m,
  },
  headerButton: {
    width: 40,
    alignItems: "center",
  },
  content: {
    padding: Spacing.m,
    paddingBottom: Spacing.xl,
  },
  dropdown: {
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.m,
    borderRadius: BorderRadius.m,
    borderWidth: 1,
  },
  dropdownHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dropdownList: {
    borderWidth: 1,
    borderRadius: BorderRadius.m,
    marginBottom: Spacing.m,
    marginTop: -5,
  },
});
