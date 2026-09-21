import { GlassSurface } from "@/components/atoms/GlassSurface";
import { Typography } from "@/components/atoms/Typography";
import { IconSymbol, type IconSymbolName } from "@/components/ui/icon-symbol";
import { BackdropOpacity, BorderRadius, Motion, Spacing } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";
import { useMenuPanel } from "@/contexts/MenuPanelContext";
import STRINGS from "@/i18n/es.json";
import { useRouter } from "expo-router";
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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const WINDOW_WIDTH = Dimensions.get("window").width;
const PANEL_WIDTH = Math.min(WINDOW_WIDTH * 0.78, 320);

interface MenuItem {
  icon: IconSymbolName;
  label: string;
  route: "/settings" | "/settings/connections/binance";
}

/**
 * Lista de opciones del panel. "Binance" es un atajo directo a esa pantalla
 * (antes eran 3 taps más desde Ajustes: menú → Ajustes → Conexiones →
 * Binance) — el resto del camino sigue existiendo en Ajustes, este es solo
 * un acceso rápido al destino más usado.
 */
const MENU_ITEMS: MenuItem[] = [
  { icon: "gearshape", label: STRINGS.menu.settings, route: "/settings" },
  { icon: "bitcoinsign.circle", label: STRINGS.menu.binance, route: "/settings/connections/binance" },
];

/**
 * Panel lateral de navegación, hecho a mano (no `@react-navigation/drawer`,
 * que está instalado pero sin usar en ningún lado) — evita envolver toda la
 * app autenticada (`NativeTabs` + `Stack.Protected` + deep links) en un
 * Drawer real, que sería el cambio de más riesgo posible en la navegación
 * de la app. Se anima igual que `BottomSheet.tsx` (mismo `Animated` de
 * React Native, mismas curvas de `Motion`, mismo respeto a "reducir
 * movimiento"), solo que en horizontal en vez de vertical.
 *
 * Se monta una sola vez en `app/_layout.tsx`; su visibilidad la controla
 * `MenuPanelContext`, no props — así cualquier pantalla puede abrirlo
 * (el botón de hamburguesa de cada pestaña) sin pasar nada a través de la
 * navegación.
 */
export function SideMenuPanel() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isOpen, close } = useMenuPanel();

  // El `Modal` se desmonta al terminar la animación de salida, no cuando
  // `isOpen` pasa a false, para que el panel se vea salir (igual que BottomSheet).
  const [mounted, setMounted] = useState(isOpen);
  const [reduceMotion, setReduceMotion] = useState(false);

  const progress = useRef(new Animated.Value(isOpen ? 1 : 0)).current;

  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (active) setReduceMotion(enabled);
    });
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduceMotion);
    return () => {
      active = false;
      sub.remove();
    };
  }, []);

  useEffect(() => {
    if (isOpen) setMounted(true);

    const animation = Animated.timing(progress, {
      toValue: isOpen ? 1 : 0,
      duration: isOpen ? Motion.enter : Motion.exit,
      easing: isOpen ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
      useNativeDriver: true,
    });

    animation.start(({ finished }) => {
      if (finished && !isOpen) setMounted(false);
    });

    return () => animation.stop();
  }, [isOpen, progress]);

  const handleNavigate = useCallback(
    (route: MenuItem["route"]) => {
      close();
      router.push(route);
    },
    [close, router],
  );

  const backdropStyle = {
    opacity: progress.interpolate({
      inputRange: [0, 1],
      outputRange: [0, BackdropOpacity],
    }),
  };

  const panelStyle = reduceMotion
    ? { opacity: progress }
    : {
        transform: [
          {
            translateX: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [-PANEL_WIDTH, 0],
            }),
          },
        ],
      };

  return (
    <Modal visible={mounted} transparent animationType="none" statusBarTranslucent onRequestClose={close}>
      <View style={styles.root}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={close}
          accessibilityRole="button"
          accessibilityLabel={STRINGS.common.close}
        >
          <Animated.View style={[styles.backdrop, backdropStyle]} pointerEvents="none" />
        </Pressable>

        <Animated.View style={[styles.panelWrapper, { width: PANEL_WIDTH }, panelStyle]}>
          <GlassSurface
            style={[styles.panel, { paddingTop: insets.top + Spacing.l, paddingBottom: insets.bottom + Spacing.m }]}
            fallbackStyle={[styles.flatPanel, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            {MENU_ITEMS.map((item) => (
              <Pressable
                key={item.route}
                onPress={() => handleNavigate(item.route)}
                accessibilityRole="button"
                accessibilityLabel={item.label}
                style={({ pressed }) => [
                  styles.item,
                  pressed && { backgroundColor: colors.surfaceHighlight },
                ]}
              >
                <IconSymbol name={item.icon} size={22} color={colors.text} />
                <Typography variant="body">{item.label}</Typography>
              </Pressable>
            ))}
          </GlassSurface>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: "row",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000",
  },
  /** Anima y limita el ancho; no pinta nada, para no envolver el cristal. */
  panelWrapper: {
    height: "100%",
  },
  /** Forma del panel, común a la variante con cristal y a la plana. */
  panel: {
    flex: 1,
    paddingHorizontal: Spacing.m,
    borderTopRightRadius: BorderRadius.xl,
    borderBottomRightRadius: BorderRadius.xl,
    overflow: "hidden",
  },
  /** Fondo opaco + hairline derecho: solo cuando no hay cristal. */
  flatPanel: {
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.m,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.s,
    borderRadius: BorderRadius.m,
  },
});
