import { Colors } from "@/constants/theme";
import { fetchVisionEntities } from "@/features/vision/data/visionSlice";
import { useColorScheme } from "@/hooks/use-color-scheme";
import STRINGS from "@/i18n/es.json";
import { AppDispatch, RootState } from "@/store/store";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchCategories } from "../data/categoriesSlice";
import { fetchGamificationData } from "../data/gamificationSlice";
import { fetchTransactions } from "../data/walletSlice";
import { useStreak } from "./useStreak";

export const useWalletData = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { transactions } = useSelector((state: RootState) => state.wallet);
  const { entities: visionEntities } = useSelector(
    (state: RootState) => state.vision,
  );
  const { categories } = useSelector((state: RootState) => state.categories);
  const { user } = useSelector((state: RootState) => state.auth);
  const { streakFreezes, repairedDays } = useSelector(
    (state: RootState) => state.gamification,
  );
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const streak = useStreak(transactions, repairedDays);

  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    if (user?.uid) {
      dispatch(fetchTransactions(user.uid));
      dispatch(fetchVisionEntities(user.uid));
      dispatch(fetchGamificationData(user.uid));
      dispatch(fetchCategories(user.uid));
    }
  }, [dispatch, user]);

  const onRefresh = () => {
    if (user?.uid) {
      setRefreshing(true);
      Promise.all([
        dispatch(fetchTransactions(user.uid)).unwrap(),
        dispatch(fetchGamificationData(user.uid)).unwrap(),
        dispatch(fetchCategories(user.uid)).unwrap(),
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
    return (
      tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear
    );
  });

  const balance = currentMonthTransactions.reduce((acc, curr) => {
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
    streakFreezes,
    repairedDays,
    categories,
    selectedDate,
    setSelectedDate,
  };
};
