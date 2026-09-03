import { GlassSurface } from "@/components/atoms/GlassSurface";
import { Typography } from "@/components/atoms/Typography";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { BorderRadius, Spacing } from "@/constants/theme";
import { Transaction } from "@/features/wallet/data/walletSlice";
import STRINGS from "@/i18n/es.json";
import { formatCurrency } from "@/utils/format";
import React from "react";
import { StyleSheet, View } from "react-native";
import { DashboardCard } from "./DashboardCard";
import { DashboardColors } from "./types";

interface RecentTransactionsSectionProps {
  colors: DashboardColors;
  transactions: Transaction[];
}

/**
 * Las últimas transacciones del periodo, dentro de la card de sección.
 *
 * Estas filas **no** son `TransactionItem` (esta sección pinta su propia lista,
 * sin swipe ni acciones), pero sí son filas del libro contable y desde el
 * retrofit del 2026-09-02 (tercera vuelta) son superficies propias: cada una
 * pide cristal con `forceGlass` dentro de la card. Antes se separaban con
 * hairline y se quedaban planas por la excepción "el contenido repetido no
 * lleva cristal", que se retiró — el mismo movimiento se ve de cristal suelto en
 * `WalletScreen`, así que no tenía sentido que aquí fuera una línea plana.
 * Ahora la separación la da el `gap` entre superficies, no el hairline.
 *
 * Sin cristal —Android/web, iOS sin la API, "reducir transparencia"— la fila
 * cae a `surfaceHighlight` + hairline: el escalón de superficie *dentro* de la
 * card, que ya es `surface`.
 *
 * El importe sigue la regla del signo: `success` para ingreso y `expense` para
 * gasto (antes el gasto iba en `colors.text`, que la regla prohíbe
 * explícitamente).
 */
export function RecentTransactionsSection({
  colors,
  transactions,
}: RecentTransactionsSectionProps) {
  return (
    <DashboardCard>
      <Typography variant="subheading" style={styles.title}>
        {STRINGS.dashboard.recentTransactions}
      </Typography>

      <View style={styles.list}>
        {transactions.map((tx) => {
          const isIncome = tx.type === "income";
          const dateStr = new Date(tx.date).toLocaleDateString("es-MX", {
            day: "2-digit",
            month: "short",
          });
          return (
            <GlassSurface
              key={tx.id}
              forceGlass
              style={styles.row}
              fallbackStyle={[
                styles.flatRow,
                {
                  backgroundColor: colors.surfaceHighlight,
                  borderColor: colors.border,
                },
              ]}
            >
              <View
                style={[styles.icon, { backgroundColor: colors.surface }]}
              >
                <IconSymbol
                  name={isIncome ? "arrow.down.left" : "arrow.up.right"}
                  size={20}
                  color={isIncome ? colors.success : colors.icon}
                />
              </View>

              <View style={styles.copy}>
                <Typography variant="body" weight="semibold" numberOfLines={1}>
                  {tx.description}
                </Typography>
                <Typography variant="caption" muted numberOfLines={1}>
                  {(tx.category || STRINGS.dashboard.uncategorized) +
                    " • " +
                    dateStr}
                </Typography>
              </View>

              <Typography
                variant="number"
                style={{ color: isIncome ? colors.success : colors.expense }}
              >
                {(isIncome ? "+" : "−") + formatCurrency(tx.amount)}
              </Typography>
            </GlassSurface>
          );
        })}
      </View>
    </DashboardCard>
  );
}

const styles = StyleSheet.create({
  title: {
    marginBottom: Spacing.s,
  },
  /** La separación entre filas la da el `gap`, ya no un hairline por fila. */
  list: {
    gap: Spacing.s,
  },
  /** Layout de la fila, común a la variante con cristal y a la plana. */
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.s,
    borderRadius: BorderRadius.m,
    overflow: "hidden",
  },
  /** Fondo opaco + hairline: solo cuando no hay cristal. */
  flatRow: {
    borderWidth: StyleSheet.hairlineWidth,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.round,
    alignItems: "center",
    justifyContent: "center",
  },
  copy: {
    flex: 1,
  },
});
