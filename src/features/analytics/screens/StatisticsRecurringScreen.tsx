import { Card } from "@/components/atoms/Card";
import { Typography } from "@/components/atoms/Typography";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";
import { calculateRecurringExpenses } from "@/features/analytics/utils/analyticsUtils";
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

export default function StatisticsRecurringScreen() {
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

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await dispatch(fetchTransactions()).unwrap();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: "Gastos recurrentes",
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

          {recurringExpenses.length === 0 ? (
            <Text style={{ color: colors.textSecondary }}>
              No hay gastos recurrentes detectados.
            </Text>
          ) : (
            recurringExpenses.map((expense, index) => (
              <Card key={index} variant="outlined" style={styles.expenseCard}>
                <View style={styles.expenseHeader}>
                  <Text style={[styles.expenseName, { color: colors.text }]}>
                    {expense.description}
                  </Text>
                  <Text style={[styles.expenseAmount, { color: colors.text }]}>
                    ${expense.totalAmount.toFixed(2)}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.expenseFrequency,
                    { color: colors.textSecondary },
                  ]}
                >
                  Total del mes
                </Text>
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
  expenseCard: {
    marginBottom: Spacing.m,
  },
  expenseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  expenseName: {
    fontSize: 16,
    fontWeight: "600",
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: "600",
  },
  expenseFrequency: {
    fontSize: 12,
    marginTop: 4,
  },
});
