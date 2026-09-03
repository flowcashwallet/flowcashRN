import { SegmentedControl } from "@/components/atoms/SegmentedControl";
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
 * El control recuperó vidrio real en el retrofit del 2026-09-01: en iOS 26+ su
 * fondo es Liquid Glass nativo vía `GlassSurface`, y en Android/web sigue con
 * `surfaceHighlight` + hairline exactamente como antes.
 *
 * Como `jest-expo` resuelve las variantes `.ios`, aquí se ejerce la rama de iOS
 * y se puede comprobar el gating de verdad.
 */
const mockApiAvailable = jest.mocked(isGlassEffectAPIAvailable);
const mockColorScheme = jest.mocked(useColorScheme);

const OPTIONS = [
  { value: "month", label: "Mes" },
  { value: "year", label: "Año" },
] as const;

function renderControl(onChange = jest.fn()) {
  render(
    <ThemeProvider>
      <SegmentedControl value="month" options={OPTIONS} onChange={onChange} />
    </ThemeProvider>,
  );
  return onChange;
}

async function settle() {
  await act(async () => {});
}

/** Estilo plano del contenedor, sea cual sea el nodo que lo lleve. */
function flatten(style: unknown) {
  return (StyleSheet.flatten(style as never) ?? {}) as Record<string, unknown>;
}

/**
 * Estilos aplanados de todas las `View` renderizadas. El contenedor del control
 * no tiene `testID` propio en la rama plana, así que se busca por su relleno en
 * lugar de acoplar el test a la profundidad exacta del árbol.
 */
function allViewStyles() {
  return screen
    .UNSAFE_getAllByType(View)
    .map((node) => flatten(node.props.style));
}

describe("SegmentedControl", () => {
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

  it("keeps the flat surfaceHighlight + hairline treatment without glass", async () => {
    renderControl();
    await settle();

    expect(screen.queryByTestId("glass-view")).toBeNull();

    const container = allViewStyles().find(
      (s) => s.backgroundColor === Colors.light.surfaceHighlight,
    );
    expect(container).toBeDefined();
    expect(container?.borderWidth).toBe(StyleSheet.hairlineWidth);
  });

  it("becomes a real glass surface on iOS when both gates pass", async () => {
    mockApiAvailable.mockReturnValue(true);
    renderControl();
    await settle();

    const glass = screen.getByTestId("glass-view");
    expect(glass.props.glassEffectStyle).toBe("regular");
    // El material del sistema sustituye al relleno opaco y al hairline.
    const container = flatten(glass.props.style);
    expect(container.backgroundColor).toBeUndefined();
    expect(container.borderWidth).toBeUndefined();
  });

  it("ties the glass colour scheme to the app theme, not the OS", async () => {
    mockApiAvailable.mockReturnValue(true);
    mockColorScheme.mockReturnValue("dark");
    renderControl();
    await settle();
    expect(screen.getByTestId("glass-view").props.colorScheme).toBe("dark");
  });

  it("still reports selection and fires onChange in the glass branch", async () => {
    mockApiAvailable.mockReturnValue(true);
    const onChange = renderControl();
    await settle();

    expect(screen.getByText("Mes").props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ color: Colors.light.onPrimary }),
      ]),
    );

    fireEvent.press(screen.getByText("Año"));
    expect(onChange).toHaveBeenCalledWith("year");
  });
});
