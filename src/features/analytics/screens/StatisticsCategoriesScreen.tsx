import { Card } from "@/components/atoms/Card";
import { Typography } from "@/components/atoms/Typography";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";
import { calculateAllCategories } from "@/features/analytics/utils/analyticsUtils";
import { fetchTransactions } from "@/features/wallet/data/walletSlice";
import STRINGS from "@/i18n/es.json";
import { AppDispatch, RootState } from "@/store/store";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";

export default function StatisticsCategoriesScreen() {
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
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

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

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await dispatch(fetchTransactions()).unwrap();
    } finally {
      setRefreshing(false);
    }
  };

  const handleCategoryPress = (category: string) => {
    setExpandedCategory((prev) => (prev === category ? null : category));
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: "Todas las categorías",
          headerLeft: () => (
            <TouchableOpacity
              accessibilityRole="button"
              hitSlop={20}
              onPress={() => router.back()}
              style={{ marginLeft: 5 }}
            >
              <IconSymbol name="chevron.left" size={24} color={colors.text} />
            </TouchableOpacity>
          ),
          headerTintColor: colors.text,
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerShadowVisible: false,
        }}
      />
      <ThemedView style={styles.container}>
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: 200 + insets.bottom },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
        >
          <View style={styles.headerRow}>
            <Typography
              variant="h2"
              weight="bold"
              style={{ color: colors.text }}
            >
              {STRINGS.wallet.months[selectedMonth]}{" "}
              {selectedYear !== new Date().getFullYear() ? selectedYear : ""}
            </Typography>
          </View>

          {categories.length === 0 ? (
            <Text style={{ color: colors.textSecondary }}>
              No hay gastos registrados este mes.
            </Text>
          ) : (
            categories.map((category, index) => (
              <Card key={index} variant="outlined" style={styles.categoryCard}>
                <TouchableOpacity
                  style={styles.categoryHeader}
                  onPress={() => handleCategoryPress(category.category)}
                >
                  <View style={styles.categoryInfo}>
                    <Text style={[styles.categoryName, { color: colors.text }]}>
                      {category.category}
                    </Text>
                    <Text
                      style={[
                        styles.categoryPercentage,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {category.percentage.toFixed(1)}%
                    </Text>
                  </View>
                  <View style={styles.categoryAmountContainer}>
                    <Text
                      style={[styles.categoryAmount, { color: colors.text }]}
                    >
                      ${category.totalAmount.toFixed(2)}
                    </Text>
                    <IconSymbol
                      name={
                        expandedCategory === category.category
                          ? "chevron.up"
                          : "chevron.down"
                      }
                      size={16}
                      color={colors.textSecondary}
                    />
                  </View>
                </TouchableOpacity>

                {expandedCategory === category.category && (
                  <View
                    style={[
                      styles.categoryDetails,
                      { borderTopColor: colors.border },
                    ]}
                  >
                    {category.transactions && category.transactions.length > 0 ? (
                      category.transactions.map((tx) => (
                        <View key={tx.id} style={styles.transactionRow}>
                          <View style={styles.transactionInfo}>
                            <Text
                              style={{ fontSize: 14, color: colors.text }}
                              numberOfLines={1}
                            >
                              {tx.description}
                            </Text>
                            <Text
                              style={{
                                fontSize: 12,
                                color: colors.textSecondary,
                              }}
                            >
                              {new Date(tx.date).toLocaleDateString()}
                            </Text>
                          </View>
                          <Text
                            style={{
                              fontSize: 14,
                              fontWeight: "600",
                              color: colors.text,
                            }}
                          >
                            ${tx.amount.toFixed(2)}
                          </Text>
                        </View>
                      ))
                    ) : (
                      <Text style={{ color: colors.textSecondary }}>
                        No hay transacciones en esta categoría.
                      </Text>
                    )}
                  </View>
                )}
              </Card>
            ))
          )}
        </ScrollView>
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
  },
  content: {
    paddingHorizontal: Spacing.m,
    paddingTop: Spacing.m,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.m,
  },
  categoryCard: {
    marginBottom: Spacing.m,
  },
  categoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: "600",
  },
  categoryPercentage: {
    fontSize: 12,
  },
  categoryAmountContainer: {
    alignItems: "flex-end",
  },
  categoryAmount: {
    fontSize: 16,
    fontWeight: "600",
  },
  categoryDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  transactionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  transactionInfo: {
    flex: 1,
    marginRight: Spacing.s,
  },
});
