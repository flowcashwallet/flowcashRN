import { GlassSurface } from "@/components/atoms/GlassSurface";
import { Typography } from "@/components/atoms/Typography";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { BorderRadius, Spacing, ThemeColors } from "@/constants/theme";
import { CategoryInsight } from "@/features/analytics/utils/analyticsUtils";
import { formatCurrency } from "@/utils/format";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

interface CategoryCardProps {
  colors: ThemeColors;
  category: CategoryInsight;
  isExpanded: boolean;
  onPress: () => void;
}

/**
 * Mapea el nombre de una categoría a un icono representativo. Las categorías
 * son texto libre (no hay campo de icono en el modelo), así que esto es una
 * heurística de palabras clave sobre nombres comunes en español, igual que
 * `entityIcon()` en `VisionEntityList.tsx`. Sin match, cae a `tag.fill`: un
 * icono de categoría genérico y neutro, no una adivinanza.
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
 * Una categoría del top del mes, con sus movimientos desplegables.
 *
 * Pase visual 2026-09-02: la card era `borderWidth: 1` **sin** `borderColor`
 * (el negro por defecto de RN sobre el fondo menta) y sin fondo. Pasó a
 * `GlassSurface` — cristal nativo en iOS 26+, `surface` + hairline sin él.
 *
 * Ajuste 2026-09-03 (pedido explícito del usuario: "quiero que esos items se
 * vean como los de VisionScreen y los de WalletScreen"): la fila colapsada
 * pasa a la misma píldora (`BorderRadius.round`) con disco de icono en
 * `surfaceHighlight` que usan `TransactionItem` (Wallet) y `VisionEntityList`
 * (Vision) — mismo alto de fila, mismo fondo `colors.background` en el
 * fallback plano (no es una card distinta, es una fila más sobre el lienzo).
 * Los movimientos desplegados debajo se quedan como superficies propias con
 * `forceGlass` sobre `surfaceHighlight`, en `BorderRadius.m`: una fila anidada
 * dentro de la familia de la píldora, no una píldora en sí misma.
 *
 * Todos los importes son gasto: `−` y `colors.expense`.
 */
export const CategoryCard: React.FC<CategoryCardProps> = ({
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

          <View style={styles.copy}>
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
            <Typography variant="caption" muted style={styles.emptyDetail}>
              No hay transacciones disponibles
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
   * convención que `TransactionItem`/`VisionEntityList` — el hairline y la
   * forma de píldora son lo que separa una fila de la siguiente, no una card.
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
  copy: {
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
  emptyDetail: {
    fontStyle: "italic",
  },
});
