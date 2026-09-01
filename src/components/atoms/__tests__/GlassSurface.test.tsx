import { GlassSurface } from "@/components/atoms/GlassSurface";
import { Colors } from "@/constants/theme";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { act, render, screen } from "@testing-library/react-native";
import { isGlassEffectAPIAvailable } from "expo-glass-effect";
import React from "react";
import { AccessibilityInfo, StyleSheet, Text } from "react-native";

/**
 * `jest-expo` corre con `defaultPlatform: "ios"`, así que este suite ejerce
 * `GlassSurface.ios.tsx` — la variante que de verdad tiene los gates. El
 * contrato está en "Liquid Glass nativo en iOS — items de lista"
 * (`docs/refactor-plan.md`).
 *
 * No hay simulador aquí, así que no se puede comprobar el cristal en sí; lo que
 * sí es verificable —y lo que puede crashear en producción si se rompe— es la
 * lógica de gating y que el fallback sea exactamente la fila plana.
 */

const mockApiAvailable = jest.mocked(isGlassEffectAPIAvailable);

const flatRowStyle = { borderBottomWidth: StyleSheet.hairlineWidth };

function renderSurface() {
  return render(
    <ThemeProvider>
      <GlassSurface
        testID="surface"
        style={{ paddingVertical: 12 }}
        fallbackStyle={[
          flatRowStyle,
          { borderBottomColor: Colors.light.border },
        ]}
      >
        <Text>Supermercado</Text>
      </GlassSurface>
    </ThemeProvider>,
  );
}

/** Deja que resuelva la promesa de `isReduceTransparencyEnabled`. */
async function settle() {
  await act(async () => {});
}

describe("GlassSurface (iOS) — gating del Liquid Glass nativo", () => {
  beforeEach(() => {
    mockApiAvailable.mockReturnValue(false);
    jest
      .spyOn(AccessibilityInfo, "isReduceTransparencyEnabled")
      .mockResolvedValue(false);
    jest
      .spyOn(AccessibilityInfo, "addEventListener")
      .mockReturnValue({ remove: jest.fn() } as never);
  });

  afterEach(() => jest.restoreAllMocks());

  it("renders the plain fallback row when the glass API is unavailable", async () => {
    mockApiAvailable.mockReturnValue(false);
    renderSurface();
    await settle();

    expect(screen.queryByTestId("glass-view")).toBeNull();

    const row = StyleSheet.flatten(
      screen.getByTestId("surface").props.style,
    ) as Record<string, unknown>;
    expect(row.borderBottomWidth).toBe(StyleSheet.hairlineWidth);
    expect(row.borderBottomColor).toBe(Colors.light.border);
  });

  it("renders the plain fallback row when reduce transparency is on, even with the API available", async () => {
    mockApiAvailable.mockReturnValue(true);
    jest
      .spyOn(AccessibilityInfo, "isReduceTransparencyEnabled")
      .mockResolvedValue(true);

    renderSurface();
    await settle();

    expect(screen.queryByTestId("glass-view")).toBeNull();
    const row = StyleSheet.flatten(
      screen.getByTestId("surface").props.style,
    ) as Record<string, unknown>;
    expect(row.borderBottomWidth).toBe(StyleSheet.hairlineWidth);
  });

  it("renders GlassView with `regular` style when both gates pass", async () => {
    mockApiAvailable.mockReturnValue(true);
    renderSurface();
    await settle();

    const glass = screen.getByTestId("surface");
    expect(glass.props.glassEffectStyle).toBe("regular");
    // Sin hairline ni fondo opaco: el material del sistema los sustituye.
    const row = StyleSheet.flatten(glass.props.style) as Record<
      string,
      unknown
    >;
    expect(row.borderBottomWidth).toBeUndefined();
  });

  it("ties the glass colour scheme to the app theme, not the OS", async () => {
    mockApiAvailable.mockReturnValue(true);
    renderSurface();
    await settle();
    expect(screen.getByTestId("surface").props.colorScheme).toBe("light");
  });

  it("keeps rendering its children in every branch", async () => {
    mockApiAvailable.mockReturnValue(false);
    renderSurface();
    await settle();
    expect(screen.getByText("Supermercado")).toBeTruthy();
    screen.unmount();

    mockApiAvailable.mockReturnValue(true);
    renderSurface();
    await settle();
    expect(screen.getByText("Supermercado")).toBeTruthy();
  });
});
