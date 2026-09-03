import { Typography } from "@/components/atoms/Typography";
import { Spacing } from "@/constants/theme";
import { LiabilityPaymentsYearHeader } from "@/features/vision/components/liability-payments/LiabilityPaymentsYearHeader";
import { MonthPaymentRow } from "@/features/vision/components/liability-payments/MonthPaymentRow";
import { useLiabilityPaymentsScreen } from "@/features/vision/hooks/useLiabilityPaymentsScreen";
import React from "react";
import { FlatList, StyleSheet, View } from "react-native";

export default function LiabilityPaymentsScreen() {
  const {
    colors,
    entity,
    year,
    goPrevYear,
    goNextYear,
    displayMonths,
    yearTotalPaid,
    currentMonthSummary,
  } = useLiabilityPaymentsScreen();

  if (!entity) {
    return (
      <View style={[styles.notFound, { backgroundColor: colors.background }]}>
        <Typography variant="body" muted>
          No se encontró el pasivo.
        </Typography>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LiabilityPaymentsYearHeader
        entityName={entity.name}
        year={year}
        yearTotalPaid={yearTotalPaid}
        currentMonthSummary={currentMonthSummary}
        onPrevYear={goPrevYear}
        onNextYear={goNextYear}
      />

      <FlatList
        data={displayMonths}
        keyExtractor={(m) => `${year}-${m.monthIndex}`}
        contentContainerStyle={[
          styles.listContent,
          { backgroundColor: colors.background },
        ]}
        renderItem={({ item }) => (
          <MonthPaymentRow
            item={item}
            minimumPayment={entity.minimumPayment ?? null}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  notFound: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.m,
  },
  listContent: {
    paddingHorizontal: Spacing.m,
    paddingBottom: Spacing.xl,
    gap: Spacing.s,
  },
});
