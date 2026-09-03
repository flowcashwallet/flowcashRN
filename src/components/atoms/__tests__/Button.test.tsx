import { Button } from "@/components/atoms/Button";
import { Colors } from "@/constants/theme";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { act, render, screen } from "@testing-library/react-native";
import { isGlassEffectAPIAvailable } from "expo-glass-effect";
import React from "react";
import { AccessibilityInfo, StyleSheet, TouchableOpacity } from "react-native";

/**
 * `jest-expo` corre con `defaultPlatform: "ios"`, así que este suite ejerce
 * `GlassSurface.ios.tsx` — igual que `GlassSurface.test.tsx`/
 * `TransactionItem.test.tsx`. `GlassView` está mockeado en `jest.setup.js`
 * para renderizar `testID="glass-view"` por defecto, pero acepta que se lo
 * sobreescriba — `Button` pasa `testID="button-surface"` a su `GlassSurface`,
 * así que ese es el testID final tanto si hay cristal real como si cae al
 * fallback: la misma consulta sirve en los dos estados, y para saber si de
 * verdad es cristal se comprueba `glassEffectStyle` (solo lo trae la rama que
 * de verdad renderiza `GlassView`).
 *
 * Cambio bajo prueba (2026-09-03, corregido tras feedback del usuario:
 * "el glass del botón no debe ser absolute debe envolver al contenido"):
 * `primary`, `secondary` y `outline` (sin `disabled`) envuelven `Content` en
 * `GlassSurface` directamente — mismo patrón que `TransactionItem`/
 * `CategoryCard`/`BudgetCollapsibleCard` — en vez de una capa `absoluteFill`
 * hermana (el intento anterior). `ghost` y `disabled` nunca llevan cristal:
 * su `style` vive directo en el `TouchableOpacity`, sin `GlassSurface` de por
 * medio.
 */

const mockApiAvailable = jest.mocked(isGlassEffectAPIAvailable);

const mockColorScheme = jest.fn(() => "light");
jest.mock("react-native/Libraries/Utilities/useColorScheme", () => ({
  __esModule: true,
  default: () => mockColorScheme(),
}));

function renderButton(
  props: Partial<React.ComponentProps<typeof Button>> = {},
) {
  return render(
    <ThemeProvider>
      <Button title="Continuar" onPress={jest.fn()} {...props} />
    </ThemeProvider>,
  );
}

/** Deja que resuelva la promesa de `isReduceTransparencyEnabled`. */
async function settle() {
  await act(async () => {});
}

/**
 * El nodo que `primary`/`secondary`/`outline` (sin `disabled`) renderizan
 * para su superficie — `GlassView` real, o la `View` plana del fallback.
 * Presente en los dos casos porque `Button` le pasa `testID="button-surface"`
 * a su `GlassSurface`, y esta lo reenvía sea cual sea la rama.
 */
function surfaceNode() {
  return screen.getByTestId("button-surface");
}

function surfaceStyle() {
  return StyleSheet.flatten(surfaceNode().props.style) as Record<
    string,
    unknown
  >;
}

function isRealGlass() {
  return surfaceNode().props.glassEffectStyle === "regular";
}

/** Para `ghost`/`disabled`: nunca hay `GlassSurface`, el estilo vive directo en el `TouchableOpacity`. */
function outerTouchableStyle() {
  const touchable = screen.UNSAFE_getByType(TouchableOpacity);
  return StyleSheet.flatten(touchable.props.style) as Record<
    string,
    unknown
  >;
}

describe("Button — Liquid Glass", () => {
  beforeEach(() => {
    mockColorScheme.mockReturnValue("light");
    jest
      .spyOn(AccessibilityInfo, "isReduceTransparencyEnabled")
      .mockResolvedValue(false);
    jest
      .spyOn(AccessibilityInfo, "addEventListener")
      .mockReturnValue({ remove: jest.fn() } as never);
  });

  afterEach(() => jest.restoreAllMocks());

  describe("both gates green — glass envuelve el contenido", () => {
    beforeEach(() => mockApiAvailable.mockReturnValue(true));

    it.each([
      ["primary", Colors.light.primary],
      ["secondary", Colors.light.secondary],
    ] as const)(
      "envuelve %s en una única superficie de cristal teñida con el color del variant",
      async (variant, expectedTint) => {
        renderButton({ variant });
        await settle();

        expect(isRealGlass()).toBe(true);
        expect(surfaceNode().props.tintColor).toBe(expectedTint);
      },
    );

    it("envuelve outline en cristal sin teñir", async () => {
      renderButton({ variant: "outline" });
      await settle();

      expect(isRealGlass()).toBe(true);
      expect(surfaceNode().props.tintColor).toBeUndefined();
    });

    it("aplica isInteractive en los tres variants con cristal — el botón entero es el área de toque", async () => {
      for (const variant of ["primary", "secondary", "outline"] as const) {
        renderButton({ variant });
        await settle();
        expect(surfaceNode().props.isInteractive).toBe(true);
        screen.unmount();
      }
    });

    it("nunca vidria ghost — no tiene superficie propia por diseño", async () => {
      renderButton({ variant: "ghost" });
      await settle();
      expect(screen.queryByTestId("button-surface")).toBeNull();
      expect(screen.queryByTestId("glass-view")).toBeNull();
    });

    it("nunca vidria un botón disabled, sea cual sea el variant", async () => {
      for (const variant of [
        "primary",
        "secondary",
        "outline",
        "ghost",
      ] as const) {
        renderButton({ variant, disabled: true });
        await settle();
        expect(screen.queryByTestId("button-surface")).toBeNull();
        screen.unmount();
      }
    });

    it("usa un `backgroundColor` sobreescrito por `style` como tinte del cristal, no el color por defecto del variant", async () => {
      // Caso real: TransactionModal.tsx pinta "Guardar y continuar" de
      // success/error vía `style`; el cristal no debe imponer verde encima.
      renderButton({
        variant: "primary",
        style: { backgroundColor: Colors.light.error },
      });
      await settle();
      expect(surfaceNode().props.tintColor).toBe(Colors.light.error);
    });
  });

  describe("either gate red — cae al fallback plano, mismos colores que siempre", () => {
    it("sin la API de cristal, mantiene los fondos planos de siempre (claro)", async () => {
      mockApiAvailable.mockReturnValue(false);

      renderButton({ variant: "primary" });
      await settle();
      expect(isRealGlass()).toBe(false);
      expect(surfaceStyle().backgroundColor).toBe(Colors.light.primary);
      screen.unmount();

      renderButton({ variant: "secondary" });
      await settle();
      expect(isRealGlass()).toBe(false);
      expect(surfaceStyle().backgroundColor).toBe(Colors.light.secondary);
      screen.unmount();

      renderButton({ variant: "outline" });
      await settle();
      expect(isRealGlass()).toBe(false);
      const outline = surfaceStyle();
      expect(outline.backgroundColor).toBe("transparent");
      expect(outline.borderWidth).toBe(1);
      expect(outline.borderColor).toBe(Colors.light.primary);
      screen.unmount();

      renderButton({ variant: "ghost" });
      await settle();
      expect(screen.queryByTestId("button-surface")).toBeNull();
      expect(outerTouchableStyle().backgroundColor).toBe("transparent");
    });

    it("sin la API de cristal, mantiene los fondos planos de siempre (oscuro)", async () => {
      mockApiAvailable.mockReturnValue(false);
      mockColorScheme.mockReturnValue("dark");

      renderButton({ variant: "primary" });
      await settle();
      expect(surfaceStyle().backgroundColor).toBe(Colors.dark.primary);
      screen.unmount();

      renderButton({ variant: "secondary" });
      await settle();
      expect(surfaceStyle().backgroundColor).toBe(Colors.dark.secondary);
      screen.unmount();

      renderButton({ variant: "outline" });
      await settle();
      expect(surfaceStyle().borderColor).toBe(Colors.dark.primary);
    });

    it("sin cristal cuando 'reducir transparencia' está activo, aunque la API esté disponible", async () => {
      mockApiAvailable.mockReturnValue(true);
      jest
        .spyOn(AccessibilityInfo, "isReduceTransparencyEnabled")
        .mockResolvedValue(true);

      renderButton({ variant: "primary" });
      await settle();
      expect(isRealGlass()).toBe(false);
      expect(surfaceStyle().backgroundColor).toBe(Colors.light.primary);
    });

    it("mantiene el gris plano de disabled exactamente igual, sin cristal", async () => {
      mockApiAvailable.mockReturnValue(true);

      renderButton({ variant: "primary", disabled: true });
      await settle();
      expect(screen.queryByTestId("button-surface")).toBeNull();
      expect(outerTouchableStyle().backgroundColor).toBe(Colors.light.icon);
    });
  });

  describe("los overrides de `style` siguen aplicando sobre el estilo base", () => {
    /**
     * Caso real: el botón "Reiniciar Presupuesto" de `BudgetDashboard.tsx`
     * (`variant="outline"`, `style={{ borderColor: colors.error }}`). El
     * borde es parte del `style` que siempre se aplica (layout/identidad del
     * variant), no del `fallbackStyle`, así que tiene que sobrevivir con y
     * sin cristal.
     */
    it.each([
      ["glass activo", true],
      ["fallback plano", false],
    ] as const)(
      "aplica un `borderColor` a medida sobre el variant outline (%s)",
      async (_label, apiAvailable) => {
        mockApiAvailable.mockReturnValue(apiAvailable);

        renderButton({
          variant: "outline",
          style: { borderColor: Colors.light.error },
        });
        await settle();

        const style = surfaceStyle();
        expect(style.borderWidth).toBe(1);
        expect(style.borderColor).toBe(Colors.light.error);
      },
    );

    it("un `flex`/layout a medida en `style` sigue aplicando sobre la superficie con cristal", async () => {
      // Caso real: los dos botones de `TransactionDetailModal.tsx` reparten
      // el ancho con `flex: 1` cada uno.
      mockApiAvailable.mockReturnValue(true);
      renderButton({ variant: "primary", style: { flex: 1 } });
      await settle();
      expect(surfaceStyle().flex).toBe(1);
    });

    it("sigue mostrando el título del botón sea cual sea el estado del cristal", async () => {
      mockApiAvailable.mockReturnValue(true);
      renderButton({ title: "Reiniciar Presupuesto", variant: "outline" });
      await settle();
      expect(screen.getByText("Reiniciar Presupuesto")).toBeTruthy();
    });
  });
});
