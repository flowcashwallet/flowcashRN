import { GlassSurface } from "@/components/atoms/GlassSurface";
import { Typography } from "@/components/atoms/Typography";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { BorderRadius, Spacing } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";
import { Forecast } from "@/features/wallet/data/walletSlice";
import { formatCurrency } from "@/utils/format";
import React from "react";
import { StyleSheet, View } from "react-native";

interface ForecastCardProps {
  forecast: Forecast | null;
}

/**
 * Grosor del acento de estado en el borde izquierdo. Vive en `style` (no en
 * `fallbackStyle`) a propósito: es la marca de estado de la card y tiene que
 * verse también sobre el cristal, donde el resto del borde desaparece.
 */
const STATUS_ACCENT_WIDTH = 4;

/**
 * La predicción del mes, la card más densa de Analytics.
 *
 * Pase visual 2026-09-02:
 * - Superficie: era `colors.glass.cardBg` (el vidrio *falso* deprecado) con
 *   sombra `#000` y `borderWidth: 1`. Ahora es `GlassSurface` — cristal nativo
 *   en iOS 26+, y `surface` + hairline en `border` cuando no lo hay. Con esto
 *   `glass.*` deja de tener consumidores fuera de `BudgetDashboard`.
 * - Los dos paneles internos (desglose y consejo) piden cristal con
 *   `forceGlass`: son superficies propias dentro de una card ya vidriada, mismo
 *   caso que el panel de totales de `UpcomingFixedPaymentsSection`. Conservan su
 *   `surfaceHighlight` plano, que es el escalón correcto dentro de una card
 *   `surface`.
 * - Regla del signo: `−` + `expense` para lo que sale (gasto diario promedio,
 *   gastos del mes, la proyección de gasto restante, lo gastado hoy) y `+` +
 *   `success` para lo que entra. `error` sobrevive en un único sitio, la
 *   proyección de fin de mes negativa: eso sí es un sobregiro real, no un gasto
 *   corriente.
 * - La tendencia "Al alza" pasa de `error` a `warning` (misma corrección que
 *   hizo Dashboard con el pico de categoría: una tendencia no es un fallo), y la
 *   confianza deja de pintarse de tres colores decorativos — solo "Confianza
 *   baja" es `warning`, el resto va `muted`.
 */
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
          // Una tendencia al alza es una advertencia sobre el dato, no un fallo.
          color: colors.warning,
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

  /**
   * La confianza no es una categoría con color propio: alta y media no dicen
   * nada que el texto no diga ya, así que van `muted`. Solo la baja es un aviso
   * sobre la fiabilidad del número, y por eso es la única en `warning`.
   */
  const getConfidenceInfo = () => {
    switch (forecast.confidence) {
      case "high":
        return { isLow: false, text: "Confianza alta" };
      case "medium":
        return { isLow: false, text: "Confianza media" };
      case "low":
      default:
        return { isLow: true, text: "Confianza baja" };
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
  // `Math.max(0, …)`: nunca es negativo, así que va siempre en `success`. Antes
  // había un ternario `>= 0 ? success : error` cuya rama de error era
  // inalcanzable.
  const remainingToday = Math.max(
    0,
    dailyAllowance + todayIncome - todayExpenses,
  );

  const projectedOverdraft = forecast.projected_balance < 0;
  const remainingProjection =
    forecast.daily_burn_rate * Math.max(0, daysLeftIncludingToday - 1);

  return (
    <GlassSurface
      style={[
        styles.container,
        {
          borderLeftColor: getStatusColor(),
          borderLeftWidth: STATUS_ACCENT_WIDTH,
        },
      ]}
      fallbackStyle={[
        styles.flatContainer,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <View style={styles.header}>
        <IconSymbol name={getStatusIcon()} size={24} color={getStatusColor()} />
        <Typography variant="subheading" style={styles.headerTitle}>
          Predicción Mensual
        </Typography>
        {forecast.confidence && (
          <Typography
            variant="caption"
            weight="semibold"
            muted={!getConfidenceInfo().isLow}
            style={
              getConfidenceInfo().isLow ? { color: colors.warning } : undefined
            }
          >
            {getConfidenceInfo().text}
          </Typography>
        )}
      </View>

      <Typography variant="body" style={styles.message}>
        {forecast.message}
      </Typography>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Typography variant="caption" muted>
            Gasto Diario Prom.
          </Typography>
          <Typography
            variant="number"
            style={[styles.statValue, { color: colors.expense }]}
          >
            −{formatCurrency(forecast.daily_burn_rate)}
          </Typography>
          {forecast.spending_trend && (
            <View style={styles.trendRow}>
              <IconSymbol
                name={getTrendInfo().icon}
                size={16}
                color={getTrendInfo().color}
              />
              <Typography
                variant="caption"
                style={{ color: getTrendInfo().color }}
              >
                {getTrendInfo().text}
              </Typography>
            </View>
          )}
        </View>

        <View style={styles.stat}>
          <Typography variant="caption" muted>
            Proyección Fin de Mes
          </Typography>
          {/*
            El único `error` legítimo de la card: una proyección negativa es un
            sobregiro que va a ocurrir, no un gasto corriente. Sin prefijo de
            signo — `formatCurrency` ya emite el `-` cuando es negativa, y esto
            es un saldo, no un movimiento.
          */}
          <Typography
            variant="number"
            style={[
              styles.statValue,
              { color: projectedOverdraft ? colors.error : colors.success },
            ]}
          >
            {formatCurrency(forecast.projected_balance)}
          </Typography>
        </View>
      </View>

      <GlassSurface
        forceGlass
        style={styles.breakdownContainer}
        fallbackStyle={[
          styles.flatPanel,
          {
            backgroundColor: colors.surfaceHighlight,
            borderColor: colors.border,
          },
        ]}
      >
        <View style={styles.breakdownRow}>
          <Typography variant="caption" muted>
            Ingresos del mes
          </Typography>
          <Typography variant="number" style={{ color: colors.success }}>
            +{formatCurrency(forecast.disposable_budget)}
          </Typography>
        </View>
        <View style={styles.breakdownRow}>
          <Typography variant="caption" muted>
            Gastos del mes
          </Typography>
          <Typography variant="number" style={{ color: colors.expense }}>
            −{formatCurrency(forecast.current_expenses)}
          </Typography>
        </View>
        <View style={styles.breakdownRow}>
          <Typography variant="caption" muted>
            Saldo disponible (sin hoy)
          </Typography>
          {/* Es un saldo restante, no un movimiento: sin signo ni color. */}
          <Typography variant="number">
            {formatCurrency(
              forecast.remaining_excluding_today ?? forecast.remaining_budget,
            )}
          </Typography>
        </View>
        <View style={styles.breakdownRow}>
          <Typography variant="caption" muted style={styles.breakdownLabel}>
            Proyección ({daysLeftIncludingToday - 1} días ×{" "}
            {formatCurrency(forecast.daily_burn_rate)})
          </Typography>
          <Typography variant="number" style={{ color: colors.expense }}>
            −{formatCurrency(remainingProjection)}
          </Typography>
        </View>
      </GlassSurface>

      {forecast.tip && (
        <GlassSurface
          forceGlass
          style={styles.tipContainer}
          fallbackStyle={[
            styles.flatPanel,
            {
              backgroundColor: colors.surfaceHighlight,
              borderColor: colors.border,
            },
          ]}
        >
          <IconSymbol name="lightbulb.fill" size={16} color={colors.primary} />
          <Typography variant="caption" muted style={styles.tipText}>
            {forecast.tip}
          </Typography>
        </GlassSurface>
      )}

      <View
        style={[styles.sectionDivider, { backgroundColor: colors.border }]}
      />

      <Typography variant="overline" muted style={styles.todayLabel}>
        Hoy
      </Typography>

      <View style={styles.todayMainRow}>
        <Typography variant="caption" muted>
          Te quedarían por gastar hoy
        </Typography>
        <Typography
          variant="display"
          style={[styles.heroAmount, { color: colors.success }]}
        >
          {formatCurrency(remainingToday)}
        </Typography>
      </View>

      <View style={styles.todayDetailsRow}>
        <View style={styles.todayDetail}>
          <Typography variant="caption" muted>
            Gastaste
          </Typography>
          <Typography
            variant="number"
            style={[styles.statValue, { color: colors.expense }]}
          >
            −{formatCurrency(todayExpenses)}
          </Typography>
        </View>
        <View style={styles.todayDetail}>
          <Typography variant="caption" muted>
            Ingresos
          </Typography>
          <Typography
            variant="number"
            style={[styles.statValue, { color: colors.success }]}
          >
            +{formatCurrency(todayIncome)}
          </Typography>
        </View>
        <View style={styles.todayDetail}>
          <Typography variant="caption" muted>
            Presupuesto diario
          </Typography>
          {/* Un presupuesto no es un movimiento: sin signo ni color. */}
          <Typography variant="number" style={styles.statValue}>
            {formatCurrency(dailyAllowance)}
          </Typography>
          {(forecast.unpaid_fixed ?? 0) > 0 && (
            <Typography variant="caption" muted>
              {formatCurrency(forecast.unpaid_fixed ?? 0)} en fijos por pagar
            </Typography>
          )}
        </View>
      </View>
    </GlassSurface>
  );
};

const styles = StyleSheet.create({
  /** Layout de la card, común a la variante con cristal y a la plana. */
  container: {
    padding: Spacing.m,
    borderRadius: BorderRadius.l,
    marginBottom: Spacing.m,
    overflow: "hidden",
  },
  /** Fondo opaco + hairline: solo cuando no hay cristal. */
  flatContainer: {
    borderWidth: StyleSheet.hairlineWidth,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.s,
    marginBottom: Spacing.s,
  },
  headerTitle: {
    flex: 1,
  },
  message: {
    marginBottom: Spacing.m,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: Spacing.s,
    marginBottom: Spacing.m,
  },
  stat: {
    flex: 1,
  },
  /**
   * En una tira de estadísticas la cifra vive **bajo** su etiqueta, no a la
   * derecha de ella, así que se alinea con la etiqueta. Se conserva lo que de
   * verdad aporta `variant="number"` aquí: los dígitos tabulares.
   */
  statValue: {
    textAlign: "left",
  },
  /** La cifra accionable de la card: cuánto queda hoy. Tabular como el resto. */
  heroAmount: {
    fontVariant: ["tabular-nums"],
  },
  trendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  /** Layout del panel de desglose, con y sin cristal. */
  breakdownContainer: {
    padding: Spacing.s,
    borderRadius: BorderRadius.m,
    marginBottom: Spacing.m,
    gap: Spacing.xs,
    overflow: "hidden",
  },
  /** Layout del consejo, con y sin cristal. */
  tipContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.s,
    padding: Spacing.s,
    borderRadius: BorderRadius.m,
    overflow: "hidden",
  },
  tipText: {
    flex: 1,
    fontStyle: "italic",
  },
  /**
   * Fondo opaco + hairline de los dos paneles internos: solo sin cristal. El
   * radio y el padding se quedan arriba porque aplican siempre.
   */
  flatPanel: {
    borderWidth: StyleSheet.hairlineWidth,
  },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: Spacing.s,
  },
  breakdownLabel: {
    flex: 1,
  },
  sectionDivider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: Spacing.m,
  },
  todayLabel: {
    marginBottom: Spacing.s,
  },
  todayMainRow: {
    marginBottom: Spacing.m,
  },
  todayDetailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: Spacing.s,
  },
  todayDetail: {
    flex: 1,
  },
});
