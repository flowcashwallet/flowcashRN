import { BottomSheet } from "@/components/molecules/BottomSheet";
import { Colors } from "@/constants/theme";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { isGlassEffectAPIAvailable } from "expo-glass-effect";
import React from "react";
import { AccessibilityInfo, StyleSheet, Text, View } from "react-native";

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 34, left: 0, right: 0 }),
}));

const mockApiAvailable = jest.mocked(isGlassEffectAPIAvailable);

/** Deja resolver las promesas de `AccessibilityInfo`. */
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

function renderSheet(props: Partial<React.ComponentProps<typeof BottomSheet>>) {
  return render(
    <ThemeProvider>
      <BottomSheet visible onClose={jest.fn()} title="Filtros" {...props}>
        <Text>contenido</Text>
      </BottomSheet>
    </ThemeProvider>,
  );
}

describe("BottomSheet smoke", () => {
  it("renders title, children and close affordance when visible", () => {
    renderSheet({});
    expect(screen.getByText("Filtros")).toBeTruthy();
    expect(screen.getByText("contenido")).toBeTruthy();
    expect(screen.getAllByLabelText("Cerrar").length).toBeGreaterThan(0);
  });

  it("calls onClose when the backdrop is pressed", () => {
    const onClose = jest.fn();
    renderSheet({ onClose });
    fireEvent.press(screen.getAllByLabelText("Cerrar")[0]);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not dismiss on backdrop press when disabled", () => {
    const onClose = jest.fn();
    renderSheet({ onClose, dismissOnBackdropPress: false, hideCloseButton: true });
    fireEvent.press(screen.getAllByLabelText("Cerrar")[0]);
    expect(onClose).not.toHaveBeenCalled();
  });

  it("unmounts the modal after the exit animation finishes", async () => {
    const { rerender } = renderSheet({});
    expect(screen.getByText("contenido")).toBeTruthy();

    rerender(
      <ThemeProvider>
        <BottomSheet visible={false} onClose={jest.fn()} title="Filtros">
          <Text>contenido</Text>
        </BottomSheet>
      </ThemeProvider>,
    );

    await act(async () => {
      await new Promise((r) => setTimeout(r, 400));
    });

    expect(screen.queryByText("contenido")).toBeNull();
  });
});

/**
 * El panel del sheet es superficie flotante, así que lleva Liquid Glass nativo
 * en iOS 26+ (ver `docs/refactor-plan.md`). Lo que **no** lo lleva es el
 * backdrop: su trabajo es oscurecer lo de atrás. Como `jest-expo` resuelve las
 * variantes `.ios`, aquí se ejerce el gating real.
 */
describe("BottomSheet — Liquid Glass del panel", () => {
  beforeEach(() => {
    mockApiAvailable.mockReturnValue(false);
    jest
      .spyOn(AccessibilityInfo, "isReduceTransparencyEnabled")
      .mockResolvedValue(false);
    jest.spyOn(AccessibilityInfo, "isReduceMotionEnabled").mockResolvedValue(false);
    jest
      .spyOn(AccessibilityInfo, "addEventListener")
      .mockReturnValue({ remove: jest.fn() } as never);
  });

  afterEach(() => jest.restoreAllMocks());

  it("keeps the flat surface + hairline panel when the glass API is unavailable", async () => {
    renderSheet({});
    await settle();

    expect(screen.queryByTestId("glass-view")).toBeNull();

    const panel = allViewStyles().find(
      (s) => s.backgroundColor === Colors.light.surface,
    );
    expect(panel).toBeDefined();
    expect(panel?.borderTopWidth).toBe(StyleSheet.hairlineWidth);
  });

  it("turns the panel — and only the panel — into a glass surface when both gates pass", async () => {
    mockApiAvailable.mockReturnValue(true);
    renderSheet({});
    await settle();

    const glass = screen.getAllByTestId("glass-view");
    // Uno solo: el panel. El backdrop sigue siendo el fundido a negro y nada de
    // lo que hay dentro del sheet apila cristal sobre cristal.
    expect(glass).toHaveLength(1);
    expect(glass[0].props.glassEffectStyle).toBe("regular");

    const panel = (StyleSheet.flatten(glass[0].props.style) ?? {}) as Record<
      string,
      unknown
    >;
    expect(panel.backgroundColor).toBeUndefined();
    expect(panel.borderTopWidth).toBeUndefined();

    // El backdrop conserva su negro literal, que es lo que oscurece la pantalla.
    expect(
      allViewStyles().some((s) => s.backgroundColor === "#000"),
    ).toBe(true);
  });

  it("still renders header, children and dismiss affordance in the glass branch", async () => {
    mockApiAvailable.mockReturnValue(true);
    const onClose = jest.fn();
    renderSheet({ onClose });
    await settle();

    expect(screen.getByText("Filtros")).toBeTruthy();
    expect(screen.getByText("contenido")).toBeTruthy();
    fireEvent.press(screen.getAllByLabelText("Cerrar")[0]);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("drops the reduce-motion fade when the panel is glass, because opacity 0 breaks it", async () => {
    jest
      .spyOn(AccessibilityInfo, "isReduceMotionEnabled")
      .mockResolvedValue(true);

    // El wrapper animado es el único nodo con el tope de altura del sheet.
    const sheetWrapper = () =>
      allViewStyles().find((s) => s.maxHeight === "90%");

    // Sin cristal: "reducir movimiento" funde el panel, como siempre.
    mockApiAvailable.mockReturnValue(false);
    renderSheet({});
    await settle();
    expect(sheetWrapper()).toHaveProperty("opacity");
    screen.unmount();

    // Con cristal: nada de opacidad animada sobre el panel ni sobre su ancestro.
    mockApiAvailable.mockReturnValue(true);
    renderSheet({});
    await settle();
    expect(sheetWrapper()).toBeDefined();
    expect(sheetWrapper()).not.toHaveProperty("opacity");
  });
});
