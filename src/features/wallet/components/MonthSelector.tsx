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
      style={[
        styles.container,
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
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.s,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.round,
    borderWidth: StyleSheet.hairlineWidth,
  },
  label: {
    textTransform: "capitalize",
  },
});
