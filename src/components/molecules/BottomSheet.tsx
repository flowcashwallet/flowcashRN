import {
  GlassSurface,
  useGlassSurfaceActive,
} from "@/components/atoms/GlassSurface";
import { GlassNestingBoundary } from "@/components/atoms/GlassSurface.nesting";
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
  KeyboardAvoidingView,
  Modal,
  Platform,
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
  /**
   * Levanta el sheet por encima del teclado. Solo para sheets con formulario
   * largo (`AddEntityModal`); el resto no lo necesita y así no se cambia el
   * comportamiento de los ~9 sheets ya migrados.
   */
  avoidKeyboard?: boolean;
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
 * **El panel es una superficie flotante, así que en iOS 26+ es Liquid Glass
 * nativo** (`GlassSurface`); sin soporte, o con "reducir transparencia", vuelve
 * al `surface` + hairline de siempre. Como los ~7 modales de Wallet ya usan esta
 * primitiva, el cristal les llega sin tocar ninguno. El **backdrop no** lleva
 * cristal: su trabajo es oscurecer lo de atrás, y un backdrop translúcido no
 * oscurece nada. Lo que va **dentro** del sheet (inputs, chips, el botón de
 * cerrar) también se queda plano: no se apila cristal sobre cristal.
 *
 * Respeta "reducir movimiento": en ese caso el sheet no se desliza. Cuando el
 * panel es plano funde; cuando es de cristal aparece sin fundido y solo funde el
 * backdrop, porque `opacity: 0` en un ancestro de un `GlassView` rompe el efecto
 * (caveat del paquete, documentado en el plan) — y ese `opacity: 0` es justo el
 * primer fotograma de un fundido de entrada.
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
  avoidKeyboard = false,
  style,
  contentStyle,
  children,
}: BottomSheetProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const glassActive = useGlassSurfaceActive();

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

  // Con "reducir movimiento" el sheet no se desliza. Funde, salvo que el panel
  // sea de cristal: ahí no puede fundir, porque el fundido arranca en
  // `opacity: 0` y eso rompe el `GlassView` de dentro. En ese caso el panel
  // aparece de golpe y la transición la lleva el backdrop, que sí funde.
  const sheetStyle = reduceMotion
    ? glassActive
      ? undefined
      : { opacity: progress }
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
      {/*
        El contenido del `Modal` es otra ventana: aunque en el árbol de React
        cuelgue de la superficie que lo abrió (un sheet abierto desde dentro de
        otro sheet), visualmente se lee contra su propio backdrop, no contra el
        cristal de fuera. Se reinicia el marcador de anidamiento para que este
        panel pueda ser cristal — es el apilado de sheets de iOS.
      */}
      <GlassNestingBoundary>
        {/*
          Con `avoidKeyboard` la raíz encoge lo que ocupa el teclado; como el
          sheet está anclado abajo (`justifyContent: "flex-end"`), sube solo. No
          hace falta medir nada ni tocar el `maxHeight`.
        */}
        <KeyboardAvoidingView
          style={styles.root}
          behavior={
            avoidKeyboard
              ? Platform.OS === "ios"
                ? "padding"
                : "height"
              : undefined
          }
          enabled={avoidKeyboard}
        >
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

          {/*
          El wrapper anima (transform o fundido) y es quien limita la altura —
          tiene que ser hijo directo de `root`, que es el único con altura
          definida contra la que resolver el `maxHeight` en %. El panel de
          dentro es la superficie, y es quien lleva el cristal; `flexShrink` es
          lo que lo hace encajar dentro del tope del wrapper. Separarlos es lo
          que permite que el material nunca tenga una opacidad animada encima.
        */}
          <Animated.View style={[styles.sheetWrapper, sheetStyle, style]}>
            <GlassSurface
              style={[
                styles.sheet,
                { paddingBottom: insets.bottom + Spacing.m },
              ]}
              fallbackStyle={[
                styles.flatSheet,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={styles.grabberRow} pointerEvents="none">
                <View
                  style={[styles.grabber, { backgroundColor: colors.border }]}
                />
              </View>

              {showHeader ? (
                <View
                  style={[styles.header, { borderBottomColor: colors.border }]}
                >
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
                        <IconSymbol
                          name="xmark"
                          size={14}
                          color={colors.icon}
                        />
                      </Pressable>
                    ))}
                </View>
              ) : null}

              <View style={[styles.content, contentStyle]}>{children}</View>
            </GlassSurface>
          </Animated.View>
        </KeyboardAvoidingView>
      </GlassNestingBoundary>
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
  /** Anima y limita la altura; no pinta nada, para no envolver el cristal. */
  sheetWrapper: {
    maxHeight: "90%",
  },
  /** Forma del panel, común a la variante con cristal y a la plana. */
  sheet: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    overflow: "hidden",
    flexShrink: 1,
  },
  /** Fondo opaco + hairline superior: solo cuando no hay cristal. */
  flatSheet: {
    borderTopWidth: StyleSheet.hairlineWidth,
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
