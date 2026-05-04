import { useTheme } from "@/contexts/ThemeContext";
import { fetchVisionEntities } from "@/features/vision/data/visionSlice";
import STRINGS from "@/i18n/es.json";
import { AppDispatch, RootState } from "@/store/store";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchCategories } from "../data/categoriesSlice";
import { fetchGamificationData } from "../data/gamificationSlice";
import { setPeriodView, setSelectedMonthTimestamp } from "../data/walletUiSlice";
import { fetchForecast, fetchTransactions } from "../data/walletSlice";
import { useStreak } from "./useStreak";

export const useWalletData = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { transactions, forecast } = useSelector(
    (state: RootState) => state.wallet,
  );
  const selectedMonthTimestamp = useSelector(
    (state: RootState) => state.walletUi.selectedMonthTimestamp,
  );
  const periodView = useSelector((state: RootState) => state.walletUi.periodView);
  const { entities: visionEntities } = useSelector(
    (state: RootState) => state.vision,
  );
  const { categories } = useSelector((state: RootState) => state.categories);
  const { user } = useSelector((state: RootState) => state.auth);
  const { repairedDays } = useSelector(
    (state: RootState) => state.gamification,
  );
  const { colors } = useTheme();

  const streak = useStreak(transactions, repairedDays);

  const [refreshing, setRefreshing] = useState(false);
  const selectedDate = useMemo(
    () => new Date(selectedMonthTimestamp),
    [selectedMonthTimestamp],
  );
  const setSelectedDate = useCallback(
    (date: Date) => {
      const normalized = new Date(date.getFullYear(), date.getMonth(), 1);
      dispatch(setSelectedMonthTimestamp(normalized.getTime()));
    },
    [dispatch],
  );
  const setPeriodViewMode = useCallback(
    (mode: "month" | "year") => {
      dispatch(setPeriodView(mode));
    },
    [dispatch],
  );

  useEffect(() => {
    if (user?.id) {
      dispatch(fetchTransactions());
      dispatch(fetchForecast());
      dispatch(fetchVisionEntities());
      dispatch(fetchGamificationData());
      dispatch(fetchCategories(user.id.toString()));
    }
  }, [dispatch, user]);

  const onRefresh = () => {
    if (user?.id) {
      setRefreshing(true);
      Promise.all([
        dispatch(fetchTransactions()).unwrap(),
        dispatch(fetchForecast()).unwrap(),
        dispatch(fetchGamificationData()).unwrap(),
        dispatch(fetchCategories(user.id.toString())).unwrap(),
        dispatch(fetchVisionEntities()).unwrap(),
      ])
        .then(() => setRefreshing(false))
        .catch(() => setRefreshing(false));
    }
  };

  // Filter transactions for current month
  const currentMonth = selectedDate.getMonth();
  const currentYear = selectedDate.getFullYear();
  const currentMonthName = STRINGS.wallet.months[currentMonth];

  const currentMonthTransactions = transactions.filter((t) => {
    const tDate = new Date(t.date);
    if (periodView === "year") return tDate.getFullYear() === currentYear;
    return tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear;
  });

  const balance = currentMonthTransactions.reduce((acc, curr) => {
    if (curr.type === "transfer") return acc;
    return curr.type === "income" ? acc + curr.amount : acc - curr.amount;
  }, 0);

  const income = currentMonthTransactions
    .filter((t) => t.type === "income")
    .reduce((acc, curr) => acc + curr.amount, 0);

  const expense = currentMonthTransactions
    .filter((t) => t.type === "expense")
    .reduce((acc, curr) => acc + curr.amount, 0);

  return {
    transactions,
    visionEntities,
    user,
    refreshing,
    onRefresh,
    currentMonthTransactions,
    currentMonthName,
    balance,
    income,
    expense,
    colors,
    streak,
    repairedDays,
    categories,
    selectedDate,
    setSelectedDate,
    periodView,
    setPeriodView: setPeriodViewMode,
    forecast,
  };
};
