import { GlassCard } from "@/components/atoms/GlassCard";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { BorderRadius, Spacing } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";
import { MonthSelector } from "@/features/wallet/components/MonthSelector";
import { MonthYearPickerModal } from "@/features/wallet/components/MonthYearPickerModal";
import { useWalletData } from "@/features/wallet/hooks/useWalletData";
import STRINGS from "@/i18n/es.json";
import { formatCurrency } from "@/utils/format";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { PieChart } from "react-native-gifted-charts";

export default function DashboardScreen() {
  const { colors } = useTheme();
  const {
    currentMonthTransactions,
    currentMonthName,
    selectedDate,
    setSelectedDate,
    income,
    expense,
    balance,
  } = useWalletData();
  const year = selectedDate.getFullYear();
  const [datePickerVisible, setDatePickerVisible] = useState(false);

  const recentTransactions = useMemo(
    () => currentMonthTransactions.slice(0, 5),
    [currentMonthTransactions],
  );
  const savings = income - expense;

  const categoryTotals = useMemo(() => {
    const totals = new Map<string, number>();
    for (const t of currentMonthTransactions) {
      if (t.type !== "expense") continue;
      const key = t.category || "Otros";
      totals.set(key, (totals.get(key) || 0) + Math.abs(t.amount));
    }
    return totals;
  }, [currentMonthTransactions]);

  const piePalette = [
    "#8fb1ff",
    "#ff6b6b",
    "#4ade80",
    "#FFD166",
    "#C084FC",
    "#60A5FA",
    "#F97316",
    "#34D399",
  ];

  const categoryColor = useMemo(() => {
    const hash = (s: string) => {
      let h = 0;
      for (let i = 0; i < s.length; i++) {
        h = (h * 31 + s.charCodeAt(i)) >>> 0;
      }
      return h;
    };
    return (category: string) => piePalette[hash(category) % piePalette.length];
  }, [piePalette]);

  const allocationBreakdown = useMemo(() => {
    const entries = Array.from(categoryTotals.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
    const total = entries.reduce((sum, [, v]) => sum + v, 0) || 1;
    return entries.map(([category, amount]) => ({
      category,
      amount,
      percent: amount / total,
      color: categoryColor(category),
    }));
  }, [categoryColor, categoryTotals]);

  const pieData = useMemo(() => {
    return allocationBreakdown.map((c) => ({
      value: c.amount,
      color: c.color,
    }));
  }, [allocationBreakdown]);

  return (
    <LinearGradient
      collapsable={false}
      colors={colors.gradients.background}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <BlurView
        intensity={80}
        tint={colors.background.toLowerCase() === "#fff" ? "light" : "dark"}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: Spacing.m, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: Spacing.m,
          }}
        >
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: colors.surface,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <IconSymbol name="person.fill" size={18} color={colors.primary} />
          </View>
          <Text style={{ color: colors.primary, fontWeight: "bold" }}>
            {STRINGS.dashboard.title}
          </Text>
          <IconSymbol name="bell.fill" size={18} color={colors.textSecondary} />
        </View>

        <View style={{ marginBottom: Spacing.m }}>
          <MonthSelector
            currentMonthName={currentMonthName}
            year={year}
            showYear={year !== new Date().getFullYear()}
            onPress={() => setDatePickerVisible(true)}
          />
        </View>

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
            <View
              style={[
                styles.pillIcon,
                {
                  borderColor: colors.success,
                },
              ]}
            >
              <IconSymbol
                name="arrow.down.left"
                size={16}
                color={colors.success}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                {STRINGS.dashboard.monthlyIncome}
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
              <IconSymbol
                name="arrow.up.right"
                size={16}
                color={colors.error}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                {STRINGS.dashboard.monthlyOutflow}
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
            <View
              style={[
                styles.pillIcon,
                {
                  borderColor: colors.primary,
                },
              ]}
            >
              <IconSymbol
                name="banknote.fill"
                size={16}
                color={colors.primary}
              />
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

        <GlassCard style={styles.card}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            {STRINGS.dashboard.monthlyAllocation}
          </Text>
          <View style={{ alignItems: "center", marginBottom: 20 }}>
            <PieChart
              donut
              innerRadius={70}
              radius={90}
              data={
                pieData.length > 0
                  ? pieData
                  : [{ value: 100, color: colors.border }]
              }
              centerLabelComponent={() => (
                <View
                  style={{ justifyContent: "center", alignItems: "center" }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      color: colors.textSecondary,
                      fontWeight: "bold",
                    }}
                  >
                    {STRINGS.dashboard.total}
                  </Text>
                  <Text
                    style={{
                      fontSize: 20,
                      color: colors.text,
                      fontWeight: "bold",
                    }}
                  >
                    {formatCurrency(expense)}
                  </Text>
                </View>
              )}
            />
          </View>
          {allocationBreakdown.length > 0 ? (
            <View style={{ gap: 12 }}>
              {allocationBreakdown.map((c) => (
                <View
                  key={c.category}
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      flex: 1,
                    }}
                  >
                    <View
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        marginRight: 12,
                        backgroundColor: c.color,
                      }}
                    />
                    <Text
                      style={{ color: colors.textSecondary, fontSize: 14 }}
                      numberOfLines={1}
                    >
                      {c.category}
                    </Text>
                  </View>
                  <Text
                    style={{
                      color: colors.text,
                      fontSize: 14,
                      fontWeight: "600",
                    }}
                  >
                    {Math.round(c.percent * 100)}%
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
              No hay gastos en este mes.
            </Text>
          )}
        </GlassCard>

        <GlassCard style={[styles.card, { paddingBottom: 8 }]}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              Recent Transactions
            </Text>
          </View>

          {recentTransactions.map((tx) => {
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
                    {(tx.category || "General") + " • " + dateStr}
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: "bold",
                      color:
                        tx.type === "income" ? colors.success : colors.text,
                      marginBottom: 4,
                    }}
                  >
                    {(tx.type === "income" ? "+" : "-") +
                      formatCurrency(tx.amount)}
                  </Text>
                </View>
              </View>
            );
          })}
        </GlassCard>
      </ScrollView>

      <MonthYearPickerModal
        visible={datePickerVisible}
        onClose={() => setDatePickerVisible(false)}
        selectedDate={selectedDate}
        onSelect={setSelectedDate}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  pillIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  label: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 4,
  },
  value: {
    fontSize: 18,
    fontWeight: "bold",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 20,
  },
});
