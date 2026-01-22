import { Spacing } from "@/constants/theme";
import { Transaction } from "@/features/wallet/walletSlice";
import React from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { Typography } from "../atoms/Typography";
import { TransactionItem } from "../molecules/TransactionItem";

interface TransactionListProps {
  transactions: Transaction[];
  onTransactionPress?: (transaction: Transaction) => void;
  onDelete?: (id: string) => void;
}

export function TransactionList({
  transactions,
  onTransactionPress,
  onDelete,
}: TransactionListProps) {
  if (!transactions || transactions.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Typography variant="body" style={{ opacity: 0.6 }}>
          No hay movimientos recientes
        </Typography>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Typography variant="h3" weight="bold" style={styles.title}>
        Movimientos Recientes
      </Typography>

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
