import { GlassSurface } from "@/components/atoms/GlassSurface";
import { Typography } from "@/components/atoms/Typography";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { BorderRadius, Spacing, ThemeColors } from "@/constants/theme";
import { CategoryInsight } from "@/features/analytics/utils/analyticsUtils";
import { formatCurrency } from "@/utils/format";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

interface StatisticsCategoryCardProps {
  colors: ThemeColors;
  category: CategoryInsight;
  isExpanded: boolean;
  onPress: () => void;
}

/**
 * La card de categoría de la pantalla "Todas las categorías".
 *
 * Pase visual 2026-09-02: era `Card variant="outlined"`. Se retira en favor de
 * `GlassSurface` directamente — desde que el cristal pasó a ser el default de
 * toda superficie propia, `Card` dejó de ser la forma en la que se pinta
 * contenido con superficie en esta app (sigue viva en auth/budget/vision, que
 * aún no han tenido su pase). Los movimientos desplegados son superficies
 * propias con `forceGlass`, igual que en `CategoryCard` de Analytics.
 */
export const StatisticsCategoryCard: React.FC<StatisticsCategoryCardProps> = ({
  colors,
  category,
  isExpanded,
  onPress,
}) => {
  return (
    <GlassSurface
      style={styles.categoryCard}
      fallbackStyle={[
        styles.flatCard,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <TouchableOpacity
        style={styles.categoryHeader}
        onPress={onPress}
        accessibilityRole="button"
      >
        <View style={styles.categoryInfo}>
          <Typography variant="body" weight="semibold">
            {category.category}
          </Typography>
          <Typography variant="caption" muted>
            {category.percentage.toFixed(1)}%
          </Typography>
        </View>
        <View style={styles.categoryAmountContainer}>
          <Typography variant="number" style={{ color: colors.expense }}>
            −{formatCurrency(category.totalAmount)}
          </Typography>
          <IconSymbol
            name={isExpanded ? "chevron.up" : "chevron.down"}
            size={16}
            color={colors.icon}
          />
        </View>
      </TouchableOpacity>

      {isExpanded && (
        <View
          style={[styles.categoryDetails, { borderTopColor: colors.border }]}
        >
          {category.transactions && category.transactions.length > 0 ? (
            category.transactions.map((tx) => (
              <GlassSurface
                key={tx.id}
                forceGlass
                style={styles.transactionRow}
                fallbackStyle={[
                  styles.flatRow,
                  {
                    backgroundColor: colors.surfaceHighlight,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View style={styles.transactionInfo}>
                  <Typography variant="bodySmall" numberOfLines={1}>
                    {tx.description}
                  </Typography>
                  <Typography variant="caption" muted>
                    {new Date(tx.date).toLocaleDateString()}
                  </Typography>
                </View>
                <Typography variant="number" style={{ color: colors.expense }}>
                  −{formatCurrency(tx.amount)}
                </Typography>
              </GlassSurface>
            ))
          ) : (
            <Typography variant="caption" muted>
              No hay transacciones en esta categoría.
            </Typography>
          )}
        </View>
      )}
    </GlassSurface>
  );
};

const styles = StyleSheet.create({
  /** Layout de la card, común a la variante con cristal y a la plana. */
  categoryCard: {
    padding: Spacing.m,
    borderRadius: BorderRadius.l,
    overflow: "hidden",
  },
  /** Fondo opaco + hairline: solo cuando no hay cristal. */
  flatCard: {
    borderWidth: StyleSheet.hairlineWidth,
  },
  categoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: Spacing.s,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryAmountContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.s,
  },
  categoryDetails: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: Spacing.s,
  },
  /** Layout de la fila desplegada, común a la variante con cristal y a la plana. */
  transactionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: Spacing.s,
    paddingVertical: Spacing.s,
    paddingHorizontal: Spacing.s,
    borderRadius: BorderRadius.m,
    overflow: "hidden",
  },
  /** Fondo opaco + hairline de la fila: solo cuando no hay cristal. */
  flatRow: {
    borderWidth: StyleSheet.hairlineWidth,
  },
  transactionInfo: {
    flex: 1,
  },
});
