import { FixedExpense, saveBudgetConfig } from "@/features/budget/budgetSlice";
import {
  formatAmountInput,
  getRawAmount,
} from "@/features/budget/components/BudgetHelpers";
import { fetchCategories } from "@/features/wallet/data/categoriesSlice";
import { AppDispatch, RootState } from "@/store/store";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Keyboard } from "react-native";
import { useDispatch, useSelector } from "react-redux";

export const useBudgetSetup = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { monthlyIncome, fixedExpenses, isSetup } = useSelector(
    (state: RootState) => state.budget,
  );
  const { user } = useSelector((state: RootState) => state.auth);
  const { categories } = useSelector((state: RootState) => state.categories);

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

  // Antes vivía como `useEffect` directo en `BudgetSetupWizard.tsx`.
  useEffect(() => {
    if (user?.id && categories.length === 0) {
      dispatch(fetchCategories(user.id.toString()));
    }
  }, [user, dispatch, categories.length]);

  const handleIncomeChange = useCallback((text: string) => {
    setIncome(formatAmountInput(text));
  }, []);

  const handleExpenseAmountChange = useCallback((text: string) => {
    setExpenseAmount(formatAmountInput(text));
  }, []);

  const toggleCategoryDropdown = useCallback(() => {
    setIsCategoryDropdownOpen((prev) => !prev);
  }, []);

  const handleSelectExpenseCategory = useCallback((name: string) => {
    setExpenseCategory(name);
    setIsCategoryDropdownOpen(false);
  }, []);

  const goToIncomeStep = useCallback(() => setStep(1), []);
  const goToExpensesStep = useCallback(() => setStep(2), []);
  const goToSummaryStep = useCallback(() => setStep(3), []);

  const handleContinueFromIncome = useCallback(() => {
    if (!income) {
      Alert.alert("Error", "Por favor ingresa tu ingreso mensual.");
      return;
    }
    goToExpensesStep();
  }, [income, goToExpensesStep]);

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

  // Antes un `.reduce(...)` inline en el paso 3 (resumen) de
  // `BudgetSetupWizard.tsx`.
  const totalExpenses = useMemo(
    () => expenses.reduce((acc, curr) => acc + curr.amount, 0),
    [expenses],
  );

  // Antes `getRawAmount(income)` calculado inline en el JSX del paso 3.
  const parsedIncome = useMemo(() => getRawAmount(income), [income]);

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
    income,
    handleIncomeChange,
    expenses,
    expenseName,
    setExpenseName,
    expenseAmount,
    handleExpenseAmountChange,
    expenseCategory,
    isCategoryDropdownOpen,
    toggleCategoryDropdown,
    handleSelectExpenseCategory,
    categories,
    handleAddExpense,
    handleRemoveExpense,
    totalExpenses,
    parsedIncome,
    handleFinish,
    handleContinueFromIncome,
    goToIncomeStep,
    goToExpensesStep,
    goToSummaryStep,
  };
};
