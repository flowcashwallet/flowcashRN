import STRINGS from "@/i18n/es.json";
import { AppDispatch, RootState } from "@/store/store";
import { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchTransactions } from "@/features/wallet/data/walletSlice";
import {
  calculateRecurringExpenses,
  calculateTopCategories,
  generateFinancialTips,
} from "../utils/analyticsUtils";

export const useAnalyticsData = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { transactions } = useSelector((state: RootState) => state.wallet);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);

  const currentMonth = selectedDate.getMonth();
  const currentYear = selectedDate.getFullYear();
  const currentMonthName = STRINGS.wallet.months[currentMonth];

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const tDate = new Date(t.date);
      return (
        tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear
      );
    });
  }, [transactions, currentMonth, currentYear]);

  const recurringExpenses = useMemo(
    () => calculateRecurringExpenses(filteredTransactions),
    [filteredTransactions],
  );
  const topCategories = useMemo(
    () => calculateTopCategories(filteredTransactions),
    [filteredTransactions],
  );
  const financialTips = useMemo(
    () => generateFinancialTips(filteredTransactions),
    [filteredTransactions],
  );

  const onRefresh = async () => {
    setRefreshing(true);
    try {
        await dispatch(fetchTransactions()).unwrap();
    } catch (error) {
        console.error("Failed to refresh transactions in analytics:", error);
    } finally {
        setRefreshing(false);
    }
  };

  return {
    recurringExpenses,
    topCategories,
    financialTips,
    transactionsCount: filteredTransactions.length,
    selectedDate,
    setSelectedDate,
    currentMonthName,
    currentYear,
    onRefresh,
    refreshing,
  };
};
