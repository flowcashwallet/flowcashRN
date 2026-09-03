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
 * Igual heurística que `categoryIcon()` de `CategoryCard.tsx` (Analytics):
 * las categorías son texto libre, sin campo de icono en el modelo, así que
 * esto es un match de palabras clave sobre nombres comunes en español. Sin
 * match, cae a `tag.fill`.
 */
function categoryIcon(name: string) {
  const n = name.toLowerCase();
  if (/comida|restaurante|super|almuerzo|cena/.test(n)) return "fork.knife";
  if (/transporte|auto|carro|gasolina|uber|taxi/.test(n)) return "car.fill";
  if (/vivienda|renta|casa|hogar|alquiler/.test(n)) return "house.fill";
  if (/salud|médic|medic|farmacia|doctor/.test(n)) return "cross.case.fill";
  if (/entretenimiento|ocio|diversión|cine/.test(n)) return "sparkles";
  if (/educación|escuela|curso|universidad/.test(n)) return "book.fill";
  if (/servicios|luz|agua|internet|teléfono|telefono/.test(n))
    return "bolt.fill";
  if (/compras|ropa|tienda/.test(n)) return "bag.fill";
  return "tag.fill";
}

/**
 * La card de categoría de la pantalla "Todas las categorías".
 *
 * Equivalente de `CategoryCard` de Analytics, mismo tratamiento y misma
 * fecha de ajuste: pedido explícito del usuario de que se lea como
 * `TransactionItem`/`VisionEntityList` — píldora (`BorderRadius.round`) con
 * disco de icono en `surfaceHighlight`, fondo `colors.background` en el
 * fallback plano. Los movimientos desplegados siguen siendo superficies
 * propias con `forceGlass`, en `BorderRadius.m`.
 */
export const StatisticsCategoryCard: React.FC<StatisticsCategoryCardProps> = ({
  colors,
  category,
  isExpanded,
  onPress,
}) => {
  return (
    <View>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        accessibilityRole="button"
      >
        <GlassSurface
          style={styles.row}
          isInteractive
          fallbackStyle={[
            styles.flatRow,
            {
              backgroundColor: colors.background,
              borderBottomColor: colors.border,
            },
          ]}
        >
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: colors.surfaceHighlight },
            ]}
          >
            <IconSymbol
              name={categoryIcon(category.category)}
              size={20}
              color={colors.icon}
            />
          </View>

          <View style={styles.categoryInfo}>
            <Typography variant="body" weight="semibold" numberOfLines={1}>
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
        </GlassSurface>
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.categoryDetails}>
          {category.transactions && category.transactions.length > 0 ? (
            category.transactions.map((tx) => (
              <GlassSurface
                key={tx.id}
                forceGlass
                style={styles.transactionRow}
                fallbackStyle={[
                  styles.flatTransactionRow,
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
    </View>
  );
};

const styles = StyleSheet.create({
  /** Layout de la fila colapsada, común a la variante con cristal y a la plana. */
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.s,
    borderRadius: BorderRadius.round,
    overflow: "hidden",
  },
  /**
   * Fondo de la fila **sin** cristal: opaco y del color del lienzo, igual
   * convención que `TransactionItem`/`VisionEntityList`.
   */
  flatRow: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.round,
    justifyContent: "center",
    alignItems: "center",
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
  flatTransactionRow: {
    borderWidth: StyleSheet.hairlineWidth,
  },
  transactionInfo: {
    flex: 1,
  },
});
