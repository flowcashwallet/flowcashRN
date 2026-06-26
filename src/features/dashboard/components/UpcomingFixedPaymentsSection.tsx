import { GlassCard } from "@/components/atoms/GlassCard";
import React from "react";
import { Text, View } from "react-native";
import { DashboardColors, UpcomingFixedPaymentsSummary } from "./types";

interface UpcomingFixedPaymentsSectionProps {
  colors: DashboardColors;
  data: UpcomingFixedPaymentsSummary;
  formatWeeklyValue: (value: number) => string;
}

export function UpcomingFixedPaymentsSection({
  colors,
  data,
  formatWeeklyValue,
}: UpcomingFixedPaymentsSectionProps) {
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
        Pagos fijos proximos (30 dias)
      </Text>
      <Text
        style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 10 }}
      >
        Proyeccion de recurrentes de gasto en los proximos 30 dias e impacto
        estimado en el balance actual
      </Text>

      <View
        style={{
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 12,
          padding: 10,
          backgroundColor: colors.surface,
          marginBottom: 10,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginBottom: 6,
          }}
        >
          <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
            Total pagos fijos
          </Text>
          <Text
            style={{ color: colors.error, fontSize: 12, fontWeight: "700" }}
          >
            -{formatWeeklyValue(data.total)}
          </Text>
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
            Balance estimado tras fijos
          </Text>
          <Text
            style={{
              color:
                data.expectedBalanceAfterFixed >= 0
                  ? colors.success
                  : colors.error,
              fontSize: 12,
              fontWeight: "700",
            }}
          >
            {(data.expectedBalanceAfterFixed >= 0 ? "+" : "") +
              formatWeeklyValue(data.expectedBalanceAfterFixed)}
          </Text>
        </View>
      </View>

      {data.items.length === 0 ? (
        <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
          No hay pagos fijos recurrentes en los proximos 30 dias.
        </Text>
      ) : (
        <View style={{ gap: 10 }}>
          {data.items.map((item) => (
            <View
              key={item.key}
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
                  {item.description}
                </Text>
                <Text
                  style={{
                    color: colors.error,
                    fontSize: 13,
                    fontWeight: "700",
                  }}
                >
                  -{formatWeeklyValue(item.amount)}
                </Text>
              </View>
              <Text
                style={{
                  color: colors.textSecondary,
                  fontSize: 12,
                  marginTop: 4,
                }}
              >
                {item.category} •{" "}
                {item.dueDate.toLocaleDateString("es-MX", {
                  day: "2-digit",
                  month: "short",
                })}
              </Text>
            </View>
          ))}
        </View>
      )}
    </GlassCard>
  );
}
