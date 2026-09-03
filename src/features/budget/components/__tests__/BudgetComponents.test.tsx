import { Colors } from "@/constants/theme";
import { ThemeProvider } from "@/contexts/ThemeContext";
import type { FixedExpense } from "@/features/budget/budgetSlice";
import type { Category } from "@/features/wallet/data/categoriesSlice";
import { act, render, screen } from "@testing-library/react-native";
import { isGlassEffectAPIAvailable } from "expo-glass-effect";
import React from "react";
import { AccessibilityInfo, StyleSheet, View } from "react-native";
import { BudgetCollapsibleCard } from "../budget-dashboard/BudgetCollapsibleCard";
import { BudgetDistributionCard } from "../budget-dashboard/BudgetDistributionCard";
import { BudgetStatsCard } from "../budget-dashboard/BudgetStatsCard";
import { BudgetExpenseFormCard } from "../budget-setup/BudgetExpenseFormCard";
import { BudgetExpenseListItem } from "../budget-setup/BudgetExpenseListItem";
import { BudgetSummaryStep } from "../budget-setup/BudgetSummaryStep";

/**
 * Pase visual de Budget (2026-09-03).
 *
 * Mismo criterio que `AnalyticsComponents.test.tsx`/`DashboardSections.test.tsx`:
 *
 * 1. cada componente con superficie propia aporta **su** superficie de cristal
 *    cuando los dos gates pasan, y cae a `surface`/`background` + hairline
 *    cuando no — afirmado contra `Colors.light` **y** `Colors.dark`;
 * 2. la regla del signo — un gasto fijo (Distribución, Detalles, Resumen del
 *    wizard, la fila de gasto agregado) va en `colors.expense`, **nunca** en
 *    `colors.error` ni `colors.text` — `BudgetDashboard` era el consumidor
 *    original de `error` para "Fijos"/"Gastos Fijos", corregido en este pase;
 * 3. la fila de gasto fijo agregado (`BudgetExpenseListItem`) sigue el mismo
 *    patrón pill + disco de icono de 40 que `TransactionItem` (Wallet) /
 *    `VisionEntityList` (Vision), pedido explícito del usuario tras el pase
 *    de Analytics.
 */

/**
 * Reanimated no arranca bajo Jest sin runtime nativo (mismo problema
 * preexistente que rompe la suite de `BudgetScreen`, ver
 * `VisionComponents.test.tsx`). `BudgetCollapsibleCard` solo lo usa para el
 * fundido del contenido expandido; aquí interesa la superficie, no la
 * animación.
 */
jest.mock("react-native-reanimated", () => {
  // `require` obligatorio: la factoría de `jest.mock` se hoistea sobre los imports.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View: RNView } = require("react-native");
  const noopAnimation = { duration: () => undefined };
  return {
    __esModule: true,
    default: { View: RNView },
    FadeIn: noopAnimation,
    FadeOut: noopAnimation,
    LinearTransition: undefined,
  };
});

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

/** Estilos aplanados del nodo de texto que contiene `text`. */
function styleOf(text: string | RegExp) {
  return StyleSheet.flatten(screen.getByText(text).props.style) as Record<
    string,
    unknown
  >;
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

const EXPENSE: FixedExpense = {
  id: "e1",
  name: "Internet",
  amount: 45,
  category: "🏠 Vivienda",
};

const CATEGORY: Category = {
  id: "c1",
  userId: "u1",
  name: "🏠 Vivienda",
  createdAt: 0,
};

describe("BudgetCollapsibleCard — cristal por defecto, plana como fallback", () => {
  it("aporta una superficie de cristal cuando los dos gates están en verde", async () => {
    mockApiAvailable.mockReturnValue(true);
    renderInTheme(
      <BudgetCollapsibleCard
        title="Distribución"
        icon="chart.pie.fill"
        expanded={false}
        onToggle={jest.fn()}
        chevronColor={Colors.light.icon}
      >
        <View />
      </BudgetCollapsibleCard>,
    );
    await settle();

    expect(screen.getByTestId("glass-view")).toBeTruthy();
  });

  it("se queda plana cuando la API de cristal no está disponible", async () => {
    mockApiAvailable.mockReturnValue(false);
    renderInTheme(
      <BudgetCollapsibleCard
        title="Distribución"
        icon="chart.pie.fill"
        expanded={false}
        onToggle={jest.fn()}
        chevronColor={Colors.light.icon}
      >
        <View />
      </BudgetCollapsibleCard>,
    );
    await settle();

    expect(screen.queryByTestId("glass-view")).toBeNull();
  });

  it.each([
    ["light" as const, Colors.light],
    ["dark" as const, Colors.dark],
  ])(
    "cae a `surface` + hairline en modo %s cuando no hay cristal (era `colors.glass.cardBg`)",
    async (theme, colors) => {
      mockColorScheme.mockReturnValue(theme);
      mockApiAvailable.mockReturnValue(false);
      renderInTheme(
        <BudgetCollapsibleCard
          title="Distribución"
          icon="chart.pie.fill"
          expanded={false}
          onToggle={jest.fn()}
          chevronColor={colors.icon}
        >
          <View />
        </BudgetCollapsibleCard>,
      );
      await settle();

      const card = viewStyles().find(
        (s) => s?.backgroundColor === colors.surface && s?.borderWidth,
      );
      expect(card).toBeDefined();
      expect(card?.borderWidth).toBe(StyleSheet.hairlineWidth);
      expect(card?.borderColor).toBe(colors.border);
      // El vidrio falso deprecado pintaba sombra `#000`; la card plana no.
      expect(card?.shadowColor).toBeUndefined();
    },
  );
});

describe("BudgetDistributionCard — la regla del signo", () => {
  it("los fijos van en `colors.expense`, nunca en `colors.error`", async () => {
    renderInTheme(
      <BudgetDistributionCard
        colors={Colors.light}
        expanded
        onToggle={jest.fn()}
        remainingBudget={500}
        totalFixedExpenses={300}
      />,
    );
    await settle();

    const style = styleOf("$300.00");
    expect(style.color).toBe(Colors.light.expense);
    expect(style.color).not.toBe(Colors.light.error);
  });

  it("el libre restante va en `colors.success`", async () => {
    renderInTheme(
      <BudgetDistributionCard
        colors={Colors.light}
        expanded
        onToggle={jest.fn()}
        remainingBudget={500}
        totalFixedExpenses={300}
      />,
    );
    await settle();

    const amounts = screen.getAllByText("$500.00");
    amounts.forEach((node) => {
      const style = StyleSheet.flatten(node.props.style) as Record<
        string,
        unknown
      >;
      expect(style.color).toBe(Colors.light.success);
    });
  });
});

describe("BudgetStatsCard — la regla del signo", () => {
  it("los gastos (fijos y reales) van en `colors.expense`, nunca `colors.error` ni `colors.text`", async () => {
    renderInTheme(
      <BudgetStatsCard
        colors={Colors.light}
        expanded
        onToggle={jest.fn()}
        monthlyIncome={1000}
        totalFixedExpenses={300}
        totalActualIncome={1000}
        totalActualExpense={250}
      />,
    );
    await settle();

    const fixed = styleOf("−$300.00");
    const actual = styleOf("−$250.00");
    [fixed, actual].forEach((style) => {
      expect(style.color).toBe(Colors.light.expense);
      expect(style.color).not.toBe(Colors.light.error);
      expect(style.color).not.toBe(Colors.light.text);
    });
  });

  it("los ingresos (esperado y real) van en `colors.success`", async () => {
    renderInTheme(
      <BudgetStatsCard
        colors={Colors.light}
        expanded
        onToggle={jest.fn()}
        monthlyIncome={1000}
        totalFixedExpenses={300}
        totalActualIncome={900}
        totalActualExpense={250}
      />,
    );
    await settle();

    const expected = styleOf("$1,000.00");
    const actual = styleOf("$900.00");
    [expected, actual].forEach((style) => {
      expect(style.color).toBe(Colors.light.success);
    });
  });
});

describe("BudgetSummaryStep — resumen final del wizard", () => {
  it("el ingreso mensual va en `colors.success` y el total de gastos fijos en `colors.expense`", async () => {
    renderInTheme(
      <BudgetSummaryStep
        colors={Colors.light}
        parsedIncome={1200}
        totalExpenses={400}
        onBack={jest.fn()}
        onFinish={jest.fn()}
      />,
    );
    await settle();

    expect(styleOf("$1,200.00").color).toBe(Colors.light.success);
    const expenseStyle = styleOf("$400.00");
    expect(expenseStyle.color).toBe(Colors.light.expense);
    expect(expenseStyle.color).not.toBe(Colors.light.error);
  });

  it("cada card del resumen aporta su propia superficie de cristal cuando el gate está en verde", async () => {
    mockApiAvailable.mockReturnValue(true);
    renderInTheme(
      <BudgetSummaryStep
        colors={Colors.light}
        parsedIncome={1200}
        totalExpenses={400}
        onBack={jest.fn()}
        onFinish={jest.fn()}
      />,
    );
    await settle();

    // 2 cards (ingreso/gastos) + 2 botones de `WizardNavRow` ("Atrás"
    // outline, "Finalizar" primary) — `Button` gana cristal propio el
    // 2026-09-03, así que este paso del wizard lo hereda gratis sin tocarlo.
    expect(screen.getAllByTestId("glass-view")).toHaveLength(4);
  });
});

describe("BudgetExpenseListItem — misma fila pill + disco de icono que TransactionItem", () => {
  it("aporta una superficie de cristal cuando el gate está en verde", async () => {
    mockApiAvailable.mockReturnValue(true);
    renderInTheme(
      <BudgetExpenseListItem
        colors={Colors.light}
        expense={EXPENSE}
        onRemove={jest.fn()}
      />,
    );
    await settle();

    expect(screen.getByTestId("glass-view")).toBeTruthy();
  });

  it.each([
    ["light" as const, Colors.light],
    ["dark" as const, Colors.dark],
  ])(
    "cae a `background` + hairline en modo %s (opaca, como `TransactionItem`, no una card)",
    async (theme, colors) => {
      mockColorScheme.mockReturnValue(theme);
      mockApiAvailable.mockReturnValue(false);
      renderInTheme(
        <BudgetExpenseListItem
          colors={colors}
          expense={EXPENSE}
          onRemove={jest.fn()}
        />,
      );
      await settle();

      const row = viewStyles().find(
        (s) => s?.backgroundColor === colors.background && s?.borderBottomWidth,
      );
      expect(row).toBeDefined();
      expect(row?.borderBottomWidth).toBe(StyleSheet.hairlineWidth);
      expect(row?.borderRadius).toBe(9999);
    },
  );

  it("el disco de icono es 40x40 sobre `surfaceHighlight`", async () => {
    renderInTheme(
      <BudgetExpenseListItem
        colors={Colors.light}
        expense={EXPENSE}
        onRemove={jest.fn()}
      />,
    );
    await settle();

    const disc = viewStyles().find(
      (s) => s?.backgroundColor === Colors.light.surfaceHighlight,
    );
    expect(disc).toBeDefined();
    expect(disc?.width).toBe(40);
    expect(disc?.height).toBe(40);
  });

  it("el importe va en `colors.expense`, nunca `colors.error`", async () => {
    renderInTheme(
      <BudgetExpenseListItem
        colors={Colors.light}
        expense={EXPENSE}
        onRemove={jest.fn()}
      />,
    );
    await settle();

    const style = styleOf("$45.00");
    expect(style.color).toBe(Colors.light.expense);
    expect(style.color).not.toBe(Colors.light.error);
  });

  it("el botón de borrar tiene accessibilityLabel", async () => {
    renderInTheme(
      <BudgetExpenseListItem
        colors={Colors.light}
        expense={EXPENSE}
        onRemove={jest.fn()}
      />,
    );
    await settle();

    expect(screen.getByLabelText("Eliminar")).toBeTruthy();
  });
});

describe("BudgetExpenseFormCard — la card del formulario lleva cristal", () => {
  it("aporta una superficie de cristal cuando el gate está en verde", async () => {
    mockApiAvailable.mockReturnValue(true);
    renderInTheme(
      <BudgetExpenseFormCard
        colors={Colors.light}
        categories={[CATEGORY]}
        expenseName=""
        onChangeExpenseName={jest.fn()}
        expenseAmount=""
        onChangeExpenseAmount={jest.fn()}
        expenseCategory=""
        isCategoryDropdownOpen={false}
        onToggleCategoryDropdown={jest.fn()}
        onSelectCategory={jest.fn()}
        onAddExpense={jest.fn()}
      />,
    );
    await settle();

    expect(screen.getByTestId("glass-view")).toBeTruthy();
  });

  it("se queda plana, `surface` + hairline, cuando la API de cristal no está disponible", async () => {
    mockApiAvailable.mockReturnValue(false);
    renderInTheme(
      <BudgetExpenseFormCard
        colors={Colors.light}
        categories={[CATEGORY]}
        expenseName=""
        onChangeExpenseName={jest.fn()}
        expenseAmount=""
        onChangeExpenseAmount={jest.fn()}
        expenseCategory=""
        isCategoryDropdownOpen={false}
        onToggleCategoryDropdown={jest.fn()}
        onSelectCategory={jest.fn()}
        onAddExpense={jest.fn()}
      />,
    );
    await settle();

    expect(screen.queryByTestId("glass-view")).toBeNull();
    const card = viewStyles().find(
      (s) => s?.backgroundColor === Colors.light.surface && s?.borderWidth,
    );
    expect(card).toBeDefined();
    expect(card?.borderWidth).toBe(StyleSheet.hairlineWidth);
  });
});
