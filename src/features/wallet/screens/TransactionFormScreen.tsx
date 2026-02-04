import { NotificationSetupModal } from "@/components/NotificationSetupModal";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Typography } from "@/components/atoms/Typography";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { BorderRadius, Colors, Spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import STRINGS from "@/i18n/es.json";
import { formatAmountInput } from "@/utils/format";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
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
import { EntitySelectionModal } from "../components/EntitySelectionModal";
import { useTransactionForm } from "../hooks/useTransactionForm";

export default function TransactionFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { id, initialType } = params;

  const {
    type,
    setType,
    amount,
    setAmount,
    description,
    setDescription,
    selectedCategory,
    setSelectedCategory,
    selectedEntityId,
    setSelectedEntityId,
    transferRelatedEntityId,
    setTransferRelatedEntityId,
    selectedPaymentType,
    setSelectedPaymentType,
    date,
    setDate,
    isSaving,
    isEditing,
    handleSave,
    handleDelete,
    frequentCategories,
    frequentEntities,
    categories,
    entities,
    isNotificationSetupVisible,
    setIsNotificationSetupVisible,
  } = useTransactionForm({
    id: id as string,
    initialType: initialType as "income" | "expense",
  });

  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isPaymentTypeDropdownOpen, setIsPaymentTypeDropdownOpen] =
    useState(false);
  const [isEntityModalVisible, setIsEntityModalVisible] = useState(false);
  const [isDestEntityModalVisible, setIsDestEntityModalVisible] =
    useState(false);

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
              : type === "transfer"
                ? "Nueva Transferencia"
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
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      padding: Spacing.s,
                      alignItems: "center",
                      backgroundColor:
                        type === "transfer" ? colors.surface : "transparent",
                      borderRadius: BorderRadius.s,
                    }}
                    onPress={() => setType("transfer")}
                  >
                    <Typography
                      weight="bold"
                      style={{
                        color:
                          type === "transfer"
                            ? colors.text
                            : colors.textSecondary,
                      }}
                    >
                      Transf.
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
                    display={Platform.OS === "ios" ? "inline" : "default"}
                    themeVariant={colorScheme ?? "light"}
                    onChange={(_: DateTimePickerEvent, selectedDate?: Date) => {
                      const currentDate = selectedDate || date;
                      setShowDatePicker(false);
                      setDate(currentDate);
                    }}
                    maximumDate={new Date()}
                    style={
                      Platform.OS === "ios"
                        ? { backgroundColor: colors.surface }
                        : undefined
                    }
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
              {type !== "transfer" && (
                <View style={{ marginBottom: Spacing.m }}>
                  <Typography
                    variant="caption"
                    style={{ marginBottom: Spacing.xs, color: colors.text }}
                  >
                    {STRINGS.wallet.category}
                  </Typography>

                  {/* Quick Category Chips */}
                  {frequentCategories.length > 0 && (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={{ marginBottom: Spacing.s }}
                      contentContainerStyle={{ gap: 8 }}
                    >
                      {frequentCategories.map((cat) => (
                        <TouchableOpacity
                          key={cat}
                          onPress={() => {
                            setSelectedCategory(cat);
                            Haptics.selectionAsync();
                          }}
                          style={{
                            backgroundColor:
                              selectedCategory === cat
                                ? colors.primary
                                : colors.surface,
                            paddingHorizontal: Spacing.m,
                            paddingVertical: 6,
                            borderRadius: BorderRadius.l,
                            borderWidth: 1,
                            borderColor:
                              selectedCategory === cat
                                ? colors.primary
                                : colors.border,
                          }}
                        >
                          <Typography
                            style={{
                              color:
                                selectedCategory === cat
                                  ? "#FFFFFF"
                                  : colors.text,
                              fontWeight:
                                selectedCategory === cat ? "bold" : "normal",
                              fontSize: 13,
                            }}
                          >
                            {cat}
                          </Typography>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  )}

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
                      <ScrollView
                        nestedScrollEnabled
                        style={{ maxHeight: 200 }}
                      >
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
              )}

              {/* Entity Selector */}
              <View style={{ marginBottom: Spacing.xl }}>
                <Typography
                  variant="caption"
                  style={{ marginBottom: Spacing.xs, color: colors.text }}
                >
                  {type === "transfer"
                    ? "Cuenta de Origen"
                    : STRINGS.vision.selectEntity}
                </Typography>

                {/* Quick Entity Chips */}
                {frequentEntities.length > 0 && (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={{ marginBottom: Spacing.s }}
                    contentContainerStyle={{ gap: 8 }}
                  >
                    {frequentEntities.map((entity) => (
                      <TouchableOpacity
                        key={entity!.id}
                        onPress={() => {
                          setSelectedEntityId(entity!.id);
                          Haptics.selectionAsync();
                        }}
                        style={{
                          backgroundColor:
                            selectedEntityId === entity!.id
                              ? colors.primary
                              : colors.surface,
                          paddingHorizontal: Spacing.m,
                          paddingVertical: 6,
                          borderRadius: BorderRadius.l,
                          borderWidth: 1,
                          borderColor:
                            selectedEntityId === entity!.id
                              ? colors.primary
                              : colors.border,
                        }}
                      >
                        <Typography
                          style={{
                            color:
                              selectedEntityId === entity!.id
                                ? "#FFFFFF"
                                : colors.text,
                            fontWeight:
                              selectedEntityId === entity!.id
                                ? "bold"
                                : "normal",
                            fontSize: 13,
                          }}
                        >
                          {entity!.name}
                        </Typography>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}

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

              {type === "transfer" && (
                <View style={{ marginBottom: Spacing.xl }}>
                  <Typography
                    variant="caption"
                    style={{ marginBottom: Spacing.xs, color: colors.text }}
                  >
                    Cuenta de Destino
                  </Typography>

                  <TouchableOpacity
                    onPress={() => setIsDestEntityModalVisible(true)}
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
                          color: transferRelatedEntityId
                            ? colors.text
                            : colors.textSecondary,
                        }}
                      >
                        {transferRelatedEntityId
                          ? entities.find(
                              (e) => e.id === transferRelatedEntityId,
                            )?.name || "Seleccionar cuenta destino"
                          : "Seleccionar cuenta destino"}
                      </Typography>
                      <IconSymbol
                        name="chevron.down"
                        size={16}
                        color={colors.text}
                      />
                    </View>
                  </TouchableOpacity>
                </View>
              )}

              <View style={{ flexDirection: "row", gap: Spacing.m }}>
                <View style={{ flex: 1 }}>
                  <Button
                    title={STRINGS.common.save}
                    onPress={() => handleSave(true)}
                    loading={isSaving}
                    variant="primary"
                  />
                </View>
                {!isEditing && (
                  <View style={{ flex: 1 }}>
                    <Button
                      title="Guardar y otro"
                      onPress={() => handleSave(false)}
                      loading={isSaving}
                      variant="outline"
                    />
                  </View>
                )}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </ScrollView>
      </KeyboardAvoidingView>

      <EntitySelectionModal
        visible={isEntityModalVisible}
        onClose={() => setIsEntityModalVisible(false)}
        onSelect={(id) => setSelectedEntityId(id)}
        visionEntities={entities}
        selectedEntityId={selectedEntityId}
      />

      <EntitySelectionModal
        visible={isDestEntityModalVisible}
        onClose={() => setIsDestEntityModalVisible(false)}
        onSelect={(id) => setTransferRelatedEntityId(id)}
        visionEntities={entities}
        selectedEntityId={transferRelatedEntityId}
      />

      <NotificationSetupModal
        visible={isNotificationSetupVisible}
        onClose={() => {
          setIsNotificationSetupVisible(false);
          router.back();
        }}
        onSave={() => {}}
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
    paddingTop: Platform.OS === "ios" ? 60 : 20,
    paddingBottom: Spacing.m,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    padding: Spacing.m,
    paddingBottom: 100,
  },
  dropdown: {
    borderRadius: BorderRadius.m,
    borderWidth: 1,
  },
  dropdownHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.m,
  },
  dropdownList: {
    marginTop: -1,
    borderBottomLeftRadius: BorderRadius.m,
    borderBottomRightRadius: BorderRadius.m,
    borderWidth: 1,
    borderTopWidth: 0,
    overflow: "hidden",
  },
});
