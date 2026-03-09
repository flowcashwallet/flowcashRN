import { Typography } from "@/components/atoms/Typography";
import { TransactionItem } from "@/components/molecules/TransactionItem";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";
import { RootState } from "@/store/store";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import { FlatList, View } from "react-native";
import { useSelector } from "react-redux";
import { Transaction } from "../data/walletSlice";

export default function RecurringTransactionsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { transactions } = useSelector((state: RootState) => state.wallet);

  const recurringTransactions = useMemo(() => {
    return transactions.filter((t) => t.isRecurring);
  }, [transactions]);

  const handleTransactionPress = (transaction: Transaction) => {
    router.push({
      pathname: "/wallet/transaction-form",
      params: {
        id: transaction.id,
        initialType: transaction.type,
        initialAmount: transaction.amount.toString(),
        initialDescription: transaction.description,
      },
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <FlatList
        data={recurringTransactions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: Spacing.m }}
        automaticallyAdjustContentInsets={true}
        contentInsetAdjustmentBehavior="always"
        automaticallyAdjustsScrollIndicatorInsets={true}
        ListEmptyComponent={
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              marginTop: Spacing.xl * 2,
            }}
          >
            <Typography
              variant="h3"
              style={{ color: colors.textSecondary, textAlign: "center" }}
            >
              No tienes transacciones recurrentes
            </Typography>
            <Typography
              variant="body"
              style={{
                color: colors.textSecondary,
                textAlign: "center",
                marginTop: Spacing.s,
              }}
            >
              Activa la opción &quot;Recurrente&quot; al crear una transacción.
            </Typography>
          </View>
        }
        renderItem={({ item }) => (
          <View style={{ marginBottom: Spacing.s }}>
            <TransactionItem
              id={item.id}
              amount={item.amount}
              description={item.description}
              date={item.date}
              type={item.type}
              category={item.category}
              onPress={() => handleTransactionPress(item)}
            />
            <View
              style={{
                position: "absolute",
                top: -8,
                right: -8,
                backgroundColor: colors.primary,
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: 12,
              }}
            >
              <Typography
                variant="caption"
                weight="bold"
                style={{
                  color: "#FFF",
                  fontSize: 10,
                  textTransform: "capitalize",
                }}
              >
                {item.recurrenceFrequency === "weekly"
                  ? "Semanal"
                  : item.recurrenceFrequency === "monthly"
                    ? "Mensual"
                    : "Anual"}
              </Typography>
            </View>
          </View>
        )}
      />
    </View>
  );
}
