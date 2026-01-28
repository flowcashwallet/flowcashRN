import { TransactionList } from "@/components/organisms/TransactionList";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Spacing } from "@/constants/theme";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { QuickActions } from "../components/QuickActions";
import { StreakCalendarModal } from "../components/StreakCalendarModal";
import { TransactionFilterModal } from "../components/TransactionFilterModal";
import { WalletHeader } from "../components/WalletHeader";
import { Transaction } from "../data/walletSlice";
import { useWalletData } from "../hooks/useWalletData";
import { useWalletTransactions } from "../hooks/useWalletTransactions";

export default function WalletScreen() {
  const router = useRouter();
  const {
    currentMonthTransactions,
    balance,
    income,
    expense,
    currentMonthName,
    refreshing,
    onRefresh,
    colors,
    visionEntities,
    streak,
    streakFreezes,
    repairedDays,
    categories,
  } = useWalletData();

  const { deleteTransaction, deleteMonthlyTransactions } =
    useWalletTransactions();

  const [calendarVisible, setCalendarVisible] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  const [filters, setFilters] = useState<{
    category: string | null;
    entityId: string | null;
    type: "income" | "expense" | null;
    paymentType:
      | "credit_card"
      | "debit_card"
      | "cash"
      | "transfer"
      | "payroll"
      | null;
  }>({
    category: null,
    entityId: null,
    type: null,
    paymentType: null,
  });

  const handleDeleteMonthly = () => {
    deleteMonthlyTransactions(currentMonthTransactions, currentMonthName);
  };

  const handleTransactionPress = (transaction: Transaction) => {
    router.push({
      pathname: "/transaction-form",
      params: { id: transaction.id },
    });
  };

  const filteredTransactions = currentMonthTransactions.filter((t) => {
    if (filters.category && t.category !== filters.category) return false;
    if (filters.entityId && t.relatedEntityId !== filters.entityId)
      return false;
    if (filters.type && t.type !== filters.type) return false;
    if (filters.paymentType && t.paymentType !== filters.paymentType)
      return false;
    return true;
  });

  const hasActiveFilters =
    filters.category || filters.entityId || filters.type || filters.paymentType;

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]} // Android
          />
        }
      >
        <WalletHeader
          balance={balance}
          currentMonthName={currentMonthName}
          income={income}
          expense={expense}
          onDeleteMonth={handleDeleteMonthly}
          streak={streak}
          onPressStreak={() => setCalendarVisible(true)}
        />

        <QuickActions
          onPressIncome={() => {
            router.push({
              pathname: "/transaction-form",
              params: { initialType: "income" },
            });
          }}
          onPressExpense={() => {
            router.push({
              pathname: "/transaction-form",
              params: { initialType: "expense" },
            });
          }}
          onPressCategories={() => {
            router.push("/wallet/categories");
          }}
        />

        <TransactionList
          transactions={filteredTransactions}
          onDelete={deleteTransaction}
          onTransactionPress={handleTransactionPress}
          headerRight={
            <TouchableOpacity onPress={() => setFilterVisible(true)}>
              <IconSymbol
                name={
                  hasActiveFilters
                    ? "line.3.horizontal.decrease.circle.fill"
                    : "line.3.horizontal.decrease.circle"
                }
                size={24}
                color={colors.primary}
              />
            </TouchableOpacity>
          }
        />
      </ScrollView>

      <StreakCalendarModal
        visible={calendarVisible}
        onClose={() => setCalendarVisible(false)}
        transactions={currentMonthTransactions}
        repairedDays={repairedDays || []}
      />

      <TransactionFilterModal
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        categories={categories}
        entities={visionEntities}
        currentFilters={filters}
        onApply={setFilters}
        onClear={() =>
          setFilters({
            category: null,
            entityId: null,
            type: null,
            paymentType: null,
          })
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.m,
    paddingTop: 10,
  },
});
