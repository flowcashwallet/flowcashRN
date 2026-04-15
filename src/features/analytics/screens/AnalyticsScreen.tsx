import { GlassCard } from "@/components/atoms/GlassCard";
import { Typography } from "@/components/atoms/Typography";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";
import { MonthYearPickerModal } from "@/features/wallet/components/MonthYearPickerModal";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
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
import { useAnalyticsData } from "../hooks/useAnalyticsData";

import { ForecastCard } from "@/features/wallet/components/ForecastCard";
import { fetchForecast } from "@/features/wallet/data/walletSlice";
import { AppDispatch, RootState } from "@/store/store";

const FontSize = {
  xs: 12,
  s: 14,
  m: 16,
  l: 20,
  xl: 24,
};

export default function AnalyticsScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { forecast } = useSelector((state: RootState) => state.wallet);

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
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchForecast());
  }, [dispatch]);

  const handleCategoryPress = (category: string) => {
    setExpandedCategory((prev) => (prev === category ? null : category));
  };

  const handleViewAllCategories = () => {
    router.push({
      pathname: "/statistics-categories",
      params: {
        month: selectedDate.getMonth().toString(),
        year: selectedDate.getFullYear().toString(),
      },
    } as any);
  };

  const handleViewAllRecurring = () => {
    router.push({
      pathname: "/statistics-recurring",
      params: {
        month: selectedDate.getMonth().toString(),
        year: selectedDate.getFullYear().toString(),
      },
    } as any);
  };

  const onRefresh = async () => {
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
  };

  return (
    <ThemedView
      lightColor="transparent"
      darkColor="transparent"
      style={styles.container}
    >
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
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
        {/* Month Selector Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: Spacing.m,
          }}
        >
          <TouchableOpacity
            style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            onPress={() => setDatePickerVisible(true)}
          >
            <Typography
              variant="h2"
              weight="bold"
              style={{ color: colors.text }}
            >
              {currentMonthName}{" "}
              {currentYear !== new Date().getFullYear() ? currentYear : ""}
            </Typography>
            <IconSymbol name="chevron.down" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Predicción de Flujo (Forecasting) */}
        <ForecastCard forecast={forecast} />

        {/* Consejos */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Consejos para ti
          </Text>
          {financialTips.map((tip, index) => (
            <GlassCard key={index} style={styles.tipCard}>
              <IconSymbol
                name="lightbulb.fill"
                size={24}
                color={colors.primary}
              />
              <Text style={[styles.tipText, { color: colors.text }]}>
                {tip}
              </Text>
            </GlassCard>
          ))}
        </View>
        {/* Top Categorías */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Top Categorías
            </Text>
            <TouchableOpacity onPress={handleViewAllCategories}>
              <Text style={[styles.viewMoreText, { color: colors.primary }]}>
                Ver más
              </Text>
            </TouchableOpacity>
          </View>
          {topCategories.length === 0 ? (
            <Text style={{ color: colors.textSecondary }}>
              No hay gastos registrados este mes.
            </Text>
          ) : (
            topCategories.map((category, index) => (
              <GlassCard key={index} style={styles.categoryCard}>
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

                {/* Expanded Details - Transactions List */}
                {expandedCategory === category.category && (
                  <View
                    style={{
                      marginTop: 12,
                      paddingTop: 12,
                      borderTopWidth: 1,
                      borderTopColor: colors.border,
                    }}
                  >
                    {category.transactions &&
                    category.transactions.length > 0 ? (
                      category.transactions.map((tx, txIndex) => (
                        <View
                          key={tx.id}
                          style={{
                            flexDirection: "row",
                            justifyContent: "space-between",
                            marginBottom: 8,
                          }}
                        >
                          <View style={{ flex: 1 }}>
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
                      <Text
                        style={{
                          fontSize: 12,
                          color: colors.textSecondary,
                          fontStyle: "italic",
                        }}
                      >
                        No hay transacciones disponibles
                      </Text>
                    )}
                  </View>
                )}
              </GlassCard>
            ))
          )}
        </View>
        {/* Gastos Recurrentes */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Gastos Recurrentes
            </Text>
            <TouchableOpacity onPress={handleViewAllRecurring}>
              <Text style={[styles.viewMoreText, { color: colors.primary }]}>
                Ver más
              </Text>
            </TouchableOpacity>
          </View>
          {recurringExpenses.length === 0 ? (
            <Text style={{ color: colors.textSecondary }}>
              No hay gastos recurrentes detectados.
            </Text>
          ) : (
            recurringExpenses.map((expense, index) => (
              <GlassCard key={index} style={styles.expenseCard}>
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
              </GlassCard>
            ))
          )}
        </View>
      </ScrollView>

      <MonthYearPickerModal
        visible={datePickerVisible}
        selectedDate={selectedDate}
        onClose={() => setDatePickerVisible(false)}
        onSelect={setSelectedDate}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
  },
  content: {
    padding: Spacing.m,
  },
  section: {
    marginBottom: Spacing.l,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: FontSize.l,
    fontWeight: "bold",
    marginBottom: Spacing.s,
  },
  viewMoreText: {
    fontSize: FontSize.s,
    fontWeight: "600",
  },
  tipCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.m,
    marginBottom: Spacing.s,
    padding: Spacing.m,
  },
  tipText: {
    flex: 1,
    fontSize: FontSize.s,
  },
  expenseCard: {
    marginBottom: Spacing.s,
    padding: Spacing.m,
  },
  expenseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  expenseName: {
    fontSize: FontSize.m,
    fontWeight: "600",
  },
  expenseAmount: {
    fontSize: FontSize.m,
    fontWeight: "bold",
  },
  expenseFrequency: {
    fontSize: FontSize.xs,
  },
  categoryCard: {
    marginBottom: Spacing.s,
    padding: Spacing.m,
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
    fontSize: FontSize.m,
    fontWeight: "600",
    marginBottom: 2,
  },
  categoryPercentage: {
    fontSize: FontSize.xs,
  },
  categoryAmountContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  categoryAmount: {
    fontSize: FontSize.m,
    fontWeight: "bold",
  },
});
