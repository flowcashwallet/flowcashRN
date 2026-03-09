import {
  fetchBudgetConfig,
  processMonthlyBudget,
} from "@/features/budget/budgetSlice";
import { fetchTransactions } from "@/features/wallet/data/walletSlice";
import { RootState } from "@/store/store";
import { useTheme } from "@/contexts/ThemeContext";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "@/store/store";

export const useBudgetData = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { isSetup, loading: budgetLoading } = useSelector(
    (state: RootState) => state.budget
  );
  const { user } = useSelector((state: RootState) => state.auth);

  const { colors } = useTheme();

  useEffect(() => {
    if (user?.id) {
      dispatch(fetchBudgetConfig());
      dispatch(fetchTransactions());
    }
  }, [dispatch, user]);

  useEffect(() => {
    if (isSetup && user?.id) {
      dispatch(processMonthlyBudget());
    }
  }, [isSetup, user, dispatch]);

  return {
    user,
    isSetup,
    budgetLoading,
    colors,
  };
};
