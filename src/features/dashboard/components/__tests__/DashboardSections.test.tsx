import { Colors } from "@/constants/theme";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AllocationSection } from "@/features/dashboard/components/AllocationSection";
import { AnomalousMovementsSection } from "@/features/dashboard/components/AnomalousMovementsSection";
import { BalanceOverviewSection } from "@/features/dashboard/components/BalanceOverviewSection";
import { CategorySpikeAlertsSection } from "@/features/dashboard/components/CategorySpikeAlertsSection";
import { DashboardPeriodControls } from "@/features/dashboard/components/DashboardPeriodControls";
import { RecentTransactionsSection } from "@/features/dashboard/components/RecentTransactionsSection";
import { UpcomingFixedPaymentsSection } from "@/features/dashboard/components/UpcomingFixedPaymentsSection";
import { WeeklySpendingSection } from "@/features/dashboard/components/WeeklySpendingSection";
import type { DashboardColors } from "@/features/dashboard/components/types";
import type { Transaction } from "@/features/wallet/data/walletSlice";
import { act, render, screen } from "@testing-library/react-native";
import { isGlassEffectAPIAvailable } from "expo-glass-effect";
import React from "react";
import { AccessibilityInfo, StyleSheet, View } from "react-native";

/**
 * Pase visual de Dashboard (2026-09-02).
 *
 * Cubre las tres cosas que sí son verificables sin simulador:
 * 1. cada sección tiene **su propia** superficie de cristal en iOS 26+ y cae a
 *    `surface` + hairline cuando no hay cristal — comprobado en claro y oscuro,
 *    que es la verificación de tema de este pase;
 * 2. el guard de anidamiento: dentro de una card vidriada no aparece una segunda
 *    superficie de cristal;
 * 3. la regla del signo — `expense` para gasto, `success` para ingreso, y
 *    `error` solo donde de verdad hay un problema.
 */

/**
 * `react-native-gifted-charts` se publica en ESM sin transpilar y Jest no lo
 * transforma. Se stubea porque aquí no se está probando el gráfico: lo que se
 * prueba es la superficie que lo envuelve.
 */
jest.mock("react-native-gifted-charts", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View } = require("react-native");
  return { LineChart: View, PieChart: View, BarChart: View };
});

const mockApiAvailable = jest.mocked(isGlassEffectAPIAvailable);

const mockColorScheme = jest.fn(() => "light");
jest.mock("react-native/Libraries/Utilities/useColorScheme", () => ({
  __esModule: true,
  default: () => mockColorScheme(),
}));

function palette(theme: "light" | "dark"): DashboardColors {
  return Colors[theme];
}

const TRANSACTIONS: Transaction[] = [
  {
    id: "t1",
    amount: 1200,
    description: "Nomina",
    date: Date.UTC(2026, 7, 3),
    type: "income",
    category: "💼 Trabajo",
  } as Transaction,
  {
    id: "t2",
    amount: 340,
    description: "Supermercado",
    date: Date.UTC(2026, 7, 4),
    type: "expense",
    category: "🍔 Comida",
  } as Transaction,
];

const WEEKLY_DETAIL = {
  label: "Sem 1",
  range: "1–7 ago",
  expenseTotal: 500,
  incomeTotal: 900,
  balance: 400,
  categories: [{ category: "Comida", amount: 300 }],
  incomeCategories: [{ category: "Sueldo", amount: 900 }],
};

const formatValue = (v: number) => `$${v}`;

function renderInTheme(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

async function settle() {
  await act(async () => {});
}

/** Estilos aplanados del nodo de texto que contiene `text`. */
function styleOf(text: string | RegExp) {
  return StyleSheet.flatten(screen.getByText(text).props.style) as Record<
    string,
    unknown
  >;
}

/**
 * Estilos aplanados de todas las `View`. La card plana no tiene `testID`
 * propio, así que se busca por su tratamiento de fondo en vez de acoplar el
 * test a la profundidad exacta del árbol.
 */
function flatCardStyles() {
  return screen
    .UNSAFE_getAllByType(View)
    .map((node) => StyleSheet.flatten(node.props.style));
}

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

/**
 * Cada sección se renderiza aislada, así que el número de superficies de
 * cristal que aparecen es exactamente el que la sección aporta por sí misma.
 */
const SECTIONS: {
  name: string;
  /** Superficies de cristal propias (la card, más las píldoras si las tiene). */
  glassSurfaces: number;
  render: (colors: DashboardColors) => React.ReactElement;
}[] = [
  {
    name: "BalanceOverviewSection",
    // La card del saldo más las tres píldoras: son hermanas, no anidadas.
    glassSurfaces: 4,
    render: (colors) => (
      <BalanceOverviewSection
        colors={colors}
        periodView="month"
        income={1200}
        expense={340}
        balance={860}
        savings={200}
      />
    ),
  },
  {
    name: "CategorySpikeAlertsSection",
    // La card más la caja de la alerta, que pide cristal con `forceGlass`.
    glassSurfaces: 2,
    render: (colors) => (
      <CategorySpikeAlertsSection
        colors={colors}
        periodView="month"
        alerts={[
          {
            category: "Comida",
            currentAmount: 900,
            averageAmount: 600,
            increasePct: 50,
            weekLabel: "Sem 1",
          },
        ]}
        formatWeeklyValue={formatValue}
      />
    ),
  },
  {
    name: "AnomalousMovementsSection",
    // La card más la caja del movimiento (`forceGlass`).
    glassSurfaces: 2,
    render: (colors) => (
      <AnomalousMovementsSection
        colors={colors}
        movements={[
          {
            id: "m1",
            description: "Compra grande",
            category: "Hogar",
            type: "expense",
            amount: 5000,
            expected: 800,
            zScore: 3.2,
            date: Date.UTC(2026, 7, 4),
          },
        ]}
        formatWeeklyValue={formatValue}
      />
    ),
  },
  {
    name: "UpcomingFixedPaymentsSection",
    // La card, el panel de totales y el único pago: los tres con `forceGlass`.
    glassSurfaces: 3,
    render: (colors) => (
      <UpcomingFixedPaymentsSection
        colors={colors}
        data={{
          items: [
            {
              key: "f1",
              description: "Renta",
              category: "Hogar",
              amount: 700,
              dueDate: new Date(Date.UTC(2026, 7, 10)),
              recurrenceFrequency: "monthly",
            },
          ],
          total: 700,
          expectedBalanceAfterFixed: 160,
        }}
        formatWeeklyValue={formatValue}
      />
    ),
  },
  {
    name: "RecentTransactionsSection",
    // La card más una superficie por transacción: desde el retrofit del
    // 2026-09-02 (tercera vuelta) las filas repetidas también son cristal.
    glassSurfaces: 1 + TRANSACTIONS.length,
    render: (colors) => (
      <RecentTransactionsSection colors={colors} transactions={TRANSACTIONS} />
    ),
  },
  {
    name: "WeeklySpendingSection",
    // Solo la card: sin datos de tendencia no se dibuja el botón de detalle,
    // que es la otra superficie de la sección (ver el test del desglose).
    glassSurfaces: 1,
    render: (colors) => (
      <WeeklySpendingSection
        colors={colors}
        periodView="month"
        expenseTrend={{ data: [], hasData: false }}
        lineChartSpacing={40}
        onLineChartLayout={jest.fn()}
        formatWeeklyValue={formatValue}
        showWeeklyDetails={false}
        onToggleWeeklyDetails={jest.fn()}
        weeklyDetails={[WEEKLY_DETAIL]}
        expandedWeek={null}
        onToggleExpandedWeek={jest.fn()}
      />
    ),
  },
  {
    name: "AllocationSection",
    glassSurfaces: 1,
    render: (colors) => (
      <AllocationSection
        colors={colors}
        periodView="month"
        expense={340}
        allocationBreakdown={[]}
        pieData={[]}
      />
    ),
  },
];

describe("Dashboard — cada sección es su propia superficie", () => {
  it.each(SECTIONS)(
    "$name gets its own native glass surface when both gates pass",
    async ({ glassSurfaces, render: renderSection }) => {
      mockApiAvailable.mockReturnValue(true);
      renderInTheme(renderSection(palette("light")));
      await settle();

      expect(screen.queryAllByTestId("glass-view")).toHaveLength(glassSurfaces);
    },
  );

  it.each([
    ["light" as const, Colors.light],
    ["dark" as const, Colors.dark],
  ])(
    "falls back to an opaque `surface` card with a hairline border in %s mode",
    async (theme, colors) => {
      mockColorScheme.mockReturnValue(theme);
      mockApiAvailable.mockReturnValue(false);
      renderInTheme(
        <RecentTransactionsSection
          colors={colors}
          transactions={TRANSACTIONS}
        />,
      );
      await settle();

      expect(screen.queryByTestId("glass-view")).toBeNull();
      const card = flatCardStyles().find(
        (s) => s?.backgroundColor === colors.surface && s?.borderWidth,
      );
      expect(card).toBeDefined();
      expect(card?.borderWidth).toBe(StyleSheet.hairlineWidth);
      expect(card?.borderColor).toBe(colors.border);
    },
  );

  /**
   * El guard de anidamiento donde sigue mandando tras la tercera vuelta: dentro
   * de una fila ya vidriada. La fila de transacción reciente es cristal, pero su
   * disco de icono es una `View` normal — no se apila un tercer material.
   */
  it("never stacks a third level of glass inside an already-glass row", async () => {
    mockApiAvailable.mockReturnValue(true);
    renderInTheme(
      <RecentTransactionsSection
        colors={palette("light")}
        transactions={TRANSACTIONS}
      />,
    );
    await settle();

    // La card y una fila por transacción, y ni una superficie más.
    expect(screen.queryAllByTestId("glass-view")).toHaveLength(
      1 + TRANSACTIONS.length,
    );
    // Ninguna de ellas lleva fondo opaco: el material sustituye al `surface`.
    screen.getAllByTestId("glass-view").forEach((node) => {
      const style = StyleSheet.flatten(node.props.style) as Record<
        string,
        unknown
      >;
      expect(style.backgroundColor).toBeUndefined();
    });
    // El disco del icono sigue siendo una `View` opaca dentro del cristal.
    const disc = flatCardStyles().find(
      (s) => s?.backgroundColor === Colors.light.surface && s?.width === 40,
    );
    expect(disc).toBeDefined();
  });

  /**
   * La cabecera de periodo es la excepción deliberada: no es una card, es
   * layout. Sus dos controles ya son cristal cada uno por su cuenta.
   */
  it("keeps DashboardPeriodControls as two sibling glass controls, not one slab", async () => {
    mockApiAvailable.mockReturnValue(true);
    renderInTheme(
      <DashboardPeriodControls
        periodView="month"
        selectedDate={new Date(Date.UTC(2026, 7, 1))}
        currentMonthName="agosto"
        year={2026}
        onOpenDatePicker={jest.fn()}
        onChangePeriodView={jest.fn()}
      />,
    );
    await settle();

    expect(screen.queryAllByTestId("glass-view")).toHaveLength(2);
  });

  /**
   * El desglose semanal, que es lo que abrió la tercera vuelta del 2026-09-02:
   * el usuario vio en dispositivo que las filas de semana seguían planas. Ahora
   * cada bloque de semana es cristal (`forceGlass`), igual que el botón "Ver
   * detalles por semana". Lo que hay **dentro** del bloque —su toggle y el
   * panel de totales— sigue plano por el guard: es el tercer nivel.
   */
  it("glasses every weekly detail block, and stops at the block's own contents", async () => {
    mockApiAvailable.mockReturnValue(true);
    const secondWeek = { ...WEEKLY_DETAIL, label: "Sem 2", range: "8–14 ago" };
    renderInTheme(
      <WeeklySpendingSection
        colors={palette("light")}
        periodView="month"
        expenseTrend={{
          data: [{ value: 100, label: "Sem 1", dataPointText: "100" }],
          hasData: true,
        }}
        lineChartSpacing={40}
        onLineChartLayout={jest.fn()}
        formatWeeklyValue={formatValue}
        showWeeklyDetails
        onToggleWeeklyDetails={jest.fn()}
        weeklyDetails={[WEEKLY_DETAIL, secondWeek]}
        expandedWeek={WEEKLY_DETAIL.label}
        onToggleExpandedWeek={jest.fn()}
      />,
    );
    await settle();

    // La card, el botón de detalle, un bloque por semana (2), el botón "Ver
    // gastos" de cada bloque (2, se renderiza siempre, no solo si expandido)
    // y el panel de totales de la semana expandida (1): 1+1+2+2+1 = 7. Ya no
    // hay un tercer nivel que se quede plano "porque es repetido" — esa
    // excepción se retiró (ver "Dirección estética" en el plan).
    expect(screen.queryAllByTestId("glass-view")).toHaveLength(7);
    // Y dentro, la regla del signo intacta.
    expect(styleOf("−$500").color).toBe(Colors.light.expense);
    // "+$900" sale dos veces: el total de ingresos y su única categoría.
    screen.getAllByText("+$900").forEach((node) => {
      expect(
        (StyleSheet.flatten(node.props.style) as Record<string, unknown>).color,
      ).toBe(Colors.light.success);
    });
  });

  /**
   * Sin cristal, el bloque de semana vuelve exactamente al recuadro de antes:
   * `surfaceHighlight` + hairline, el escalón *dentro* de la card. En claro y en
   * oscuro, que es la verificación de tema de esta vuelta.
   */
  it.each([
    ["light" as const, Colors.light],
    ["dark" as const, Colors.dark],
  ])(
    "falls back to `surfaceHighlight` + hairline for the weekly blocks in %s mode",
    async (theme, colors) => {
      mockColorScheme.mockReturnValue(theme);
      mockApiAvailable.mockReturnValue(false);
      renderInTheme(
        <WeeklySpendingSection
          colors={colors}
          periodView="month"
          expenseTrend={{
            data: [{ value: 100, label: "Sem 1", dataPointText: "100" }],
            hasData: true,
          }}
          lineChartSpacing={40}
          onLineChartLayout={jest.fn()}
          formatWeeklyValue={formatValue}
          showWeeklyDetails
          onToggleWeeklyDetails={jest.fn()}
          weeklyDetails={[WEEKLY_DETAIL]}
          expandedWeek={null}
          onToggleExpandedWeek={jest.fn()}
        />,
      );
      await settle();

      expect(screen.queryByTestId("glass-view")).toBeNull();
      const block = flatCardStyles().find(
        (s) =>
          s?.backgroundColor === colors.surfaceHighlight &&
          s?.borderWidth === StyleSheet.hairlineWidth,
      );
      expect(block).toBeDefined();
      expect(block?.borderColor).toBe(colors.border);
    },
  );
});

/**
 * Retrofit 2026-09-02: el usuario vio Dashboard en dispositivo y señaló que las
 * cajas destacadas de dentro de las cards seguían leyéndose como recuadros
 * blancos planos. Optan por `forceGlass`; lo que no cambia es el fallback ni la
 * regla para el contenido repetido.
 */
describe("Dashboard — elementos destacados con forceGlass", () => {
  it("glasses every fixed-payment box: el panel de totales y cada pago", async () => {
    mockApiAvailable.mockReturnValue(true);
    renderInTheme(
      <UpcomingFixedPaymentsSection
        colors={palette("light")}
        data={{
          items: [
            {
              key: "f1",
              description: "Renta",
              category: "Hogar",
              amount: 700,
              dueDate: new Date(Date.UTC(2026, 7, 10)),
              recurrenceFrequency: "monthly",
            },
            {
              key: "f2",
              description: "Internet",
              category: "Servicios",
              amount: 300,
              dueDate: new Date(Date.UTC(2026, 7, 14)),
              recurrenceFrequency: "monthly",
            },
          ],
          total: 1000,
          expectedBalanceAfterFixed: 160,
        }}
        formatWeeklyValue={formatValue}
      />,
    );
    await settle();

    // Card + totales + los dos pagos: cada caja es su propia superficie.
    expect(screen.queryAllByTestId("glass-view")).toHaveLength(4);
  });

  it("glasses one box per alert, not one shared wrapper", async () => {
    mockApiAvailable.mockReturnValue(true);
    renderInTheme(
      <CategorySpikeAlertsSection
        colors={palette("light")}
        periodView="month"
        alerts={[
          {
            category: "Comida",
            currentAmount: 900,
            averageAmount: 600,
            increasePct: 50,
            weekLabel: "Sem 1",
          },
          {
            category: "Transporte",
            currentAmount: 400,
            averageAmount: 200,
            increasePct: 100,
            weekLabel: "Sem 2",
          },
        ]}
        formatWeeklyValue={formatValue}
      />,
    );
    await settle();

    expect(screen.queryAllByTestId("glass-view")).toHaveLength(3);
  });

  /**
   * Las filas de `RecentTransactionsSection` eran el caso contrario —contenido
   * repetido que se quedaba plano— hasta que esa excepción se retiró
   * (2026-09-02, tercera vuelta). Ahora cada fila es su propia superficie.
   */
  it("glasses every recent transaction row, one surface per movement", async () => {
    mockApiAvailable.mockReturnValue(true);
    renderInTheme(
      <RecentTransactionsSection
        colors={palette("light")}
        transactions={TRANSACTIONS}
      />,
    );
    await settle();

    expect(screen.queryAllByTestId("glass-view")).toHaveLength(
      1 + TRANSACTIONS.length,
    );
  });

  /**
   * Sin cristal la fila vuelve a un recuadro `surfaceHighlight` + hairline: el
   * escalón dentro de la card, que ya es `surface`. En claro y en oscuro.
   */
  it.each([
    ["light" as const, Colors.light],
    ["dark" as const, Colors.dark],
  ])(
    "falls back to `surfaceHighlight` + hairline for the recent rows in %s mode",
    async (theme, colors) => {
      mockColorScheme.mockReturnValue(theme);
      mockApiAvailable.mockReturnValue(false);
      renderInTheme(
        <RecentTransactionsSection
          colors={colors}
          transactions={TRANSACTIONS}
        />,
      );
      await settle();

      expect(screen.queryByTestId("glass-view")).toBeNull();
      const rows = flatCardStyles().filter(
        (s) =>
          s?.backgroundColor === colors.surfaceHighlight &&
          s?.borderWidth === StyleSheet.hairlineWidth &&
          s?.borderColor === colors.border,
      );
      expect(rows).toHaveLength(TRANSACTIONS.length);
    },
  );

  /**
   * El límite de la regla: se vidria lo que **tiene superficie propia**, no toda
   * fila repetida. La leyenda del donut son punto + etiqueta + porcentaje, sin
   * fondo ni borde: anotación del gráfico. Sigue sin cristal, y eso no es la
   * excepción retirada — es que no hay superficie que vidriar.
   */
  it("does not invent a surface for the donut legend rows", async () => {
    mockApiAvailable.mockReturnValue(true);
    renderInTheme(
      <AllocationSection
        colors={palette("light")}
        periodView="month"
        expense={340}
        allocationBreakdown={[
          { category: "Comida", amount: 200, percent: 0.6, color: "#123456" },
          { category: "Hogar", amount: 140, percent: 0.4, color: "#654321" },
        ]}
        pieData={[
          { value: 200, color: "#123456" },
          { value: 140, color: "#654321" },
        ]}
      />,
    );
    await settle();

    // Solo la card de la sección.
    expect(screen.queryAllByTestId("glass-view")).toHaveLength(1);
  });

  /**
   * Sin cristal —Android/web, iOS sin API, o "reducir transparencia"— las cajas
   * destacadas vuelven exactamente al recuadro `surface` + hairline de antes,
   * en claro y en oscuro. `forceGlass` no toca los gates.
   */
  it.each([
    ["light" as const, Colors.light],
    ["dark" as const, Colors.dark],
  ])(
    "falls back to `surface` + hairline for the highlighted boxes in %s mode",
    async (theme, colors) => {
      mockColorScheme.mockReturnValue(theme);
      mockApiAvailable.mockReturnValue(false);
      renderInTheme(
        <AnomalousMovementsSection
          colors={colors}
          movements={[
            {
              id: "m1",
              description: "Compra grande",
              category: "Hogar",
              type: "expense",
              amount: 5000,
              expected: 800,
              zScore: 3.2,
              date: Date.UTC(2026, 7, 4),
            },
          ]}
          formatWeeklyValue={formatValue}
        />,
      );
      await settle();

      expect(screen.queryByTestId("glass-view")).toBeNull();
      const boxes = flatCardStyles().filter(
        (s) =>
          s?.backgroundColor === colors.surface &&
          s?.borderWidth === StyleSheet.hairlineWidth &&
          s?.borderColor === colors.border,
      );
      // La card de sección y la caja del movimiento.
      expect(boxes.length).toBeGreaterThanOrEqual(2);
    },
  );
});

describe("Dashboard — la regla del signo", () => {
  it("paints a recent expense with `expense`, never `text` nor `error`", async () => {
    renderInTheme(
      <RecentTransactionsSection
        colors={palette("light")}
        transactions={TRANSACTIONS}
      />,
    );
    await settle();

    const expense = styleOf(/^−/);
    expect(expense.color).toBe(Colors.light.expense);
    expect(expense.color).not.toBe(Colors.light.error);
    expect(expense.color).not.toBe(Colors.light.text);
    expect(styleOf(/^\+/).color).toBe(Colors.light.success);
  });

  it("keeps the sign rule in dark mode too", async () => {
    mockColorScheme.mockReturnValue("dark");
    renderInTheme(
      <RecentTransactionsSection
        colors={palette("dark")}
        transactions={TRANSACTIONS}
      />,
    );
    await settle();

    expect(styleOf(/^−/).color).toBe(Colors.dark.expense);
    expect(styleOf(/^\+/).color).toBe(Colors.dark.success);
  });

  it("uses tabular figures for every amount in the list", async () => {
    renderInTheme(
      <RecentTransactionsSection
        colors={palette("light")}
        transactions={TRANSACTIONS}
      />,
    );
    await settle();

    const amount = styleOf(/^−/);
    expect(amount.fontVariant).toEqual(["tabular-nums"]);
    expect(amount.textAlign).toBe("right");
  });

  it("paints the negative period balance with `expense`, not `error`", async () => {
    renderInTheme(
      <BalanceOverviewSection
        colors={palette("light")}
        periodView="month"
        income={100}
        expense={500}
        balance={-400}
        savings={0}
      />,
    );
    await settle();

    const balance = styleOf(/400/);
    expect(balance.color).toBe(Colors.light.expense);
    expect(balance.color).not.toBe(Colors.light.error);
  });

  it("warns — not errors — on a category spike", async () => {
    renderInTheme(
      <CategorySpikeAlertsSection
        colors={palette("light")}
        periodView="month"
        alerts={[
          {
            category: "Comida",
            currentAmount: 900,
            averageAmount: 600,
            increasePct: 50,
            weekLabel: "Sem 1",
          },
        ]}
        formatWeeklyValue={formatValue}
      />,
    );
    await settle();

    const spike = styleOf("+50%");
    expect(spike.color).toBe(Colors.light.warning);
    expect(spike.color).not.toBe(Colors.light.error);
  });

  /**
   * El único `error` legítimo del dashboard: un balance proyectado negativo
   * *después* de los fijos es un sobregiro que va a ocurrir.
   */
  it("reserves `error` for a projected overdraft after fixed payments", async () => {
    renderInTheme(
      <UpcomingFixedPaymentsSection
        colors={palette("light")}
        data={{
          items: [],
          total: 700,
          expectedBalanceAfterFixed: -120,
        }}
        formatWeeklyValue={formatValue}
      />,
    );
    await settle();

    expect(styleOf(/-120/).color).toBe(Colors.light.error);
    // El total de los fijos sigue siendo un gasto normal.
    expect(styleOf(/^−\$700/).color).toBe(Colors.light.expense);
  });
});
