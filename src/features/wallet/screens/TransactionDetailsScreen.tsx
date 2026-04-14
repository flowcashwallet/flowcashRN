import { Button } from "@/components/atoms/Button";
import { Card } from "@/components/atoms/Card";
import { Typography } from "@/components/atoms/Typography";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";
import { useVisionData } from "@/features/vision/hooks/useVisionData";
import STRINGS from "@/i18n/es.json";
import { RootState } from "@/store/store";
import { formatCurrency } from "@/utils/format";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo } from "react";
import { ScrollView, View } from "react-native";
import { useSelector } from "react-redux";
import { useWalletTransactions } from "../hooks/useWalletTransactions";

export default function TransactionDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { id } = params;
  const { colors } = useTheme();
  const { entities } = useVisionData();
  const { deleteTransaction } = useWalletTransactions();

  const transaction = useSelector((state: RootState) =>
    state.wallet.transactions.find((t) => t.id === (id as string)),
  );

  const sourceEntityName = useMemo(() => {
    if (!transaction?.relatedEntityId) return null;
    return entities?.find((e) => e.id === transaction.relatedEntityId)?.name;
  }, [entities, transaction?.relatedEntityId]);

  const destEntityName = useMemo(() => {
    if (!transaction?.transferRelatedEntityId) return null;
    return entities?.find((e) => e.id === transaction.transferRelatedEntityId)
      ?.name;
  }, [entities, transaction?.transferRelatedEntityId]);

  const typeLabel = useMemo(() => {
    if (!transaction) return "";
    if (transaction.type === "income") return STRINGS.wallet.income;
    if (transaction.type === "expense") return STRINGS.wallet.expense;
    return STRINGS.wallet.transfer;
  }, [transaction]);

  const amountColor = useMemo(() => {
    if (!transaction) return colors.text;
    if (transaction.type === "income") return colors.success;
    if (transaction.type === "expense") return colors.error;
    return colors.primary;
  }, [colors, transaction]);

  const handleEdit = () => {
    if (!transaction) return;
    router.push({
      pathname: "/wallet/transaction-form",
      params: { id: transaction.id },
    });
  };

  const handleDelete = () => {
    if (!transaction) return;
    deleteTransaction(transaction.id).then((success) => {
      if (success) router.back();
    });
  };

  return (
    <View style={{ backgroundColor: colors.background }}>
      <View style={{ flex: 1 }}>
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          style={{ paddingHorizontal: Spacing.m }}
        >
          {!transaction ? (
            <Card variant="outlined">
              <Typography
                variant="body"
                style={{ color: colors.textSecondary }}
              >
                {STRINGS.wallet.transactionNotFound}
              </Typography>
              <Button
                title={STRINGS.common.close}
                variant="outline"
                onPress={() => router.back()}
                style={{ marginTop: Spacing.m }}
              />
            </Card>
          ) : (
            <>
              <Card variant="outlined" style={{ marginBottom: Spacing.m }}>
                <Typography
                  variant="caption"
                  style={{ color: colors.textSecondary }}
                >
                  {typeLabel}
                </Typography>
                <Typography
                  variant="h1"
                  weight="bold"
                  style={{ marginTop: 6, color: amountColor }}
                >
                  {formatCurrency(transaction.amount)}
                </Typography>
                <Typography
                  variant="body"
                  weight="medium"
                  style={{ marginTop: 6, color: colors.text }}
                >
                  {transaction.description}
                </Typography>
                <Typography
                  variant="caption"
                  style={{ marginTop: 6, color: colors.textSecondary }}
                >
                  {new Date(transaction.date).toLocaleDateString()}
                </Typography>
              </Card>

              <Card variant="outlined" style={{ marginBottom: Spacing.m }}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginBottom: 10,
                  }}
                >
                  <Typography
                    variant="caption"
                    style={{ color: colors.textSecondary }}
                  >
                    {STRINGS.wallet.category}
                  </Typography>
                  <Typography variant="body" style={{ color: colors.text }}>
                    {transaction.category || STRINGS.wallet.noCategory}
                  </Typography>
                </View>

                {transaction.type === "transfer" ? (
                  <>
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        marginBottom: 10,
                      }}
                    >
                      <Typography
                        variant="caption"
                        style={{ color: colors.textSecondary }}
                      >
                        {STRINGS.wallet.origin}
                      </Typography>
                      <Typography variant="body" style={{ color: colors.text }}>
                        {sourceEntityName || "-"}
                      </Typography>
                    </View>
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                      }}
                    >
                      <Typography
                        variant="caption"
                        style={{ color: colors.textSecondary }}
                      >
                        {STRINGS.wallet.destination}
                      </Typography>
                      <Typography variant="body" style={{ color: colors.text }}>
                        {destEntityName || "-"}
                      </Typography>
                    </View>
                  </>
                ) : (
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                    }}
                  >
                    <Typography
                      variant="caption"
                      style={{ color: colors.textSecondary }}
                    >
                      {STRINGS.wallet.account}
                    </Typography>
                    <Typography variant="body" style={{ color: colors.text }}>
                      {sourceEntityName || "-"}
                    </Typography>
                  </View>
                )}
              </Card>

              <View style={{ flexDirection: "row", gap: 12 }}>
                <Button
                  title={STRINGS.common.edit}
                  onPress={handleEdit}
                  variant="primary"
                  style={{ flex: 1 }}
                />
                <Button
                  title={STRINGS.common.delete}
                  onPress={handleDelete}
                  variant="outline"
                  style={{ flex: 1, borderColor: colors.error }}
                  textStyle={{ color: colors.error }}
                />
              </View>
            </>
          )}
        </ScrollView>
      </View>
    </View>
  );
}
