import { GlassCard } from "@/components/atoms/GlassCard";
import { IconSymbol } from "@/components/ui/icon-symbol";
import STRINGS from "@/i18n/es.json";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { LineChart } from "react-native-gifted-charts";
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
        {periodView === "year"
          ? STRINGS.dashboard.monthlySpending
          : STRINGS.dashboard.weeklySpending}
      </Text>

      {expenseTrend.hasData ? (
        <>
          <View
            style={{ width: "100%" }}
            onLayout={(e) => onLineChartLayout(e.nativeEvent.layout.width)}
          >
            <LineChart
              data={expenseTrend.data}
              color={colors.primary}
              thickness={3}
              hideDataPoints={false}
              dataPointsColor={colors.primary}
              dataPointsRadius={4}
              height={160}
              spacing={lineChartSpacing}
              initialSpacing={10}
              endSpacing={10}
              yAxisColor={colors.border}
              xAxisColor={colors.border}
              yAxisLabelPrefix="$"
              overflowTop={22}
              textColor1={colors.text}
              textFontSize={12}
              textShiftY={-8}
              textShiftX={10}
              xAxisLabelTextStyle={{
                color: colors.textSecondary,
                fontSize: 12,
              }}
              yAxisTextStyle={{ color: colors.textSecondary, fontSize: 12 }}
              noOfSections={4}
              backgroundColor="transparent"
              rulesColor={colors.border}
              {...(resolvedLineChartWidth
                ? { width: resolvedLineChartWidth }
                : {})}
              pointerConfig={{
                pointerStripHeight: 160,
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
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 8,
                        borderRadius: 10,
                        backgroundColor: colors.surface,
                        borderWidth: 1,
                        borderColor: colors.border,
                        minWidth: 140,
                      }}
                    >
                      <Text
                        style={{
                          color: colors.textSecondary,
                          fontSize: 12,
                          maxWidth: "100%",
                        }}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {label}
                      </Text>
                      <Text
                        style={{
                          color: colors.text,
                          fontSize: 14,
                          fontWeight: "700",
                          maxWidth: "100%",
                        }}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {formatWeeklyValue(value)}
                      </Text>
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
                style={{
                  marginTop: 12,
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  borderRadius: 12,
                  backgroundColor: colors.surfaceHighlight,
                  borderWidth: 1,
                  borderColor: colors.border,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Text
                  style={{
                    color: colors.text,
                    fontSize: 14,
                    fontWeight: "700",
                  }}
                >
                  {showWeeklyDetails
                    ? STRINGS.dashboard.toggleWeeklyDetailsHide
                    : STRINGS.dashboard.toggleWeeklyDetailsShow}
                </Text>
                <IconSymbol
                  name={showWeeklyDetails ? "chevron.up" : "chevron.down"}
                  size={18}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>

              {showWeeklyDetails ? (
                <View style={{ marginTop: 12, gap: 12 }}>
                  {weeklyDetails.map((w) => (
                    <View
                      key={w.label}
                      style={{
                        borderRadius: 14,
                        backgroundColor: colors.surfaceHighlight,
                        borderWidth: 1,
                        borderColor: colors.border,
                        padding: 12,
                      }}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: 8,
                        }}
                      >
                        <Text
                          style={{
                            color: colors.text,
                            fontSize: 14,
                            fontWeight: "700",
                          }}
                        >
                          {w.label}
                        </Text>
                        <Text
                          style={{
                            color:
                              w.balance >= 0 ? colors.success : colors.error,
                            fontSize: 14,
                            fontWeight: "700",
                          }}
                        >
                          {(w.balance >= 0 ? "+" : "") +
                            formatWeeklyValue(w.balance)}
                        </Text>
                      </View>

                      <Text
                        style={{
                          color: colors.textSecondary,
                          fontSize: 12,
                          marginBottom: 8,
                        }}
                      >
                        {w.range}
                      </Text>

                      <TouchableOpacity
                        onPress={() => onToggleExpandedWeek(w.label)}
                        style={{
                          marginTop: 6,
                          paddingVertical: 10,
                          paddingHorizontal: 10,
                          borderRadius: 12,
                          backgroundColor: colors.surface,
                          borderWidth: 1,
                          borderColor: colors.border,
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <Text
                          style={{
                            color: colors.text,
                            fontSize: 13,
                            fontWeight: "700",
                          }}
                        >
                          {expandedWeek === w.label
                            ? STRINGS.dashboard.toggleWeekHide
                            : STRINGS.dashboard.toggleWeekShow}
                        </Text>
                        <IconSymbol
                          name={
                            expandedWeek === w.label
                              ? "chevron.up"
                              : "chevron.down"
                          }
                          size={16}
                          color={colors.textSecondary}
                        />
                      </TouchableOpacity>

                      {expandedWeek === w.label ? (
                        <>
                          <View
                            style={{
                              marginTop: 8,
                              borderRadius: 12,
                              backgroundColor: colors.surface,
                              borderWidth: 1,
                              borderColor: colors.border,
                              padding: 10,
                              gap: 6,
                            }}
                          >
                            <View
                              style={{
                                flexDirection: "row",
                                justifyContent: "space-between",
                                alignItems: "center",
                              }}
                            >
                              <Text
                                style={{
                                  color: colors.textSecondary,
                                  fontSize: 12,
                                }}
                              >
                                Ingresos
                              </Text>
                              <Text
                                style={{
                                  color: colors.success,
                                  fontSize: 12,
                                  fontWeight: "700",
                                }}
                              >
                                +{formatWeeklyValue(w.incomeTotal)}
                              </Text>
                            </View>
                            <View
                              style={{
                                flexDirection: "row",
                                justifyContent: "space-between",
                                alignItems: "center",
                              }}
                            >
                              <Text
                                style={{
                                  color: colors.textSecondary,
                                  fontSize: 12,
                                }}
                              >
                                Gastos
                              </Text>
                              <Text
                                style={{
                                  color: colors.error,
                                  fontSize: 12,
                                  fontWeight: "700",
                                }}
                              >
                                -{formatWeeklyValue(w.expenseTotal)}
                              </Text>
                            </View>
                            <View
                              style={{
                                flexDirection: "row",
                                justifyContent: "space-between",
                                alignItems: "center",
                                borderTopWidth: 1,
                                borderTopColor: colors.border,
                                paddingTop: 6,
                              }}
                            >
                              <Text
                                style={{
                                  color: colors.textSecondary,
                                  fontSize: 12,
                                }}
                              >
                                Balance
                              </Text>
                              <Text
                                style={{
                                  color:
                                    w.balance >= 0
                                      ? colors.success
                                      : colors.error,
                                  fontSize: 12,
                                  fontWeight: "700",
                                }}
                              >
                                {(w.balance >= 0 ? "+" : "") +
                                  formatWeeklyValue(w.balance)}
                              </Text>
                            </View>
                          </View>

                          <Text
                            style={{
                              color: colors.textSecondary,
                              fontSize: 12,
                              marginTop: 10,
                              marginBottom: 4,
                            }}
                          >
                            Gastos por categoria
                          </Text>

                          {w.categories.length === 0 ? (
                            <Text
                              style={{
                                color: colors.textSecondary,
                                fontSize: 12,
                                marginTop: 4,
                              }}
                            >
                              {STRINGS.dashboard.noWeekExpenses}
                            </Text>
                          ) : (
                            <View style={{ marginTop: 4 }}>
                              {w.categories.map((category, idx) => {
                                const isFirst = idx === 0;
                                return (
                                  <View
                                    key={`${w.label}-${category.category}`}
                                    style={{
                                      flexDirection: "row",
                                      justifyContent: "space-between",
                                      alignItems: "center",
                                      paddingVertical: 6,
                                      borderTopWidth: isFirst ? 0 : 1,
                                      borderTopColor: colors.border,
                                    }}
                                  >
                                    <Text
                                      style={{
                                        color: colors.text,
                                        fontSize: 13,
                                        flex: 1,
                                        paddingRight: 12,
                                      }}
                                      numberOfLines={1}
                                    >
                                      {category.category}
                                    </Text>
                                    <Text
                                      style={{
                                        color: colors.text,
                                        fontSize: 13,
                                        fontWeight: "700",
                                      }}
                                    >
                                      -{formatWeeklyValue(category.amount)}
                                    </Text>
                                  </View>
                                );
                              })}
                            </View>
                          )}

                          <Text
                            style={{
                              color: colors.textSecondary,
                              fontSize: 12,
                              marginTop: 10,
                              marginBottom: 4,
                            }}
                          >
                            Ingresos por categoria
                          </Text>

                          {w.incomeCategories.length === 0 ? (
                            <Text
                              style={{
                                color: colors.textSecondary,
                                fontSize: 12,
                                marginTop: 4,
                              }}
                            >
                              No hay ingresos en esta semana.
                            </Text>
                          ) : (
                            <View style={{ marginTop: 4 }}>
                              {w.incomeCategories.map((category, idx) => {
                                const isFirst = idx === 0;
                                return (
                                  <View
                                    key={`${w.label}-income-${category.category}`}
                                    style={{
                                      flexDirection: "row",
                                      justifyContent: "space-between",
                                      alignItems: "center",
                                      paddingVertical: 6,
                                      borderTopWidth: isFirst ? 0 : 1,
                                      borderTopColor: colors.border,
                                    }}
                                  >
                                    <Text
                                      style={{
                                        color: colors.text,
                                        fontSize: 13,
                                        flex: 1,
                                        paddingRight: 12,
                                      }}
                                      numberOfLines={1}
                                    >
                                      {category.category}
                                    </Text>
                                    <Text
                                      style={{
                                        color: colors.success,
                                        fontSize: 13,
                                        fontWeight: "700",
                                      }}
                                    >
                                      +{formatWeeklyValue(category.amount)}
                                    </Text>
                                  </View>
                                );
                              })}
                            </View>
                          )}
                        </>
                      ) : null}
                    </View>
                  ))}
                </View>
              ) : null}
            </>
          ) : null}
        </>
      ) : (
        <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
          {periodView === "year"
            ? STRINGS.dashboard.noMonthlySpending
            : STRINGS.dashboard.noWeeklySpending}
        </Text>
      )}
    </GlassCard>
  );
}
