import { Button } from "@/components/atoms/Button";
import { Card } from "@/components/atoms/Card";
import { Input } from "@/components/atoms/Input";
import { Typography } from "@/components/atoms/Typography";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { BorderRadius, Colors, Spacing } from "@/constants/theme";
import { useBudgetSetup } from "@/features/budget/hooks/useBudgetSetup";
import { fetchCategories } from "@/features/wallet/data/categoriesSlice";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { AppDispatch, RootState } from "@/store/store";
import { formatCurrency } from "@/utils/format";
import React, { useEffect } from "react";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";

export const BudgetSetupWizard = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { categories } = useSelector((state: RootState) => state.categories);
  const {
    step,
    setStep,
    income,
    setIncome,
    expenses,
    expenseName,
    setExpenseName,
    expenseAmount,
    setExpenseAmount,
    expenseCategory,
    setExpenseCategory,
    isCategoryDropdownOpen,
    setIsCategoryDropdownOpen,
    handleAddExpense,
    handleRemoveExpense,
    handleFinish,
    formatAmountInput,
    getRawAmount,
  } = useBudgetSetup();

  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  useEffect(() => {
    if (user?.id && categories.length === 0) {
      dispatch(fetchCategories(user.id.toString()));
    }
  }, [user, dispatch, categories.length]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={{ padding: Spacing.m, paddingBottom: 100 }}
        >
          <View
            style={[
              styles.headerGradient,
              { backgroundColor: colors.surfaceHighlight },
            ]}
          >
            <Typography
              variant="h2"
              weight="bold"
              style={{ color: colors.text }}
            >
              {step === 1
                ? "Configura tu Presupuesto"
                : step === 2
                  ? "Gastos Fijos"
                  : "Resumen"}
            </Typography>
            <Typography style={{ color: colors.textSecondary }}>
              Paso {step} de 3
            </Typography>
          </View>

          {step === 1 && (
            <View style={styles.stepContainer}>
              <Typography variant="body" style={{ marginBottom: Spacing.m }}>
                Para comenzar, dinos cuál es tu ingreso mensual estimado. Esto
                nos ayudará a calcular tu capacidad de ahorro.
              </Typography>
              <Input
                label="Ingreso Mensual"
                placeholder="Ej. 2,500.00"
                keyboardType="numeric"
                value={income}
                onChangeText={(text) => setIncome(formatAmountInput(text))}
              />
              <Button
                title="Siguiente"
                onPress={() => {
                  if (!income) {
                    Alert.alert(
                      "Error",
                      "Por favor ingresa tu ingreso mensual.",
                    );
                    return;
                  }
                  setStep(2);
                }}
                style={{ marginTop: Spacing.l }}
              />
            </View>
          )}

          {step === 2 && (
            <View style={styles.stepContainer}>
              <Typography variant="body" style={{ marginBottom: Spacing.m }}>
                ¿Tienes gastos fijos mensuales? (Renta, Internet, Netflix, etc.)
                Agrégalos aquí.
              </Typography>

              <Card variant="outlined" style={{ marginBottom: Spacing.m }}>
                <Input
                  label="Nombre del Gasto"
                  placeholder="Ej. Internet"
                  value={expenseName}
                  onChangeText={setExpenseName}
                />

                <Typography
                  variant="caption"
                  style={{ marginBottom: Spacing.xs, color: colors.text }}
                >
                  Categoría
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
                        color: expenseCategory
                          ? colors.text
                          : colors.text + "80",
                      }}
                    >
                      {expenseCategory || "Selecciona una categoría"}
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
                      {categories.map((cat, index) => (
                        <TouchableOpacity
                          key={cat.id}
                          onPress={() => {
                            setExpenseCategory(cat.name);
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
                            {cat.name}
                          </Typography>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}

                <Input
                  label="Monto"
                  placeholder="0.00"
                  keyboardType="numeric"
                  value={expenseAmount}
                  onChangeText={(text) =>
                    setExpenseAmount(formatAmountInput(text))
                  }
                />
                <Button
                  title="Agregar Gasto"
                  variant="outline"
                  onPress={handleAddExpense}
                  style={{ marginTop: Spacing.s }}
                />
              </Card>

              {expenses.length > 0 && (
                <View>
                  <Typography
                    variant="h3"
                    weight="bold"
                    style={{ marginBottom: Spacing.s }}
                  >
                    Gastos Agregados:
                  </Typography>
                  {expenses.map((expense) => (
                    <Card
                      key={expense.id}
                      style={{
                        marginBottom: Spacing.s,
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <View>
                        <Typography weight="bold">{expense.name}</Typography>
                        <Typography variant="caption">
                          {formatCurrency(expense.amount)}
                        </Typography>
                      </View>
                      <TouchableOpacity
                        onPress={() => handleRemoveExpense(expense.id)}
                      >
                        <IconSymbol
                          name="trash"
                          size={20}
                          color={colors.error}
                        />
                      </TouchableOpacity>
                    </Card>
                  ))}
                </View>
              )}

              <View
                style={{
                  flexDirection: "row",
                  gap: Spacing.m,
                  marginTop: Spacing.l,
                }}
              >
                <Button
                  title="Atrás"
                  variant="outline"
                  onPress={() => setStep(1)}
                  style={{ flex: 1 }}
                />
                <Button
                  title="Siguiente"
                  onPress={() => setStep(3)}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          )}

          {step === 3 && (
            <View style={styles.stepContainer}>
              <Typography
                variant="h3"
                weight="bold"
                style={{ marginBottom: Spacing.m }}
              >
                Resumen
              </Typography>

              <Card style={{ marginBottom: Spacing.m }}>
                <Typography variant="caption">Ingreso Mensual</Typography>
                <Typography
                  variant="h2"
                  weight="bold"
                  style={{ color: colors.success }}
                >
                  {formatCurrency(getRawAmount(income))}
                </Typography>
              </Card>

              <Card style={{ marginBottom: Spacing.m }}>
                <Typography variant="caption">Total Gastos Fijos</Typography>
                <Typography
                  variant="h2"
                  weight="bold"
                  style={{ color: colors.error }}
                >
                  {formatCurrency(
                    expenses.reduce((acc, curr) => acc + curr.amount, 0),
                  )}
                </Typography>
              </Card>

              <Typography
                variant="body"
                style={{
                  textAlign: "center",
                  marginBottom: Spacing.l,
                  fontStyle: "italic",
                }}
              >
                Al finalizar, estos ingresos y gastos se agregarán
                automáticamente a tu Wallet cada inicio de mes.
              </Typography>

              <View style={{ flexDirection: "row", gap: Spacing.m }}>
                <Button
                  title="Atrás"
                  variant="outline"
                  onPress={() => setStep(2)}
                  style={{ flex: 1 }}
                />
                <Button
                  title="Finalizar"
                  onPress={handleFinish}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          )}
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  headerGradient: {
    padding: Spacing.l,
    borderRadius: BorderRadius.l,
    marginBottom: Spacing.l,
  },
  stepContainer: {
    flex: 1,
  },
});
