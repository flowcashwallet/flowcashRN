import { NotificationSetupModal } from "@/components/NotificationSetupModal";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Typography } from "@/components/atoms/Typography";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { BorderRadius, Colors, Spacing } from "@/constants/theme";
import { useVisionData } from "@/features/vision/hooks/useVisionData";
import { fetchCategories } from "@/features/wallet/data/categoriesSlice";
import { useWalletTransactions } from "@/features/wallet/hooks/useWalletTransactions";
import { useColorScheme } from "@/hooks/use-color-scheme";
import STRINGS from "@/i18n/es.json";
import { registerForPushNotificationsAsync } from "@/services/notifications";
import { AppDispatch, RootState } from "@/store/store";
import { formatAmountInput } from "@/utils/format";
import { determineDefaultPaymentType } from "@/utils/transactionUtils";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
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

  const { addTransaction, deleteTransaction, updateTransaction } =
    useWalletTransactions();

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
      determineDefaultPaymentType(transactions, type),
  );

  const [date, setDate] = useState(
    new Date(existingTransaction?.date || Date.now()),
  );
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isPaymentTypeDropdownOpen, setIsPaymentTypeDropdownOpen] =
    useState(false);
  const [isEntityModalVisible, setIsEntityModalVisible] = useState(false);
  const [isNotificationSetupVisible, setIsNotificationSetupVisible] =
    useState(false);
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
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setIsSaving(true);
    try {
      let success = false;
      if (isEditing && existingTransaction) {
        success =
          (await updateTransaction({
            id: existingTransaction.id,
            amount: amount,
            description,
            type,
            category: selectedCategory || "General",
            relatedEntityId: selectedEntityId || null,
            oldAmount: existingTransaction.amount,
            oldEntityId: existingTransaction.relatedEntityId,
            date: date.getTime(),
            paymentType: selectedPaymentType,
          })) || false;
      } else {
        success =
          (await addTransaction({
            amount: amount,
            description,
            type,
            category: selectedCategory || "General",
            relatedEntityId: selectedEntityId || null,
            date: date.getTime(),
            paymentType: selectedPaymentType,
          })) || false;
      }

      if (success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        if (!isEditing) {
          const isFirstTransaction = transactions.length === 0;
          const hasAsked = await AsyncStorage.getItem(
            "has_asked_initial_reminder",
          );

          if (isFirstTransaction && !hasAsked) {
            Alert.alert(
              "¡Primera transacción!",
              "¿Te gustaría configurar un recordatorio diario para no olvidar registrar tus gastos?",
              [
                {
                  text: "No, gracias",
                  style: "cancel",
                  onPress: async () => {
                    await AsyncStorage.setItem(
                      "has_asked_initial_reminder",
                      "true",
                    );
                    router.back();
                  },
                },
                {
                  text: "Sí, configurar",
                  onPress: async () => {
                    await AsyncStorage.setItem(
                      "has_asked_initial_reminder",
                      "true",
                    );
                    const granted = await registerForPushNotificationsAsync();
                    if (granted) {
                      setIsNotificationSetupVisible(true);
                    } else {
                      Alert.alert(
                        "Permisos requeridos",
                        "No se pudieron habilitar las notificaciones. Verifica tus ajustes.",
                        [{ text: "OK", onPress: () => router.back() }],
                      );
                    }
                  },
                },
              ],
            );
            return; // Don't route back yet
          }
        }
        router.back();
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (error) {
      console.error("Error saving transaction:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!existingTransaction) return;

    const success = await deleteTransaction(existingTransaction.id);
    if (success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
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

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
      >
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
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setType("expense");
                    }}
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

              {/* Date Picker */}
              <View style={{ marginBottom: Spacing.m, marginTop: Spacing.m }}>
                <Typography
                  variant="caption"
                  style={{
                    color: colors.textSecondary,
                    marginBottom: Spacing.xs,
                  }}
                >
                  Fecha
                </Typography>
                <TouchableOpacity
                  onPress={() => setShowDatePicker(true)}
                  style={{
                    backgroundColor: colors.surface,
                    padding: Spacing.m,
                    borderRadius: BorderRadius.m,
                    borderWidth: 1,
                    borderColor: colors.border,
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <IconSymbol
                    name="calendar"
                    size={20}
                    color={colors.text}
                    style={{ marginRight: Spacing.s }}
                  />
                  <Typography>
                    {date.toLocaleDateString("es-ES", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </Typography>
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={date}
                    mode="date"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    onChange={(
                      event: DateTimePickerEvent,
                      selectedDate?: Date,
                    ) => {
                      const currentDate = selectedDate || date;
                      setShowDatePicker(Platform.OS === "ios");
                      setDate(currentDate);
                    }}
                    maximumDate={new Date()}
                  />
                )}
              </View>

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
                          style={{
                            color: colors.primary,
                            marginLeft: Spacing.s,
                          }}
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
                        ? entities.find((e) => e.id === selectedEntityId)
                            ?.name || STRINGS.vision.entityPlaceholder
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
      </KeyboardAvoidingView>

      <EntitySelectionModal
        visible={isEntityModalVisible}
        onClose={() => setIsEntityModalVisible(false)}
        onSelect={setSelectedEntityId}
        visionEntities={entities}
        selectedEntityId={selectedEntityId}
      />

      <NotificationSetupModal
        visible={isNotificationSetupVisible}
        onClose={() => {
          setIsNotificationSetupVisible(false);
          router.back();
        }}
        onSave={() => {
          setIsNotificationSetupVisible(false);
          router.back();
        }}
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
