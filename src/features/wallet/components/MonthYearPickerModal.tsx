import { Typography } from "@/components/atoms/Typography";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { BorderRadius, Colors, Spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import STRINGS from "@/i18n/es.json";
import React, { useState } from "react";
import { Modal, StyleSheet, TouchableOpacity, View } from "react-native";

interface MonthYearPickerModalProps {
  visible: boolean;
  onClose: () => void;
  selectedDate: Date;
  onSelect: (date: Date) => void;
}

export const MonthYearPickerModal: React.FC<MonthYearPickerModalProps> = ({
  visible,
  onClose,
  selectedDate,
  onSelect,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  
  const [year, setYear] = useState(selectedDate.getFullYear());

  const months = STRINGS.wallet.months || [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  const handleMonthSelect = (monthIndex: number) => {
    const newDate = new Date(year, monthIndex, 1);
    onSelect(newDate);
    onClose();
  };

  const changeYear = (increment: number) => {
    setYear(prev => prev + increment);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.surface }]}>
          <View style={styles.header}>
            <Typography variant="h3" weight="bold" style={{ color: colors.text }}>
              Seleccionar Fecha
            </Typography>
            <TouchableOpacity onPress={onClose}>
              <IconSymbol name="xmark" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Year Selector */}
          <View style={styles.yearSelector}>
            <TouchableOpacity onPress={() => changeYear(-1)} style={styles.yearButton}>
              <IconSymbol name="chevron.left" size={24} color={colors.primary} />
            </TouchableOpacity>
            
            <Typography variant="h2" weight="bold" style={{ color: colors.text }}>
              {year}
            </Typography>

            <TouchableOpacity onPress={() => changeYear(1)} style={styles.yearButton}>
              <IconSymbol name="chevron.right" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Months Grid */}
          <View style={styles.monthsGrid}>
            {months.map((month, index) => {
              const isSelected = 
                selectedDate.getMonth() === index && 
                selectedDate.getFullYear() === year;

              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.monthButton,
                    { 
                      backgroundColor: isSelected ? colors.primary : "transparent",
                      borderColor: colors.border
                    }
                  ]}
                  onPress={() => handleMonthSelect(index)}
                >
                  <Typography 
                    variant="body" 
                    weight={isSelected ? "bold" : "regular"}
                    style={{ color: isSelected ? "#FFFFFF" : colors.text }}
                  >
                    {month.substring(0, 3)}
                  </Typography>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    padding: Spacing.m,
  },
  container: {
    borderRadius: BorderRadius.l,
    padding: Spacing.l,
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.l,
  },
  yearSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.l,
    paddingHorizontal: Spacing.m,
  },
  yearButton: {
    padding: Spacing.s,
  },
  monthsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: Spacing.s,
  },
  monthButton: {
    width: "30%", // 3 columns
    paddingVertical: Spacing.m,
    borderRadius: BorderRadius.m,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "transparent", 
    marginBottom: Spacing.s,
  },
});
