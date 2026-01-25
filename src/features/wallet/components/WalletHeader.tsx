import { Typography } from "@/components/atoms/Typography";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { BorderRadius, Colors, Spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import STRINGS from "@/i18n/es.json";
import { formatCurrency } from "@/utils/format";
import React from "react";
import { Platform, StyleSheet, TouchableOpacity, View } from "react-native";
import { PieChart } from "react-native-gifted-charts";
import { StreakInfo } from "../hooks/useStreak";
import { StreakBadge } from "./StreakBadge";

interface WalletHeaderProps {
  balance: number;
  currentMonthName: string;
  income: number;
  expense: number;
  onDeleteMonth: () => void;
  streak: StreakInfo;
}

export const WalletHeader: React.FC<WalletHeaderProps> = ({
  balance,
  currentMonthName,
  income,
  expense,
  onDeleteMonth,
  streak,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const chartData = [
    {
      value: income > 0 ? income : 0.01,
      color: colors.success,
      text: STRINGS.wallet.incomes,
    },
    {
      value: expense > 0 ? expense : 0.01,
      color: colors.error,
      text: STRINGS.wallet.expenses,
    },
  ];

  return (
    <View
      style={[
        styles.balanceCard,
        {
          padding: Spacing.l,
          borderRadius: BorderRadius.xl,
          backgroundColor: colors.surfaceHighlight,
          ...Platform.select({
            ios: {
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.3,
              shadowRadius: 20,
            },
            android: { elevation: 10 },
          }),
        },
      ]}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          width: "100%",
          alignItems: "center",
          marginBottom: Spacing.s,
        }}
      >
        <StreakBadge streak={streak} />
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Typography
            variant="h3"
            weight="bold"
            style={{ color: colors.textSecondary }}
          >
            {currentMonthName}
          </Typography>
        </View>
        <TouchableOpacity onPress={onDeleteMonth}>
          <IconSymbol
            name="trash.fill"
            size={24}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
      </View>
      <Typography variant="caption" style={{ color: colors.textSecondary }}>
        {STRINGS.wallet.balanceTotal}
      </Typography>
      <Typography
        variant="h1"
        weight="bold"
        style={{ color: colors.text, marginTop: Spacing.xs }}
      >
        {formatCurrency(balance)}
      </Typography>
      <View style={styles.chartContainer}>
        <PieChart
          data={chartData}
          donut
          radius={60}
          innerRadius={45}
          backgroundColor="transparent"
          centerLabelComponent={() => (
            <Typography
              variant="caption"
              weight="medium"
              style={{ color: colors.text }}
            >
              {STRINGS.wallet.summary}
            </Typography>
          )}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  balanceCard: {
    alignItems: "center",
    marginBottom: Spacing.l,
  },
  chartContainer: {
    marginTop: Spacing.m,
    height: 150,
    alignItems: "center",
    justifyContent: "center",
  },
});
