import { Spacing } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";
import { AllocationSection } from "@/features/dashboard/components/AllocationSection";
import { AnomalousMovementsSection } from "@/features/dashboard/components/AnomalousMovementsSection";
import { BalanceOverviewSection } from "@/features/dashboard/components/BalanceOverviewSection";
import { CategorySpikeAlertsSection } from "@/features/dashboard/components/CategorySpikeAlertsSection";
import { DashboardPeriodControls } from "@/features/dashboard/components/DashboardPeriodControls";
import { RecentTransactionsSection } from "@/features/dashboard/components/RecentTransactionsSection";
import { UpcomingFixedPaymentsSection } from "@/features/dashboard/components/UpcomingFixedPaymentsSection";
import { WeeklySpendingSection } from "@/features/dashboard/components/WeeklySpendingSection";
import { MonthYearPickerModal } from "@/features/wallet/components/MonthYearPickerModal";
import { useWalletData } from "@/features/wallet/hooks/useWalletData";
import STRINGS from "@/i18n/es.json";
import { formatCurrency } from "@/utils/format";
import { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

export default function DashboardScreen() {
  const { colors } = useTheme();
  const {
    transactions,
    currentMonthTransactions,
    currentMonthName,
    selectedDate,
    setSelectedDate,
    periodView,
    setPeriodView,
    income,
    expense,
    balance,
  } = useWalletData();
  const year = selectedDate.getFullYear();
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [showWeeklyDetails, setShowWeeklyDetails] = useState(false);
  const [expandedWeek, setExpandedWeek] = useState<string | null>(null);
  const [lineChartWidth, setLineChartWidth] = useState(0);

  useEffect(() => {
    if (periodView === "year") {
      setShowWeeklyDetails(false);
      setExpandedWeek(null);
    }
  }, [periodView]);

  const recentTransactions = useMemo(
    () => currentMonthTransactions.slice(0, 5),
    [currentMonthTransactions],
  );
  const savings = income - expense;
  const selectedMonthIndex = selectedDate.getMonth();

  const selectedYearTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      const transactionDate = new Date(transaction.date);
      return transactionDate.getFullYear() === year;
    });
  }, [transactions, year]);

  const selectedMonthTransactions = useMemo(() => {
    return selectedYearTransactions.filter((transaction) => {
      const transactionDate = new Date(transaction.date);
      return transactionDate.getMonth() === selectedMonthIndex;
    });
  }, [selectedMonthIndex, selectedYearTransactions]);

  const formatWeeklyValue = (value: number) => {
    const formatted = formatCurrency(value);
    return formatted.endsWith(".00") ? formatted.slice(0, -3) : formatted;
  };

  const expenseTrend = useMemo(() => {
    if (periodView === "year") {
      const totals = Array.from({ length: 12 }, () => 0);
      for (const t of currentMonthTransactions) {
        if (t.type !== "expense") continue;
        const monthIndex = new Date(t.date).getMonth();
        totals[monthIndex] += Math.abs(t.amount);
      }

      const data = totals.map((value, i) => ({
        value,
        label: STRINGS.wallet.months[i].substring(0, 3),
        dataPointText: formatWeeklyValue(value),
      }));

      const hasData = totals.some((v) => v > 0);
      return { data, hasData };
    }

    const monthIndex = selectedDate.getMonth();
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const weeksCount = Math.ceil(daysInMonth / 7);
    const totals = Array.from({ length: weeksCount }, () => 0);

    for (const t of currentMonthTransactions) {
      if (t.type !== "expense") continue;
      const day = new Date(t.date).getDate();
      const weekIndex = Math.min(weeksCount - 1, Math.floor((day - 1) / 7));
      totals[weekIndex] += Math.abs(t.amount);
    }

    const data = totals.map((value, i) => ({
      value,
      label: `${STRINGS.dashboard.weekAbbrev} ${i + 1}`,
      dataPointText: formatWeeklyValue(value),
    }));

    const hasData = totals.some((v) => v > 0);
    return { data, hasData };
  }, [currentMonthTransactions, periodView, selectedDate, year]);

  const resolvedLineChartWidth = useMemo(() => {
    if (!lineChartWidth) return undefined;
    return Math.max(0, lineChartWidth - 16);
  }, [lineChartWidth]);

  const lineChartSpacing = useMemo(() => {
    const points = Math.max(1, expenseTrend.data.length);
    if (!resolvedLineChartWidth) {
      return Math.max(44, 240 / points);
    }
    if (points <= 1) return Math.max(44, resolvedLineChartWidth);
    const available = Math.max(0, resolvedLineChartWidth - 20);
    return Math.max(24, available / (points - 1));
  }, [expenseTrend.data.length, resolvedLineChartWidth]);

  const weeklyDetails = useMemo(() => {
    if (periodView === "year") return [];
    const monthIndex = selectedDate.getMonth();
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const weeksCount = Math.ceil(daysInMonth / 7);

    const perWeek = Array.from({ length: weeksCount }, (_, i) => ({
      label: `${STRINGS.dashboard.weekAbbrev} ${i + 1}`,
      fromDay: i * 7 + 1,
      toDay: Math.min(daysInMonth, (i + 1) * 7),
      expenseTotal: 0,
      incomeTotal: 0,
      expenseByCategory: new Map<string, number>(),
      incomeByCategory: new Map<string, number>(),
    }));

    for (const t of currentMonthTransactions) {
      const day = new Date(t.date).getDate();
      const weekIndex = Math.min(weeksCount - 1, Math.floor((day - 1) / 7));

      if (t.type === "expense") {
        const amount = Math.abs(t.amount);
        const category = t.category || STRINGS.dashboard.uncategorized;
        perWeek[weekIndex].expenseTotal += amount;
        perWeek[weekIndex].expenseByCategory.set(
          category,
          (perWeek[weekIndex].expenseByCategory.get(category) || 0) + amount,
        );
      }

      if (t.type === "income") {
        const amount = Math.abs(t.amount);
        const category = t.category || STRINGS.dashboard.uncategorized;
        perWeek[weekIndex].incomeTotal += amount;
        perWeek[weekIndex].incomeByCategory.set(
          category,
          (perWeek[weekIndex].incomeByCategory.get(category) || 0) + amount,
        );
      }
    }

    return perWeek.map((w) => ({
      label: w.label,
      range: STRINGS.dashboard.weekRange
        .replace(
          "{from}",
          new Date(year, monthIndex, w.fromDay).toLocaleDateString("es-MX", {
            day: "2-digit",
            month: "short",
          }),
        )
        .replace(
          "{to}",
          new Date(year, monthIndex, w.toDay).toLocaleDateString("es-MX", {
            day: "2-digit",
            month: "short",
          }),
        ),
      expenseTotal: w.expenseTotal,
      incomeTotal: w.incomeTotal,
      balance: w.incomeTotal - w.expenseTotal,
      categories: Array.from(w.expenseByCategory.entries())
        .map(([category, amount]) => ({ category, amount }))
        .sort((a, b) => b.amount - a.amount),
      incomeCategories: Array.from(w.incomeByCategory.entries())
        .map(([category, amount]) => ({ category, amount }))
        .sort((a, b) => b.amount - a.amount),
    }));
  }, [currentMonthTransactions, periodView, selectedDate, year]);

  const categorySpikeAlerts = useMemo(() => {
    const monthlyExpenseTotals = new Map<string, number>();
    const categoryMonthlySeries = new Map<string, number[]>();

    for (let month = 0; month < 12; month += 1) {
      const monthTransactions = selectedYearTransactions.filter(
        (transaction) => {
          const transactionDate = new Date(transaction.date);
          return (
            transactionDate.getMonth() === month &&
            transaction.type === "expense"
          );
        },
      );

      const monthCategoryTotals = new Map<string, number>();
      monthTransactions.forEach((transaction) => {
        const category =
          transaction.category || STRINGS.dashboard.uncategorized;
        const amount = Math.abs(transaction.amount);
        monthCategoryTotals.set(
          category,
          (monthCategoryTotals.get(category) || 0) + amount,
        );
      });

      monthCategoryTotals.forEach((amount, category) => {
        const series =
          categoryMonthlySeries.get(category) ||
          Array.from({ length: 12 }, () => 0);
        series[month] = amount;
        categoryMonthlySeries.set(category, series);
      });
    }

    selectedMonthTransactions.forEach((transaction) => {
      if (transaction.type !== "expense") return;
      const category = transaction.category || STRINGS.dashboard.uncategorized;
      monthlyExpenseTotals.set(
        category,
        (monthlyExpenseTotals.get(category) || 0) +
          Math.abs(transaction.amount),
      );
    });

    return Array.from(monthlyExpenseTotals.entries())
      .map(([category, currentAmount]) => {
        const fullSeries = categoryMonthlySeries.get(category) || [];
        const comparisonSeries = fullSeries.filter(
          (_, index) => index !== selectedMonthIndex,
        );
        if (comparisonSeries.length === 0) return null;

        const averageAmount =
          comparisonSeries.reduce((sum, value) => sum + value, 0) /
          comparisonSeries.length;
        if (averageAmount <= 0) return null;

        const increasePct =
          ((currentAmount - averageAmount) / averageAmount) * 100;
        if (increasePct < 30) return null;

        return {
          category,
          currentAmount,
          averageAmount,
          increasePct,
          weekLabel: STRINGS.wallet.months[selectedMonthIndex],
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => b.increasePct - a.increasePct);
  }, [selectedMonthIndex, selectedMonthTransactions, selectedYearTransactions]);

  const anomalousMovements = useMemo(() => {
    const groups = new Map<string, number[]>();

    selectedYearTransactions.forEach((tx) => {
      const key = `${tx.type}|${tx.category || STRINGS.dashboard.uncategorized}`;
      const amount = Math.abs(tx.amount);
      const list = groups.get(key) || [];
      list.push(amount);
      groups.set(key, list);
    });

    const anomalies = selectedMonthTransactions
      .map((tx) => {
        const key = `${tx.type}|${tx.category || STRINGS.dashboard.uncategorized}`;
        const series = groups.get(key) || [];
        if (series.length < 3) return null;

        const value = Math.abs(tx.amount);
        const mean = series.reduce((sum, v) => sum + v, 0) / series.length;
        const variance =
          series.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) /
          series.length;
        const std = Math.sqrt(variance);
        if (std === 0) return null;

        const zScore = (value - mean) / std;
        if (zScore < 2) return null;

        return {
          id: tx.id,
          description: tx.description,
          category: tx.category || STRINGS.dashboard.uncategorized,
          type: tx.type,
          amount: value,
          expected: mean,
          zScore,
          date: tx.date,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => b.zScore - a.zScore)
      .slice(0, 3);

    return anomalies;
  }, [selectedMonthTransactions, selectedYearTransactions]);

  const upcomingFixedPayments = useMemo(() => {
    const now = new Date();
    const horizon = new Date(now);
    horizon.setDate(horizon.getDate() + 30);

    const addMonthsSafe = (source: Date, months: number) => {
      const d = new Date(source);
      const targetDay = d.getDate();
      d.setDate(1);
      d.setMonth(d.getMonth() + months);
      const daysInTargetMonth = new Date(
        d.getFullYear(),
        d.getMonth() + 1,
        0,
      ).getDate();
      d.setDate(Math.min(targetDay, daysInTargetMonth));
      return d;
    };

    const seriesMap = new Map<
      string,
      {
        description: string;
        category: string;
        amount: number;
        recurrenceFrequency: "weekly" | "monthly" | "yearly";
        recurrenceMonths: number | null;
        lastDate: number;
      }
    >();

    transactions.forEach((tx) => {
      if (tx.type !== "expense") return;
      if (!tx.isRecurring || !tx.recurrenceFrequency) return;

      const key = [
        tx.description || "(sin descripcion)",
        tx.category || STRINGS.dashboard.uncategorized,
        Math.abs(tx.amount).toFixed(2),
        tx.recurrenceFrequency,
        tx.recurrenceMonths ?? "",
      ].join("|");

      const current = seriesMap.get(key);
      if (!current || tx.date > current.lastDate) {
        seriesMap.set(key, {
          description: tx.description || "(sin descripcion)",
          category: tx.category || STRINGS.dashboard.uncategorized,
          amount: Math.abs(tx.amount),
          recurrenceFrequency: tx.recurrenceFrequency,
          recurrenceMonths: tx.recurrenceMonths ?? null,
          lastDate: tx.date,
        });
      }
    });

    const items: {
      key: string;
      description: string;
      category: string;
      amount: number;
      dueDate: Date;
      recurrenceFrequency: "weekly" | "monthly" | "yearly";
    }[] = [];

    seriesMap.forEach((series, key) => {
      let nextDate = new Date(series.lastDate);
      let safety = 0;

      while (nextDate <= now && safety < 120) {
        if (series.recurrenceFrequency === "weekly") {
          nextDate = new Date(nextDate.getTime() + 7 * 24 * 60 * 60 * 1000);
        } else if (series.recurrenceFrequency === "monthly") {
          nextDate = addMonthsSafe(nextDate, series.recurrenceMonths || 1);
        } else {
          nextDate = addMonthsSafe(nextDate, 12);
        }
        safety += 1;
      }

      if (nextDate > now && nextDate <= horizon) {
        items.push({
          key,
          description: series.description,
          category: series.category,
          amount: series.amount,
          dueDate: nextDate,
          recurrenceFrequency: series.recurrenceFrequency,
        });
      }
    });

    const sorted = items.sort(
      (a, b) => a.dueDate.getTime() - b.dueDate.getTime(),
    );
    const total = sorted.reduce((sum, item) => sum + item.amount, 0);

    return {
      items: sorted,
      total,
      expectedBalanceAfterFixed: balance - total,
    };
  }, [balance, transactions]);

  const categoryTotals = useMemo(() => {
    const totals = new Map<string, number>();
    for (const t of currentMonthTransactions) {
      if (t.type !== "expense") continue;
      const key = t.category || STRINGS.dashboard.uncategorized;
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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: Spacing.m, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <DashboardPeriodControls
          periodView={periodView}
          selectedDate={selectedDate}
          currentMonthName={currentMonthName}
          year={year}
          onOpenDatePicker={() => setDatePickerVisible(true)}
          onChangePeriodView={setPeriodView}
        />

        <BalanceOverviewSection
          colors={colors}
          periodView={periodView}
          income={income}
          expense={expense}
          balance={balance}
          savings={savings}
        />

        <WeeklySpendingSection
          colors={colors}
          periodView={periodView}
          expenseTrend={expenseTrend}
          lineChartSpacing={lineChartSpacing}
          resolvedLineChartWidth={resolvedLineChartWidth}
          onLineChartLayout={(width) => setLineChartWidth(width)}
          formatWeeklyValue={formatWeeklyValue}
          showWeeklyDetails={showWeeklyDetails}
          onToggleWeeklyDetails={() => {
            setShowWeeklyDetails((v) => {
              const next = !v;
              if (!next) setExpandedWeek(null);
              return next;
            });
          }}
          weeklyDetails={weeklyDetails}
          expandedWeek={expandedWeek}
          onToggleExpandedWeek={(weekLabel) =>
            setExpandedWeek((prev) => (prev === weekLabel ? null : weekLabel))
          }
        />

        <CategorySpikeAlertsSection
          colors={colors}
          periodView={periodView}
          alerts={categorySpikeAlerts}
          formatWeeklyValue={formatWeeklyValue}
        />

        <AnomalousMovementsSection
          colors={colors}
          movements={anomalousMovements}
          formatWeeklyValue={formatWeeklyValue}
        />

        <UpcomingFixedPaymentsSection
          colors={colors}
          data={upcomingFixedPayments}
          formatWeeklyValue={formatWeeklyValue}
        />

        <AllocationSection
          colors={colors}
          periodView={periodView}
          expense={expense}
          allocationBreakdown={allocationBreakdown}
          pieData={pieData}
        />

        <RecentTransactionsSection
          colors={colors}
          transactions={recentTransactions}
        />
      </ScrollView>
      <MonthYearPickerModal
        visible={datePickerVisible}
        onClose={() => setDatePickerVisible(false)}
        selectedDate={selectedDate}
        onSelect={setSelectedDate}
        mode={periodView}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
