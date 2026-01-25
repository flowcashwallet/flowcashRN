import { TransactionList } from "@/components/organisms/TransactionList";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { RefreshControl, ScrollView, StyleSheet } from "react-native";
import { QuickActions } from "../components/QuickActions";
import { TransactionDetailModal } from "../components/TransactionDetailModal";
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
          transactions={currentMonthTransactions}
          onDelete={deleteTransaction}
          onTransactionPress={handleTransactionPress}
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
