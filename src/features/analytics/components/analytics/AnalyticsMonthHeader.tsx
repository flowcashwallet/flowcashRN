import { GlassSurface } from "@/components/atoms/GlassSurface";
import { Typography } from "@/components/atoms/Typography";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { BorderRadius, Spacing, ThemeColors } from "@/constants/theme";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

interface AnalyticsMonthHeaderProps {
  colors: ThemeColors;
  currentMonthName: string;
  currentYear: number;
  onPress: () => void;
}

/**
 * El selector de mes de Analytics, con la misma forma que `MonthSelector` en
 * Wallet: píldora con icono de calendario, nombre del mes y chevron.
 *
 * Antes era texto suelto + chevron sobre el canvas — no se leía como algo
 * pulsable. Ahora es una superficie propia y, desde la ampliación de alcance
 * del 2026-09-02 ("todo componente con superficie propia lleva vidrio en
 * iOS 26+", ver `docs/refactor-plan.md`), esa superficie es cristal nativo.
 * Sin cristal cae a la píldora plana `surfaceHighlight` + hairline.
 */
export const AnalyticsMonthHeader: React.FC<AnalyticsMonthHeaderProps> = ({
  colors,
  currentMonthName,
  currentYear,
  onPress,
}) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="Cambiar mes"
        style={styles.touchable}
      >
        <GlassSurface
          isInteractive
          style={styles.pill}
          fallbackStyle={[
            styles.flatPill,
            {
              backgroundColor: colors.surfaceHighlight,
              borderColor: colors.border,
            },
          ]}
        >
          <IconSymbol name="calendar" size={16} color={colors.primary} />
          <Typography variant="heading" style={styles.label}>
            {currentMonthName}{" "}
            {currentYear !== new Date().getFullYear() ? currentYear : ""}
          </Typography>
          <IconSymbol name="chevron.down" size={16} color={colors.icon} />
        </GlassSurface>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.m,
  },
  touchable: {
    alignSelf: "flex-start",
  },
  /** Layout de la píldora, común a la variante con cristal y a la plana. */
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.s,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.round,
    overflow: "hidden",
  },
  /** Relleno opaco + hairline: solo cuando no hay cristal. */
  flatPill: {
    borderWidth: StyleSheet.hairlineWidth,
  },
  label: {
    textTransform: "capitalize",
  },
});
