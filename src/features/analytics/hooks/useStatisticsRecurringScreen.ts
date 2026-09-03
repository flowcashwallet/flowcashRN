import { useTheme } from "@/contexts/ThemeContext";
import { calculateRecurringExpenses } from "@/features/analytics/utils/analyticsUtils";
import { fetchTransactions } from "@/features/wallet/data/walletSlice";
import { AppDispatch, RootState } from "@/store/store";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";

/**
 * Detalle de "gastos recurrentes" del mes recibido por parámetro de ruta
 * (`month`/`year`, viene de `AnalyticsScreen`). Mismo criterio que
 * `useStatisticsCategoriesScreen`: reutiliza `calculateRecurringExpenses` de
 * `analyticsUtils` en vez de duplicar el fetch/filtro de `useAnalyticsData`.
 */
export const useStatisticsRecurringScreen = () => {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { transactions } = useSelector((state: RootState) => state.wallet);
  const { month, year } = useLocalSearchParams<{
    month?: string;
    year?: string;
  }>();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const [refreshing, setRefreshing] = useState(false);

  const selectedMonth = Number.isFinite(Number(month))
    ? Number(month)
    : new Date().getMonth();
  const selectedYear = Number.isFinite(Number(year))
    ? Number(year)
    : new Date().getFullYear();

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const tDate = new Date(t.date);
      return (
        tDate.getMonth() === selectedMonth && tDate.getFullYear() === selectedYear
      );
    });
  }, [transactions, selectedMonth, selectedYear]);

  const recurringExpenses = useMemo(
    () => calculateRecurringExpenses(filteredTransactions),
    [filteredTransactions],
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await dispatch(fetchTransactions()).unwrap();
    } finally {
      setRefreshing(false);
    }
  }, [dispatch]);

  const goBack = useCallback(() => router.back(), [router]);

  return {
    colors,
    insets,
    selectedMonth,
    selectedYear,
    recurringExpenses,
    refreshing,
    onRefresh,
    goBack,
  };
};
