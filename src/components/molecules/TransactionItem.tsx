import { IconSymbol } from "@/components/ui/icon-symbol";
import { BorderRadius, Colors, Spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
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
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

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
          borderRadius: BorderRadius.m,
          backgroundColor: colors.surface,
          ...Platform.select({
            ios: {
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
            },
            android: {
              elevation: 4,
            },
          }),
        }}
      >
        <View
          style={{
            flexDirection: "row",
            overflow: "hidden",
            borderRadius: BorderRadius.m,
          }}
        >
          {/* Side Indicator */}
          <View
            style={{
              width: 6,
              backgroundColor: isIncome
                ? colors.success
                : isTransfer
                  ? colors.text
                  : colors.error,
            }}
          />

          <View
            style={[
              styles.container,
              {
                backgroundColor: colors.surface,
                flex: 1,
                borderBottomWidth: 0,
              },
            ]}
          >
            <View
              style={[
                styles.iconContainer,
                {
                  backgroundColor: isIncome
                    ? "rgba(0, 242, 96, 0.1)"
                    : isTransfer
                      ? "rgba(128, 128, 128, 0.1)"
                      : "rgba(255, 65, 108, 0.1)",
                },
              ]}
            >
              {emoji ? (
                <Typography variant="h3">{emoji}</Typography>
              ) : (
                <IconSymbol
                  name={
                    isIncome
                      ? "arrow.down.left"
                      : isTransfer
                        ? "arrow.right"
                        : "arrow.up.right"
                  }
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
                  color: isIncome
                    ? colors.success
                    : isTransfer
                      ? colors.text
                      : colors.error,
                  marginBottom: 4,
                }}
              >
                {isIncome ? "+" : "-"}
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
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.m,
    paddingHorizontal: Spacing.m, // Add horizontal padding since we are inside a card now
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
