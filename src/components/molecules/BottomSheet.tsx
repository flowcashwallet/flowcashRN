import { Typography } from "@/components/atoms/Typography";
import { IconSymbol } from "@/components/ui/icon-symbol";
import {
  BackdropOpacity,
  BorderRadius,
  Motion,
  Spacing,
} from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Dimensions,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const SHEET_TRAVEL = Dimensions.get("window").height;

export interface BottomSheetProps {
  visible: boolean;
  /** Se llama al pulsar el backdrop, la X, o el botón atrás de Android. */
  onClose: () => void;
  /** Título del header. Si se omite (y no hay `headerRight`), no se pinta header. */
  title?: string;
  /** Slot a la derecha del header, en lugar del botón de cerrar por defecto. */
  headerRight?: React.ReactNode;
  /** Oculta el botón de cerrar por defecto (p. ej. si el sheet tiene su propio CTA). */
  hideCloseButton?: boolean;
  /** Desactiva el cierre al pulsar el backdrop, para flujos destructivos. */
  dismissOnBackdropPress?: boolean;
  /** Estilo extra para el contenedor del sheet (p. ej. `maxHeight`). */
  style?: StyleProp<ViewStyle>;
  /** Estilo extra para el área de contenido, debajo del header. */
  contentStyle?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

/**
 * Sheet inferior compartido de FlowCash.
 *
 * Es la primitiva única para todo lo que aparece desde abajo: pickers, filtros,
 * formularios cortos y detalles. Aporta backdrop con press-to-dismiss, animación
 * de entrada/salida con las duraciones de `Motion`, safe area inferior y un
 * header opcional con botón de cerrar. Todo el color sale de tokens del tema.
 *
 * Respeta "reducir movimiento": en ese caso el sheet aparece con fundido en lugar
 * de deslizarse.
 *
 * Los modales existentes se migran a esta primitiva en los pases visuales por
 * pantalla; ver el tracker en `docs/refactor-plan.md`.
 */
export function BottomSheet({
  visible,
  onClose,
  title,
  headerRight,
  hideCloseButton = false,
  dismissOnBackdropPress = true,
  style,
  contentStyle,
  children,
}: BottomSheetProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  // `Modal` se desmonta al terminar la animación de salida, no cuando `visible`
  // pasa a false, para que el sheet se vea salir.
  const [mounted, setMounted] = useState(visible);
  const [reduceMotion, setReduceMotion] = useState(false);

  const progress = useRef(new Animated.Value(visible ? 1 : 0)).current;

  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (active) setReduceMotion(enabled);
    });
    const sub = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduceMotion,
    );
    return () => {
      active = false;
      sub.remove();
    };
  }, []);

  useEffect(() => {
    if (visible) setMounted(true);

    const animation = Animated.timing(progress, {
      toValue: visible ? 1 : 0,
      duration: visible ? Motion.enter : Motion.exit,
      easing: visible ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
      useNativeDriver: true,
    });

    animation.start(({ finished }) => {
      if (finished && !visible) setMounted(false);
    });

    return () => animation.stop();
  }, [visible, progress]);

  const handleBackdropPress = useCallback(() => {
    if (dismissOnBackdropPress) onClose();
  }, [dismissOnBackdropPress, onClose]);

  const backdropStyle = {
    opacity: progress.interpolate({
      inputRange: [0, 1],
      outputRange: [0, BackdropOpacity],
    }),
  };

  const sheetStyle = reduceMotion
    ? { opacity: progress }
    : {
        transform: [
          {
            translateY: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [SHEET_TRAVEL, 0],
            }),
          },
        ],
      };

  const showHeader = Boolean(title) || Boolean(headerRight) || !hideCloseButton;

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={handleBackdropPress}
          accessibilityRole="button"
          accessibilityLabel="Cerrar"
        >
          <Animated.View
            style={[styles.backdrop, backdropStyle]}
            pointerEvents="none"
          />
        </Pressable>

        <Animated.View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              paddingBottom: insets.bottom + Spacing.m,
            },
            sheetStyle,
            style,
          ]}
        >
          <View style={styles.grabberRow} pointerEvents="none">
            <View
              style={[styles.grabber, { backgroundColor: colors.border }]}
            />
          </View>

          {showHeader ? (
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <View style={styles.headerTitle}>
                {title ? (
                  <Typography variant="subheading" numberOfLines={1}>
                    {title}
                  </Typography>
                ) : null}
              </View>

              {headerRight ??
                (hideCloseButton ? null : (
                  <Pressable
                    onPress={onClose}
                    hitSlop={Spacing.s}
                    accessibilityRole="button"
                    accessibilityLabel="Cerrar"
                    style={({ pressed }) => [
                      styles.closeButton,
                      { backgroundColor: colors.surfaceHighlight },
                      pressed && styles.pressed,
                    ]}
                  >
                    <IconSymbol name="xmark" size={14} color={colors.icon} />
                  </Pressable>
                ))}
            </View>
          ) : null}

          <View style={[styles.content, contentStyle]}>{children}</View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000",
  },
  sheet: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    borderTopWidth: StyleSheet.hairlineWidth,
    maxHeight: "90%",
  },
  grabberRow: {
    alignItems: "center",
    paddingTop: Spacing.s,
  },
  grabber: {
    width: 36,
    height: 4,
    borderRadius: BorderRadius.round,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.s,
    paddingHorizontal: Spacing.m,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    flex: 1,
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.round,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.6,
  },
  content: {
    paddingHorizontal: Spacing.m,
    paddingTop: Spacing.m,
  },
});
