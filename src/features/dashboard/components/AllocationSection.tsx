import { Typography } from "@/components/atoms/Typography";
import { BorderRadius, Spacing } from "@/constants/theme";
import STRINGS from "@/i18n/es.json";
import { formatCurrency } from "@/utils/format";
import React from "react";
import { StyleSheet, View } from "react-native";
import { PieChart } from "react-native-gifted-charts";
import { DashboardCard } from "./DashboardCard";
import { DashboardColors } from "./types";

interface AllocationItem {
  category: string;
  amount: number;
  percent: number;
  color: string;
}

interface PieItem {
  value: number;
  color: string;
}

interface AllocationSectionProps {
  colors: DashboardColors;
  periodView: "month" | "year";
  expense: number;
  allocationBreakdown: AllocationItem[];
  pieData: PieItem[];
}

/** Diámetros del donut, fijos: son geometría del gráfico, no espaciado. */
const DONUT_RADIUS = 90;
const DONUT_INNER_RADIUS = 70;
/** Punto de color de la leyenda. */
const LEGEND_DOT = 8;

/**
 * Reparto del gasto por categoría.
 *
 * El color de cada porción viene de `PIE_PALETTE` (constante del hook): es
 * codificación de categoría en un gráfico, el único sitio donde el color no
 * significa estado. El total del centro va en `expense` porque es, justamente,
 * la suma de lo que salió.
 *
 * La leyenda **no** lleva cristal, y no por la excepción de "contenido
 * repetido" (retirada el 2026-09-02): sus filas nunca han tenido superficie
 * propia — son punto de color + etiqueta + porcentaje, anotación del gráfico, no
 * bloques con fondo. La regla vigente es "toda superficie propia lleva cristal";
 * aquí no hay superficie que vidriar. Convertirlas en superficies sería
 * inventarles una que no tienen y romper la lectura del donut.
 */
export function AllocationSection({
  colors,
  periodView,
  expense,
  allocationBreakdown,
  pieData,
}: AllocationSectionProps) {
  return (
    <DashboardCard>
      <Typography variant="subheading" style={styles.title}>
        {periodView === "year"
          ? STRINGS.dashboard.yearlyAllocation
          : STRINGS.dashboard.monthlyAllocation}
      </Typography>

      <View style={styles.chart}>
        <PieChart
          donut
          innerRadius={DONUT_INNER_RADIUS}
          radius={DONUT_RADIUS}
          data={
            pieData.length > 0
              ? pieData
              : [{ value: 100, color: colors.border }]
          }
          centerLabelComponent={() => (
            <View style={styles.center}>
              <Typography variant="overline" muted>
                {STRINGS.dashboard.total}
              </Typography>
              <Typography
                variant="heading"
                style={{ color: colors.expense }}
                numberOfLines={1}
              >
                {formatCurrency(expense)}
              </Typography>
            </View>
          )}
        />
      </View>

      {allocationBreakdown.length > 0 ? (
        <View style={styles.legend}>
          {allocationBreakdown.map((c) => (
            <View key={c.category} style={styles.legendRow}>
              <View style={styles.legendLabel}>
                <View style={[styles.dot, { backgroundColor: c.color }]} />
                <Typography variant="bodySmall" muted numberOfLines={1}>
                  {c.category}
                </Typography>
              </View>
              <Typography variant="number">
                {Math.round(c.percent * 100)}%
              </Typography>
            </View>
          ))}
        </View>
      ) : (
        <Typography variant="bodySmall" muted>
          No hay gastos en este mes.
        </Typography>
      )}
    </DashboardCard>
  );
}

const styles = StyleSheet.create({
  title: {
    marginBottom: Spacing.sm,
  },
  chart: {
    alignItems: "center",
    marginBottom: Spacing.l,
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
  },
  legend: {
    gap: Spacing.sm,
  },
  legendRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: Spacing.s,
  },
  legendLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flex: 1,
  },
  dot: {
    width: LEGEND_DOT,
    height: LEGEND_DOT,
    borderRadius: BorderRadius.round,
  },
});
