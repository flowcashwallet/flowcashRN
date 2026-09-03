import {
  GlassSurface,
  useGlassSurfaceActive,
} from "@/components/atoms/GlassSurface";
import { GlassNestingBoundary } from "@/components/atoms/GlassSurface.nesting";
import { TransactionItem } from "@/components/molecules/TransactionItem";
import { Colors } from "@/constants/theme";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { act, render, screen } from "@testing-library/react-native";
import { isGlassEffectAPIAvailable } from "expo-glass-effect";
import React from "react";
import { AccessibilityInfo, StyleSheet, Text } from "react-native";

/**
 * `jest-expo` corre con `defaultPlatform: "ios"`, así que este suite ejerce
 * `GlassSurface.ios.tsx` — la variante que de verdad tiene los gates. El
 * contrato está en "Liquid Glass nativo en iOS — toda la superficie flotante de
 * la pantalla" (`docs/refactor-plan.md`).
 *
 * No hay simulador aquí, así que no se puede comprobar el cristal en sí; lo que
 * sí es verificable —y lo que puede crashear en producción si se rompe— es la
 * lógica de gating y que el fallback sea exactamente la superficie plana.
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

/**
 * Guard de anidamiento (ver "Mecanismo, no criterio manual" en
 * `docs/refactor-plan.md`). Desde que **toda** superficie propia lleva cristal,
 * el mismo componente puede montarse suelto sobre el fondo (cristal) o dentro
 * de una card ya vidriada (plano). Decide el primitivo vía contexto, no el
 * llamante.
 */
describe("GlassSurface (iOS) — guard de anidamiento", () => {
  beforeEach(() => {
    // Los dos gates pasan en todo este bloque: lo único que debe aplanar la
    // superficie de dentro es el anidamiento.
    mockApiAvailable.mockReturnValue(true);
    jest
      .spyOn(AccessibilityInfo, "isReduceTransparencyEnabled")
      .mockResolvedValue(false);
    jest
      .spyOn(AccessibilityInfo, "addEventListener")
      .mockReturnValue({ remove: jest.fn() } as never);
  });

  afterEach(() => jest.restoreAllMocks());

  async function renderNested() {
    render(
      <ThemeProvider>
        <GlassSurface testID="outer" style={{ padding: 16 }}>
          <GlassSurface
            testID="inner"
            style={{ padding: 8 }}
            fallbackStyle={{
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: Colors.light.border,
            }}
          >
            <GlassSurface testID="deepest" style={{ padding: 4 }}>
              <Text>Supermercado</Text>
            </GlassSurface>
          </GlassSurface>
        </GlassSurface>
      </ThemeProvider>,
    );
    await act(async () => {});
  }

  it("glasses the outer surface and flattens the nested one, even though both gates pass", async () => {
    await renderNested();

    expect(screen.getByTestId("outer").props.glassEffectStyle).toBe("regular");
    // La de dentro cae al fallback plano: nunca cristal sobre cristal.
    expect(screen.getByTestId("inner").props.glassEffectStyle).toBeUndefined();
    const inner = StyleSheet.flatten(
      screen.getByTestId("inner").props.style,
    ) as Record<string, unknown>;
    expect(inner.borderWidth).toBe(StyleSheet.hairlineWidth);
    expect(inner.borderColor).toBe(Colors.light.border);
  });

  it("keeps flattening further down: estar dentro de una plana que está dentro de cristal sigue siendo cristal arriba", async () => {
    await renderNested();
    expect(
      screen.getByTestId("deepest").props.glassEffectStyle,
    ).toBeUndefined();
    expect(screen.getByText("Supermercado")).toBeTruthy();
  });

  it("glasses a surface that is only a *sibling* of another glass surface", async () => {
    render(
      <ThemeProvider>
        <>
          <GlassSurface testID="a" />
          <GlassSurface testID="b" />
        </>
      </ThemeProvider>,
    );
    await act(async () => {});

    expect(screen.getByTestId("a").props.glassEffectStyle).toBe("regular");
    expect(screen.getByTestId("b").props.glassEffectStyle).toBe("regular");
  });

  /**
   * El caso real que motivó el guard: `TransactionItem` es cristal suelto en
   * `WalletScreen` y tiene que aplanarse solo dentro de una card de sección ya
   * vidriada, sin que el componente sepa en qué pantalla vive.
   */
  it("flattens a TransactionItem row nested in a glass card, but not a loose one", async () => {
    render(
      <ThemeProvider>
        <>
          <TransactionItem
            id="loose"
            amount={120}
            description="Suelto"
            date={Date.now()}
            type="expense"
          />
          <GlassSurface testID="card">
            <TransactionItem
              id="nested"
              amount={340}
              description="Anidado"
              date={Date.now()}
              type="expense"
            />
          </GlassSurface>
        </>
      </ThemeProvider>,
    );
    await act(async () => {});

    expect(screen.getByTestId("card").props.glassEffectStyle).toBe("regular");

    // De las dos filas solo una es cristal: la suelta. La card se queda con su
    // propio `testID`, así que el único `glass-view` restante es esa fila —
    // la anidada cayó al fallback plano sola.
    expect(screen.queryAllByTestId("glass-view")).toHaveLength(1);
    expect(screen.getByText("Suelto")).toBeTruthy();
    expect(screen.getByText("Anidado")).toBeTruthy();
  });

  /**
   * `GlassNestingBoundary` es la escotilla para contenido que se pinta en otra
   * ventana (el `Modal` de `BottomSheet`): ahí sí vuelve a haber cristal.
   */
  it("lets GlassNestingBoundary restore glass for content rendered in another window", async () => {
    render(
      <ThemeProvider>
        <GlassSurface testID="outer">
          <GlassNestingBoundary>
            <GlassSurface testID="sheet" />
          </GlassNestingBoundary>
        </GlassSurface>
      </ThemeProvider>,
    );
    await act(async () => {});

    expect(screen.getByTestId("outer").props.glassEffectStyle).toBe("regular");
    expect(screen.getByTestId("sheet").props.glassEffectStyle).toBe("regular");
  });
});

/**
 * `forceGlass` — la escotilla **por instancia** sobre el guard de anidamiento
 * (ver "Actualización 2026-09-02" en `docs/refactor-plan.md`). Existe para
 * cualquier superficie propia que viva dentro de una card ya vidriada —
 * destacada o repetida, la distinción se retiró en la tercera vuelta del mismo
 * día; lo que no puede hacer es saltarse los dos gates de runtime ni abrir el
 * subárbol entero.
 */
describe("GlassSurface (iOS) — forceGlass", () => {
  beforeEach(() => {
    mockApiAvailable.mockReturnValue(true);
    jest
      .spyOn(AccessibilityInfo, "isReduceTransparencyEnabled")
      .mockResolvedValue(false);
    jest
      .spyOn(AccessibilityInfo, "addEventListener")
      .mockReturnValue({ remove: jest.fn() } as never);
  });

  afterEach(() => jest.restoreAllMocks());

  it("keeps a nested surface as glass when it opts in with forceGlass", async () => {
    render(
      <ThemeProvider>
        <GlassSurface testID="card">
          <GlassSurface
            testID="highlight"
            forceGlass
            fallbackStyle={{ borderWidth: StyleSheet.hairlineWidth }}
          >
            <Text>Alerta</Text>
          </GlassSurface>
        </GlassSurface>
      </ThemeProvider>,
    );
    await act(async () => {});

    expect(screen.getByTestId("card").props.glassEffectStyle).toBe("regular");
    expect(screen.getByTestId("highlight").props.glassEffectStyle).toBe(
      "regular",
    );
    expect(screen.getByText("Alerta")).toBeTruthy();
  });

  /**
   * No es `GlassNestingBoundary`: una superficie con `forceGlass` sigue
   * publicando "hay cristal encima", así que lo que cuelgue de ella se aplana
   * por defecto. Si no fuera así, un solo `forceGlass` abriría la veda a toda
   * su rama.
   */
  it("still flattens a plain surface nested two levels under a forceGlass one", async () => {
    render(
      <ThemeProvider>
        <GlassSurface testID="card">
          <GlassSurface testID="highlight" forceGlass>
            <GlassSurface
              testID="deep"
              fallbackStyle={{
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: Colors.light.border,
              }}
            >
              <Text>Detalle</Text>
            </GlassSurface>
          </GlassSurface>
        </GlassSurface>
      </ThemeProvider>,
    );
    await act(async () => {});

    expect(screen.getByTestId("highlight").props.glassEffectStyle).toBe(
      "regular",
    );
    expect(screen.getByTestId("deep").props.glassEffectStyle).toBeUndefined();
    const deep = StyleSheet.flatten(
      screen.getByTestId("deep").props.style,
    ) as Record<string, unknown>;
    expect(deep.borderWidth).toBe(StyleSheet.hairlineWidth);
    expect(deep.borderColor).toBe(Colors.light.border);
  });

  async function renderForcedUnderFailingGate() {
    render(
      <ThemeProvider>
        <GlassSurface testID="card">
          <GlassSurface
            testID="highlight"
            forceGlass
            fallbackStyle={{ borderWidth: StyleSheet.hairlineWidth }}
          />
        </GlassSurface>
      </ThemeProvider>,
    );
    await act(async () => {});

    // Ni la card ni el elemento forzado: con un gate en rojo no hay cristal
    // en ninguna parte del árbol.
    expect(screen.getByTestId("card").props.glassEffectStyle).toBeUndefined();
    expect(
      screen.getByTestId("highlight").props.glassEffectStyle,
    ).toBeUndefined();
    const highlight = StyleSheet.flatten(
      screen.getByTestId("highlight").props.style,
    ) as Record<string, unknown>;
    expect(highlight.borderWidth).toBe(StyleSheet.hairlineWidth);
  }

  /**
   * El caso que abrió la tercera vuelta del 2026-09-02: una **lista** de filas
   * repetidas dentro de una card ya vidriada. Antes se dejaban planas por
   * política; ahora cada fila pide cristal por su cuenta y `forceGlass` tiene
   * que dárselo a todas, no solo a la primera — el guard mira el contexto del
   * ancestro, no si ya hay hermanas vidriadas.
   */
  it("glasses every row of a repeated list nested in a glass card", async () => {
    render(
      <ThemeProvider>
        <GlassSurface testID="card">
          {["a", "b", "c"].map((id) => (
            <GlassSurface key={id} testID={`row-${id}`} forceGlass>
              <Text>{id}</Text>
            </GlassSurface>
          ))}
        </GlassSurface>
      </ThemeProvider>,
    );
    await act(async () => {});

    // La card más las tres filas: cuatro superficies de cristal, no una.
    expect(screen.getByTestId("card").props.glassEffectStyle).toBe("regular");
    ["a", "b", "c"].forEach((id) => {
      expect(screen.getByTestId(`row-${id}`).props.glassEffectStyle).toBe(
        "regular",
      );
    });
  });

  it("does not bypass the API-availability gate", async () => {
    mockApiAvailable.mockReturnValue(false);
    await renderForcedUnderFailingGate();
  });

  it("does not bypass the reduce-transparency gate", async () => {
    jest
      .spyOn(AccessibilityInfo, "isReduceTransparencyEnabled")
      .mockResolvedValue(true);
    await renderForcedUnderFailingGate();
  });
});

/**
 * `useGlassSurfaceActive()` es el mismo par de gates, expuesto para los
 * llamantes que tienen que decidir algo **fuera** de la superficie: hoy
 * `BottomSheet` y `FloatingActionMenu`, que se saltan su fundido de entrada
 * cuando hay cristal porque `opacity: 0` en un ancestro lo rompe.
 */
describe("useGlassSurfaceActive (iOS)", () => {
  function Probe() {
    return <Text>{useGlassSurfaceActive() ? "glass" : "flat"}</Text>;
  }

  async function renderProbe() {
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    await settle();
  }

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

  it("is false when the glass API is unavailable", async () => {
    mockApiAvailable.mockReturnValue(false);
    await renderProbe();
    expect(screen.getByText("flat")).toBeTruthy();
  });

  it("is false when reduce transparency is on, even with the API available", async () => {
    mockApiAvailable.mockReturnValue(true);
    jest
      .spyOn(AccessibilityInfo, "isReduceTransparencyEnabled")
      .mockResolvedValue(true);
    await renderProbe();
    expect(screen.getByText("flat")).toBeTruthy();
  });

  it("is true only when both gates pass", async () => {
    mockApiAvailable.mockReturnValue(true);
    await renderProbe();
    expect(screen.getByText("glass")).toBeTruthy();
  });
});
