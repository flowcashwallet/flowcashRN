import { GlassSurface } from "@/components/atoms/GlassSurface";
import { Typography } from "@/components/atoms/Typography";
import { BorderRadius, Spacing } from "@/constants/theme";
import React from "react";
import { StyleSheet, View } from "react-native";
import { DashboardCard } from "./DashboardCard";
import { DashboardColors, UpcomingFixedPaymentsSummary } from "./types";

interface UpcomingFixedPaymentsSectionProps {
  colors: DashboardColors;
  data: UpcomingFixedPaymentsSummary;
  formatWeeklyValue: (value: number) => string;
}

/**
 * Recurrentes de gasto de los próximos 30 días y su impacto en el balance.
 *
 * Aquí sí aparece `error`, y es el único sitio del dashboard donde está
 * justificado: un balance proyectado negativo **tras** los fijos es un
 * sobregiro que va a pasar, no un gasto normal. El total de los pagos, en
 * cambio, es un importe de gasto corriente y va en `expense`.
 *
 * El panel de totales y la caja de cada pago piden cristal con `forceGlass`
 * aunque estén dentro de la card: son los bloques destacados de la sección —el
 * resumen es único, y los pagos próximos son un puñado corto—, y planos se
 * leían como cajas blancas pegadas sobre el cristal (retrofit 2026-09-02).
 */
export function UpcomingFixedPaymentsSection({
  colors,
  data,
  formatWeeklyValue,
}: UpcomingFixedPaymentsSectionProps) {
  const willOverdraw = data.expectedBalanceAfterFixed < 0;

  return (
    <DashboardCard>
      <Typography variant="subheading" style={styles.title}>
        Pagos fijos proximos (30 dias)
      </Typography>
      <Typography variant="caption" muted style={styles.help}>
        Proyeccion de recurrentes de gasto en los proximos 30 dias e impacto
        estimado en el balance actual
      </Typography>

      <GlassSurface
        forceGlass
        style={styles.summary}
        fallbackStyle={[
          styles.flatBox,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <View style={styles.summaryRow}>
          <Typography variant="caption" muted>
            Total pagos fijos
          </Typography>
          <Typography variant="number" style={{ color: colors.expense }}>
            −{formatWeeklyValue(data.total)}
          </Typography>
        </View>
        <View style={styles.summaryRow}>
          <Typography variant="caption" muted>
            Balance estimado tras fijos
          </Typography>
          <Typography
            variant="number"
            style={{ color: willOverdraw ? colors.error : colors.success }}
          >
            {(willOverdraw ? "" : "+") +
              formatWeeklyValue(data.expectedBalanceAfterFixed)}
          </Typography>
        </View>
      </GlassSurface>

      {data.items.length === 0 ? (
        <Typography variant="bodySmall" muted>
          No hay pagos fijos recurrentes en los proximos 30 dias.
        </Typography>
      ) : (
        <View style={styles.list}>
          {data.items.map((item) => (
            <GlassSurface
              key={item.key}
              forceGlass
              style={styles.item}
              fallbackStyle={[
                styles.flatBox,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <View style={styles.itemHeader}>
                <Typography
                  variant="bodySmall"
                  weight="semibold"
                  style={styles.itemName}
                  numberOfLines={1}
                >
                  {item.description}
                </Typography>
                <Typography variant="number" style={{ color: colors.expense }}>
                  −{formatWeeklyValue(item.amount)}
                </Typography>
              </View>
              <Typography variant="caption" muted style={styles.itemMeta}>
                {item.category} •{" "}
                {item.dueDate.toLocaleDateString("es-MX", {
                  day: "2-digit",
                  month: "short",
                })}
              </Typography>
            </GlassSurface>
          ))}
        </View>
      )}
    </DashboardCard>
  );
}

const styles = StyleSheet.create({
  title: {
    marginBottom: Spacing.s,
  },
  help: {
    marginBottom: Spacing.sm,
  },
  /** Layout del panel de totales, con y sin cristal. */
  summary: {
    borderRadius: BorderRadius.m,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
    gap: Spacing.xs,
    overflow: "hidden",
  },
  /**
   * Fondo opaco + hairline del resumen y de cada pago: solo sin cristal. El
   * radio y el padding viven en `summary`/`item` porque aplican siempre.
   */
  flatBox: {
    borderWidth: StyleSheet.hairlineWidth,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: Spacing.s,
  },
  list: {
    gap: Spacing.s,
  },
  item: {
    borderRadius: BorderRadius.m,
    padding: Spacing.sm,
    overflow: "hidden",
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: Spacing.s,
  },
  itemName: {
    flex: 1,
  },
  itemMeta: {
    marginTop: Spacing.xs,
  },
});
