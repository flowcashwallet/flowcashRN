import { Card } from "@/components/atoms/Card";
import { Typography } from "@/components/atoms/Typography";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors, Spacing } from "@/constants/theme";
import { MonthYearPickerModal } from "@/features/wallet/components/MonthYearPickerModal";
import { useColorScheme } from "@/hooks/use-color-scheme";
import React, { useState } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useAnalyticsData } from "../hooks/useAnalyticsData";

const FontSize = {
  xs: 12,
  s: 14,
  m: 16,
  l: 20,
  xl: 24,
};

export default function AnalyticsScreen() {
  const {
    recurringExpenses,
    topCategories,
    financialTips,
    selectedDate,
    setSelectedDate,
    currentMonthName,
    currentYear,
  } = useAnalyticsData();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const [datePickerVisible, setDatePickerVisible] = useState(false);

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Month Selector Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: Spacing.m,
          }}
        >
          <TouchableOpacity
            style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            onPress={() => setDatePickerVisible(true)}
          >
            <Typography
              variant="h2"
              weight="bold"
              style={{ color: colors.text }}
            >
              {currentMonthName}{" "}
              {currentYear !== new Date().getFullYear() ? currentYear : ""}
            </Typography>
            <IconSymbol name="chevron.down" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Consejos */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Consejos para ti
          </Text>
          {financialTips.map((tip, index) => (
            <Card key={index} variant="outlined" style={styles.tipCard}>
              <IconSymbol
                name="lightbulb.fill"
                size={24}
                color={colors.primary}
              />
              <Text style={[styles.tipText, { color: colors.text }]}>
                {tip}
              </Text>
            </Card>
          ))}
        </View>

        {/* Gastos Recurrentes */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Gastos Recurrentes
          </Text>
          <Card variant="elevated">
            {recurringExpenses.length === 0 ? (
              <Text
                style={{
                  color: colors.textSecondary,
                  textAlign: "center",
                  padding: Spacing.s,
                }}
              >
                No se encontraron gastos recurrentes aún.
              </Text>
            ) : (
              recurringExpenses.map((expense, index) => (
                <View
                  key={index}
                  style={[
                    styles.rowItem,
                    { borderBottomColor: colors.border },
                    index === recurringExpenses.length - 1 && {
                      borderBottomWidth: 0,
                    },
                  ]}
                >
                  <View style={styles.rowContent}>
                    <Text style={[styles.itemTitle, { color: colors.text }]}>
                      {expense.description}
                    </Text>
                    <Text
                      style={[
                        styles.itemSubtitle,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {expense.count} transacciones
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={[styles.amount, { color: colors.text }]}>
                      ${expense.averageAmount.toFixed(2)}
                    </Text>
                    <Text
                      style={[
                        styles.itemSubtitle,
                        { color: colors.textSecondary, fontSize: 10 },
                      ]}
                    >
                      promedio
                    </Text>
                  </View>
                </View>
              ))
            )}
          </Card>
        </View>

        {/* Top Categorías */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Top Categorías
          </Text>
          <Card variant="elevated">
            {topCategories.length === 0 ? (
              <Text
                style={{
                  color: colors.textSecondary,
                  textAlign: "center",
                  padding: Spacing.s,
                }}
              >
                No hay datos suficientes.
              </Text>
            ) : (
              topCategories.map((cat, index) => (
                <View
                  key={index}
                  style={[
                    styles.categoryItem,
                    index === topCategories.length - 1 && { marginBottom: 0 },
                  ]}
                >
                  <View style={styles.categoryHeader}>
                    <Text style={[styles.categoryName, { color: colors.text }]}>
                      {cat.category}
                    </Text>
                    <Text
                      style={[styles.categoryAmount, { color: colors.text }]}
                    >
                      ${cat.totalAmount.toFixed(2)}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.progressBarBackground,
                      { backgroundColor: colors.background },
                    ]}
                  >
                    <View
                      style={[
                        styles.progressBarFill,
                        {
                          backgroundColor: colors.primary,
                          width: `${cat.percentage}%`,
                        },
                      ]}
                    />
                  </View>
                  <Text
                    style={[styles.percentage, { color: colors.textSecondary }]}
                  >
                    {cat.percentage.toFixed(1)}% del total
                  </Text>
                </View>
              ))
            )}
          </Card>
        </View>
      </ScrollView>
      <MonthYearPickerModal
        visible={datePickerVisible}
        onClose={() => setDatePickerVisible(false)}
        selectedDate={selectedDate}
        onSelect={setSelectedDate}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.m,
    paddingBottom: 100,
  },
  section: {
    marginBottom: Spacing.l,
  },
  sectionTitle: {
    fontSize: FontSize.l,
    fontWeight: "bold",
    marginBottom: Spacing.m,
  },
  tipCard: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.s,
    gap: Spacing.m,
  },
  tipText: {
    flex: 1,
    fontSize: FontSize.m,
    lineHeight: 22,
  },
  rowItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.m,
    borderBottomWidth: 1,
  },
  rowContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: FontSize.m,
    fontWeight: "600",
  },
  itemSubtitle: {
    fontSize: FontSize.s,
    marginTop: 4,
  },
  amount: {
    fontSize: FontSize.m,
    fontWeight: "700",
  },
  categoryItem: {
    marginBottom: Spacing.l,
  },
  categoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  categoryName: {
    fontSize: FontSize.m,
    fontWeight: "500",
  },
  categoryAmount: {
    fontSize: FontSize.m,
    fontWeight: "600",
  },
  progressBarBackground: {
    height: 10,
    borderRadius: 5,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 5,
  },
  percentage: {
    fontSize: FontSize.xs,
    marginTop: 4,
    textAlign: "right",
  },
});
