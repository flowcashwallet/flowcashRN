import { Typography } from "@/components/atoms/Typography";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Spacing, ThemeColors } from "@/constants/theme";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { EdgeInsets } from "react-native-safe-area-context";

interface CategoriesHeaderProps {
  insets: EdgeInsets;
  colors: ThemeColors;
  onGoBack: () => void;
  onAdd: () => void;
}

export function CategoriesHeader({
  insets,
  colors,
  onGoBack,
  onAdd,
}: CategoriesHeaderProps) {
  return (
    <View
      style={[
        styles.header,
        {
          paddingTop: insets.top,
          backgroundColor: colors.background,
          borderBottomColor: colors.border,
        },
      ]}
    >
      <Pressable
        onPress={onGoBack}
        hitSlop={Spacing.m}
        accessibilityRole="button"
        accessibilityLabel="Volver"
        style={({ pressed }) => [
          styles.headerButton,
          pressed && styles.pressed,
        ]}
      >
        <IconSymbol name="arrow.left" size={24} color={colors.icon} />
      </Pressable>

      <Typography variant="subheading">Categorías</Typography>

      <Pressable
        onPress={onAdd}
        hitSlop={Spacing.m}
        accessibilityRole="button"
        accessibilityLabel="Agregar categoría"
        style={({ pressed }) => [
          styles.headerButton,
          pressed && styles.pressed,
        ]}
      >
        <IconSymbol name="plus" size={24} color={colors.primary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.s,
    paddingBottom: Spacing.s,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  // El feedback de press es opacidad, no escala (ver "Movimiento").
  pressed: {
    opacity: 0.6,
  },
});
