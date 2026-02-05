import { Typography } from "@/components/atoms/Typography";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { BorderRadius, Colors, Spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import STRINGS from "@/i18n/es.json";
import { formatCurrency } from "@/utils/format";
import React, { useState } from "react";
import { Platform, StyleSheet, TouchableOpacity, View } from "react-native";
import { StreakInfo } from "../hooks/useStreak";
import { StreakBadge } from "./StreakBadge";

interface WalletHeaderProps {
  balance: number;
  currentMonthName: string;
  income: number;
  expense: number;
  onDeleteMonth: () => void;
  streak: StreakInfo;
  onPressStreak: () => void;
  onMonthPress?: () => void;
  showYear?: boolean;
  year?: number;
}

export const WalletHeader: React.FC<WalletHeaderProps> = ({
  balance,
  currentMonthName,
  income,
  expense,
  onDeleteMonth,
  streak,
  onPressStreak,
  onMonthPress,
  showYear = false,
  year,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);

  const total = income + expense;
  const incomePercentage = total > 0 ? (income / total) * 100 : 0;

  return (
    <View
      style={[
        styles.balanceCard,
        {
          padding: Spacing.l,
          borderRadius: BorderRadius.xl,
          backgroundColor: colors.surfaceHighlight,
          ...(colorScheme === "dark"
            ? Platform.select({
                ios: {
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 10 },
                  shadowOpacity: 0.3,
                  shadowRadius: 20,
                },
                android: { elevation: 10 },
              })
            : {}),
        },
      ]}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          width: "100%",
          alignItems: "center",
          marginBottom: Spacing.m,
        }}
      >
        <StreakBadge streak={streak} onPress={onPressStreak} />
        <TouchableOpacity
          style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
          onPress={onMonthPress}
          activeOpacity={onMonthPress ? 0.7 : 1}
        >
          <Typography
            variant="h3"
            weight="bold"
            style={{ color: colors.textSecondary }}
          >
            {currentMonthName} {showYear && year ? year : ""}
          </Typography>
          {onMonthPress && (
            <IconSymbol
              name="chevron.down"
              size={20}
              color={colors.textSecondary}
            />
          )}
        </TouchableOpacity>
        {/* Placeholder View for alignment, replacing the trash icon */}
        <View style={{ width: 40 }} />
      </View>

      <Typography variant="caption" style={{ color: colors.textSecondary }}>
        {STRINGS.wallet.balanceTotal}
      </Typography>

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          marginTop: Spacing.xs,
          marginBottom: Spacing.l,
        }}
      >
        <Typography variant="h1" weight="bold" style={{ color: colors.text }}>
          {isBalanceVisible ? formatCurrency(balance) : "****"}
        </Typography>
        <TouchableOpacity
          onPress={() => setIsBalanceVisible(!isBalanceVisible)}
          style={{ marginLeft: Spacing.s }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <IconSymbol
            name={isBalanceVisible ? "eye.fill" : "eye.slash.fill"}
            size={24}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
      </View>

      {/* Progress Bar */}
      <View
        style={{
          width: "100%",
          height: 8,
          backgroundColor: colors.surface,
          borderRadius: 4,
          overflow: "hidden",
          flexDirection: "row",
          marginBottom: Spacing.m,
        }}
      >
        <View
          style={{
            width: `${incomePercentage}%`,
            height: "100%",
            backgroundColor: colors.success,
          }}
        />
        <View
          style={{
            flex: 1,
            height: "100%",
            backgroundColor: colors.error,
          }}
        />
      </View>

      {/* Summary Row */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          width: "100%",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: "rgba(0, 242, 96, 0.1)",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <IconSymbol
              name="arrow.down.left"
              size={16}
              color={colors.success}
            />
          </View>
          <View>
            <Typography
              variant="caption"
              style={{ color: colors.textSecondary }}
            >
              Ingresos
            </Typography>
            <Typography
              variant="body"
              weight="bold"
              style={{ color: colors.success }}
            >
              {isBalanceVisible ? formatCurrency(income) : "****"}
            </Typography>
          </View>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: "rgba(255, 65, 108, 0.1)",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <IconSymbol name="arrow.up.right" size={16} color={colors.error} />
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Typography
              variant="caption"
              style={{ color: colors.textSecondary }}
            >
              Gastos
            </Typography>
            <Typography
              variant="body"
              weight="bold"
              style={{ color: colors.error }}
            >
              {isBalanceVisible ? formatCurrency(expense) : "****"}
            </Typography>
          </View>
        </View>
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
