import { Typography } from "@/components/atoms/Typography";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { BorderRadius, Colors, Spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { formatCurrency } from "@/utils/format";
import React from "react";
import { StyleSheet, View } from "react-native";
import { Forecast } from "../data/walletSlice";

interface ForecastCardProps {
  forecast: Forecast | null;
}

export const ForecastCard: React.FC<ForecastCardProps> = ({ forecast }) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  if (!forecast) return null;

  const getStatusColor = () => {
    switch (forecast.status) {
      case "danger":
        return colors.error;
      case "warning":
        return colors.warning;
      case "safe":
        return colors.success;
      default:
        return colors.text;
    }
  };

  const getStatusIcon = () => {
    switch (forecast.status) {
      case "danger":
        return "exclamationmark.triangle.fill";
      case "warning":
        return "exclamationmark.circle.fill";
      case "safe":
        return "checkmark.circle.fill";
      default:
        return "info.circle.fill";
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: getStatusColor(),
          borderWidth: 1,
          borderLeftWidth: 4, // Emphasis on the status color
        },
      ]}
    >
      <View style={styles.header}>
        <IconSymbol name={getStatusIcon()} size={24} color={getStatusColor()} />
        <Typography
          variant="h3"
          weight="bold"
          style={{ color: colors.text, marginLeft: Spacing.s, flex: 1 }}
        >
          Predicción Mensual
        </Typography>
      </View>

      <Typography
        variant="body"
        style={{ color: colors.text, marginBottom: Spacing.m }}
      >
        {forecast.message}
      </Typography>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Typography variant="caption" style={{ color: colors.textSecondary }}>
            Gasto Diario Prom.
          </Typography>
          <Typography
            variant="body"
            weight="bold"
            style={{ color: colors.text }}
          >
            {formatCurrency(forecast.daily_burn_rate)}
          </Typography>
        </View>

        <View style={styles.stat}>
          <Typography variant="caption" style={{ color: colors.textSecondary }}>
            Proyección Fin de Mes
          </Typography>
          <Typography
            variant="body"
            weight="bold"
            style={{
              color:
                forecast.projected_balance >= 0 ? colors.success : colors.error,
            }}
          >
            {formatCurrency(forecast.projected_balance)}
          </Typography>
        </View>
      </View>

      {forecast.tip && (
        <View
          style={[
            styles.tipContainer,
            { backgroundColor: colors.surfaceHighlight },
          ]}
        >
          <Typography
            variant="caption"
            style={{ color: colors.textSecondary, fontStyle: "italic" }}
          >
            💡 {forecast.tip}
          </Typography>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: Spacing.m,
    borderRadius: BorderRadius.l,
    marginBottom: Spacing.m,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.s,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.m,
  },
  stat: {
    flex: 1,
  },
  tipContainer: {
    padding: Spacing.s,
    borderRadius: BorderRadius.m,
  },
});
