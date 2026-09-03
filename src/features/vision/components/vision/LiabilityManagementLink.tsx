import { GlassSurface } from "@/components/atoms/GlassSurface";
import { Typography } from "@/components/atoms/Typography";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { BorderRadius, Spacing } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

interface LiabilityManagementLinkProps {
  onPress: () => void;
}

/**
 * Acceso a "Gestión de pagos" desde la pestaña de pasivos.
 *
 * Botón flotante con superficie propia → cristal en iOS 26+ y `surface` +
 * hairline sin él. El `TouchableOpacity` queda **fuera** de la superficie con el
 * layout de la fila, y el `GlassSurface` dentro con el padding, igual que el
 * botón "Ver detalles por semana" de Dashboard.
 */
export const LiabilityManagementLink: React.FC<
  LiabilityManagementLinkProps
> = ({ onPress }) => {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        accessibilityRole="button"
      >
        <GlassSurface
          style={styles.button}
          isInteractive
          fallbackStyle={[
            styles.flatButton,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <IconSymbol
            name="calendar.badge.checkmark"
            size={16}
            color={colors.icon}
          />
          <Typography variant="button">Gestión de pagos</Typography>
        </GlassSurface>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: Spacing.m,
  },
  /** Layout del botón, común a la variante con cristal y a la plana. */
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.s,
    borderRadius: BorderRadius.round,
    overflow: "hidden",
  },
  /** Fondo opaco + hairline: solo cuando no hay cristal. */
  flatButton: {
    borderWidth: StyleSheet.hairlineWidth,
  },
});
