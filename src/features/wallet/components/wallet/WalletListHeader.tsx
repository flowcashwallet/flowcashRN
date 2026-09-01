import { GlassSegmentedControl } from "@/components/atoms/GlassSegmentedControl";
import { IconSymbol } from "@/components/ui/icon-symbol";
import {
  BorderRadius,
  Spacing,
  ThemeColors,
  TypographyScale,
} from "@/constants/theme";
import STRINGS from "@/i18n/es.json";
import React from "react";
import {
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { ExportButton } from "../ExportTransactions";
import { MonthSelector } from "../MonthSelector";

interface WalletListHeaderProps {
  periodView: "month" | "year";
  onChangePeriodView: (mode: "month" | "year") => void;
  selectedDate: Date;
  currentMonthName: string;
  onPressMonth: () => void;
  searchQuery: string;
  onChangeSearchQuery: (query: string) => void;
  colors: ThemeColors;
}

export function WalletListHeader({
  periodView,
  onChangePeriodView,
  selectedDate,
  currentMonthName,
  onPressMonth,
  searchQuery,
  onChangeSearchQuery,
  colors,
}: WalletListHeaderProps) {
  return (
    <>
      <View style={styles.topRow}>
        <View style={styles.monthSelectorRow}>
          <MonthSelector
            currentMonthName={
              periodView === "year"
                ? `${STRINGS.wallet.viewYear} ${selectedDate.getFullYear()}`
                : currentMonthName
            }
            year={selectedDate.getFullYear()}
            showYear={
              periodView === "month" &&
              selectedDate.getFullYear() !== new Date().getFullYear()
            }
            onPress={onPressMonth}
          />
          <GlassSegmentedControl
            style={styles.segmentedControl}
            value={periodView}
            options={[
              { value: "month", label: STRINGS.wallet.viewMonth },
              { value: "year", label: STRINGS.wallet.viewYear },
            ]}
            onChange={onChangePeriodView}
          />
        </View>
        <ExportButton />
      </View>

      <View
        style={[
          styles.searchBar,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
      >
        <IconSymbol name="magnifyingglass" size={20} color={colors.icon} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder={STRINGS.common.search}
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={onChangeSearchQuery}
          clearButtonMode="while-editing"
        />
        {Platform.OS === "android" && searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => onChangeSearchQuery("")}
            accessibilityRole="button"
            accessibilityLabel="Limpiar búsqueda"
          >
            <IconSymbol
              name="xmark.circle.fill"
              size={20}
              color={colors.icon}
            />
          </TouchableOpacity>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.m,
    marginHorizontal: Spacing.m,
  },
  monthSelectorRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  segmentedControl: {
    marginLeft: Spacing.s,
  },
  /**
   * Antes era un panel translúcido blanco con sombra: en modo oscuro se veía
   * como una neblina y el borde blanco no existía como token. Ahora es una
   * superficie plana con hairline, según la dirección estética.
   */
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.s,
    borderRadius: BorderRadius.m,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Platform.OS === "ios" ? Spacing.xs : Spacing.s,
    marginBottom: Spacing.m,
    borderWidth: StyleSheet.hairlineWidth,
    marginHorizontal: Spacing.m,
  },
  searchInput: {
    flex: 1,
    paddingVertical: Spacing.s,
    fontSize: TypographyScale.body.fontSize,
  },
});
