import { Typography } from "@/components/atoms/Typography";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { BorderRadius, Spacing, ThemeColors } from "@/constants/theme";
import { Category } from "@/features/wallet/data/categoriesSlice";
import React from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";

interface CategoryDropdownFieldProps {
  colors: ThemeColors;
  categories: Category[];
  value: string;
  isOpen: boolean;
  onToggle: () => void;
  onSelect: (name: string) => void;
}

/**
 * Selector de categoría del gasto fijo, paso 2 del wizard: un disparador con
 * flecha ▲/▼ y, debajo, una lista desplegable dentro de un `ScrollView`
 * anidado. Antes ~85 líneas inline en `BudgetSetupWizard.tsx`.
 */
export const CategoryDropdownField: React.FC<CategoryDropdownFieldProps> = ({
  colors,
  categories,
  value,
  isOpen,
  onToggle,
  onSelect,
}) => {
  return (
    <>
      <Typography variant="overline" muted style={styles.label}>
        Categoría
      </Typography>
      <TouchableOpacity
        onPress={onToggle}
        style={[
          styles.trigger,
          { backgroundColor: colors.surface, borderColor: colors.border },
          isOpen && styles.triggerOpen,
        ]}
      >
        <View style={styles.triggerRow}>
          <Typography variant="body" muted={!value}>
            {value || "Selecciona una categoría"}
          </Typography>
          <IconSymbol
            name={isOpen ? "chevron.up" : "chevron.down"}
            size={16}
            color={colors.icon}
          />
        </View>
      </TouchableOpacity>

      {isOpen && (
        <View
          style={[
            styles.list,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <ScrollView nestedScrollEnabled>
            {categories.map((cat, index) => (
              <TouchableOpacity
                key={cat.id}
                onPress={() => onSelect(cat.name)}
                style={[
                  styles.item,
                  index > 0 && {
                    borderTopWidth: StyleSheet.hairlineWidth,
                    borderTopColor: colors.border,
                  },
                ]}
              >
                <Typography variant="body">{cat.name}</Typography>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  label: {
    marginBottom: Spacing.xs,
  },
  trigger: {
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.m,
    borderRadius: BorderRadius.m,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: Spacing.m,
  },
  triggerOpen: {
    marginBottom: 0,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  triggerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  list: {
    borderWidth: StyleSheet.hairlineWidth,
    borderTopWidth: 0,
    borderBottomLeftRadius: BorderRadius.m,
    borderBottomRightRadius: BorderRadius.m,
    marginBottom: Spacing.m,
    maxHeight: 200,
  },
  item: {
    padding: Spacing.m,
    borderTopWidth: 0,
  },
});
