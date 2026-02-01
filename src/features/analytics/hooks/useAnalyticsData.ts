import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { useMemo } from "react";
import { calculateRecurringExpenses, calculateTopCategories, generateFinancialTips } from "../utils/analyticsUtils";

export const useAnalyticsData = () => {
  const { transactions } = useSelector((state: RootState) => state.wallet);

  const recurringExpenses = useMemo(() => calculateRecurringExpenses(transactions), [transactions]);
  const topCategories = useMemo(() => calculateTopCategories(transactions), [transactions]);
  const financialTips = useMemo(() => generateFinancialTips(transactions), [transactions]);

  return {
    recurringExpenses,
    topCategories,
    financialTips,
    transactionsCount: transactions.length
  };
};
