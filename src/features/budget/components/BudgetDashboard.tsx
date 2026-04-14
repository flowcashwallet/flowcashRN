import { Button } from "@/components/atoms/Button";
import { Typography } from "@/components/atoms/Typography";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { BorderRadius, Spacing } from "@/constants/theme";
import { useBudgetDashboard } from "@/features/budget/hooks/useBudgetDashboard";
import STRINGS from "@/i18n/es.json";
import { formatCurrency } from "@/utils/format";
import { useState } from "react";
import {
  LayoutAnimation,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { BarChart } from "react-native-gifted-charts";
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export const BudgetDashboard = () => {
  const insets = useSafeAreaInsets();
  const {
    colors,
    handleReset,
    barData,
    monthName,
    currentYear,
    remainingBudget,
    monthlyIncome,
    totalActualExpense,
    totalActualIncome,
    totalFixedExpenses,
  } = useBudgetDashboard();

  const [isPieExpanded, setIsPieExpanded] = useState(false);
  const [isBarExpanded, setIsBarExpanded] = useState(false);
  const [isStatsExpanded, setIsStatsExpanded] = useState(false);

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{
        paddingHorizontal: Spacing.m,
        paddingBottom: 200 + insets.bottom,
      }}
    >
      <View style={{ marginVertical: Spacing.m }}>
        <Typography variant="h2" weight="bold" style={{ color: colors.text }}>
          {STRINGS.budget.yourBudget}
        </Typography>
        <Typography style={{ color: colors.textSecondary }}>
          {monthName} {currentYear}
        </Typography>
      </View>

      {/* Distribution Card - Collapsible */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.glass.cardBg,
            ...Platform.select({
              ios: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 10,
              },
              android: { elevation: 6 },
            }),
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => {
            LayoutAnimation.configureNext(
              LayoutAnimation.Presets.easeInEaseOut,
            );
            setIsPieExpanded(!isPieExpanded);
          }}
          activeOpacity={0.8}
          style={styles.cardHeader}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Typography variant="h3" weight="bold">
              {STRINGS.budget.distribution}
            </Typography>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            {!isPieExpanded && (
              <Typography
                weight="bold"
                style={{ color: colors.success, fontSize: 16 }}
              >
                {formatCurrency(remainingBudget)}
              </Typography>
            )}
            <IconSymbol
              name={isPieExpanded ? "chevron.up" : "chevron.down"}
              size={16}
              color="#8E8E93"
            />
          </View>
        </TouchableOpacity>

        {isPieExpanded && (
          <Animated.View
            entering={FadeIn.duration(300)}
            exiting={FadeOut.duration(200)}
            layout={LinearTransition}
            style={{ marginTop: Spacing.m }}
          >
            {/* Fixed Expenses Row */}
            <View style={styles.row}>
              <Typography variant="body" style={{ fontSize: 15 }}>
                {STRINGS.budget.fixed}
              </Typography>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                <Typography
                  weight="bold"
                  style={{ color: colors.error, fontSize: 16 }}
                >
                  {formatCurrency(totalFixedExpenses)}
                </Typography>
                <View style={[styles.dot, { backgroundColor: colors.error }]} />
              </View>
            </View>

            <View
              style={{
                height: 1,
                backgroundColor: "#3A3A3C",
                marginVertical: Spacing.s,
              }}
            />

            {/* Remaining Budget Row */}
            <View style={styles.row}>
              <Typography variant="body" style={{ fontSize: 15 }}>
                {STRINGS.budget.free}
              </Typography>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                <Typography
                  weight="bold"
                  style={{ color: colors.success, fontSize: 16 }}
                >
                  {formatCurrency(remainingBudget)}
                </Typography>
                <View
                  style={[styles.dot, { backgroundColor: colors.success }]}
                />
              </View>
            </View>
          </Animated.View>
        )}
      </View>

      {/* Summary Chart Card - Collapsible */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.glass.cardBg,
            ...Platform.select({
              ios: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 10,
              },
              android: { elevation: 6 },
            }),
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => {
            LayoutAnimation.configureNext(
              LayoutAnimation.Presets.easeInEaseOut,
            );
            setIsBarExpanded(!isBarExpanded);
          }}
          activeOpacity={0.8}
          style={styles.cardHeader}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Typography
              variant="h3"
              weight="bold"
              style={{ color: colors.text }}
            >
              {STRINGS.budget.monthlySummary}
            </Typography>
          </View>
          <IconSymbol
            name={isBarExpanded ? "chevron.up" : "chevron.down"}
            size={16}
            color={colors.textSecondary}
          />
        </TouchableOpacity>

        {isBarExpanded && (
          <Animated.View
            entering={FadeIn.duration(300)}
            exiting={FadeOut.duration(200)}
            layout={LinearTransition}
            style={{ marginTop: Spacing.m, alignItems: "center" }}
          >
            <BarChart
              key={`${monthlyIncome}-${totalActualExpense}-${totalActualIncome}`}
              data={barData}
              barWidth={50}
              spacing={40}
              noOfSections={4}
              barBorderRadius={4}
              frontColor="lightgray"
              yAxisThickness={0}
              xAxisThickness={0}
              yAxisLabelWidth={60}
              height={200}
              width={300}
              isAnimated
              hideRules
              maxValue={
                Math.max(
                  monthlyIncome,
                  totalActualExpense,
                  totalActualIncome,
                  100,
                ) * 1.2
              }
              yAxisTextStyle={{ color: colors.textSecondary, fontSize: 10 }}
              xAxisLabelTextStyle={{
                color: colors.textSecondary,
                fontSize: 10,
              }}
            />
          </Animated.View>
        )}
      </View>

      {/* Stats Grid Card - Collapsible */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.glass.cardBg,
            ...Platform.select({
              ios: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 10,
              },
              android: { elevation: 6 },
            }),
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => {
            LayoutAnimation.configureNext(
              LayoutAnimation.Presets.easeInEaseOut,
            );
            setIsStatsExpanded(!isStatsExpanded);
          }}
          activeOpacity={0.8}
          style={styles.cardHeader}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Typography
              variant="h3"
              weight="bold"
              style={{ color: colors.text }}
            >
              Detalles
            </Typography>
          </View>
          <IconSymbol
            name={isStatsExpanded ? "chevron.up" : "chevron.down"}
            size={16}
            color={colors.textSecondary}
          />
        </TouchableOpacity>

        {isStatsExpanded && (
          <Animated.View
            entering={FadeIn.duration(300)}
            exiting={FadeOut.duration(200)}
            layout={LinearTransition}
            style={{ marginTop: Spacing.m }}
          >
            {/* Expected Income */}
            <View style={styles.row}>
              <Typography
                variant="body"
                style={{ color: colors.textSecondary, fontSize: 15 }}
              >
                {STRINGS.budget.expectedIncome}
              </Typography>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                <Typography
                  weight="bold"
                  style={{ color: colors.text, fontSize: 16 }}
                >
                  {formatCurrency(monthlyIncome)}
                </Typography>
                <View style={[styles.dot, { backgroundColor: "#30D158" }]} />
              </View>
            </View>

            {/* Fixed Expenses */}
            <View style={styles.row}>
              <Typography
                variant="body"
                style={{ color: colors.textSecondary, fontSize: 15 }}
              >
                {STRINGS.budget.fixedExpenses}
              </Typography>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                <Typography
                  weight="bold"
                  style={{ color: colors.text, fontSize: 16 }}
                >
                  -{formatCurrency(totalFixedExpenses)}
                </Typography>
                <View style={[styles.dot, { backgroundColor: "#FF453A" }]} />
              </View>
            </View>

            <View
              style={{
                height: 1,
                backgroundColor: "#3A3A3C",
                marginVertical: Spacing.s,
              }}
            />

            {/* Actual Income */}
            <View style={styles.row}>
              <Typography
                variant="body"
                style={{ color: colors.textSecondary, fontSize: 15 }}
              >
                {STRINGS.budget.actualIncome}
              </Typography>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                <Typography
                  weight="bold"
                  style={{ color: colors.text, fontSize: 16 }}
                >
                  {formatCurrency(totalActualIncome)}
                </Typography>
                <View style={[styles.dot, { backgroundColor: "#30D158" }]} />
              </View>
            </View>

            {/* Actual Expenses */}
            <View style={styles.row}>
              <Typography
                variant="body"
                style={{ color: colors.textSecondary, fontSize: 15 }}
              >
                {STRINGS.budget.actualExpense}
              </Typography>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                <Typography
                  weight="bold"
                  style={{ color: colors.text, fontSize: 16 }}
                >
                  -{formatCurrency(totalActualExpense)}
                </Typography>
                <View style={[styles.dot, { backgroundColor: "#FF453A" }]} />
              </View>
            </View>
          </Animated.View>
        )}
      </View>

      <Button
        title={STRINGS.budget.resetBudget}
        variant="outline"
        onPress={handleReset}
        style={{ marginTop: Spacing.xl, borderColor: colors.error }}
        textStyle={{ color: colors.error }}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.l,
    borderRadius: BorderRadius.xl,
    padding: Spacing.m,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
