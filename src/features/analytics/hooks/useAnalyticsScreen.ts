import { useTheme } from "@/contexts/ThemeContext";
import { fetchForecast } from "@/features/wallet/data/walletSlice";
import { AppDispatch, RootState } from "@/store/store";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import { useAnalyticsData } from "./useAnalyticsData";

/**
 * Compone `useAnalyticsData()` (fetch/derivados de transacciones del mes) sin
 * duplicar su lógica, y absorbe lo que antes vivía en el cuerpo de
 * `AnalyticsScreen`: el forecast (Redux + su propio refresh), el selector de
 * mes, el estado de categoría expandida, y la navegación a las dos pantallas
 * de detalle ("ver más").
 */
export const useAnalyticsScreen = () => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { forecast } = useSelector((state: RootState) => state.wallet);
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const {
    recurringExpenses,
    topCategories,
    financialTips,
    selectedDate,
    setSelectedDate,
    currentMonthName,
    currentYear,
    onRefresh: onRefreshAnalytics,
  } = useAnalyticsData();

  const [refreshing, setRefreshing] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(
    null,
  );

  useEffect(() => {
    dispatch(fetchForecast());
  }, [dispatch]);

  const openDatePicker = useCallback(() => setDatePickerVisible(true), []);
  const closeDatePicker = useCallback(() => setDatePickerVisible(false), []);

  const handleCategoryPress = useCallback((category: string) => {
    setExpandedCategory((prev) => (prev === category ? null : category));
  }, []);

  const handleViewAllCategories = useCallback(() => {
    router.push({
      pathname: "/statistics-categories",
      params: {
        month: selectedDate.getMonth().toString(),
        year: selectedDate.getFullYear().toString(),
      },
    } as any);
  }, [router, selectedDate]);

  const handleViewAllRecurring = useCallback(() => {
    router.push({
      pathname: "/statistics-recurring",
      params: {
        month: selectedDate.getMonth().toString(),
        year: selectedDate.getFullYear().toString(),
      },
    } as any);
  }, [router, selectedDate]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        onRefreshAnalytics(),
        dispatch(fetchForecast()).unwrap(),
      ]);
    } catch (error) {
      console.error("Error refreshing analytics screen:", error);
    } finally {
      setRefreshing(false);
    }
  }, [dispatch, onRefreshAnalytics]);

  return {
    colors,
    insets,
    forecast,

    recurringExpenses,
    topCategories,
    financialTips,
    selectedDate,
    setSelectedDate,
    currentMonthName,
    currentYear,

    refreshing,
    onRefresh,

    datePickerVisible,
    openDatePicker,
    closeDatePicker,

    expandedCategory,
    handleCategoryPress,
    handleViewAllCategories,
    handleViewAllRecurring,
  };
};
