import { GlassSurface } from "@/components/atoms/GlassSurface";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { BorderRadius, Spacing } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";
import STRINGS from "@/i18n/es.json";
import { formatCurrency } from "@/utils/format";
import React from "react";
import { Alert, StyleSheet, TouchableOpacity, View } from "react-native";
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

/**
 * Fila del libro contable.
 *
 * Es el elemento firma de la app (ver "Dirección estética" en
 * `docs/refactor-plan.md`): superficie plana, separación por hairline en lugar
 * de card con sombra, e importe en `variant="number"` (dígitos tabulares,
 * alineado a la derecha) para que la columna de importes cuadre al hacer scroll.
 *
 * El signo del dinero va codificado en color: `success` para ingreso,
 * `expense` para gasto. `expense` **no** es `error` — es el rojo desaturado de
 * la tinta roja contable, que se lee como "sale dinero" y no como alarma;
 * `error` queda reservado para lo que de verdad está mal.
 *
 * En iOS 26+ la superficie de la fila la pone `GlassSurface` (Liquid Glass
 * nativo); en Android/web y en cualquier iOS sin soporte o con la
 * transparencia reducida, la misma fila plana con hairline.
 */
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

  const amountColor = isIncome
    ? colors.success
    : isTransfer
      ? colors.text
      : colors.expense;
  const sign = isIncome ? "+" : isTransfer ? "" : "−";

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
        accessibilityRole="button"
        accessibilityLabel={STRINGS.common.delete}
        style={[styles.deleteAction, { backgroundColor: colors.error }]}
      >
        {/* `surface` es el token que contrasta contra `error` en ambos temas. */}
        <IconSymbol name="trash.fill" size={24} color={colors.surface} />
      </TouchableOpacity>
    );
  };

  return (
    <Swipeable renderRightActions={renderRightActions}>
      <TouchableOpacity
        onPress={onPress}
        onLongPress={handleLongPress}
        activeOpacity={0.7}
        delayLongPress={500}
      >
        <GlassSurface
          style={styles.row}
          isInteractive={onPress !== undefined}
          fallbackStyle={[
            styles.flatRow,
            {
              // Opaco y del color de la pantalla: no es una card, es la fila
              // tapando la acción de borrado que hay debajo al deslizar.
              backgroundColor: colors.background,
              borderBottomColor: colors.border,
              borderRadius: BorderRadius.round,
            },
          ]}
        >
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: colors.surfaceHighlight },
            ]}
          >
            {isTransfer ? (
              <IconSymbol
                name="arrow.right.arrow.left"
                size={20}
                color={colors.icon}
              />
            ) : emoji ? (
              <Typography variant="body">{emoji}</Typography>
            ) : (
              <IconSymbol
                name={isIncome ? "arrow.down.left" : "arrow.up.right"}
                size={20}
                color={isIncome ? colors.success : colors.icon}
              />
            )}
          </View>

          <View style={styles.copy}>
            <Typography variant="body" weight="semibold" numberOfLines={1}>
              {description}
            </Typography>
            <Typography variant="caption" muted numberOfLines={1}>
              {category ? category.replace(emoji || "", "").trim() : "General"}
            </Typography>
          </View>

          <Typography variant="number" style={{ color: amountColor }}>
            {sign}
            {formatCurrency(amount)}
          </Typography>
        </GlassSurface>
      </TouchableOpacity>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  /** Layout de la fila, común a la variante con cristal y a la plana. */
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.s,
    borderRadius: BorderRadius.round,
    marginHorizontal: Spacing.m,
  },
  /**
   * Tratamiento de fondo de la fila **sin** cristal. Con `GlassView` activo el
   * material del sistema ya separa una fila de la siguiente, así que el
   * hairline sobra y el fondo opaco taparía el propio efecto.
   */
  flatRow: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.round,
    justifyContent: "center",
    alignItems: "center",
  },
  copy: {
    flex: 1,
  },
  deleteAction: {
    justifyContent: "center",
    alignItems: "center",
    width: 80,
    height: "100%",
  },
});
