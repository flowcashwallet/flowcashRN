import { SegmentedControl } from "@/components/atoms/SegmentedControl";
import { Spacing } from "@/constants/theme";
import { MonthSelector } from "@/features/wallet/components/MonthSelector";
import STRINGS from "@/i18n/es.json";
import React from "react";
import { StyleSheet, View } from "react-native";

interface DashboardPeriodControlsProps {
  periodView: "month" | "year";
  selectedDate: Date;
  currentMonthName: string;
  year: number;
  onOpenDatePicker: () => void;
  onChangePeriodView: (value: "month" | "year") => void;
}

/**
 * Cabecera de periodo del dashboard: píldora de mes/año + segmentado.
 *
 * **Vidrio por control, no un panel único** — la misma decisión que en
 * `WalletListHeader` (ver "Retrofit ronda 2" en `docs/refactor-plan.md`).
 * `MonthSelector` y `SegmentedControl` ya son superficies de cristal por sí
 * mismas; envolverlas en una card las dejaría anidadas y el guard de
 * anidamiento de `GlassSurface` las aplanaría, cambiando dos cristales vivos
 * por una losa. Esta fila es solo layout: no tiene —ni debe tener— superficie
 * propia.
 */
export function DashboardPeriodControls({
  periodView,
  selectedDate,
  currentMonthName,
  year,
  onOpenDatePicker,
  onChangePeriodView,
}: DashboardPeriodControlsProps) {
  return (
    <View style={styles.row}>
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
      <SegmentedControl
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

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.s,
    marginBottom: Spacing.l,
  },
});
