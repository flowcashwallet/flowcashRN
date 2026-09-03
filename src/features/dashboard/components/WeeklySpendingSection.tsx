import { GlassSurface } from "@/components/atoms/GlassSurface";
import { Typography } from "@/components/atoms/Typography";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { BorderRadius, Spacing, TypographyScale } from "@/constants/theme";
import STRINGS from "@/i18n/es.json";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { LineChart } from "react-native-gifted-charts";
import { DashboardCard } from "./DashboardCard";
import { DashboardColors, ExpenseTrend, WeeklyDetail } from "./types";

interface WeeklySpendingSectionProps {
  colors: DashboardColors;
  periodView: "month" | "year";
  expenseTrend: ExpenseTrend;
  lineChartSpacing: number;
  resolvedLineChartWidth?: number;
  onLineChartLayout: (width: number) => void;
  formatWeeklyValue: (value: number) => string;
  showWeeklyDetails: boolean;
  onToggleWeeklyDetails: () => void;
  weeklyDetails: WeeklyDetail[];
  expandedWeek: string | null;
  onToggleExpandedWeek: (weekLabel: string) => void;
}

/** Alto del área de dibujo del `LineChart`, en la rejilla de 4pt. */
const CHART_HEIGHT = 160;

/**
 * Tendencia de gasto del periodo, con el desglose semana a semana.
 *
 * **Superficies (retrofit 2026-09-02, tercera vuelta).** La card exterior es
 * cristal vía `DashboardCard`; dentro piden cristal con `forceGlass` las dos
 * superficies que el usuario ve como bloques propios: el botón "Ver detalles
 * por semana" y **cada bloque de semana** del desglose. Estos últimos estaban
 * planos por la excepción "el contenido repetido se queda plano", que se retiró
 * — ya no hay distinción entre elemento destacado y fila repetida: si tiene
 * superficie propia, lleva cristal (ver la sección de Liquid Glass en
 * `docs/refactor-plan.md`).
 *
 * Lo que hay **dentro** del bloque de semana —su toggle, el panel de totales y
 * las filas de categoría— sigue plano, y no por la excepción retirada sino por
 * el guard de anidamiento: ya hay cristal justo encima y apilar un tercer nivel
 * de material va contra la guía de Apple. Se resuelve solo, sin decidirlo aquí:
 * son `View` normales dentro de un `GlassSurface` activo.
 *
 * Los importes van en `variant="number"`: gasto en `expense`, ingreso en
 * `success`, balance de la semana en uno u otro según el signo. `error` no
 * aparece aquí — una semana en negativo no es un fallo.
 */
export function WeeklySpendingSection({
  colors,
  periodView,
  expenseTrend,
  lineChartSpacing,
  resolvedLineChartWidth,
  onLineChartLayout,
  formatWeeklyValue,
  showWeeklyDetails,
  onToggleWeeklyDetails,
  weeklyDetails,
  expandedWeek,
  onToggleExpandedWeek,
}: WeeklySpendingSectionProps) {
  return (
    <DashboardCard>
      <Typography variant="subheading" style={styles.title}>
        {periodView === "year"
          ? STRINGS.dashboard.monthlySpending
          : STRINGS.dashboard.weeklySpending}
      </Typography>

      {expenseTrend.hasData ? (
        <>
          <View
            style={styles.chartWrapper}
            onLayout={(e) => onLineChartLayout(e.nativeEvent.layout.width)}
          >
            <LineChart
              data={expenseTrend.data}
              color={colors.primary}
              thickness={3}
              hideDataPoints={false}
              dataPointsColor={colors.primary}
              dataPointsRadius={4}
              height={CHART_HEIGHT}
              spacing={lineChartSpacing}
              initialSpacing={10}
              endSpacing={10}
              yAxisColor={colors.border}
              xAxisColor={colors.border}
              yAxisLabelPrefix="$"
              overflowTop={22}
              textColor1={colors.text}
              textFontSize={TypographyScale.caption.fontSize}
              textShiftY={-8}
              textShiftX={10}
              xAxisLabelTextStyle={axisLabelStyle(colors.textSecondary)}
              yAxisTextStyle={axisLabelStyle(colors.textSecondary)}
              noOfSections={4}
              backgroundColor="transparent"
              rulesColor={colors.border}
              {...(resolvedLineChartWidth
                ? { width: resolvedLineChartWidth }
                : {})}
              pointerConfig={{
                pointerStripHeight: CHART_HEIGHT,
                pointerStripColor: colors.border,
                pointerStripWidth: 2,
                pointerColor: colors.primary,
                radius: 4,
                pointerLabelWidth: 160,
                pointerLabelHeight: 70,
                autoAdjustPointerLabelPosition: true,
                pointerLabelComponent: (items: any) => {
                  const item = Array.isArray(items) ? items[0] : items;
                  const label = item?.label ?? "";
                  const value =
                    typeof item?.value === "number" ? item.value : 0;
                  return (
                    <View
                      style={[
                        styles.pointerLabel,
                        {
                          backgroundColor: colors.surface,
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <Typography
                        variant="caption"
                        muted
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {label}
                      </Typography>
                      <Typography
                        variant="number"
                        style={styles.pointerValue}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {formatWeeklyValue(value)}
                      </Typography>
                    </View>
                  );
                },
              }}
            />
          </View>

          {periodView === "month" ? (
            <>
              <TouchableOpacity
                onPress={onToggleWeeklyDetails}
                accessibilityRole="button"
                activeOpacity={0.7}
                style={styles.toggleWrapper}
              >
                <GlassSurface
                  forceGlass
                  isInteractive
                  style={styles.toggle}
                  fallbackStyle={[
                    styles.flatToggle,
                    {
                      backgroundColor: colors.surfaceHighlight,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Typography variant="button">
                    {showWeeklyDetails
                      ? STRINGS.dashboard.toggleWeeklyDetailsHide
                      : STRINGS.dashboard.toggleWeeklyDetailsShow}
                  </Typography>
                  <IconSymbol
                    name={showWeeklyDetails ? "chevron.up" : "chevron.down"}
                    size={20}
                    color={colors.textSecondary}
                  />
                </GlassSurface>
              </TouchableOpacity>

              {showWeeklyDetails ? (
                <View style={styles.weekList}>
                  {weeklyDetails.map((w) => (
                    <GlassSurface
                      key={w.label}
                      forceGlass
                      style={styles.weekBlock}
                      fallbackStyle={[
                        styles.flatWeekBlock,
                        {
                          backgroundColor: colors.surfaceHighlight,
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <View style={styles.weekHeader}>
                        <Typography variant="body" weight="semibold">
                          {w.label}
                        </Typography>
                        <Typography
                          variant="number"
                          style={{
                            color:
                              w.balance >= 0 ? colors.success : colors.expense,
                          }}
                        >
                          {(w.balance >= 0 ? "+" : "") +
                            formatWeeklyValue(w.balance)}
                        </Typography>
                      </View>

                      <Typography variant="caption" muted style={styles.range}>
                        {w.range}
                      </Typography>

                      <TouchableOpacity
                        onPress={() => onToggleExpandedWeek(w.label)}
                        accessibilityRole="button"
                        activeOpacity={0.7}
                      >
                        <GlassSurface
                          forceGlass
                          isInteractive
                          style={styles.weekToggle}
                          fallbackStyle={[
                            styles.flatWeekToggle,
                            {
                              backgroundColor: colors.surface,
                              borderColor: colors.border,
                            },
                          ]}
                        >
                          <Typography variant="bodySmall" weight="semibold">
                            {expandedWeek === w.label
                              ? STRINGS.dashboard.toggleWeekHide
                              : STRINGS.dashboard.toggleWeekShow}
                          </Typography>
                          <IconSymbol
                            name={
                              expandedWeek === w.label
                                ? "chevron.up"
                                : "chevron.down"
                            }
                            size={16}
                            color={colors.textSecondary}
                          />
                        </GlassSurface>
                      </TouchableOpacity>

                      {expandedWeek === w.label ? (
                        <>
                          <GlassSurface
                            forceGlass
                            style={styles.weekTotals}
                            fallbackStyle={[
                              styles.flatWeekTotals,
                              {
                                backgroundColor: colors.surface,
                                borderColor: colors.border,
                              },
                            ]}
                          >
                            <View style={styles.totalsRow}>
                              <Typography variant="caption" muted>
                                Ingresos
                              </Typography>
                              <Typography
                                variant="number"
                                style={{ color: colors.success }}
                              >
                                +{formatWeeklyValue(w.incomeTotal)}
                              </Typography>
                            </View>
                            <View style={styles.totalsRow}>
                              <Typography variant="caption" muted>
                                Gastos
                              </Typography>
                              <Typography
                                variant="number"
                                style={{ color: colors.expense }}
                              >
                                −{formatWeeklyValue(w.expenseTotal)}
                              </Typography>
                            </View>
                            <View
                              style={[
                                styles.totalsRow,
                                styles.totalsBalanceRow,
                                { borderTopColor: colors.border },
                              ]}
                            >
                              <Typography variant="caption" muted>
                                Balance
                              </Typography>
                              <Typography
                                variant="number"
                                style={{
                                  color:
                                    w.balance >= 0
                                      ? colors.success
                                      : colors.expense,
                                }}
                              >
                                {(w.balance >= 0 ? "+" : "") +
                                  formatWeeklyValue(w.balance)}
                              </Typography>
                            </View>
                          </GlassSurface>

                          <Typography
                            variant="overline"
                            muted
                            style={styles.breakdownLabel}
                          >
                            Gastos por categoria
                          </Typography>

                          {w.categories.length === 0 ? (
                            <Typography variant="bodySmall" muted>
                              {STRINGS.dashboard.noWeekExpenses}
                            </Typography>
                          ) : (
                            <View>
                              {w.categories.map((category, idx) => (
                                <View
                                  key={`${w.label}-${category.category}`}
                                  style={[
                                    styles.categoryRow,
                                    idx === 0
                                      ? null
                                      : {
                                          borderTopWidth:
                                            StyleSheet.hairlineWidth,
                                          borderTopColor: colors.border,
                                        },
                                  ]}
                                >
                                  <Typography
                                    variant="bodySmall"
                                    style={styles.categoryName}
                                    numberOfLines={1}
                                  >
                                    {category.category}
                                  </Typography>
                                  <Typography
                                    variant="number"
                                    style={{ color: colors.expense }}
                                  >
                                    −{formatWeeklyValue(category.amount)}
                                  </Typography>
                                </View>
                              ))}
                            </View>
                          )}

                          <Typography
                            variant="overline"
                            muted
                            style={styles.breakdownLabel}
                          >
                            Ingresos por categoria
                          </Typography>

                          {w.incomeCategories.length === 0 ? (
                            <Typography variant="bodySmall" muted>
                              No hay ingresos en esta semana.
                            </Typography>
                          ) : (
                            <View>
                              {w.incomeCategories.map((category, idx) => (
                                <View
                                  key={`${w.label}-income-${category.category}`}
                                  style={[
                                    styles.categoryRow,
                                    idx === 0
                                      ? null
                                      : {
                                          borderTopWidth:
                                            StyleSheet.hairlineWidth,
                                          borderTopColor: colors.border,
                                        },
                                  ]}
                                >
                                  <Typography
                                    variant="bodySmall"
                                    style={styles.categoryName}
                                    numberOfLines={1}
                                  >
                                    {category.category}
                                  </Typography>
                                  <Typography
                                    variant="number"
                                    style={{ color: colors.success }}
                                  >
                                    +{formatWeeklyValue(category.amount)}
                                  </Typography>
                                </View>
                              ))}
                            </View>
                          )}
                        </>
                      ) : null}
                    </GlassSurface>
                  ))}
                </View>
              ) : null}
            </>
          ) : null}
        </>
      ) : (
        <Typography variant="bodySmall" muted>
          {periodView === "year"
            ? STRINGS.dashboard.noMonthlySpending
            : STRINGS.dashboard.noWeeklySpending}
        </Typography>
      )}
    </DashboardCard>
  );
}

/**
 * `react-native-gifted-charts` pide estilos de texto sueltos para sus ejes, no
 * admite un componente: el tamaño sale igualmente de la escala tipográfica.
 */
function axisLabelStyle(color: string) {
  return { color, fontSize: TypographyScale.caption.fontSize };
}

const styles = StyleSheet.create({
  title: {
    marginBottom: Spacing.sm,
  },
  chartWrapper: {
    width: "100%",
  },
  pointerLabel: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.s,
    borderRadius: BorderRadius.m,
    borderWidth: StyleSheet.hairlineWidth,
    minWidth: 140,
  },
  pointerValue: {
    textAlign: "left",
  },
  /**
   * El margen vive en el `TouchableOpacity` y no en la superficie: así el área
   * pulsable coincide exactamente con el cristal.
   */
  toggleWrapper: {
    marginTop: Spacing.sm,
  },
  toggle: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.m,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    overflow: "hidden",
  },
  /** Fondo opaco + hairline del botón: solo cuando no hay cristal. */
  flatToggle: {
    borderWidth: StyleSheet.hairlineWidth,
  },
  weekList: {
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  /** Layout del bloque de semana, con y sin cristal. */
  weekBlock: {
    borderRadius: BorderRadius.m,
    padding: Spacing.sm,
    overflow: "hidden",
  },
  /**
   * Fondo opaco + hairline del bloque de semana: solo cuando no hay cristal.
   * `surfaceHighlight` —y no `surface`— porque plano sigue siendo el escalón de
   * superficie *dentro* de la card, que ya es `surface`.
   */
  flatWeekBlock: {
    borderWidth: StyleSheet.hairlineWidth,
  },
  weekHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.s,
  },
  range: {
    marginBottom: Spacing.s,
  },
  /** Layout del botón "Ver gastos", con y sin cristal. */
  weekToggle: {
    marginTop: Spacing.s,
    paddingVertical: Spacing.s,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.m,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  /** Fondo opaco + hairline del botón "Ver gastos": solo cuando no hay cristal. */
  flatWeekToggle: {
    borderWidth: StyleSheet.hairlineWidth,
  },
  /** Layout de la card de totales de la semana, con y sin cristal. */
  weekTotals: {
    marginTop: Spacing.s,
    borderRadius: BorderRadius.m,
    padding: Spacing.s,
    gap: Spacing.xs,
    overflow: "hidden",
  },
  /** Fondo opaco + hairline de la card de totales: solo cuando no hay cristal. */
  flatWeekTotals: {
    borderWidth: StyleSheet.hairlineWidth,
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalsBalanceRow: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: Spacing.xs,
  },
  breakdownLabel: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  categoryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.s,
  },
  categoryName: {
    flex: 1,
    paddingRight: Spacing.sm,
  },
});
