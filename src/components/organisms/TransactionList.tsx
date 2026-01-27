import { Spacing } from "@/constants/theme";
import { Transaction } from "@/features/wallet/data/walletSlice";
import STRINGS from "@/i18n/es.json";
import React from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { Typography } from "../atoms/Typography";
import { TransactionItem } from "../molecules/TransactionItem";

interface TransactionListProps {
  transactions: Transaction[];
  onTransactionPress?: (transaction: Transaction) => void;
  onDelete?: (id: string) => void;
  headerRight?: React.ReactNode;
}

export function TransactionList({
  transactions,
  onTransactionPress,
  onDelete,
  headerRight,
}: TransactionListProps) {
  if (!transactions || transactions.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", width: "100%", marginBottom: Spacing.m }}>
           <Typography variant="h3" weight="bold">
            {STRINGS.wallet.recentTransactions}
           </Typography>
           {headerRight}
        </View>
        <Typography variant="body" style={{ opacity: 0.6 }}>
          {STRINGS.wallet.noRecentTransactions}
        </Typography>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.m }}>
        <Typography variant="h3" weight="bold">
          {STRINGS.wallet.recentTransactions}
        </Typography>
        {headerRight}
      </View>

      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TransactionItem
            id={item.id}
            amount={item.amount}
            description={item.description}
            date={item.date}
            type={item.type}
            category={item.category}
            onDelete={onDelete}
            onPress={() => onTransactionPress?.(item)}
          />
        )}
        contentContainerStyle={styles.listContent}
        scrollEnabled={false} // Often used inside a ScrollView parent
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.xl,
  },
  title: {
    marginBottom: Spacing.m,
  },
  emptyContainer: {
    padding: Spacing.l,
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: {
    paddingBottom: Spacing.s,
  },
});
