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

  const ActionButton = ({
    icon,
    label,
    color,
    onPress,
    bgColor,
  }: {
    icon: string;
    label: string;
    color: string;
    onPress: () => void;
    bgColor: string;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      style={{ flex: 1, alignItems: "center", gap: Spacing.xs }}
      activeOpacity={0.7}
    >
      <View
        style={{
          width: 50,
          height: 50,
          borderRadius: BorderRadius.l,
          backgroundColor: bgColor,
          justifyContent: "center",
          alignItems: "center",
          borderWidth: 1,
          borderColor: color,
        }}
      >
        <IconSymbol name={icon as any} size={24} color={color} />
      </View>
      <Typography
        variant="caption"
        weight="medium"
        style={{ color: colors.text }}
      >
        {label}
      </Typography>
    </TouchableOpacity>
  );

  return (
    <View style={styles.actions}>
      <ActionButton
        icon="arrow.down.left"
        label={STRINGS.wallet.income}
        color={colors.success}
        bgColor="rgba(0, 242, 96, 0.1)"
        onPress={onPressIncome}
      />
      <ActionButton
        icon="arrow.up.right"
        label={STRINGS.wallet.expense}
        color={colors.error}
        bgColor="rgba(255, 65, 108, 0.1)"
        onPress={onPressExpense}
      />
      <ActionButton
        icon="list.bullet"
        label="Categorías"
        color={colors.primary}
        bgColor="rgba(76, 201, 240, 0.1)"
        onPress={onPressCategories}
      />
      <ActionButton
        icon="arrow.triangle.2.circlepath"
        label="Suscrip."
        color="#FFCE56"
        bgColor="rgba(255, 206, 86, 0.1)"
        onPress={onPressSubscriptions}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  actions: {
    flexDirection: "row",
    marginBottom: Spacing.xl,
  },
});
