import { GlassSurface } from "@/components/atoms/GlassSurface";
import { Typography } from "@/components/atoms/Typography";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { BorderRadius, Spacing } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";
import { CurrentMonthSummary } from "@/features/vision/hooks/useLiabilityPaymentsScreen";
import { formatCurrency } from "@/utils/format";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

interface LiabilityPaymentsYearHeaderProps {
  entityName: string;
  year: number;
  yearTotalPaid: number;
  currentMonthSummary: CurrentMonthSummary | null;
  onPrevYear: () => void;
  onNextYear: () => void;
}

/**
 * Cabecera del calendario de pagos de un pasivo: nombre, total del año y
 * navegación de año.
 *
 * El nombre va sobre el canvas; el resumen del año es una superficie propia y
 * lleva cristal en iOS 26+. Los dos botones de año son superficies **hermanas**
 * de ese panel (no anidadas), así que también son cristal — mismo criterio que
 * los tres controles hermanos de `WalletListHeader`.
 */
export const LiabilityPaymentsYearHeader: React.FC<
  LiabilityPaymentsYearHeaderProps
> = ({
  entityName,
  year,
  yearTotalPaid,
  currentMonthSummary,
  onPrevYear,
  onNextYear,
}) => {
  const { colors } = useTheme();

  const flatSurface = [
    styles.flatSurface,
    { backgroundColor: colors.surface, borderColor: colors.border },
  ];

  return (
    <View style={styles.container}>
      <Typography variant="title" numberOfLines={2}>
        {entityName}
      </Typography>

      <GlassSurface style={styles.panel} fallbackStyle={flatSurface}>
        <Typography variant="overline" muted>
          Pagos recibidos en {year}
        </Typography>
        <Typography variant="display" style={{ color: colors.success }}>
          {formatCurrency(yearTotalPaid)}
        </Typography>
        {currentMonthSummary && (
          <View style={styles.currentMonth}>
            <Typography variant="caption" muted>
              {currentMonthSummary.monthLabel}:{" "}
              {formatCurrency(currentMonthSummary.amountPaid)}
            </Typography>
            {currentMonthSummary.showCheck && (
              <IconSymbol
                name="checkmark.circle.fill"
                size={16}
                color={colors.success}
              />
            )}
          </View>
        )}
      </GlassSurface>

      <View style={styles.yearNav}>
        <TouchableOpacity
          onPress={onPrevYear}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={`Año ${year - 1}`}
        >
          <GlassSurface
            style={styles.yearButton}
            isInteractive
            fallbackStyle={flatSurface}
          >
            <IconSymbol name="chevron.left" size={16} color={colors.icon} />
            <Typography variant="bodySmall">{year - 1}</Typography>
          </GlassSurface>
        </TouchableOpacity>

        <Typography variant="heading">{year}</Typography>

        <TouchableOpacity
          onPress={onNextYear}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={`Año ${year + 1}`}
        >
          <GlassSurface
            style={styles.yearButton}
            isInteractive
            fallbackStyle={flatSurface}
          >
            <Typography variant="bodySmall">{year + 1}</Typography>
            <IconSymbol name="chevron.right" size={16} color={colors.icon} />
          </GlassSurface>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: Spacing.m,
    gap: Spacing.m,
  },
  /** Fondo opaco + hairline: solo cuando no hay cristal. */
  flatSurface: {
    borderWidth: StyleSheet.hairlineWidth,
  },
  /** Layout del panel de resumen, común a las dos variantes. */
  panel: {
    borderRadius: BorderRadius.l,
    padding: Spacing.m,
    overflow: "hidden",
  },
  currentMonth: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  yearNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  /** Layout del botón de año, común a las dos variantes. */
  yearButton: {
    paddingVertical: Spacing.s,
    paddingHorizontal: Spacing.m,
    borderRadius: BorderRadius.round,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    overflow: "hidden",
  },
});
