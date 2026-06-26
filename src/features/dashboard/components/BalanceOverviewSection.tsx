import { GlassCard } from "@/components/atoms/GlassCard";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { BorderRadius, Spacing } from "@/constants/theme";
import STRINGS from "@/i18n/es.json";
import { formatCurrency } from "@/utils/format";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { DashboardColors } from "./types";

interface BalanceOverviewSectionProps {
  colors: DashboardColors;
  periodView: "month" | "year";
  income: number;
  expense: number;
  balance: number;
  savings: number;
}

export function BalanceOverviewSection({
  colors,
  periodView,
  income,
  expense,
  balance,
  savings,
}: BalanceOverviewSectionProps) {
  return (
    <>
      <GlassCard style={styles.card}>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {STRINGS.dashboard.total}
        </Text>
        <Text
          style={[
            styles.bigAmount,
            { color: balance >= 0 ? colors.success : colors.error },
          ]}
        >
          {formatCurrency(balance)}
        </Text>
      </GlassCard>

      <View style={{ gap: 12, marginBottom: Spacing.m }}>
        <View
          style={[
            styles.pill,
            {
              borderLeftColor: colors.success,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={[styles.pillIcon, { borderColor: colors.success }]}>
            <IconSymbol
              name="arrow.down.left"
              size={16}
              color={colors.success}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              {periodView === "year"
                ? STRINGS.dashboard.yearlyIncome
                : STRINGS.dashboard.monthlyIncome}
            </Text>
            <Text style={[styles.value, { color: colors.text }]}>
              {formatCurrency(income)}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.pill,
            {
              borderLeftColor: colors.error,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={[styles.pillIcon, { borderColor: colors.error }]}>
            <IconSymbol name="arrow.up.right" size={16} color={colors.error} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              {periodView === "year"
                ? STRINGS.dashboard.yearlyOutflow
                : STRINGS.dashboard.monthlyOutflow}
            </Text>
            <Text style={[styles.value, { color: colors.text }]}>
              {formatCurrency(expense)}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.pill,
            {
              borderLeftColor: colors.primary,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={[styles.pillIcon, { borderColor: colors.primary }]}>
            <IconSymbol name="banknote.fill" size={16} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              {STRINGS.dashboard.projectedSavings}
            </Text>
            <Text style={[styles.value, { color: colors.text }]}>
              {formatCurrency(savings)}
            </Text>
          </View>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.xl,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
  },
  subtitle: {
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: "700",
    marginBottom: 8,
  },
  bigAmount: {
    fontSize: 40,
    fontWeight: "bold",
    marginBottom: 12,
    lineHeight: 44,
  },
  pill: {
    borderRadius: 30,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    borderLeftWidth: 2,
    borderWidth: 1,
  },
  pillIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    marginRight: 12,
  },
  label: {
    fontSize: 10,
    letterSpacing: 1,
    fontWeight: "700",
    marginBottom: 4,
  },
  value: {
    fontSize: 18,
    fontWeight: "700",
  },
});
