import { IconSymbol } from "@/components/ui/icon-symbol";
import { BorderRadius, Spacing } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";
import STRINGS from "@/i18n/es.json";
import { formatCurrency } from "@/utils/format";
import React from "react";
import {
  Alert,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import Swipeable from "react-native-gesture-handler/Swipeable";
import { Typography } from "../atoms/Typography";

interface TransactionItemProps {
  id: string;
  amount: number;
  description: string;
  date: number;
  type: "income" | "expense" | "transfer";
  category?: string | null;
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
  const { colors } = useTheme();

  const isIncome = type === "income";
  const isTransfer = type === "transfer";

  const iconColor = isIncome
    ? colors.success
    : isTransfer
      ? colors.text
      : colors.error;

  // Extract emoji from category string (e.g. "🍔 Comida" -> "🍔")
  const emoji = category ? category.slice(0, 2) : null;

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

  const renderRightActions = () => {
    if (!onDelete) return null;
    return (
      <TouchableOpacity
        onPress={() => onDelete(id)}
        style={{
          backgroundColor: colors.error,
          justifyContent: "center",
          alignItems: "center",
          width: 80,
          height: "100%",
          borderTopRightRadius: BorderRadius.m,
          borderBottomRightRadius: BorderRadius.m,
        }}
      >
        <IconSymbol name="trash.fill" size={24} color="#FFF" />
      </TouchableOpacity>
    );
  };

  return (
    <Swipeable
      renderRightActions={renderRightActions}
      containerStyle={{ marginBottom: Spacing.s }}
    >
      <TouchableOpacity
        onPress={onPress}
        onLongPress={handleLongPress}
        activeOpacity={0.7}
        delayLongPress={500}
        style={{
          borderRadius: BorderRadius.xl, // More rounded
          backgroundColor: colors.surface,
          padding: Spacing.s, // Internal padding for the "card" feel
          // Subtle shadow
          ...Platform.select({
            ios: {
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
            },
            android: {
              elevation: 2,
            },
          }),
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          {/* Icon Container - Larger and fully round */}
          <View
            style={[
              styles.iconContainer,
              {
                backgroundColor: isIncome
                  ? "rgba(0, 242, 96, 0.1)"
                  : isTransfer
                    ? "rgba(128, 128, 128, 0.1)"
                    : "rgba(255, 65, 108, 0.1)",
                width: 42,
                height: 42,
                borderRadius: 21,
                justifyContent: "center",
                alignItems: "center",
                marginRight: Spacing.m,
              },
            ]}
          >
            {isTransfer ? (
              <IconSymbol
                name="arrow.right.arrow.left"
                size={18}
                color={iconColor}
              />
            ) : emoji ? (
              <Typography style={{ fontSize: 20 }}>{emoji}</Typography>
            ) : (
              <IconSymbol
                name={isIncome ? "arrow.down.left" : "arrow.up.right"}
                size={20}
                color={iconColor}
              />
            )}
          </View>

          {/* Content */}
          <View style={{ flex: 1, justifyContent: "center" }}>
            <Typography
              variant="body"
              weight="bold"
              style={{
                fontSize: 16,
                marginBottom: 2,
                color: colors.text,
              }}
              numberOfLines={1}
            >
              {description}
            </Typography>
            <Typography
              variant="caption"
              style={{
                color: colors.textSecondary,
                fontSize: 13,
              }}
            >
              {category ? category.replace(emoji || "", "").trim() : "General"}
            </Typography>
          </View>

          {/* Right Side - Amount Pill/Text */}
          <View style={{ alignItems: "flex-end" }}>
            <View
              style={{
                backgroundColor: isIncome
                  ? "rgba(0, 242, 96, 0.15)" // Green pill for income
                  : isTransfer
                    ? "rgba(128, 128, 128, 0.15)" // Gray pill for transfer
                    : "rgba(255, 65, 108, 0.15)", // Red pill for expense
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 12,
              }}
            >
              <Typography
                variant="body"
                weight="bold"
                style={{
                  color: isIncome
                    ? colors.success
                    : isTransfer
                      ? colors.text
                      : colors.error,
                  fontSize: 14,
                }}
              >
                {isIncome ? "+" : isTransfer ? "" : "-"}
                {formatCurrency(amount)}
              </Typography>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  // Removed old container styles as they are inline now for simplicity/overriding
  iconContainer: {
    // Base styles handled inline
  },
});
