import { Button } from "@/components/atoms/Button";
import { Card } from "@/components/atoms/Card";
import { Input } from "@/components/atoms/Input";
import { Typography } from "@/components/atoms/Typography";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { BorderRadius, Colors, Spacing } from "@/constants/theme";
import {
  FixedExpense,
  fetchBudgetConfig,
  processMonthlyBudget,
  resetBudgetConfig,
  saveBudgetConfig,
} from "@/features/budget/budgetSlice";
import { fetchTransactions } from "@/features/wallet/walletSlice";
import { useColorScheme } from "@/hooks/use-color-scheme";
import STRINGS from "@/i18n/es.json";
import { AppDispatch, RootState } from "@/store/store";
import { formatCurrency } from "@/utils/format";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
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
import { BarChart, PieChart } from "react-native-gifted-charts";
import { useDispatch, useSelector } from "react-redux";

export default function BudgetScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const { isSetup, loading: budgetLoading } = useSelector(
    (state: RootState) => state.budget,
  );
  const { user } = useSelector((state: RootState) => state.auth);

  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  useEffect(() => {
    if (user?.uid) {
      dispatch(fetchBudgetConfig(user.uid));
      dispatch(fetchTransactions(user.uid));
    }
  }, [dispatch, user]);

  useEffect(() => {
    if (isSetup && user?.uid) {
      dispatch(processMonthlyBudget(user.uid));
    }
  }, [isSetup, user, dispatch]);

  if (budgetLoading) {
    return (
      <ThemedView style={[styles.container, { justifyContent: "center" }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {isSetup ? <BudgetDashboard /> : <BudgetSetupWizard />}
    </ThemedView>
  );
}

const CATEGORIES = STRINGS.wallet.categories;

// Helper to format amount input with commas
const formatAmountInput = (text: string) => {
  // Remove existing commas to get raw input
  let rawText = text.replace(/,/g, "");

  // Allow empty string
  if (rawText === "") return "";

  // Remove non-numeric chars except dot
  rawText = rawText.replace(/[^0-9.]/g, "");

  // Handle multiple dots: keep only the first one
  const dots = rawText.match(/\./g) || [];
  if (dots.length > 1) {
    const firstDotIndex = rawText.indexOf(".");
    rawText =
      rawText.slice(0, firstDotIndex + 1) +
      rawText.slice(firstDotIndex + 1).replace(/\./g, "");
  }

  // Split into integer and decimal parts
  const parts = rawText.split(".");
  // Format integer part with commas
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  // Limit decimal places to 2
  if (parts.length > 1) {
    parts[1] = parts[1].slice(0, 2);
  }

  return parts.join(".");
};

// Helper to get raw number from formatted string
const getRawAmount = (formattedText: string) => {
  return parseFloat(formattedText.replace(/,/g, ""));
};

function BudgetSetupWizard() {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const [step, setStep] = useState(1);
  const [income, setIncome] = useState("");
  const [expenses, setExpenses] = useState<FixedExpense[]>([]);

  // Expense Form State
  const [expenseName, setExpenseName] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseCategory, setExpenseCategory] = useState("");
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);

  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const handleAddExpense = () => {
    if (!expenseName || !expenseAmount) {
      Alert.alert("Error", "Por favor ingresa nombre y monto del gasto.");
      return;
    }
    const newExpense: FixedExpense = {
      id: Date.now().toString(),
      name: expenseName,
      amount: getRawAmount(expenseAmount),
      category: expenseCategory,
    };
    setExpenses([...expenses, newExpense]);
    setExpenseName("");
    setExpenseAmount("");
    Keyboard.dismiss();
  };

  const handleRemoveExpense = (id: string) => {
    setExpenses(expenses.filter((e) => e.id !== id));
  };

  const handleFinish = async () => {
    if (!user?.uid) return;
    try {
      await dispatch(
        saveBudgetConfig({
          userId: user.uid,
          monthlyIncome: getRawAmount(income),
          fixedExpenses: expenses,
        }),
      ).unwrap();

      // The useEffect hook will handle the initial processing when isSetup becomes true
    } catch (error) {
      console.error("Error saving budget", error);
      Alert.alert("Error", "No se pudo guardar el presupuesto.");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={{ padding: Spacing.m, paddingBottom: 100 }}
        >
          <LinearGradient
            colors={[...colors.gradients.primary]}
            style={styles.headerGradient}
          >
            <Typography variant="h2" weight="bold" style={{ color: "#FFF" }}>
              {step === 1
                ? "Configura tu Presupuesto"
                : step === 2
                  ? "Gastos Fijos"
                  : "Resumen"}
            </Typography>
            <Typography style={{ color: "rgba(255,255,255,0.8)" }}>
              Paso {step} de 3
            </Typography>
          </LinearGradient>

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
                      {CATEGORIES.map((cat, index) => (
                        <TouchableOpacity
                          key={cat}
                          onPress={() => {
                            setExpenseCategory(cat);
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
}

function BudgetDashboard() {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { monthlyIncome, fixedExpenses } = useSelector(
    (state: RootState) => state.budget,
  );
  const { transactions } = useSelector((state: RootState) => state.wallet);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const handleReset = () => {
    Alert.alert(
      "Reiniciar Presupuesto",
      "¿Estás seguro? Esto eliminará tu configuración de presupuesto actual y tendrás que configurarlo de nuevo. Las transacciones pasadas no se eliminarán.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Reiniciar",
          style: "destructive",
          onPress: () => {
            if (user?.uid) {
              dispatch(resetBudgetConfig(user.uid));
            }
          },
        },
      ],
    );
  };

  // Calculate actuals
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const currentMonthTransactions = transactions.filter((t) => {
    const tDate = new Date(t.date);
    return (
      tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear
    );
  });

  const totalActualIncome = currentMonthTransactions
    .filter((t) => t.type === "income")
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalActualExpense = currentMonthTransactions
    .filter((t) => t.type === "expense")
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalFixedExpenses = fixedExpenses.reduce(
    (acc, curr) => acc + curr.amount,
    0,
  );
  const remainingBudget = Math.max(0, monthlyIncome - totalFixedExpenses);

  // Pie Chart Data (Budget Distribution)
  const pieData = [
    {
      value: totalFixedExpenses,
      color: colors.error,
      text: `${((totalFixedExpenses / monthlyIncome) * 100).toFixed(0)}%`,
    },
    {
      value: remainingBudget,
      color: colors.success,
      text: `${((remainingBudget / monthlyIncome) * 100).toFixed(0)}%`,
    },
  ];

  // Bar Chart Data (Actuals)
  const barData = [
    {
      value: monthlyIncome,
      label: "Ingreso",
      frontColor: colors.success,
      topLabelComponent: () => (
        <Typography
          variant="caption"
          style={{
            fontSize: 10,
            width: 80,
            textAlign: "center",
            marginBottom: 6,
          }}
        >
          {formatCurrency(monthlyIncome)}
        </Typography>
      ),
    },
    {
      value: totalActualExpense,
      label: "Gasto",
      frontColor: colors.error,
      topLabelComponent: () => (
        <Typography
          variant="caption"
          style={{
            fontSize: 10,
            width: 80,
            textAlign: "center",
            marginBottom: 6,
          }}
        >
          {formatCurrency(totalActualExpense)}
        </Typography>
      ),
    },
    {
      value: Math.max(0, monthlyIncome - totalActualExpense),
      label: "Restante",
      frontColor: colors.primary,
      topLabelComponent: () => (
        <Typography
          variant="caption"
          style={{
            fontSize: 10,
            width: 80,
            textAlign: "center",
            marginBottom: 6,
          }}
        >
          {formatCurrency(Math.max(0, monthlyIncome - totalActualExpense))}
        </Typography>
      ),
    },
  ];

  return (
    <ScrollView
      contentContainerStyle={{ padding: Spacing.m, paddingBottom: 100 }}
    >
      <LinearGradient
        colors={[...colors.gradients.primary]}
        style={styles.headerGradient}
      >
        <Typography variant="h2" weight="bold" style={{ color: "#FFF" }}>
          Tu Presupuesto
        </Typography>
        <Typography style={{ color: "rgba(255,255,255,0.8)" }}>
          {STRINGS.wallet.months[currentMonth]} {currentYear}
        </Typography>
      </LinearGradient>

      <Card style={{ marginBottom: Spacing.l, paddingVertical: Spacing.l }}>
        <Typography
          variant="h3"
          weight="bold"
          style={{ marginBottom: Spacing.m, textAlign: "center" }}
        >
          Distribución del Presupuesto
        </Typography>
        <View style={{ alignItems: "center" }}>
          <PieChart
            data={pieData}
            donut
            radius={80}
            innerRadius={60}
            centerLabelComponent={() => (
              <View style={{ alignItems: "center" }}>
                <Typography variant="caption">Libre</Typography>
                <Typography
                  variant="h3"
                  weight="bold"
                  style={{ color: colors.success }}
                >
                  {formatCurrency(remainingBudget)}
                </Typography>
              </View>
            )}
          />
        </View>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            marginTop: Spacing.m,
            gap: Spacing.l,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <View
              style={{
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: colors.error,
              }}
            />
            <Typography variant="caption">Fijos</Typography>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <View
              style={{
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: colors.success,
              }}
            />
            <Typography variant="caption">Libre</Typography>
          </View>
        </View>
      </Card>

      <Card style={{ marginBottom: Spacing.l, paddingVertical: Spacing.l }}>
        <Typography
          variant="h3"
          weight="bold"
          style={{ marginBottom: Spacing.m, textAlign: "center" }}
        >
          Resumen Mensual (Real vs Presupuesto)
        </Typography>
        <View style={{ alignItems: "center" }}>
          <BarChart
            key={`${monthlyIncome}-${totalActualExpense}-${totalActualIncome}`}
            data={barData}
            barWidth={50}
            spacing={40}
            noOfSections={4}
            barBorderRadius={4}
            frontColor="lightgray"
            yAxisThickness={0}
            xAxisThickness={0}
            yAxisLabelWidth={60}
            height={200}
            width={300}
            isAnimated
            hideRules
            maxValue={
              Math.max(
                monthlyIncome,
                totalActualExpense,
                totalActualIncome,
                100,
              ) * 1.2
            }
            yAxisTextStyle={{ color: colors.text, fontSize: 10 }}
            xAxisLabelTextStyle={{ color: colors.text, fontSize: 10 }}
          />
        </View>
      </Card>

      <View style={styles.statsGrid}>
        <Card style={styles.statCard}>
          <Typography variant="caption">Ingreso Esperado</Typography>
          <Typography
            variant="h3"
            weight="bold"
            style={{ color: colors.success }}
          >
            {formatCurrency(monthlyIncome)}
          </Typography>
        </Card>
        <Card style={styles.statCard}>
          <Typography variant="caption">Gastos Fijos</Typography>
          <Typography
            variant="h3"
            weight="bold"
            style={{ color: colors.error }}
          >
            {formatCurrency(totalFixedExpenses)}
          </Typography>
        </Card>
        <Card style={styles.statCard}>
          <Typography variant="caption">Ingreso Real</Typography>
          <Typography
            variant="h3"
            weight="bold"
            style={{ color: colors.success }}
          >
            {formatCurrency(totalActualIncome)}
          </Typography>
        </Card>
        <Card style={styles.statCard}>
          <Typography variant="caption">Gasto Real</Typography>
          <Typography
            variant="h3"
            weight="bold"
            style={{ color: colors.error }}
          >
            {formatCurrency(totalActualExpense)}
          </Typography>
        </Card>
      </View>

      <Card variant="outlined" style={{ marginTop: Spacing.m }}>
        <Typography
          variant="h3"
          weight="bold"
          style={{ marginBottom: Spacing.s }}
        >
          Análisis
        </Typography>
        <Typography variant="body">
          {totalActualExpense > monthlyIncome
            ? "⚠️ Has excedido tu presupuesto mensual. Revisa tus gastos variables."
            : totalActualExpense > monthlyIncome * 0.8
              ? "👀 Estás cerca de tu límite de presupuesto (80%). Ten cuidado con gastos hormiga."
              : "✅ Tu comportamiento financiero es saludable. ¡Sigue así!"}
        </Typography>
      </Card>

      <Button
        title="Reiniciar Presupuesto"
        variant="outline"
        onPress={handleReset}
        style={{ marginTop: Spacing.xl, borderColor: colors.error }}
        textStyle={{ color: colors.error }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerGradient: {
    padding: Spacing.l,
    borderRadius: BorderRadius.l,
    marginBottom: Spacing.l,
    alignItems: "center",
  },
  stepContainer: {
    flex: 1,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.m,
  },
  statCard: {
    width: "47%",
    alignItems: "center",
    padding: Spacing.m,
  },
});
