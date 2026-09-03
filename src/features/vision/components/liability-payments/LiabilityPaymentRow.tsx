import { GlassSurface } from "@/components/atoms/GlassSurface";
import { Typography } from "@/components/atoms/Typography";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { BorderRadius, Spacing } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";
import { LiabilityPaymentDisplayRow } from "@/features/vision/hooks/useLiabilityPaymentsManagementScreen";
import { formatCurrency } from "@/utils/format";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";

interface LiabilityPaymentRowProps {
  item: LiabilityPaymentDisplayRow;
  onPress: (id: string) => void;
  onTogglePress: (item: LiabilityPaymentDisplayRow) => void;
}

/**
 * Fila de pasivo de la pantalla de gestión de pagos.
 *
 * Misma fila del libro contable que `TransactionItem` (pedido explícito del
 * usuario: los items de Vision se ven como los de `WalletScreen`): superficie
 * de `GlassSurface` —Liquid Glass nativo en iOS 26+, fila plana con hairline en
 * el resto—, copy en `body`/`caption muted` a la izquierda e importe en
 * `variant="number"` (tabular, alineado a la derecha) a la derecha.
 *
 * Antes era una `Card` `elevated`, es decir una card con sombra `#000`: una card
 * es para un *resumen*, una fila es para un *elemento de lista*.
 *
 * El importe pagado va en `success` cuando hay pago: es dinero que **entra** al
 * pasivo y reduce la deuda, el mismo criterio con el que `EntityDetailModal`
 * pinta una transferencia hacia la entidad. Sin pago, `textSecondary` — no hay
 * cifra que celebrar ni error que señalar.
 */
export const LiabilityPaymentRow: React.FC<LiabilityPaymentRowProps> = ({
  item,
  onPress,
  onTogglePress,
}) => {
  const { colors } = useTheme();

  const amountColor =
    item.amountPaid > 0 ? colors.success : colors.textSecondary;

  return (
    <Pressable onPress={() => onPress(item.id)}>
      <GlassSurface
        style={styles.row}
        isInteractive
        fallbackStyle={[
          styles.flatRow,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <View style={styles.info}>
          <Typography variant="body" weight="semibold" numberOfLines={1}>
            {item.name}
          </Typography>
          <Typography variant="caption" muted>
            {item.statusText}
          </Typography>
          {item.dueDateLabel !== null && (
            <Typography variant="caption" muted>
              Vence: {item.dueDateLabel}
            </Typography>
          )}
        </View>

        <View style={styles.amounts}>
          <Typography variant="number" style={{ color: amountColor }}>
            {formatCurrency(item.amountPaid)}
          </Typography>
          {item.minimumPayment !== null && (
            <Typography variant="caption" muted>
              Límite: {formatCurrency(item.minimumPayment)}
            </Typography>
          )}
        </View>

        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            onTogglePress(item);
          }}
          hitSlop={Spacing.s}
          accessibilityRole="button"
          accessibilityLabel={item.statusText}
          style={styles.toggle}
        >
          <IconSymbol
            name={item.statusIcon}
            size={24}
            color={item.statusColor}
          />
        </Pressable>
      </GlassSurface>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  /** Layout de la fila, común a la variante con cristal y a la plana. */
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.m,
    borderRadius: BorderRadius.l,
    overflow: "hidden",
  },
  /** Fondo opaco + hairline: solo cuando no hay cristal. */
  flatRow: {
    borderWidth: StyleSheet.hairlineWidth,
  },
  info: {
    flex: 1,
  },
  amounts: {
    alignItems: "flex-end",
  },
  toggle: {
    justifyContent: "center",
  },
});
