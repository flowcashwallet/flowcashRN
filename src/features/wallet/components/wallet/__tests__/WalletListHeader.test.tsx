import { Colors } from "@/constants/theme";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { WalletListHeader } from "@/features/wallet/components/wallet/WalletListHeader";
import { act, render, screen } from "@testing-library/react-native";
import { isGlassEffectAPIAvailable } from "expo-glass-effect";
import React from "react";
import {
  AccessibilityInfo,
  StyleSheet,
  useColorScheme,
  View,
} from "react-native";

jest.mock("react-native/Libraries/Utilities/useColorScheme");
// `ExportButton` arrastra Redux, `expo-file-system` y `expo-sharing`; aquí solo
// importa que siga siendo un icono desnudo, sin superficie propia.
jest.mock("@/features/wallet/components/ExportTransactions", () => ({
  ExportButton: () => null,
}));

/**
 * El bloque flotante de la cabecera de Wallet lleva **vidrio por control**, no
 * un panel único: `SegmentedControl` ya es una superficie de cristal por
 * sí misma, así que envolver el bloque entero sería apilar cristal sobre
 * cristal. Ver `docs/refactor-plan.md` → "Retrofit ronda 2".
 */
const mockApiAvailable = jest.mocked(isGlassEffectAPIAvailable);
const mockColorScheme = jest.mocked(useColorScheme);

function renderHeader(theme: "light" | "dark" = "light") {
  mockColorScheme.mockReturnValue(theme);
  const colors = Colors[theme];
  render(
    <ThemeProvider>
      <WalletListHeader
        periodView="month"
        onChangePeriodView={jest.fn()}
        selectedDate={new Date(2026, 8, 1)}
        currentMonthName="septiembre"
        onPressMonth={jest.fn()}
        searchQuery=""
        onChangeSearchQuery={jest.fn()}
        colors={colors}
      />
    </ThemeProvider>,
  );
  return colors;
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

describe("WalletListHeader", () => {
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

  it("keeps the flat pill + hairline treatment on every control without glass", async () => {
    const colors = renderHeader();
    await settle();

    expect(screen.queryByTestId("glass-view")).toBeNull();

    const styles = allViewStyles();
    // Píldora del mes y control segmentado comparten relleno `surfaceHighlight`.
    const pills = styles.filter(
      (s) => s.backgroundColor === colors.surfaceHighlight,
    );
    expect(pills.length).toBeGreaterThanOrEqual(2);
    pills.forEach((s) => expect(s.borderWidth).toBe(StyleSheet.hairlineWidth));

    // El buscador va sobre `surface`, no sobre `surfaceHighlight`.
    const searchBar = styles.find((s) => s.backgroundColor === colors.surface);
    expect(searchBar).toBeDefined();
    expect(searchBar?.borderWidth).toBe(StyleSheet.hairlineWidth);
  });

  it("glasses each control on its own, never the block as one surface", async () => {
    mockApiAvailable.mockReturnValue(true);
    renderHeader();
    await settle();

    // Exactamente tres superficies: mes, segmented y buscador. Si el bloque
    // fuera un solo panel de cristal habría una, y las de dentro estarían
    // apiladas encima.
    const glass = screen.getAllByTestId("glass-view");
    expect(glass).toHaveLength(3);
    glass.forEach((node) => {
      expect(node.props.glassEffectStyle).toBe("regular");
      const style = (StyleSheet.flatten(node.props.style) ?? {}) as Record<
        string,
        unknown
      >;
      // El material sustituye al relleno opaco y al hairline en las tres.
      expect(style.backgroundColor).toBeUndefined();
      expect(style.borderWidth).toBeUndefined();
    });
  });

  it("leaves the search input itself plain inside the glass search bar", async () => {
    mockApiAvailable.mockReturnValue(true);
    const colors = renderHeader();
    await settle();

    const input = screen.getByPlaceholderText("Buscar...");
    const style = (StyleSheet.flatten(input.props.style) ?? {}) as Record<
      string,
      unknown
    >;
    // Ni fondo ni borde propios: es un control dentro de una superficie de
    // cristal, y no se apila cristal sobre cristal.
    expect(style.backgroundColor).toBeUndefined();
    expect(style.color).toBe(colors.text);
  });

  it("resolves every surface from dark tokens in dark mode", async () => {
    const colors = renderHeader("dark");
    await settle();

    const styles = allViewStyles();
    expect(
      styles.some((s) => s.backgroundColor === colors.surfaceHighlight),
    ).toBe(true);
    expect(styles.some((s) => s.backgroundColor === colors.surface)).toBe(true);
    expect(styles.some((s) => s.borderColor === colors.border)).toBe(true);
  });
});
