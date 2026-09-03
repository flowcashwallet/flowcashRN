import { useTheme } from "@/contexts/ThemeContext";
import { calculateAllCategories } from "@/features/analytics/utils/analyticsUtils";
import { fetchTransactions } from "@/features/wallet/data/walletSlice";
import { AppDispatch, RootState } from "@/store/store";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";

/**
 * Detalle de "todas las categorías" del mes recibido por parámetro de ruta
 * (`month`/`year`, viene de `AnalyticsScreen`). No usa `useAnalyticsData`
 * porque esa lógica está atada al mes seleccionado en pantalla, no a un mes
 * fijo por parámetro; reutiliza en cambio `calculateAllCategories` de
 * `analyticsUtils`, la misma utilidad de la que sale `useAnalyticsData`.
 */
export const useStatisticsCategoriesScreen = () => {
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
  const [expandedCategory, setExpandedCategory] = useState<string | null>(
    null,
  );

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

  const categories = useMemo(
    () => calculateAllCategories(filteredTransactions),
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

  const handleCategoryPress = useCallback((category: string) => {
    setExpandedCategory((prev) => (prev === category ? null : category));
  }, []);

  const goBack = useCallback(() => router.back(), [router]);

  return {
    colors,
    insets,
    selectedMonth,
    selectedYear,
    categories,
    refreshing,
    onRefresh,
    expandedCategory,
    handleCategoryPress,
    goBack,
  };
};
