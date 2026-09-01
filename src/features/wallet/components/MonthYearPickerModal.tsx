import { Button } from "@/components/atoms/Button";
import { Typography } from "@/components/atoms/Typography";
import { BottomSheet } from "@/components/molecules/BottomSheet";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { BorderRadius, Spacing } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";
import STRINGS from "@/i18n/es.json";
import React, { useEffect, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

interface MonthYearPickerModalProps {
  visible: boolean;
  onClose: () => void;
  selectedDate: Date;
  onSelect: (date: Date) => void;
  mode?: "month" | "year";
}

const FALLBACK_MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

export const MonthYearPickerModal: React.FC<MonthYearPickerModalProps> = ({
  visible,
  onClose,
  selectedDate,
  onSelect,
  mode = "month",
}) => {
  const { colors } = useTheme();

  const [year, setYear] = useState(selectedDate.getFullYear());
  useEffect(() => {
    if (visible) setYear(selectedDate.getFullYear());
  }, [selectedDate, visible]);

  const months = STRINGS.wallet.months || FALLBACK_MONTHS;

  const handleMonthSelect = (monthIndex: number) => {
    const newDate = new Date(year, monthIndex, 1);
    onSelect(newDate);
    onClose();
  };

  const handleYearSelect = () => {
    const newDate = new Date(year, selectedDate.getMonth(), 1);
    onSelect(newDate);
    onClose();
  };

  const changeYear = (increment: number) => {
    setYear((prev) => prev + increment);
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={
        mode === "year" ? STRINGS.wallet.selectYear : STRINGS.wallet.selectDate
      }
    >
      {/* Selector de año */}
      <View style={styles.yearSelector}>
        <TouchableOpacity
          onPress={() => changeYear(-1)}
          hitSlop={Spacing.s}
          accessibilityRole="button"
          accessibilityLabel="Año anterior"
        >
          <IconSymbol name="chevron.left" size={24} color={colors.primary} />
        </TouchableOpacity>

        <Typography variant="heading">{year}</Typography>

        <TouchableOpacity
          onPress={() => changeYear(1)}
          hitSlop={Spacing.s}
          accessibilityRole="button"
          accessibilityLabel="Año siguiente"
        >
          <IconSymbol name="chevron.right" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Rejilla de meses */}
      {mode === "month" ? (
        <View style={styles.monthsGrid}>
          {months.map((month, index) => {
            const isSelected =
              selectedDate.getMonth() === index &&
              selectedDate.getFullYear() === year;

            return (
              <TouchableOpacity
                key={month}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                style={[
                  styles.monthButton,
                  {
                    backgroundColor: isSelected
                      ? colors.primary
                      : colors.surfaceHighlight,
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => handleMonthSelect(index)}
              >
                <Typography
                  variant="button"
                  // `onPrimary` respeta el aviso de contraste sobre `primary`.
                  style={isSelected ? { color: colors.onPrimary } : undefined}
                >
                  {month.substring(0, 3)}
                </Typography>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : (
        <Button
          title={`${STRINGS.wallet.viewYear} ${year}`}
          onPress={handleYearSelect}
        />
      )}
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  yearSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.l,
    paddingHorizontal: Spacing.m,
  },
  monthsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.s,
  },
  monthButton: {
    // 3 columnas: (100% - 2 huecos) / 3.
    flexBasis: "30%",
    flexGrow: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.m,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
});
