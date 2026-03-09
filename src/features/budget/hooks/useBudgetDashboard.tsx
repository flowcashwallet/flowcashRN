import { Typography } from "@/components/atoms/Typography";
import { resetBudgetConfig } from "@/features/budget/budgetSlice";
import { useTheme } from "@/contexts/ThemeContext";
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
      label: STRINGS.budget.expectedIncome,
      frontColor: colors.success,
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
      frontColor: colors.error,
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
      frontColor: colors.primary,
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
