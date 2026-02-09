import { FixedExpense, saveBudgetConfig } from "@/features/budget/budgetSlice";
import {
  formatAmountInput,
  getRawAmount,
} from "@/features/budget/components/BudgetHelpers";
import { AppDispatch, RootState } from "@/store/store";
import { useState } from "react";
import { Alert, Keyboard } from "react-native";
import { useDispatch, useSelector } from "react-redux";

export const useBudgetSetup = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { monthlyIncome, fixedExpenses, isSetup } = useSelector(
    (state: RootState) => state.budget,
  );

  const [step, setStep] = useState(1);
  const [income, setIncome] = useState(
    isSetup ? formatAmountInput(monthlyIncome.toFixed(2)) : "",
  );
  const [expenses, setExpenses] = useState<FixedExpense[]>(
    isSetup ? [...fixedExpenses] : [],
  );

  // Expense Form State
  const [expenseName, setExpenseName] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseCategory, setExpenseCategory] = useState("");
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);

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
    try {
      await dispatch(
        saveBudgetConfig({
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

  return {
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
  };
};
