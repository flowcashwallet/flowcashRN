import { GlassSurface } from "@/components/atoms/GlassSurface";
import { Typography } from "@/components/atoms/Typography";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { BorderRadius, Spacing } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";
import { MonthPaymentDisplay } from "@/features/vision/hooks/useLiabilityPaymentsScreen";
import { formatCurrency } from "@/utils/format";
import React from "react";
import { StyleSheet, View } from "react-native";

interface MonthPaymentRowProps {
  item: MonthPaymentDisplay;
  minimumPayment: number | null;
}

/**
 * Fila de un mes en el calendario de pagos de un pasivo.
 *
 * Misma fila del libro contable que `TransactionItem` (pedido explícito del
 * usuario: los items de Vision se ven como los de `WalletScreen`): superficie de
 * `GlassSurface` con fallback plano + hairline, copy en `body`/`caption muted` e
 * importe en `variant="number"`. Antes era una `Card` `elevated` con sombra
 * `#000`.
 *
 * El importe pagado va en `success` cuando lo hay —es dinero que entra al pasivo
 * y baja la deuda— y en `textSecondary` cuando el mes no tiene pago. `error` no
 * aparece: un mes sin pago todavía no es un fallo, y la dirección estética lo
 * reserva para eso.
 */
export const MonthPaymentRow: React.FC<MonthPaymentRowProps> = ({
  item,
  minimumPayment,
}) => {
  const { colors } = useTheme();

  const amountColor =
    item.amountPaid > 0 ? colors.success : colors.textSecondary;

  return (
    <GlassSurface
      style={styles.row}
      fallbackStyle={[
        styles.flatRow,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <View style={styles.info}>
        <Typography variant="body" weight="semibold">
          {item.monthLabel}
        </Typography>
        <Typography variant="caption" muted>
          {item.statusLabel}
        </Typography>
        {minimumPayment ? (
          <Typography variant="caption" muted>
            Mínimo: {formatCurrency(minimumPayment)}
          </Typography>
        ) : null}
      </View>

      <View style={styles.amount}>
        <Typography variant="number" style={{ color: amountColor }}>
          {formatCurrency(item.amountPaid)}
        </Typography>
        {item.showCheck && (
          <IconSymbol
            name="checkmark.circle.fill"
            size={20}
            color={colors.success}
          />
        )}
      </View>
    </GlassSurface>
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
  amount: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.s,
  },
});
