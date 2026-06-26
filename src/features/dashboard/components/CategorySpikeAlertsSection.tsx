import { GlassCard } from "@/components/atoms/GlassCard";
import React from "react";
import { Text, View } from "react-native";
import { CategorySpikeAlert, DashboardColors } from "./types";

interface CategorySpikeAlertsSectionProps {
  colors: DashboardColors;
  periodView: "month" | "year";
  alerts: CategorySpikeAlert[];
  formatWeeklyValue: (value: number) => string;
}

export function CategorySpikeAlertsSection({
  colors,
  periodView,
  alerts,
  formatWeeklyValue,
}: CategorySpikeAlertsSectionProps) {
  return (
    <GlassCard
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
        Alertas de categorias en alza
      </Text>
      <Text
        style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 10 }}
      >
        Mes seleccionado con +30% o mas vs promedio de los otros meses del ano
        seleccionado
      </Text>

      {periodView !== "month" ? (
        <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
          Cambia a vista mensual para comparar el mes seleccionado contra el
          resto del ano.
        </Text>
      ) : alerts.length === 0 ? (
        <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
          Sin categorias con aumento significativo frente al promedio anual
          restante.
        </Text>
      ) : (
        <View style={{ gap: 10 }}>
          {alerts.map((alert) => (
            <View
              key={`${alert.weekLabel}-${alert.category}`}
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
                  }}
                  numberOfLines={1}
                >
                  {alert.category}
                </Text>
                <Text
                  style={{
                    color: colors.error,
                    fontSize: 13,
                    fontWeight: "700",
                  }}
                >
                  +{alert.increasePct.toFixed(0)}%
                </Text>
              </View>
              <Text
                style={{
                  color: colors.textSecondary,
                  fontSize: 12,
                  marginTop: 4,
                }}
              >
                Mes actual: {formatWeeklyValue(alert.currentAmount)} vs Promedio
                anual restante: {formatWeeklyValue(alert.averageAmount)}
              </Text>
            </View>
          ))}
        </View>
      )}
    </GlassCard>
  );
}
