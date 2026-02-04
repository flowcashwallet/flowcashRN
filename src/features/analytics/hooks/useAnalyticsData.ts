import STRINGS from "@/i18n/es.json";
import { RootState } from "@/store/store";
import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import {
  calculateRecurringExpenses,
  calculateTopCategories,
  generateFinancialTips,
} from "../utils/analyticsUtils";

export const useAnalyticsData = () => {
  const { transactions } = useSelector((state: RootState) => state.wallet);
  const [selectedDate, setSelectedDate] = useState(new Date());

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

  return {
    recurringExpenses,
    topCategories,
    financialTips,
    transactionsCount: filteredTransactions.length,
    selectedDate,
    setSelectedDate,
    currentMonthName,
    currentYear,
  };
};
