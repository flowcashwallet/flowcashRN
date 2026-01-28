import { Typography } from "@/components/atoms/Typography";
import { Colors, Spacing } from "@/constants/theme";
import { Transaction } from "@/features/wallet/data/walletSlice";
import { useColorScheme } from "@/hooks/use-color-scheme";
import STRINGS from "@/i18n/es.json";
import React, { useMemo } from "react";
import { SectionList, StyleSheet, View } from "react-native";
import { TransactionItem } from "../molecules/TransactionItem";

interface TransactionListProps {
  transactions: Transaction[];
  onTransactionPress?: (transaction: Transaction) => void;
  onDelete?: (id: string) => void;
  headerRight?: React.ReactNode;
}

const formatDateHeader = (timestamp: number) => {
  const date = new Date(timestamp);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === now.toDateString()) {
    return "Hoy";
  } else if (date.toDateString() === yesterday.toDateString()) {
    return "Ayer";
  } else {
    return date.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
      weekday: "long",
    });
  }
};

export function TransactionList({
  transactions,
  onTransactionPress,
  onDelete,
  headerRight,
}: TransactionListProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const sections = useMemo(() => {
    if (!transactions) return [];

    // Group by date string (YYYY-MM-DD) to ensure correct grouping
    const groups: { [key: string]: Transaction[] } = {};

    transactions.forEach((transaction) => {
      const date = new Date(transaction.date);
      const dateKey = date.toDateString(); // Groups by "Mon Jan 01 2024"

      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(transaction);
    });

    // Convert to array and sort by date descending
    return Object.keys(groups)
      .map((dateKey) => {
        // Use the timestamp of the first transaction in the group for sorting/display
        const firstTransaction = groups[dateKey][0];
        return {
          title: formatDateHeader(firstTransaction.date),
          data: groups[dateKey],
          timestamp: firstTransaction.date,
        };
      })
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [transactions]);

  if (!transactions || transactions.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            width: "100%",
            marginBottom: Spacing.m,
          }}
        >
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
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: Spacing.s,
        }}
      >
        <Typography variant="h3" weight="bold">
          {STRINGS.wallet.recentTransactions}
        </Typography>
        {headerRight}
      </View>

      <SectionList
        sections={sections}
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
        renderSectionHeader={({ section: { title } }) => (
          <View
            style={[
              styles.sectionHeader,
              { backgroundColor: colors.background },
            ]}
          >
            <Typography
              variant="caption"
              weight="bold"
              style={{
                color: colors.textSecondary,
                textTransform: "capitalize",
              }}
            >
              {title}
            </Typography>
          </View>
        )}
        stickySectionHeadersEnabled={true}
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
  sectionHeader: {
    paddingVertical: Spacing.s,
    marginBottom: Spacing.xs,
  },
});
