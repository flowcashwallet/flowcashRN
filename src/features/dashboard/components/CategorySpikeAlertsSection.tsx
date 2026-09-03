import { GlassSurface } from "@/components/atoms/GlassSurface";
import { Typography } from "@/components/atoms/Typography";
import { BorderRadius, Spacing } from "@/constants/theme";
import React from "react";
import { StyleSheet, View } from "react-native";
import { DashboardCard } from "./DashboardCard";
import { CategorySpikeAlert, DashboardColors } from "./types";

interface CategorySpikeAlertsSectionProps {
  colors: DashboardColors;
  periodView: "month" | "year";
  alerts: CategorySpikeAlert[];
  formatWeeklyValue: (value: number) => string;
}

/**
 * Categorías que se dispararon frente al promedio del año.
 *
 * El porcentaje va en `warning`, no en `error`: es una advertencia real sobre el
 * dato —"esto subió"— pero nada ha fallado. `error` sigue reservado para
 * sobregiro / vencido / fallo, según la tabla de paleta del plan.
 *
 * La caja de cada alerta vive **dentro** de la card, que en iOS 26+ ya es
 * cristal, así que el guard de anidamiento la aplanaría. Aquí se pide cristal
 * igual con `forceGlass`: no es una lista de contenido repetido sino el
 * elemento destacado de la sección — es literalmente lo único que la card
 * enseña, y plano se leía como una caja blanca pegada encima del cristal
 * (retrofit 2026-09-02, pedido tras verlo en dispositivo).
 */
export function CategorySpikeAlertsSection({
  colors,
  periodView,
  alerts,
  formatWeeklyValue,
}: CategorySpikeAlertsSectionProps) {
  return (
    <DashboardCard>
      <Typography variant="subheading" style={styles.title}>
        Alertas de categorias en alza
      </Typography>
      <Typography variant="caption" muted style={styles.help}>
        Mes seleccionado con +30% o mas vs promedio de los otros meses del ano
        seleccionado
      </Typography>

      {periodView !== "month" ? (
        <Typography variant="bodySmall" muted>
          Cambia a vista mensual para comparar el mes seleccionado contra el
          resto del ano.
        </Typography>
      ) : alerts.length === 0 ? (
        <Typography variant="bodySmall" muted>
          Sin categorias con aumento significativo frente al promedio anual
          restante.
        </Typography>
      ) : (
        <View style={styles.list}>
          {alerts.map((alert) => (
            <GlassSurface
              key={`${alert.weekLabel}-${alert.category}`}
              forceGlass
              style={styles.alert}
              fallbackStyle={[
                styles.flatAlert,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={styles.alertHeader}>
                <Typography
                  variant="bodySmall"
                  weight="semibold"
                  style={styles.alertCategory}
                  numberOfLines={1}
                >
                  {alert.category}
                </Typography>
                <Typography variant="number" style={{ color: colors.warning }}>
                  +{alert.increasePct.toFixed(0)}%
                </Typography>
              </View>
              <Typography variant="caption" muted style={styles.alertDetail}>
                Mes actual: {formatWeeklyValue(alert.currentAmount)} vs Promedio
                anual restante: {formatWeeklyValue(alert.averageAmount)}
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
  list: {
    gap: Spacing.s,
  },
  /** Layout de la caja de alerta, con y sin cristal. */
  alert: {
    borderRadius: BorderRadius.m,
    padding: Spacing.sm,
    overflow: "hidden",
  },
  /** Fondo opaco + hairline: solo cuando no hay cristal. */
  flatAlert: {
    borderWidth: StyleSheet.hairlineWidth,
  },
  alertHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: Spacing.s,
  },
  alertCategory: {
    flex: 1,
  },
  alertDetail: {
    marginTop: Spacing.xs,
  },
});
