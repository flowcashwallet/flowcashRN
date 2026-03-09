import { Typography } from "@/components/atoms/Typography";
import { useTheme } from "@/contexts/ThemeContext";
import { resetBudgetConfig } from "@/features/budget/budgetSlice";
import STRINGS from "@/i18n/es.json";
import { AppDispatch, RootState } from "@/store/store";
import { formatCurrency } from "@/utils/format";
import React from "react";
import { Alert } from "react-native";
import { useDispatch, useSelector } from "react-redux";

export const useBudgetDashboard = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { monthlyIncome, fixedExpenses } = useSelector(
    (state: RootState) => state.budget,
  );
  const { transactions } = useSelector((state: RootState) => state.wallet);
  const { colors } = useTheme();

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
            dispatch(resetBudgetConfig());
          },
        },
      ],
    );
  };

  // Calculate actuals
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const monthName = STRINGS.wallet.months[currentMonth];

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
      color: "#FF5252", // Neon Red
      gradientCenterColor: "#FF8A80",
      focused: false,
    },
    {
      value: remainingBudget,
      color: "#00E676", // Neon Green
      gradientCenterColor: "#69F0AE",
      focused: false,
    },
  ];

  // Bar Chart Data (Actuals)
  const barData = [
    {
      value: monthlyIncome,
      label: STRINGS.budget.expectedIncome,
      frontColor: "#2979FF", // Neon Blue
      gradientColor: "#448AFF",
      showGradient: true,
      topLabelComponent: () => (
        <Typography
          variant="caption"
          style={{
            fontSize: 10,
            width: 80,
            textAlign: "center",
            marginBottom: 6,
            color: "#D1D1D6",
          }}
        >
          {formatCurrency(monthlyIncome)}
        </Typography>
      ),
    },
    {
      value: totalActualExpense,
      label: STRINGS.budget.actualExpense,
      frontColor: "#FF5252", // Neon Red
      gradientColor: "#FF8A80",
      showGradient: true,
      topLabelComponent: () => (
        <Typography
          variant="caption"
          style={{
            fontSize: 10,
            width: 80,
            textAlign: "center",
            marginBottom: 6,
            color: "#D1D1D6",
          }}
        >
          {formatCurrency(totalActualExpense)}
        </Typography>
      ),
    },
    {
      value: Math.max(0, monthlyIncome - totalActualExpense),
      label: STRINGS.budget.free,
      frontColor: "#00E676", // Neon Green
      gradientColor: "#69F0AE",
      showGradient: true,
      topLabelComponent: () => (
        <Typography
          variant="caption"
          style={{
            fontSize: 10,
            width: 80,
            textAlign: "center",
            marginBottom: 6,
            color: "#D1D1D6",
          }}
        >
          {formatCurrency(Math.max(0, monthlyIncome - totalActualExpense))}
        </Typography>
      ),
    },
  ];

  return {
    colors,
    handleReset,
    pieData,
    barData,
    monthName,
    currentYear,
    fixedExpenses,
    remainingBudget,
    monthlyIncome,
    totalActualExpense,
    totalActualIncome,
    totalFixedExpenses,
  };
};
