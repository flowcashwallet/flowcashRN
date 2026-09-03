import { Colors } from "@/constants/theme";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { act, render, screen } from "@testing-library/react-native";
import { isGlassEffectAPIAvailable } from "expo-glass-effect";
import React from "react";
import { AccessibilityInfo, StyleSheet, View } from "react-native";
import { AuthErrorBanner } from "../AuthErrorBanner";

/**
 * Pase visual de Auth (2026-09-03).
 *
 * `AuthErrorBanner` era el hardcode `#FFEBEE` flagged desde el arranque del
 * plan de refactor (`docs/refactor-plan.md`). Este suite cubre:
 *
 * 1. el token `error` sustituye a `#FFEBEE` en ambos temas — nunca el hex
 *    literal, ni siquiera como color derivado a mano;
 * 2. `error` colorea el acento (borde izquierdo, icono, texto, tinte de
 *    cristal), no el fondo — el fondo se queda en `colors.surface`, mismo
 *    criterio de paleta que el resto de cards de la app;
 * 3. cristal por defecto cuando los dos gates están en verde, plana con
 *    `surface` + hairline como fallback (mismo patrón que
 *    `BudgetComponents.test.tsx`/`AnalyticsComponents.test.tsx`);
 * 4. sin `error`, no renderiza nada.
 */

const mockApiAvailable = jest.mocked(isGlassEffectAPIAvailable);

const mockColorScheme = jest.fn(() => "light");
jest.mock("react-native/Libraries/Utilities/useColorScheme", () => ({
  __esModule: true,
  default: () => mockColorScheme(),
}));

function renderInTheme(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

async function settle() {
  await act(async () => {});
}

/** Estilos aplanados de todas las `View` del árbol renderizado. */
function viewStyles() {
  return screen
    .UNSAFE_getAllByType(View)
    .map((node) => StyleSheet.flatten(node.props.style)) as Record<
    string,
    unknown
  >[];
}

beforeEach(() => {
  mockColorScheme.mockReturnValue("light");
  mockApiAvailable.mockReturnValue(false);
  jest
    .spyOn(AccessibilityInfo, "isReduceTransparencyEnabled")
    .mockResolvedValue(false);
  jest
    .spyOn(AccessibilityInfo, "isReduceMotionEnabled")
    .mockResolvedValue(false);
  jest
    .spyOn(AccessibilityInfo, "addEventListener")
    .mockReturnValue({ remove: jest.fn() } as never);
});

afterEach(() => jest.restoreAllMocks());

describe("AuthErrorBanner", () => {
  it("no renderiza nada sin `error`", () => {
    renderInTheme(<AuthErrorBanner error={null} colors={Colors.light} />);

    expect(screen.queryByTestId("glass-view")).toBeNull();
  });

  it("aporta una superficie de cristal cuando los dos gates están en verde", async () => {
    mockApiAvailable.mockReturnValue(true);
    renderInTheme(
      <AuthErrorBanner error="Credenciales inválidas" colors={Colors.light} />,
    );
    await settle();

    const glass = screen.getByTestId("glass-view");
    expect(glass).toBeTruthy();
    // El tinte del cristal sale del token `error`, nunca de un hex suelto.
    expect(glass.props.tintColor).toBe(Colors.light.error);
  });

  it("se queda plana cuando la API de cristal no está disponible", async () => {
    mockApiAvailable.mockReturnValue(false);
    renderInTheme(
      <AuthErrorBanner error="Credenciales inválidas" colors={Colors.light} />,
    );
    await settle();

    expect(screen.queryByTestId("glass-view")).toBeNull();
  });

  it.each([
    ["light" as const, Colors.light],
    ["dark" as const, Colors.dark],
  ])(
    "en modo %s el fondo es `colors.surface` y el acento `colors.error` — nunca `#FFEBEE`",
    async (theme, colors) => {
      mockColorScheme.mockReturnValue(theme);
      mockApiAvailable.mockReturnValue(false);
      renderInTheme(
        <AuthErrorBanner error="Credenciales inválidas" colors={colors} />,
      );
      await settle();

      const card = viewStyles().find(
        (s) => s?.backgroundColor === colors.surface && s?.borderWidth,
      );
      expect(card).toBeDefined();
      expect(card?.backgroundColor).not.toBe("#FFEBEE");
      expect(card?.borderWidth).toBe(StyleSheet.hairlineWidth);
      expect(card?.borderColor).toBe(colors.border);
      expect(card?.borderLeftColor).toBe(colors.error);

      const errorText = screen.getByText("Credenciales inválidas");
      const textStyle = StyleSheet.flatten(errorText.props.style) as Record<
        string,
        unknown
      >;
      expect(textStyle.color).toBe(colors.error);
      expect(textStyle.color).not.toBe(colors.text);
    },
  );
});
