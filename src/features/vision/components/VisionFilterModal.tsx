import { Typography } from "@/components/atoms/Typography";
import { BottomSheet } from "@/components/molecules/BottomSheet";
import { BorderRadius, Spacing } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";
import React from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";

interface VisionFilterModalProps {
  visible: boolean;
  onClose: () => void;
  categories: string[];
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
}

const ALL = "__all__";

/**
 * Filtro por categoría de Vision.
 *
 * Migrado a la primitiva `BottomSheet` en el pase visual de Vision: antes era un
 * `Modal` propio con su backdrop `rgba(0,0,0,0.5)`, su sombra `#000` y su header
 * a mano. También pasa de `useColorScheme()` + `Colors[...]` a `useTheme()`, así
 * respeta el toggle de tema de la app (mismo arreglo que `TransactionFilterModal`).
 * Los chips se quedan planos: van **dentro** del panel del sheet, que ya es la
 * superficie de cristal.
 */
export const VisionFilterModal: React.FC<VisionFilterModalProps> = ({
  visible,
  onClose,
  categories,
  selectedCategory,
  onSelectCategory,
}) => {
  const { colors } = useTheme();

  const handleSelect = (category: string | null) => {
    onSelectCategory(category);
    onClose();
  };

  const options: { key: string; label: string; value: string | null }[] = [
    { key: ALL, label: "Todas", value: null },
    ...categories.map((cat) => ({ key: cat, label: cat, value: cat })),
  ];

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Filtrar por categoría"
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <Typography variant="overline" muted style={styles.sectionLabel}>
          Categorías
        </Typography>

        <View style={styles.chips}>
          {options.map((option) => {
            const selected = selectedCategory === option.value;
            return (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.chip,
                  {
                    borderColor: selected ? colors.primary : colors.border,
                    backgroundColor: selected
                      ? colors.primary
                      : colors.surfaceHighlight,
                  },
                ]}
                onPress={() => handleSelect(option.value)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
              >
                <Typography
                  variant="bodySmall"
                  style={selected ? { color: colors.onPrimary } : undefined}
                >
                  {option.label}
                </Typography>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  sectionLabel: {
    marginBottom: Spacing.s,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.s,
    paddingBottom: Spacing.m,
  },
  chip: {
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.s,
    borderRadius: BorderRadius.round,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
