import STRINGS from "@/i18n/es.json";
import { formatCurrency } from "@/utils/format";
import React from "react";
import { Text, View } from "react-native";
import { PieChart } from "react-native-gifted-charts";
import { DashboardColors } from "./types";

interface AllocationItem {
  category: string;
  amount: number;
  percent: number;
  color: string;
}

interface PieItem {
  value: number;
  color: string;
}

interface AllocationSectionProps {
  colors: DashboardColors;
  periodView: "month" | "year";
  expense: number;
  allocationBreakdown: AllocationItem[];
  pieData: PieItem[];
}

export function AllocationSection({
  colors,
  periodView,
  expense,
  allocationBreakdown,
  pieData,
}: AllocationSectionProps) {
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
        {periodView === "year"
          ? STRINGS.dashboard.yearlyAllocation
          : STRINGS.dashboard.monthlyAllocation}
      </Text>
      <View style={{ alignItems: "center", marginBottom: 20 }}>
        <PieChart
          donut
          innerRadius={70}
          radius={90}
          data={
            pieData.length > 0
              ? pieData
              : [{ value: 100, color: colors.border }]
          }
          centerLabelComponent={() => (
            <View style={{ justifyContent: "center", alignItems: "center" }}>
              <Text
                style={{
                  fontSize: 12,
                  color: colors.textSecondary,
                  fontWeight: "bold",
                }}
              >
                {STRINGS.dashboard.total}
              </Text>
              <Text
                style={{
                  fontSize: 20,
                  color: colors.text,
                  fontWeight: "bold",
                }}
              >
                {formatCurrency(expense)}
              </Text>
            </View>
          )}
        />
      </View>
      {allocationBreakdown.length > 0 ? (
        <View style={{ gap: 12 }}>
          {allocationBreakdown.map((c) => (
            <View
              key={c.category}
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  flex: 1,
                }}
              >
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    marginRight: 12,
                    backgroundColor: c.color,
                  }}
                />
                <Text
                  style={{ color: colors.textSecondary, fontSize: 14 }}
                  numberOfLines={1}
                >
                  {c.category}
                </Text>
              </View>
              <Text
                style={{ color: colors.text, fontSize: 14, fontWeight: "600" }}
              >
                {Math.round(c.percent * 100)}%
              </Text>
            </View>
          ))}
        </View>
      ) : (
        <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
          No hay gastos en este mes.
        </Text>
      )}
    </View>
  );
}
