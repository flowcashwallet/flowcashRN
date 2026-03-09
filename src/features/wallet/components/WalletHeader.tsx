import { Typography } from "@/components/atoms/Typography";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { BorderRadius, Spacing } from "@/constants/theme";
import STRINGS from "@/i18n/es.json";
import { formatCurrency } from "@/utils/format";
import React, { useState } from "react";
import { Platform, StyleSheet, TouchableOpacity, View } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
} from "react-native-reanimated";
import { StreakInfo } from "../hooks/useStreak";

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
  currentMonthName,
  income,
  expense,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const remaining = income - expense;

  return (
    <View
      style={[
        styles.balanceCard,
        {
          padding: Spacing.m,
          borderRadius: BorderRadius.xl,
          backgroundColor: "#2C2C2E", // Dark card background like the image
          borderWidth: 0, // Remove border for the clean dark look
          ...Platform.select({
            ios: {
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 10,
            },
            android: { elevation: 6 },
          }),
        },
      ]}
    >
      {/* Header / Title Row */}
      <TouchableOpacity
        onPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={0.8}
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: isExpanded ? Spacing.m : 0,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Typography variant="h3" weight="bold" style={{ color: "#FFFFFF" }}>
            {STRINGS.wallet.summary} ({currentMonthName})
          </Typography>
        </View>
        <IconSymbol
          name={isExpanded ? "chevron.up" : "chevron.down"}
          size={16}
          color="#8E8E93"
        />
      </TouchableOpacity>

      {/* Expanded Content */}
      {isExpanded ? (
        <Animated.View
          entering={FadeIn.duration(300)}
          exiting={FadeOut.duration(200)}
          layout={LinearTransition}
        >
          {/* Income */}
          <View style={styles.row}>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
            >
              <Typography style={{ color: "#D1D1D6", fontSize: 15 }}>
                {STRINGS.wallet.income}
              </Typography>
              <IconSymbol name="info.circle" size={14} color="#8E8E93" />
            </View>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              <Typography
                weight="bold"
                style={{ color: "#FFFFFF", fontSize: 16 }}
              >
                {formatCurrency(income)}
              </Typography>
              <View style={[styles.dot, { backgroundColor: "#30D158" }]} />
            </View>
          </View>

          {/* Expenses */}
          <View style={styles.row}>
            <Typography style={{ color: "#D1D1D6", fontSize: 15 }}>
              {STRINGS.wallet.expenses}
            </Typography>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              <Typography
                weight="bold"
                style={{ color: "#FFFFFF", fontSize: 16 }}
              >
                -{formatCurrency(expense)}
              </Typography>
              <View style={[styles.dot, { backgroundColor: "#FF453A" }]} />
            </View>
          </View>

          {/* Divider */}
          <View
            style={{
              height: 1,
              backgroundColor: "#3A3A3C",
              marginVertical: Spacing.s,
            }}
          />

          {/* Remaining */}
          <View style={styles.row}>
            <Typography style={{ color: "#D1D1D6", fontSize: 15 }}>
              {STRINGS.wallet.balanceTotal}
            </Typography>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              <Typography
                weight="bold"
                style={{ color: "#FFFFFF", fontSize: 16 }}
              >
                {formatCurrency(remaining)}
              </Typography>
              <View
                style={[
                  styles.dot,
                  { backgroundColor: remaining >= 0 ? "#30D158" : "#FF453A" },
                ]}
              />
            </View>
          </View>
        </Animated.View>
      ) : (
        /* Collapsed View - Just Balance */
        <Animated.View
          entering={FadeIn.duration(300)}
          exiting={FadeOut.duration(200)}
          layout={LinearTransition}
          style={{ marginTop: 4 }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography style={{ color: "#D1D1D6", fontSize: 15 }}>
              {STRINGS.wallet.balanceTotal}
            </Typography>
            <Typography
              weight="bold"
              style={{ color: "#FFFFFF", fontSize: 16 }}
            >
              {formatCurrency(remaining)}
            </Typography>
          </View>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  balanceCard: {
    marginBottom: Spacing.l,
    overflow: "hidden", // Ensure animated content doesn't spill
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
