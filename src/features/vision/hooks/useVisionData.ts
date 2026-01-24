import { Colors } from "@/constants/theme";
import { fetchVisionEntities } from "@/features/vision/data/visionSlice";
import { fetchTransactions } from "@/features/wallet/data/walletSlice";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { AppDispatch, RootState } from "@/store/store";
import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

export const useVisionData = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { entities, loading: visionLoading } = useSelector(
    (state: RootState) => state.vision,
  );
  const { transactions } = useSelector((state: RootState) => state.wallet);

  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user?.uid) {
      dispatch(fetchVisionEntities(user.uid));
      dispatch(fetchTransactions(user.uid));
    }
  }, [dispatch, user]);

  const onRefresh = useCallback(() => {
    if (user?.uid) {
      setRefreshing(true);
      Promise.all([
        dispatch(fetchVisionEntities(user.uid)).unwrap(),
        dispatch(fetchTransactions(user.uid)).unwrap(),
      ])
        .then(() => setRefreshing(false))
        .catch(() => setRefreshing(false));
    }
  }, [dispatch, user]);

  const assets = entities.filter((e) => e.type === "asset");
  const liabilities = entities.filter((e) => e.type === "liability");

  const totalAssets = assets.reduce((acc, curr) => acc + curr.amount, 0);
  const totalLiabilities = liabilities.reduce(
    (acc, curr) => acc + curr.amount,
    0,
  );
  const netWorth = totalAssets - totalLiabilities;

  return {
    user,
    entities,
    transactions,
    visionLoading,
    refreshing,
    onRefresh,
    assets,
    liabilities,
    totalAssets,
    totalLiabilities,
    netWorth,
    colors,
  };
};
