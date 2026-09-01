import { GlassSurface } from "@/components/atoms/GlassSurface";
import { Typography } from "@/components/atoms/Typography";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Spacing, ThemeColors } from "@/constants/theme";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { EditingCategory } from "../../hooks/useCategoriesScreen";

interface CategoryListItemProps {
  category: EditingCategory;
  colors: ThemeColors;
  onEdit: (category: EditingCategory) => void;
  onDelete: (id: string) => void;
}

/**
 * Fila, no card: una card es para un resumen, una fila es para un elemento de
 * una lista (ver "Dirección estética" en `docs/refactor-plan.md`). Se separa con
 * un hairline en `border`.
 *
 * Como todo item de lista, en iOS 26+ la superficie la pone `GlassSurface`
 * (Liquid Glass nativo, gateado por soporte de API y por "reducir
 * transparencia"); el resto del tiempo, la fila plana de siempre. No lleva
 * importe con signo, así que aquí no aplica `colors.expense`.
 */
export function CategoryListItem({
  category,
  colors,
  onEdit,
  onDelete,
}: CategoryListItemProps) {
  return (
    <GlassSurface
      style={styles.row}
      fallbackStyle={[styles.flatRow, { borderBottomColor: colors.border }]}
    >
      <Typography variant="body" style={styles.name} numberOfLines={1}>
        {category.name}
      </Typography>
      <View style={styles.actions}>
        <TouchableOpacity
          onPress={() => onEdit(category)}
          hitSlop={Spacing.s}
          accessibilityRole="button"
          accessibilityLabel={`Editar ${category.name}`}
        >
          <IconSymbol name="pencil" size={20} color={colors.icon} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onDelete(category.id)}
          hitSlop={Spacing.s}
          accessibilityRole="button"
          accessibilityLabel={`Eliminar ${category.name}`}
        >
          <IconSymbol name="trash" size={20} color={colors.error} />
        </TouchableOpacity>
      </View>
    </GlassSurface>
  );
}

const styles = StyleSheet.create({
  /** Layout de la fila, común a la variante con cristal y a la plana. */
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: Spacing.m,
    paddingVertical: Spacing.sm,
  },
  /** Separación de la fila **sin** cristal; con `GlassView` la pone el material. */
  flatRow: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  name: {
    flex: 1,
  },
  actions: {
    flexDirection: "row",
    gap: Spacing.l,
  },
});
