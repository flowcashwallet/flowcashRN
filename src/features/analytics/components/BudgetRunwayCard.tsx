import { Card } from "@/components/atoms/Card";
import { Typography } from "@/components/atoms/Typography";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import React from "react";
import { ActivityIndicator, View } from "react-native";
import { useForecasting } from "../hooks/useForecasting";

export function BudgetRunwayCard() {
  const { forecast, loading } = useForecasting();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  if (loading)
    return (
      <Card variant="elevated" style={{ marginBottom: 16, padding: 16 }}>
        <ActivityIndicator size="small" color={colors.primary} />
      </Card>
    );

  if (!forecast || !forecast.has_budget) return null;

  const getStatusColor = () => {
    switch (forecast.status) {
      case "danger":
        return colors.error;
      case "warning":
        return "#F59E0B"; // Amber
      case "safe":
        return colors.success;
      default:
        return colors.text;
    }
  };

  const getIcon = () => {
    switch (forecast.status) {
      case "danger":
        return "exclamationmark.triangle.fill";
      case "warning":
        return "clock.fill";
      case "safe":
        return "checkmark.shield.fill";
      default:
        return "chart.bar.fill";
    }
  };

  return (
    <Card
      variant="elevated"
      style={{
        marginBottom: 16,
        borderLeftWidth: 4,
        borderLeftColor: getStatusColor(),
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
        <IconSymbol name={getIcon()} size={28} color={getStatusColor()} />
        <View style={{ flex: 1 }}>
          <Typography variant="h3" weight="bold" style={{ marginBottom: 4 }}>
            Predicción de Flujo
          </Typography>
          <Typography variant="body" style={{ color: colors.textSecondary }}>
            {forecast.message}
          </Typography>

          {forecast.forecast_date && (
            <View
              style={{
                marginTop: 8,
                padding: 8,
                backgroundColor: colors.background,
                borderRadius: 8,
              }}
            >
              <Typography
                variant="caption"
                weight="medium"
                style={{ color: colors.textSecondary }}
              >
                Fecha estimada de agotamiento:
              </Typography>
              <Typography
                variant="h3"
                weight="bold"
                style={{ color: getStatusColor() }}
              >
                {forecast.forecast_date}
              </Typography>
            </View>
          )}
        </View>
      </View>
    </Card>
  );
}
