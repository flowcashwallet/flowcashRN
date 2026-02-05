import { Typography } from "@/components/atoms/Typography";
import { BorderRadius, Colors, Spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import STRINGS from "@/i18n/es.json";
import { formatCurrency } from "@/utils/format";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import { PieChart } from "react-native-gifted-charts";

interface VisionHeaderProps {
  netWorth: number;
  totalAssets: number;
  totalLiabilities: number;
}

export const VisionHeader: React.FC<VisionHeaderProps> = ({
  netWorth,
  totalAssets,
  totalLiabilities,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const pieData = [
    { value: totalAssets || 1, color: colors.success },
    { value: totalLiabilities || 0, color: colors.error },
  ];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surfaceHighlight,
          ...(colorScheme === "dark"
            ? Platform.select({
                ios: {
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 10 },
                  shadowOpacity: 0.3,
                  shadowRadius: 20,
                },
                android: { elevation: 10 },
              })
            : {}),
        },
      ]}
    >
      <Typography
        variant="h3"
        style={{ color: colors.textSecondary, marginBottom: Spacing.xs }}
      >
        {STRINGS.vision.netWorth}
      </Typography>
      <Typography
        variant="h1"
        weight="bold"
        style={{
          color: colors.text,
          fontSize: 32,
          marginBottom: Spacing.l,
        }}
      >
        {formatCurrency(netWorth)}
      </Typography>

      <View style={{ alignItems: "center", marginBottom: Spacing.l }}>
        <PieChart
          data={pieData}
          donut
          radius={80}
          innerRadius={60}
          innerCircleColor={colors.surfaceHighlight}
          centerLabelComponent={() => (
            <View style={{ alignItems: "center" }}>
              <Typography
                variant="caption"
                style={{ color: colors.textSecondary, fontSize: 10 }}
              >
                Balance
              </Typography>
            </View>
          )}
        />
      </View>

      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View
            style={[styles.legendIndicator, { backgroundColor: colors.success }]}
          />
          <View>
            <Typography variant="caption" style={{ color: colors.textSecondary }}>
              {STRINGS.vision.assets}
            </Typography>
            <Typography
              variant="body"
              weight="bold"
              style={{ color: colors.text }}
            >
              {formatCurrency(totalAssets)}
            </Typography>
          </View>
        </View>

        <View style={styles.legendItem}>
          <View
            style={[styles.legendIndicator, { backgroundColor: colors.error }]}
          />
          <View>
            <Typography variant="caption" style={{ color: colors.textSecondary }}>
              {STRINGS.vision.liabilities}
            </Typography>
            <Typography
              variant="body"
              weight="bold"
              style={{ color: colors.text }}
            >
              {formatCurrency(totalLiabilities)}
            </Typography>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.m,
    marginBottom: Spacing.m,
    borderRadius: BorderRadius.xl,
    padding: Spacing.l,
    alignItems: "center",
  },
  legendContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingTop: Spacing.m,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  legendIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
});
