import React from "react";
import { Text, View } from "react-native";
import { AnomalousMovement, DashboardColors } from "./types";

interface AnomalousMovementsSectionProps {
  colors: DashboardColors;
  movements: AnomalousMovement[];
  formatWeeklyValue: (value: number) => string;
}

export function AnomalousMovementsSection({
  colors,
  movements,
  formatWeeklyValue,
}: AnomalousMovementsSectionProps) {
  return (
    <View
      style={{
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
      }}
    >
      <Text
        style={{
          fontSize: 16,
          fontWeight: "700",
          marginBottom: 12,
          color: colors.text,
        }}
      >
        Top 3 movimientos atipicos
      </Text>
      <Text
        style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 10 }}
      >
        Movimientos del mes seleccionado evaluados contra el comportamiento del
        ano en su categoria y tipo
      </Text>

      {movements.length === 0 ? (
        <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
          No se detectaron movimientos atipicos del mes frente al baseline
          anual.
        </Text>
      ) : (
        <View style={{ gap: 10 }}>
          {movements.map((movement) => (
            <View
              key={movement.id}
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 12,
                padding: 10,
                backgroundColor: colors.surface,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <Text
                  style={{
                    color: colors.text,
                    fontSize: 13,
                    fontWeight: "700",
                    flex: 1,
                    paddingRight: 8,
                  }}
                  numberOfLines={1}
                >
                  {movement.description || movement.category}
                </Text>
                <Text
                  style={{
                    color:
                      movement.type === "income"
                        ? colors.success
                        : colors.error,
                    fontSize: 13,
                    fontWeight: "700",
                  }}
                >
                  {movement.type === "income" ? "+" : "-"}
                  {formatWeeklyValue(movement.amount)}
                </Text>
              </View>
              <Text
                style={{
                  color: colors.textSecondary,
                  fontSize: 12,
                  marginTop: 4,
                }}
              >
                {movement.category} • Esperado:{" "}
                {formatWeeklyValue(movement.expected)} • z=
                {movement.zScore.toFixed(1)}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
