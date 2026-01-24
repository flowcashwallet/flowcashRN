import { FixedExpense, saveBudgetConfig } from "@/features/budget/budgetSlice";
import { AppDispatch } from "@/store/store";
import {
  formatAmountInput,
  getRawAmount,
} from "@/features/budget/components/BudgetHelpers";
import { useState } from "react";
import { Alert, Keyboard } from "react-native";
import { useDispatch } from "react-redux";

export const useBudgetSetup = (userId?: string) => {
  const dispatch = useDispatch<AppDispatch>();
  const [step, setStep] = useState(1);
  const [income, setIncome] = useState("");
  const [expenses, setExpenses] = useState<FixedExpense[]>([]);

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
    if (!userId) return;
    try {
      await dispatch(
        saveBudgetConfig({
          userId,
          monthlyIncome: getRawAmount(income),
          fixedExpenses: expenses,
        })
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
