import { IconSymbol } from "@/components/ui/icon-symbol";
import { Transaction } from "@/features/wallet/data/walletSlice";
import STRINGS from "@/i18n/es.json";
import { formatCurrency } from "@/utils/format";
import React from "react";
import { Text, View } from "react-native";
import { DashboardColors } from "./types";

interface RecentTransactionsSectionProps {
  colors: DashboardColors;
  transactions: Transaction[];
}

export function RecentTransactionsSection({
  colors,
  transactions,
}: RecentTransactionsSectionProps) {
  return (
    <View
      style={{
        borderRadius: 20,
        padding: 20,
        paddingBottom: 8,
        marginBottom: 16,
        borderWidth: 1,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text }}>
          Recent Transactions
        </Text>
      </View>

      {transactions.map((tx) => {
        const dateStr = new Date(tx.date).toLocaleDateString("es-MX", {
          day: "2-digit",
          month: "short",
        });
        return (
          <View
            key={tx.id}
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: colors.surfaceHighlight,
                alignItems: "center",
                justifyContent: "center",
                marginRight: 16,
              }}
            >
              <IconSymbol
                name={tx.type === "income" ? "arrow.down" : "bag.fill"}
                size={18}
                color={colors.textSecondary}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: colors.text,
                  fontSize: 15,
                  fontWeight: "600",
                  marginBottom: 4,
                }}
                numberOfLines={1}
              >
                {tx.description}
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                {(tx.category || STRINGS.dashboard.uncategorized) +
                  " • " +
                  dateStr}
              </Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: "bold",
                  color: tx.type === "income" ? colors.success : colors.text,
                  marginBottom: 4,
                }}
              >
                {(tx.type === "income" ? "+" : "-") + formatCurrency(tx.amount)}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}
