import { Typography } from "@/components/atoms/Typography";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { StatisticsCategoriesList } from "@/features/analytics/components/statistics-categories/StatisticsCategoriesList";
import { StatisticsScreenStackHeader } from "@/features/analytics/components/StatisticsScreenStackHeader";
import { useStatisticsCategoriesScreen } from "@/features/analytics/hooks/useStatisticsCategoriesScreen";
import STRINGS from "@/i18n/es.json";
import React from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";

/**
 * Aire bajo la última card para que el tab bar y el FAB flotantes no tapen
 * contenido. Se le suma el inset inferior seguro del dispositivo.
 */
const SCROLL_BOTTOM_INSET = 200;

export default function StatisticsCategoriesScreen() {
  const {
    colors,
    insets,
    selectedMonth,
    selectedYear,
    categories,
    refreshing,
    onRefresh,
    expandedCategory,
    handleCategoryPress,
    goBack,
  } = useStatisticsCategoriesScreen();

  return (
    <>
      <StatisticsScreenStackHeader
        title="Todas las categorías"
        colors={colors}
        onBack={goBack}
      />
      <ThemedView style={styles.container}>
        <ScrollView
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
          <View style={styles.headerRow}>
            <Typography variant="heading">
              {STRINGS.wallet.months[selectedMonth]}{" "}
              {selectedYear !== new Date().getFullYear() ? selectedYear : ""}
            </Typography>
          </View>

          <StatisticsCategoriesList
            colors={colors}
            categories={categories}
            expandedCategory={expandedCategory}
            onCategoryPress={handleCategoryPress}
          />
        </ScrollView>
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
  },
  content: {
    paddingHorizontal: Spacing.m,
    paddingTop: Spacing.m,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.m,
  },
});
