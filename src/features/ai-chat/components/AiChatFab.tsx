import { GlassSurface } from "@/components/atoms/GlassSurface";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { BorderRadius, Spacing } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";
import STRINGS from "@/i18n/es.json";
import React from "react";
import { Pressable, StyleSheet } from "react-native";

interface AiChatFabProps {
  onPress: () => void;
}

/**
 * FAB de una sola acción para lanzar el chat de IA desde Dashboard — mismo
 * estilo de superficie flotante que el FAB de `FloatingActionMenu`, pero sin
 * menú desplegable (aquí hay una sola acción). El botón entero es el área de
 * toque, así que lleva `isInteractive`.
 */
const FAB_SIZE = 56;
const FAB_INSET_RIGHT = Spacing.l;
const FAB_INSET_BOTTOM = Spacing.xxl * 2;

export function AiChatFab({ onPress }: AiChatFabProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={STRINGS.aiChat.fabLabel}
      style={styles.position}
    >
      <GlassSurface
        style={styles.fab}
        isInteractive
        tintColor={colors.primary}
        fallbackStyle={[
          styles.flatFab,
          { backgroundColor: colors.primary, shadowColor: colors.primary },
        ]}
      >
        <IconSymbol name="sparkles" size={26} color={colors.onPrimary} />
      </GlassSurface>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  position: {
    position: "absolute",
    bottom: FAB_INSET_BOTTOM,
    right: FAB_INSET_RIGHT,
    zIndex: 1000,
  },
  /** Forma del FAB, común a la variante con cristal y a la plana. */
  fab: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: BorderRadius.round,
    alignItems: "center",
    justifyContent: "center",
  },
  /** Relleno opaco + sombra: solo cuando no hay cristal. */
  flatFab: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
});
