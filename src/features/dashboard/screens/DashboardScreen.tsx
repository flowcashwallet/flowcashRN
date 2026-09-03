import { Spacing } from "@/constants/theme";
import { AllocationSection } from "@/features/dashboard/components/AllocationSection";
import { AnomalousMovementsSection } from "@/features/dashboard/components/AnomalousMovementsSection";
import { BalanceOverviewSection } from "@/features/dashboard/components/BalanceOverviewSection";
import { CategorySpikeAlertsSection } from "@/features/dashboard/components/CategorySpikeAlertsSection";
import { DashboardPeriodControls } from "@/features/dashboard/components/DashboardPeriodControls";
import { RecentTransactionsSection } from "@/features/dashboard/components/RecentTransactionsSection";
import { UpcomingFixedPaymentsSection } from "@/features/dashboard/components/UpcomingFixedPaymentsSection";
import { WeeklySpendingSection } from "@/features/dashboard/components/WeeklySpendingSection";
import { useDashboardScreen } from "@/features/dashboard/hooks/useDashboardScreen";
import { MonthYearPickerModal } from "@/features/wallet/components/MonthYearPickerModal";
import { ScrollView, StyleSheet, View } from "react-native";

export default function DashboardScreen() {
  const {
    colors,
    periodView,
    setPeriodView,
    selectedDate,
    setSelectedDate,
    currentMonthName,
    year,
    income,
    expense,
    balance,
    savings,
    datePickerVisible,
    openDatePicker,
    closeDatePicker,
    showWeeklyDetails,
    onToggleWeeklyDetails,
    expandedWeek,
    onToggleExpandedWeek,
    onLineChartLayout,
    resolvedLineChartWidth,
    lineChartSpacing,
    formatWeeklyValue,
    recentTransactions,
    expenseTrend,
    weeklyDetails,
    categorySpikeAlerts,
    anomalousMovements,
    upcomingFixedPayments,
    allocationBreakdown,
    pieData,
  } = useDashboardScreen();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <DashboardPeriodControls
          periodView={periodView}
          selectedDate={selectedDate}
          currentMonthName={currentMonthName}
          year={year}
          onOpenDatePicker={openDatePicker}
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
          onLineChartLayout={onLineChartLayout}
          formatWeeklyValue={formatWeeklyValue}
          showWeeklyDetails={showWeeklyDetails}
          onToggleWeeklyDetails={onToggleWeeklyDetails}
          weeklyDetails={weeklyDetails}
          expandedWeek={expandedWeek}
          onToggleExpandedWeek={onToggleExpandedWeek}
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
        onClose={closeDatePicker}
        selectedDate={selectedDate}
        onSelect={setSelectedDate}
        mode={periodView}
      />
    </View>
  );
}

/**
 * Aire bajo la última card para que la barra de tabs no la tape. Sobre la
 * rejilla de 4pt, en lugar del `100` suelto que había antes.
 */
const SCROLL_BOTTOM_INSET = Spacing.xxl * 2;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.m,
    paddingBottom: SCROLL_BOTTOM_INSET,
  },
});
