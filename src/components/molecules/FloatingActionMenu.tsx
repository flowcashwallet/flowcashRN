import {
  GlassSurface,
  useGlassSurfaceActive,
} from "@/components/atoms/GlassSurface";
import { Typography } from "@/components/atoms/Typography";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { BorderRadius, Motion, Spacing } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import { Modal, Pressable, StyleSheet, TouchableOpacity } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

interface ActionItem {
  id: string;
  label: string;
  icon: string;
  onPress: () => void;
  color?: string;
}

interface FloatingActionMenuProps {
  actions: ActionItem[];
}

/** Botón flotante: 56pt es la medida de acción principal en iOS y Android. */
const FAB_SIZE = 56;
/** Separación del FAB respecto al borde de pantalla y a la barra de tabs. */
const FAB_INSET_RIGHT = Spacing.l;
const FAB_INSET_BOTTOM = Spacing.xxl * 2;
/** Ancho del menú desplegable: cabe la etiqueta más larga sin partirse. */
const MENU_WIDTH = 220;

/**
 * FAB de acciones con su menú desplegable.
 *
 * Ambos son superficie flotante, así que en iOS 26+ ambos son Liquid Glass
 * **nativo** vía `GlassSurface` (ver "Liquid Glass nativo en iOS" en
 * `docs/refactor-plan.md`). El menú usaba antes un `BlurView` de `expo-blur`
 * —vidrio falso, con `intensity={0}` en Android para desactivarlo—; eso es
 * exactamente lo que la dirección estética descartó. Sin soporte de la API (o
 * con "reducir transparencia") ambos vuelven a su relleno opaco de token.
 *
 * El backdrop **no** lleva cristal: tiene que oscurecer lo de detrás.
 */
export function FloatingActionMenu({ actions }: FloatingActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { colors } = useTheme();
  const glassActive = useGlassSurfaceActive();

  const toggleMenu = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsOpen(!isOpen);
  };

  const handlePress = (action: ActionItem) => {
    Haptics.selectionAsync();
    setIsOpen(false);
    // Small delay to allow close animation to start/finish smoothly
    setTimeout(() => {
      action.onPress();
    }, 100);
  };

  return (
    <>
      <Modal visible={isOpen} transparent animationType="none">
        <Pressable style={styles.overlay} onPress={toggleMenu}>
          <Animated.View
            entering={FadeIn.duration(Motion.enter)}
            exiting={FadeOut.duration(Motion.exit)}
            style={styles.backdrop}
          />
        </Pressable>

        {/*
          El menú se abre por encima del FAB, nunca solapándolo: dos superficies
          de cristal superpuestas se suman y el material deja de leerse.
          `entering`/`exiting` se saltan cuando hay cristal porque el fundido
          arranca en `opacity: 0`, que rompe el `GlassView` (caveat del paquete).
        */}
        <Animated.View
          entering={glassActive ? undefined : FadeIn.duration(Motion.enter)}
          exiting={glassActive ? undefined : FadeOut.duration(Motion.exit)}
          style={styles.menuPosition}
        >
          <GlassSurface
            style={styles.menu}
            fallbackStyle={[
              styles.flatMenu,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            {actions.map((action, index) => (
              <TouchableOpacity
                key={action.id}
                onPress={() => handlePress(action)}
                accessibilityRole="button"
                accessibilityLabel={action.label}
                style={[
                  styles.actionItem,
                  index < actions.length - 1 && {
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: colors.border,
                  },
                ]}
              >
                <Typography variant="body" weight="medium">
                  {action.label}
                </Typography>
                <IconSymbol
                  name={action.icon as any}
                  size={20}
                  color={action.color || colors.text}
                />
              </TouchableOpacity>
            ))}
          </GlassSurface>
        </Animated.View>
      </Modal>

      <Pressable
        onPress={toggleMenu}
        accessibilityRole="button"
        accessibilityLabel={isOpen ? "Cerrar acciones" : "Abrir acciones"}
        style={styles.fabPosition}
      >
        <GlassSurface
          style={styles.fab}
          isInteractive
          // El tinte sale del token, nunca de un hex: es el mismo verde/teal que
          // tenía el relleno opaco, filtrado por el material del sistema.
          tintColor={colors.primary}
          fallbackStyle={[
            styles.flatFab,
            {
              backgroundColor: colors.primary,
              shadowColor: colors.primary,
            },
          ]}
        >
          <Animated.View
            style={[
              styles.fabIcon,
              { transform: [{ rotate: isOpen ? "45deg" : "0deg" }] },
            ]}
          >
            {/* `onPrimary`, no `#FFFFFF`: en claro `primary` es un verde claro
                y el blanco encima no pasa AA. */}
            <IconSymbol name="plus" size={30} color={colors.onPrimary} />
          </Animated.View>
        </GlassSurface>
      </Pressable>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    alignItems: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    // Negro de backdrop: la única excepción de color literal que permite la
    // dirección estética. Más suave que el de `BottomSheet` a propósito — es un
    // menú contextual, no un sheet que se apropia de la pantalla.
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  /** Coloca el menú justo encima del FAB y alineado a su borde derecho. */
  menuPosition: {
    position: "absolute",
    right: FAB_INSET_RIGHT,
    bottom: FAB_INSET_BOTTOM + FAB_SIZE + Spacing.s,
    width: MENU_WIDTH,
  },
  /** Forma del menú, común a la variante con cristal y a la plana. */
  menu: {
    borderRadius: BorderRadius.l,
    overflow: "hidden",
    paddingVertical: Spacing.xs,
  },
  /**
   * Relleno opaco + hairline + sombra: solo cuando no hay cristal. El negro de
   * la sombra es la otra excepción de literal que permite la dirección.
   */
  flatMenu: {
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  actionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between", // Text left, Icon right (iOS style)
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.m,
  },
  fabPosition: {
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
    justifyContent: "center",
    alignItems: "center",
  },
  /**
   * Relleno opaco + sombra: solo cuando no hay cristal. Con `GlassView` el
   * sistema pinta su propia sombra, y una segunda encima se ve sucia.
   */
  flatFab: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  fabIcon: {
    justifyContent: "center",
    alignItems: "center",
  },
});
