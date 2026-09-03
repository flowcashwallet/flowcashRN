import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { AnalyticsMonthHeader } from "@/features/analytics/components/analytics/AnalyticsMonthHeader";
import { FinancialTipsSection } from "@/features/analytics/components/analytics/FinancialTipsSection";
import { RecurringExpensesSection } from "@/features/analytics/components/analytics/RecurringExpensesSection";
import { TopCategoriesSection } from "@/features/analytics/components/analytics/TopCategoriesSection";
import { ForecastCard } from "@/features/analytics/components/ForecastCard";
import { useAnalyticsScreen } from "@/features/analytics/hooks/useAnalyticsScreen";
import { MonthYearPickerModal } from "@/features/wallet/components/MonthYearPickerModal";
import React from "react";
import { RefreshControl, ScrollView, StyleSheet } from "react-native";

/**
 * Aire bajo el último bloque para que el tab bar y el FAB flotantes no tapen
 * contenido. Se le suma el inset inferior seguro del dispositivo.
 */
const SCROLL_BOTTOM_INSET = 200;

export default function AnalyticsScreen() {
  const {
    colors,
    insets,
    forecast,
    recurringExpenses,
    topCategories,
    financialTips,
    selectedDate,
    setSelectedDate,
    currentMonthName,
    currentYear,
    refreshing,
    onRefresh,
    datePickerVisible,
    openDatePicker,
    closeDatePicker,
    expandedCategory,
    handleCategoryPress,
    handleViewAllCategories,
    handleViewAllRecurring,
  } = useAnalyticsScreen();

  return (
    <ThemedView
      lightColor="transparent"
      darkColor="transparent"
      style={styles.container}
    >
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[
          styles.content,
          { paddingBottom: SCROLL_BOTTOM_INSET + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <AnalyticsMonthHeader
          colors={colors}
          currentMonthName={currentMonthName}
          currentYear={currentYear}
          onPress={openDatePicker}
        />

        <ForecastCard forecast={forecast} />

        <FinancialTipsSection colors={colors} tips={financialTips} />

        <TopCategoriesSection
          colors={colors}
          categories={topCategories}
          expandedCategory={expandedCategory}
          onCategoryPress={handleCategoryPress}
          onViewAllPress={handleViewAllCategories}
        />

        <RecurringExpensesSection
          colors={colors}
          expenses={recurringExpenses}
          onViewAllPress={handleViewAllRecurring}
        />
      </ScrollView>

      <MonthYearPickerModal
        visible={datePickerVisible}
        selectedDate={selectedDate}
        onClose={closeDatePicker}
        onSelect={setSelectedDate}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
  },
  content: {
    padding: Spacing.m,
  },
});
