import { Typography } from "@/components/atoms/Typography";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { BorderRadius, Colors, Spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import STRINGS from "@/i18n/es.json";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

interface QuickActionsProps {
  onPressIncome: () => void;
  onPressExpense: () => void;
  onPressCategories: () => void;
  onPressSubscriptions: () => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  onPressIncome,
  onPressExpense,
  onPressCategories,
  onPressSubscriptions,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  return (
    <View style={styles.actions}>
      <TouchableOpacity
        onPress={onPressIncome}
        style={{ flex: 1, marginRight: Spacing.s }}
        activeOpacity={0.8}
      >
        <View
          style={{
            backgroundColor: "rgba(0, 242, 96, 0.1)",
            borderColor: colors.success,
            borderWidth: 1,
            paddingVertical: Spacing.m,
            alignItems: "center",
            borderRadius: BorderRadius.m,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <IconSymbol
              name="arrow.down.left"
              size={20}
              color={colors.success}
            />
            <Typography
              variant="body"
              weight="bold"
              style={{ color: colors.success }}
            >
              {STRINGS.wallet.income}
            </Typography>
          </View>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onPressExpense}
        style={{ flex: 1, marginHorizontal: Spacing.s }}
        activeOpacity={0.8}
      >
        <View
          style={{
            backgroundColor: "rgba(255, 65, 108, 0.1)",
            borderColor: colors.error,
            borderWidth: 1,
            paddingVertical: Spacing.m,
            alignItems: "center",
            borderRadius: BorderRadius.m,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <IconSymbol name="arrow.up.right" size={20} color={colors.error} />
            <Typography
              variant="body"
              weight="bold"
              style={{ color: colors.error }}
            >
              {STRINGS.wallet.expense}
            </Typography>
          </View>
        </View>
      </TouchableOpacity>

      <View style={{ flex: 0.5, gap: Spacing.xs }}>
        <TouchableOpacity
          onPress={onPressCategories}
          style={{ flex: 1, marginLeft: Spacing.s }}
          activeOpacity={0.8}
        >
          <View
            style={{
              backgroundColor: "rgba(76, 201, 240, 0.1)",
              borderColor: colors.primary,
              borderWidth: 1,
              paddingVertical: Spacing.s,
              alignItems: "center",
              borderRadius: BorderRadius.s,
            }}
          >
            <IconSymbol name="list.bullet" size={16} color={colors.primary} />
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onPressSubscriptions}
          style={{ flex: 1, marginLeft: Spacing.s }}
          activeOpacity={0.8}
        >
          <View
            style={{
              backgroundColor: "rgba(255, 206, 86, 0.1)",
              borderColor: "#FFCE56",
              borderWidth: 1,
              paddingVertical: Spacing.s,
              alignItems: "center",
              borderRadius: BorderRadius.s,
            }}
          >
            <IconSymbol name="arrow.triangle.2.circlepath" size={16} color="#FFCE56" />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  actions: {
    flexDirection: "row",
    marginBottom: Spacing.xl,
  },
});
