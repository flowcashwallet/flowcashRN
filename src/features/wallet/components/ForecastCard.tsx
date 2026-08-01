import { Typography } from "@/components/atoms/Typography";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { BorderRadius, Spacing } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";
import { formatCurrency } from "@/utils/format";
import React from "react";
import { StyleSheet, View } from "react-native";
import { Forecast } from "../data/walletSlice";

interface ForecastCardProps {
  forecast: Forecast | null;
}

export const ForecastCard: React.FC<ForecastCardProps> = ({ forecast }) => {
  const { colors } = useTheme();

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

  const getTrendInfo = () => {
    switch (forecast.spending_trend) {
      case "accelerating":
        return {
          icon: "arrow.up.forward",
          color: colors.error,
          text: "Al alza",
        };
      case "decelerating":
        return {
          icon: "arrow.down.forward",
          color: colors.success,
          text: "A la baja",
        };
      case "stable":
      default:
        return {
          icon: "arrow.forward",
          color: colors.textSecondary,
          text: "Estable",
        };
    }
  };

  const getConfidenceInfo = () => {
    switch (forecast.confidence) {
      case "high":
        return { color: colors.success, text: "Confianza alta" };
      case "medium":
        return { color: colors.warning, text: "Confianza media" };
      case "low":
      default:
        return { color: colors.textSecondary, text: "Confianza baja" };
    }
  };

  const daysLeftIncludingToday = Math.max(
    1,
    forecast.days_left_including_today ?? 1,
  );
  const todayExpenses = Math.max(0, forecast.today_expenses ?? 0);
  const todayIncome = Math.max(0, forecast.today_income ?? 0);
  const dailyAllowance = Math.max(
    0,
    forecast.daily_allowance ??
      forecast.remaining_budget / daysLeftIncludingToday,
  );
  const remainingToday = Math.max(
    0,
    dailyAllowance + todayIncome - todayExpenses,
  );

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.glass.cardBg,
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
        {forecast.confidence && (
          <Typography
            variant="caption"
            style={{
              color: getConfidenceInfo().color,
              fontWeight: "600",
            }}
          >
            {getConfidenceInfo().text}
          </Typography>
        )}
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
          {forecast.spending_trend && (
            <View style={styles.trendRow}>
              <IconSymbol
                name={getTrendInfo().icon}
                size={12}
                color={getTrendInfo().color}
              />
              <Typography
                variant="caption"
                style={{ color: getTrendInfo().color, marginLeft: Spacing.xs }}
              >
                {getTrendInfo().text}
              </Typography>
            </View>
          )}
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

      <View
        style={[
          styles.breakdownContainer,
          { backgroundColor: colors.surfaceHighlight },
        ]}
      >
        <View style={styles.breakdownRow}>
          <Typography variant="caption" style={{ color: colors.textSecondary }}>
            Ingresos del mes
          </Typography>
          <Typography variant="caption" style={{ color: colors.text }}>
            {formatCurrency(forecast.disposable_budget)}
          </Typography>
        </View>
        <View style={styles.breakdownRow}>
          <Typography variant="caption" style={{ color: colors.textSecondary }}>
            Gastos del mes
          </Typography>
          <Typography variant="caption" style={{ color: colors.text }}>
            {formatCurrency(forecast.current_expenses)}
          </Typography>
        </View>
        <View style={styles.breakdownRow}>
          <Typography variant="caption" style={{ color: colors.textSecondary }}>
            Saldo disponible (sin hoy)
          </Typography>
          <Typography variant="caption" style={{ color: colors.text }}>
            {formatCurrency(
              forecast.remaining_excluding_today ?? forecast.remaining_budget,
            )}
          </Typography>
        </View>
        <View style={styles.breakdownRow}>
          <Typography variant="caption" style={{ color: colors.textSecondary }}>
            Proyección ({daysLeftIncludingToday - 1} días ×{" "}
            {formatCurrency(forecast.daily_burn_rate)})
          </Typography>
          <Typography variant="caption" style={{ color: colors.textSecondary }}>
            -
            {formatCurrency(
              forecast.daily_burn_rate *
                Math.max(0, daysLeftIncludingToday - 1),
            )}
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

      <View style={styles.sectionDivider} />

      <Typography
        variant="caption"
        weight="bold"
        style={{ color: colors.textSecondary, marginBottom: Spacing.s }}
      >
        HOY
      </Typography>

      <View style={styles.todayMainRow}>
        <Typography variant="caption" style={{ color: colors.textSecondary }}>
          Te quedarían por gastar hoy
        </Typography>
        <Typography
          variant="h3"
          weight="bold"
          style={{
            color: remainingToday >= 0 ? colors.success : colors.error,
          }}
        >
          {formatCurrency(remainingToday)}
        </Typography>
      </View>

      <View style={styles.todayDetailsRow}>
        <View style={styles.todayDetail}>
          <Typography variant="caption" style={{ color: colors.textSecondary }}>
            Gastaste
          </Typography>
          <Typography
            variant="body"
            weight="bold"
            style={{ color: colors.text }}
          >
            {formatCurrency(todayExpenses)}
          </Typography>
        </View>
        <View style={styles.todayDetail}>
          <Typography variant="caption" style={{ color: colors.textSecondary }}>
            Ingresos
          </Typography>
          <Typography
            variant="body"
            weight="bold"
            style={{ color: colors.text }}
          >
            {formatCurrency(todayIncome)}
          </Typography>
        </View>
        <View style={styles.todayDetail}>
          <Typography variant="caption" style={{ color: colors.textSecondary }}>
            Presupuesto diario
          </Typography>
          <Typography
            variant="body"
            weight="bold"
            style={{ color: colors.text }}
          >
            {formatCurrency(dailyAllowance)}
          </Typography>
          {(forecast.unpaid_fixed ?? 0) > 0 && (
            <Typography
              variant="caption"
              style={{ color: colors.textSecondary, fontSize: 10 }}
            >
              {formatCurrency(forecast.unpaid_fixed ?? 0)} en fijos por pagar
            </Typography>
          )}
        </View>
      </View>
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
  allowanceContainer: {
    padding: Spacing.s,
    borderRadius: BorderRadius.m,
    marginBottom: Spacing.s,
  },
  trendRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.xs,
  },
  breakdownContainer: {
    padding: Spacing.s,
    borderRadius: BorderRadius.m,
    marginBottom: Spacing.m,
  },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.xs,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: "rgba(128,128,128,0.2)",
    marginVertical: Spacing.m,
  },
  todayMainRow: {
    marginBottom: Spacing.m,
  },
  todayDetailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  todayDetail: {
    flex: 1,
  },
});
