import { Input } from "@/components/atoms/Input";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";
import STRINGS from "@/i18n/es.json";
import { Stack, useLocalSearchParams } from "expo-router";
import React from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { AmountInput } from "../components/transaction-form/AmountInput";
import { CategorySelector } from "../components/transaction-form/CategorySelector";
import { DateField } from "../components/transaction-form/DateField";
import { DeleteHeaderButton } from "../components/transaction-form/DeleteHeaderButton";
import { EntitySelectorField } from "../components/transaction-form/EntitySelectorField";
import { FormFooterActions } from "../components/transaction-form/FormFooterActions";
import { PaymentTypeDropdown } from "../components/transaction-form/PaymentTypeDropdown";
import { RecurrenceSection } from "../components/transaction-form/RecurrenceSection";
import { TransactionTypeSelector } from "../components/transaction-form/TransactionTypeSelector";
import { useTransactionForm } from "../hooks/useTransactionForm";

export default function TransactionFormScreen() {
  const {
    id,
    initialType,
    amount: paramAmount,
    description: paramDescription,
    category: paramCategory,
    relatedEntityId,
  } = useLocalSearchParams();

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
    entities,
    isRecurring,
    setIsRecurring,
    recurrenceFrequency,
    setRecurrenceFrequency,
    recurrenceMonths,
    setRecurrenceMonths,
  } = useTransactionForm({
    id: id as string,
    initialType: initialType as "income" | "expense" | "transfer",
    initialAmount: paramAmount as string,
    initialDescription: paramDescription as string,
    initialCategory: paramCategory as string,
    relatedEntityId: relatedEntityId as string,
  });

  const { colors, theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTransparent: true,
          headerTitle: isEditing ? "Editar" : "Agregar",
          headerRight: () => (
            <DeleteHeaderButton
              visible={isEditing}
              color={colors.error}
              onDelete={handleDelete}
            />
          ),
        }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
        keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <TouchableWithoutFeedback
            onPress={Platform.OS === "web" ? undefined : Keyboard.dismiss}
          >
            <View>
              <AmountInput
                type={type}
                amount={amount}
                onChangeAmount={setAmount}
                colors={colors}
              />
              {!isEditing && (
                <TransactionTypeSelector
                  type={type}
                  onSelectType={setType}
                  colors={colors}
                />
              )}
              <Input
                label={STRINGS.wallet.description}
                placeholder={STRINGS.wallet.descriptionPlaceholder}
                value={description}
                onChangeText={setDescription}
              />
              <DateField
                date={date}
                onChangeDate={setDate}
                colors={colors}
                theme={theme}
              />
              <PaymentTypeDropdown
                selectedPaymentType={selectedPaymentType}
                onSelectPaymentType={setSelectedPaymentType}
                colors={colors}
              />
              {type !== "transfer" && (
                <CategorySelector
                  selectedCategory={selectedCategory}
                  onSelectCategory={setSelectedCategory}
                  frequentCategories={frequentCategories}
                  colors={colors}
                />
              )}
              <EntitySelectorField
                label={
                  type === "transfer"
                    ? "Cuenta de Origen"
                    : STRINGS.vision.selectEntity
                }
                entities={entities}
                selectedEntityId={selectedEntityId}
                onSelect={setSelectedEntityId}
                placeholder={STRINGS.vision.entityPlaceholder}
                frequentEntities={frequentEntities}
                colors={colors}
              />
              {type === "transfer" && (
                <EntitySelectorField
                  label="Cuenta de Destino"
                  entities={entities}
                  selectedEntityId={transferRelatedEntityId}
                  onSelect={setTransferRelatedEntityId}
                  placeholder="Seleccionar cuenta destino"
                  colors={colors}
                />
              )}
              <RecurrenceSection
                isRecurring={isRecurring}
                onChangeIsRecurring={setIsRecurring}
                recurrenceFrequency={recurrenceFrequency}
                onChangeRecurrenceFrequency={setRecurrenceFrequency}
                recurrenceMonths={recurrenceMonths}
                onChangeRecurrenceMonths={setRecurrenceMonths}
                colors={colors}
              />
              <FormFooterActions
                isEditing={isEditing}
                isSaving={isSaving}
                onSave={handleSave}
              />
            </View>
          </TouchableWithoutFeedback>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

/** El header de `Stack.Screen` es transparente: el contenido arranca por debajo. */
const HEADER_OFFSET = Spacing.xxl;
/** Aire bajo el CTA de cierre para que no lo tape la barra inferior. */
const FOOTER_OFFSET = Spacing.xxl * 2;

const styles = StyleSheet.create({
  container: {},
  flex: {
    flex: 1,
  },
  content: {
    padding: Spacing.m,
    paddingTop: HEADER_OFFSET,
    paddingBottom: FOOTER_OFFSET,
  },
});
