import { FloatingActionMenu } from "@/components/molecules/FloatingActionMenu";
import { Colors } from "@/constants/theme";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { isGlassEffectAPIAvailable } from "expo-glass-effect";
import React from "react";
import {
  AccessibilityInfo,
  StyleSheet,
  useColorScheme,
  View,
} from "react-native";

jest.mock("react-native/Libraries/Utilities/useColorScheme");
/**
 * Reanimated no arranca bajo Jest sin runtime nativo (mismo error que ya rompe
 * las suites de Vision/Budget). Aquí solo interesa el layout y el cableado de
 * props, no la animación, así que `Animated.View` es una `View` normal y
 * `FadeIn`/`FadeOut` devuelven `undefined`.
 */
jest.mock("react-native-reanimated", () => {
  // `require` obligatorio: la factoría de `jest.mock` se hoistea sobre los imports.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View } = require("react-native");
  const noopAnimation = { duration: () => undefined };
  return {
    __esModule: true,
    default: { View },
    FadeIn: noopAnimation,
    FadeOut: noopAnimation,
  };
});
jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(),
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: "light" },
}));
jest.mock("@/components/ui/icon-symbol", () => ({
  IconSymbol: ({ name, color }: { name: string; color: string }) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Text } = require("react-native");
    return <Text testID={`icon-${name}`} style={{ color }} />;
  },
}));

/**
 * El FAB y el menú que despliega son superficie flotante, así que en iOS 26+
 * llevan Liquid Glass nativo (ver `docs/refactor-plan.md`). Antes el menú usaba
 * un `BlurView` de `expo-blur` —vidrio falso— y el FAB un relleno opaco con el
 * icono en `#FFFFFF`, que no pasa AA sobre el `primary` claro.
 */
const mockApiAvailable = jest.mocked(isGlassEffectAPIAvailable);
const mockColorScheme = jest.mocked(useColorScheme);

const ACTIONS = [
  { id: "income", label: "Nuevo Ingreso", icon: "arrow.down.left", onPress: jest.fn() },
  { id: "expense", label: "Nuevo Gasto", icon: "arrow.up.right", onPress: jest.fn() },
];

function renderMenu() {
  render(
    <ThemeProvider>
      <FloatingActionMenu actions={ACTIONS} />
    </ThemeProvider>,
  );
}

async function settle() {
  await act(async () => {});
}

function allViewStyles() {
  return screen
    .UNSAFE_getAllByType(View)
    .map(
      (node) =>
        (StyleSheet.flatten(node.props.style) ?? {}) as Record<string, unknown>,
    );
}

describe("FloatingActionMenu", () => {
  beforeEach(() => {
    mockColorScheme.mockReturnValue("light");
    mockApiAvailable.mockReturnValue(false);
    jest
      .spyOn(AccessibilityInfo, "isReduceTransparencyEnabled")
      .mockResolvedValue(false);
    jest
      .spyOn(AccessibilityInfo, "addEventListener")
      .mockReturnValue({ remove: jest.fn() } as never);
  });

  afterEach(() => jest.restoreAllMocks());

  it("keeps the opaque primary fill and its shadow when there is no glass", async () => {
    renderMenu();
    await settle();

    expect(screen.queryByTestId("glass-view")).toBeNull();

    const fab = allViewStyles().find(
      (s) => s.backgroundColor === Colors.light.primary,
    );
    expect(fab).toBeDefined();
    expect(fab?.shadowColor).toBe(Colors.light.primary);
  });

  it("tints the FAB glass from the primary token, never a hex", async () => {
    mockApiAvailable.mockReturnValue(true);
    renderMenu();
    await settle();

    const fab = screen.getByTestId("glass-view");
    expect(fab.props.tintColor).toBe(Colors.light.primary);
    expect(fab.props.glassEffectStyle).toBe("regular");
    // Pulsable entero, así que el material responde al toque.
    expect(fab.props.isInteractive).toBe(true);
    // Ni relleno opaco ni sombra propia: los pone el sistema.
    const style = (StyleSheet.flatten(fab.props.style) ?? {}) as Record<
      string,
      unknown
    >;
    expect(style.backgroundColor).toBeUndefined();
    expect(style.shadowOpacity).toBeUndefined();
  });

  it("paints the plus icon with onPrimary, not white", async () => {
    renderMenu();
    await settle();
    const style = StyleSheet.flatten(
      screen.getByTestId("icon-plus").props.style,
    ) as Record<string, unknown>;
    expect(style.color).toBe(Colors.light.onPrimary);
    expect(style.color).not.toBe("#FFFFFF");
  });

  it("gives the opened menu its own glass surface, without stacking it on the FAB", async () => {
    mockApiAvailable.mockReturnValue(true);
    renderMenu();
    await settle();

    fireEvent.press(screen.getByLabelText("Abrir acciones"));
    await settle();

    expect(screen.getByText("Nuevo Ingreso")).toBeTruthy();

    // Dos superficies: el FAB y el panel del menú. Ninguna dentro de la otra.
    const glass = screen.getAllByTestId("glass-view");
    expect(glass).toHaveLength(2);
    glass.forEach((node) =>
      expect(node.props.glassEffectStyle).toBe("regular"),
    );

    // El menú arranca por encima del FAB: si se solaparan, dos cristales
    // superpuestos dejarían de leerse como material.
    const menu = allViewStyles().find((s) => s.width === 220);
    const fab = allViewStyles().find((s) => s.width === 56);
    expect(menu).toBeDefined();
    expect(fab).toBeDefined();
    const fabPosition = allViewStyles().find(
      (s) => s.position === "absolute" && s.zIndex === 1000,
    );
    expect(Number(menu?.bottom)).toBeGreaterThanOrEqual(
      Number(fabPosition?.bottom) + Number(fab?.height),
    );
  });

  it("falls back to the opaque menu with a hairline when there is no glass", async () => {
    renderMenu();
    await settle();

    fireEvent.press(screen.getByLabelText("Abrir acciones"));
    await settle();

    expect(screen.queryByTestId("glass-view")).toBeNull();
    const menu = allViewStyles().find(
      (s) => s.backgroundColor === Colors.light.surface,
    );
    expect(menu).toBeDefined();
    expect(menu?.borderWidth).toBe(StyleSheet.hairlineWidth);
  });

  it("renders the same actions in dark mode, with dark tokens", async () => {
    mockColorScheme.mockReturnValue("dark");
    renderMenu();
    await settle();

    fireEvent.press(screen.getByLabelText("Abrir acciones"));
    await settle();

    expect(screen.getByText("Nuevo Gasto")).toBeTruthy();
    const style = StyleSheet.flatten(
      screen.getByTestId("icon-plus").props.style,
    ) as Record<string, unknown>;
    expect(style.color).toBe(Colors.dark.onPrimary);
  });
});
