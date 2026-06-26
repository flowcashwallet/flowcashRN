import { GlassSegmentedControl } from "@/components/atoms/GlassSegmentedControl";
import { Spacing } from "@/constants/theme";
import { MonthSelector } from "@/features/wallet/components/MonthSelector";
import STRINGS from "@/i18n/es.json";
import React from "react";
import { View } from "react-native";

interface DashboardPeriodControlsProps {
  periodView: "month" | "year";
  selectedDate: Date;
  currentMonthName: string;
  year: number;
  onOpenDatePicker: () => void;
  onChangePeriodView: (value: "month" | "year") => void;
}

export function DashboardPeriodControls({
  periodView,
  selectedDate,
  currentMonthName,
  year,
  onOpenDatePicker,
  onChangePeriodView,
}: DashboardPeriodControlsProps) {
  return (
    <View
      style={{
        marginBottom: Spacing.m,
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      <MonthSelector
        currentMonthName={
          periodView === "year"
            ? `${STRINGS.wallet.viewYear} ${selectedDate.getFullYear()}`
            : currentMonthName
        }
        year={year}
        showYear={periodView === "month" && year !== new Date().getFullYear()}
        onPress={onOpenDatePicker}
      />
      <GlassSegmentedControl
        style={{ marginLeft: Spacing.s }}
        value={periodView}
        options={[
          { value: "month", label: STRINGS.wallet.viewMonth },
          { value: "year", label: STRINGS.wallet.viewYear },
        ]}
        onChange={onChangePeriodView}
      />
    </View>
  );
}
