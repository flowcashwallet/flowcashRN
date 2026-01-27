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
import { TransactionDetailModal } from "../components/TransactionDetailModal";
import { TransactionFilterModal } from "../components/TransactionFilterModal";
import { TransactionModal } from "../components/TransactionModal";
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

  const {
    isSaving,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    deleteMonthlyTransactions,
  } = useWalletTransactions();

  const [modalVisible, setModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  const [filters, setFilters] = useState<{
    category: string | null;
    entityId: string | null;
    type: "income" | "expense" | null;
  }>({
    category: null,
    entityId: null,
    type: null,
  });

  const [transactionType, setTransactionType] = useState<"income" | "expense">(
    "expense",
  );
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);

  const handleDeleteMonthly = () => {
    deleteMonthlyTransactions(currentMonthTransactions, currentMonthName);
  };

  const handleTransactionPress = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setDetailModalVisible(true);
  };

  const filteredTransactions = currentMonthTransactions.filter((t) => {
    if (filters.category && t.category !== filters.category) return false;
    if (filters.entityId && t.relatedEntityId !== filters.entityId)
      return false;
    if (filters.type && t.type !== filters.type) return false;
    return true;
  });

  const hasActiveFilters = filters.category || filters.entityId || filters.type;

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
            setTransactionType("income");
            setModalVisible(true);
          }}
          onPressExpense={() => {
            setTransactionType("expense");
            setModalVisible(true);
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

      <TransactionModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={addTransaction}
        initialType={transactionType}
        visionEntities={visionEntities}
        isSaving={isSaving}
      />

      <TransactionDetailModal
        visible={detailModalVisible}
        onClose={() => setDetailModalVisible(false)}
        transaction={selectedTransaction}
        onUpdate={updateTransaction}
        onDelete={deleteTransaction}
        visionEntities={visionEntities}
        isSaving={isSaving}
      />

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
          setFilters({ category: null, entityId: null, type: null })
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
