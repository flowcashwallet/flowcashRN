import { GlassSurface } from "@/components/atoms/GlassSurface";
import { Typography } from "@/components/atoms/Typography";
import { BorderRadius, Spacing } from "@/constants/theme";
import React from "react";
import { StyleSheet, View } from "react-native";
import { DashboardCard } from "./DashboardCard";
import { AnomalousMovement, DashboardColors } from "./types";

interface AnomalousMovementsSectionProps {
  colors: DashboardColors;
  movements: AnomalousMovement[];
  formatWeeklyValue: (value: number) => string;
}

/**
 * Los tres movimientos que más se salen del comportamiento habitual.
 *
 * Que un movimiento sea atípico no lo hace un fallo: el importe sigue la regla
 * del signo (`success` ingreso / `expense` gasto), y la señal de "esto es raro"
 * la da el contexto de la card, no el color del número.
 *
 * La caja de cada movimiento pide cristal con `forceGlass` pese a estar dentro
 * de la card: son como mucho tres elementos destacados —el contenido entero de
 * la sección—, no una lista larga repetida, y planos se leían como cajas
 * blancas sobre el cristal (retrofit 2026-09-02).
 */
export function AnomalousMovementsSection({
  colors,
  movements,
  formatWeeklyValue,
}: AnomalousMovementsSectionProps) {
  return (
    <DashboardCard>
      <Typography variant="subheading" style={styles.title}>
        Top 3 movimientos atipicos
      </Typography>
      <Typography variant="caption" muted style={styles.help}>
        Movimientos del mes seleccionado evaluados contra el comportamiento del
        ano en su categoria y tipo
      </Typography>

      {movements.length === 0 ? (
        <Typography variant="bodySmall" muted>
          No se detectaron movimientos atipicos del mes frente al baseline
          anual.
        </Typography>
      ) : (
        <View style={styles.list}>
          {movements.map((movement) => {
            const isIncome = movement.type === "income";
            return (
              <GlassSurface
                key={movement.id}
                forceGlass
                style={styles.movement}
                fallbackStyle={[
                  styles.flatMovement,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View style={styles.movementHeader}>
                  <Typography
                    variant="bodySmall"
                    weight="semibold"
                    style={styles.movementName}
                    numberOfLines={1}
                  >
                    {movement.description || movement.category}
                  </Typography>
                  <Typography
                    variant="number"
                    style={{
                      color: isIncome ? colors.success : colors.expense,
                    }}
                  >
                    {isIncome ? "+" : "−"}
                    {formatWeeklyValue(movement.amount)}
                  </Typography>
                </View>
                <Typography variant="caption" muted style={styles.movementMeta}>
                  {movement.category} • Esperado:{" "}
                  {formatWeeklyValue(movement.expected)} • z=
                  {movement.zScore.toFixed(1)}
                </Typography>
              </GlassSurface>
            );
          })}
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
  /** Layout de la caja de movimiento, con y sin cristal. */
  movement: {
    borderRadius: BorderRadius.m,
    padding: Spacing.sm,
    overflow: "hidden",
  },
  /** Fondo opaco + hairline: solo cuando no hay cristal. */
  flatMovement: {
    borderWidth: StyleSheet.hairlineWidth,
  },
  movementHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: Spacing.s,
  },
  movementName: {
    flex: 1,
  },
  movementMeta: {
    marginTop: Spacing.xs,
  },
});
