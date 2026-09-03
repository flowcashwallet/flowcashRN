import { GlassSurface } from "@/components/atoms/GlassSurface";
import { Typography } from "@/components/atoms/Typography";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { BorderRadius, Spacing } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";
import React from "react";
import { StyleSheet, TouchableOpacity } from "react-native";

interface MonthSelectorProps {
  currentMonthName: string;
  year: number;
  showYear?: boolean;
  onPress: () => void;
}

/**
 * Se retiró el `BlurView`: la dirección estética es superficie plana (ver
 * `docs/refactor-plan.md`). El blur solo se pintaba en iOS, era caro en Android
 * y su relleno translúcido bajaba el contraste del nombre del mes.
 *
 * Lo que sí es cristal, desde el retrofit del 2026-09-01, es el material
 * **nativo** de iOS 26+ vía `GlassSurface`: la píldora del mes es un control
 * flotante del header, así que entra en el alcance de "toda la superficie
 * flotante de la pantalla". Sin soporte (o con "reducir transparencia") vuelve
 * a la píldora plana `surfaceHighlight` + hairline, que es la de Android/web.
 */
export function MonthSelector({
  currentMonthName,
  year,
  showYear = false,
  onPress,
}: MonthSelectorProps) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel="Cambiar periodo"
      style={styles.touchable}
    >
      <GlassSurface
        style={styles.container}
        isInteractive
        fallbackStyle={[
          styles.flatContainer,
          {
            backgroundColor: colors.surfaceHighlight,
            borderColor: colors.border,
          },
        ]}
      >
        <IconSymbol name="calendar" size={16} color={colors.primary} />
        <Typography variant="subheading" style={styles.label}>
          {currentMonthName} {showYear ? year : ""}
        </Typography>
        <IconSymbol name="chevron.down" size={16} color={colors.icon} />
      </GlassSurface>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  touchable: {
    alignSelf: "flex-start",
  },
  /** Layout de la píldora, común a la variante con cristal y a la plana. */
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.s,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.round,
  },
  /** Relleno opaco + hairline: solo cuando no hay cristal. */
  flatContainer: {
    borderWidth: StyleSheet.hairlineWidth,
  },
  label: {
    textTransform: "capitalize",
  },
});
