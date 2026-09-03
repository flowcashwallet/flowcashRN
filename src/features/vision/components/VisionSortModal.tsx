import { Typography } from "@/components/atoms/Typography";
import { BottomSheet } from "@/components/molecules/BottomSheet";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { BorderRadius, Spacing } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

export type SortOption = "amount" | "name";

interface VisionSortModalProps {
  visible: boolean;
  onClose: () => void;
  selectedOption: SortOption;
  onSelectOption: (option: SortOption) => void;
}

const SORT_OPTIONS: {
  id: SortOption;
  label: string;
  icon: React.ComponentProps<typeof IconSymbol>["name"];
}[] = [
  { id: "amount", label: "Monto (mayor a menor)", icon: "dollarsign.circle" },
  { id: "name", label: "Alfabético (A-Z)", icon: "textformat" },
];

/**
 * Selector de orden de Vision.
 *
 * Migrado a `BottomSheet` en el pase visual de Vision (antes: `Modal` propio con
 * backdrop y sombra a mano) y de `useColorScheme()` a `useTheme()`. Las filas de
 * opción se quedan planas: están dentro del panel del sheet, que ya es cristal.
 * `dollarsign.circle` y `textformat` se añadieron al `MAPPING` de `IconSymbol`
 * en este mismo pase — se usaban sin estar mapeados y en Android/web no pintaban
 * nada.
 */
export const VisionSortModal: React.FC<VisionSortModalProps> = ({
  visible,
  onClose,
  selectedOption,
  onSelectOption,
}) => {
  const { colors } = useTheme();

  const handleSelect = (option: SortOption) => {
    onSelectOption(option);
    onClose();
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Ordenar por">
      <View style={styles.list}>
        {SORT_OPTIONS.map((option) => {
          const selected = selectedOption === option.id;
          return (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionRow,
                {
                  backgroundColor: selected
                    ? colors.surfaceActive
                    : colors.surfaceHighlight,
                  borderColor: selected ? colors.primary : colors.border,
                },
              ]}
              onPress={() => handleSelect(option.id)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
            >
              <View style={styles.optionContent}>
                <IconSymbol
                  name={option.icon}
                  size={20}
                  color={selected ? colors.primary : colors.icon}
                />
                <Typography
                  variant="body"
                  weight={selected ? "semibold" : "regular"}
                >
                  {option.label}
                </Typography>
              </View>
              {selected && (
                <IconSymbol name="checkmark" size={20} color={colors.primary} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  list: {
    gap: Spacing.s,
    paddingBottom: Spacing.m,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.m,
    borderRadius: BorderRadius.l,
    borderWidth: StyleSheet.hairlineWidth,
  },
  optionContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
});
