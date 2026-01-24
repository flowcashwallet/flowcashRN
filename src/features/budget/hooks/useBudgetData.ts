import {
  fetchBudgetConfig,
  processMonthlyBudget,
} from "@/features/budget/budgetSlice";
import { fetchTransactions } from "@/features/wallet/data/walletSlice";
import { RootState } from "@/store/store";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Colors } from "@/constants/theme";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "@/store/store";

export const useBudgetData = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { isSetup, loading: budgetLoading } = useSelector(
    (state: RootState) => state.budget
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

  return {
    user,
    isSetup,
    budgetLoading,
    colors,
  };
};
