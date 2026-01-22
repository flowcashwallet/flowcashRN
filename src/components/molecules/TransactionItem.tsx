import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors, Spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import STRINGS from "@/i18n/es.json";
import { formatCurrency } from "@/utils/format";
import React from "react";
import { Alert, StyleSheet, TouchableOpacity, View } from "react-native";
import { Typography } from "../atoms/Typography";

interface TransactionItemProps {
  id: string;
  amount: number;
  description: string;
  date: number;
  type: "income" | "expense";
  category?: string;
  onDelete?: (id: string) => void;
  onPress?: () => void;
}

export function TransactionItem({
  id,
  amount,
  description,
  date,
  type,
  category,
  onDelete,
  onPress,
}: TransactionItemProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const isIncome = type === "income";
  const iconColor = isIncome ? colors.success : colors.error;

  // Extract emoji from category string (e.g. "🍔 Comida" -> "🍔")
  const emoji = category ? category.split(" ")[0] : null;

  const handleLongPress = () => {
    if (onDelete) {
      Alert.alert(
        STRINGS.wallet.deleteTransactionTitle,
        STRINGS.wallet.deleteTransactionMessage,
        [
          { text: STRINGS.common.cancel, style: "cancel" },
          {
            text: STRINGS.common.delete,
            style: "destructive",
            onPress: () => onDelete(id),
          },
        ],
      );
    }
  };

  return (
    <TouchableOpacity
      style={[styles.container, { borderBottomColor: colors.border }]}
      onPress={onPress}
      onLongPress={handleLongPress}
      activeOpacity={0.7}
      delayLongPress={500}
    >
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: isIncome ? "#E6F8EF" : "#FFEBE6" },
        ]}
      >
        {emoji ? (
          <Typography variant="h3">{emoji}</Typography>
        ) : (
          <IconSymbol
            name={isIncome ? "arrow.down.left" : "arrow.up.right"}
            size={24}
            color={iconColor}
          />
        )}
      </View>

      <View style={styles.content}>
        <Typography variant="body" weight="medium">
          {description}
        </Typography>
        <Typography variant="caption" style={{ color: colors.icon }}>
          {category ? category : new Date(date).toLocaleDateString()}
        </Typography>
      </View>

      <View style={styles.rightContainer}>
        <Typography
          variant="body"
          weight="bold"
          style={{
            color: isIncome ? colors.success : colors.error,
            marginBottom: 4,
          }}
        >
          {isIncome ? "+" : "-"}
          {formatCurrency(amount).replace("$", "")}
        </Typography>
        {onDelete && (
          <TouchableOpacity
            onPress={() => onDelete(id)}
            style={styles.deleteButton}
          >
            <IconSymbol name="trash.fill" size={20} color={colors.icon} />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.m,
    borderBottomWidth: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.m,
  },
  content: {
    flex: 1,
  },
  rightContainer: {
    alignItems: "flex-end",
  },
  deleteButton: {
    padding: 4,
  },
});
