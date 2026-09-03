import { SegmentedControl } from "@/components/atoms/SegmentedControl";
import { GlassSurface } from "@/components/atoms/GlassSurface";
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

/**
 * Cabecera flotante de la lista de Wallet: píldora de mes + control segmentado +
 * exportar, y debajo el buscador.
 *
 * **Vidrio por control, no un panel único** (decisión del retrofit del
 * 2026-09-01, ver `docs/refactor-plan.md`). El motivo es duro, no de gusto:
 * `SegmentedControl` es una superficie de cristal por sí misma —y también
 * en Dashboard, donde no existe esta cabecera—, así que envolver el bloque en
 * un solo `GlassSurface` sería apilar cristal sobre cristal, justo lo que la
 * dirección prohíbe. Cada control flota por su cuenta: `MonthSelector`, el
 * segmented y el buscador ponen su propio material. Encaja además con el layout
 * (`marginHorizontal` por bloque, con aire entre filas) y con las filas de la
 * lista de abajo, que ya son cápsulas independientes.
 *
 * `ExportButton` se queda plano: es un icono desnudo, sin superficie propia ni
 * antes ni ahora; el cristal es para superficies, no para glifos sueltos.
 */
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
          <SegmentedControl
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

      <GlassSurface
        style={styles.searchBar}
        fallbackStyle={[
          styles.flatSearchBar,
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
      </GlassSurface>
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
   * Antes era un panel translúcido blanco (`rgba(...)`) con sombra: en modo
   * oscuro se veía como una neblina y el borde blanco no existía como token.
   * Ahora el layout es común y el fondo lo decide `GlassSurface`: material
   * nativo en iOS 26+, `surface` + hairline (`flatSearchBar`) en el resto.
   *
   * El `TextInput` de dentro se queda plano a propósito: es un control dentro
   * de una superficie de cristal y no se apila cristal sobre cristal.
   */
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.s,
    borderRadius: BorderRadius.m,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Platform.OS === "ios" ? Spacing.xs : Spacing.s,
    marginBottom: Spacing.m,
    marginHorizontal: Spacing.m,
  },
  flatSearchBar: {
    borderWidth: StyleSheet.hairlineWidth,
  },
  searchInput: {
    flex: 1,
    paddingVertical: Spacing.s,
    fontSize: TypographyScale.body.fontSize,
  },
});
