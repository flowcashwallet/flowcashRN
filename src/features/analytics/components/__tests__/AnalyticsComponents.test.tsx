import { Colors } from "@/constants/theme";
import { ThemeProvider } from "@/contexts/ThemeContext";
import type { Forecast, Transaction } from "@/features/wallet/data/walletSlice";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { isGlassEffectAPIAvailable } from "expo-glass-effect";
import React from "react";
import { AccessibilityInfo, StyleSheet, View } from "react-native";
import type {
  CategoryInsight,
  RecurringExpense,
} from "../../utils/analyticsUtils";
import { ForecastCard } from "../ForecastCard";
import { AnalyticsMonthHeader } from "../analytics/AnalyticsMonthHeader";
import { CategoryCard } from "../analytics/CategoryCard";
import { FinancialTipsSection } from "../analytics/FinancialTipsSection";
import { RecurringExpensesSection } from "../analytics/RecurringExpensesSection";
import { TopCategoriesSection } from "../analytics/TopCategoriesSection";
import { StatisticsCategoriesList } from "../statistics-categories/StatisticsCategoriesList";
import { StatisticsCategoryCard } from "../statistics-categories/StatisticsCategoryCard";
import { StatisticsRecurringList } from "../statistics-recurring/StatisticsRecurringList";

/**
 * Pase visual de Analytics (2026-09-02/03).
 *
 * Mismo criterio que `DashboardSections.test.tsx`/`VisionComponents.test.tsx`:
 *
 * 1. cada componente con superficie propia aporta **su** superficie de cristal
 *    cuando los dos gates pasan, y cae a `surface`/`surfaceHighlight` + hairline
 *    cuando no — afirmado contra `Colors.light` **y** `Colors.dark`, que es la
 *    verificación de tema claro/oscuro de este pase (no hay simulador aquí);
 * 2. la regla del signo — `expense` para lo que sale, `success` para lo que
 *    entra, y **nunca** `error` para un importe normal (`ForecastCard` es el
 *    componente con más superficie de este tipo: desglose, "hoy", tendencia y
 *    confianza);
 * 3. los paneles `forceGlass` de `ForecastCard` (desglose y consejo) piden
 *    cristal aunque estén anidados dentro de la card, que ya es cristal —
 *    mismo patrón de anidamiento que `GlassSurface.test.tsx`.
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

/** Estilos aplanados del nodo de texto que contiene `text`. */
function styleOf(text: string | RegExp) {
  return StyleSheet.flatten(screen.getByText(text).props.style) as Record<
    string,
    unknown
  >;
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
  jest.spyOn(AccessibilityInfo, "isReduceMotionEnabled").mockResolvedValue(false);
  jest
    .spyOn(AccessibilityInfo, "addEventListener")
    .mockReturnValue({ remove: jest.fn() } as never);
});

afterEach(() => jest.restoreAllMocks());

const TX_1: Transaction = {
  id: "t1",
  userId: "u1",
  amount: 15.5,
  type: "expense",
  description: "Burger King",
  date: Date.UTC(2026, 0, 5),
} as Transaction;

const CATEGORY: CategoryInsight = {
  category: "Food",
  percentage: 40,
  totalAmount: 400,
  transactions: [TX_1],
};

const CATEGORY_NO_TX: CategoryInsight = {
  category: "Transporte",
  percentage: 10,
  totalAmount: 90,
  transactions: [],
};

const RECURRING: RecurringExpense = {
  description: "Netflix",
  count: 3,
  totalAmount: 15,
  averageAmount: 5,
};

const BASE_FORECAST: Forecast = {
  has_budget: true,
  disposable_budget: 2000,
  current_expenses: 800,
  remaining_budget: 1200,
  remaining_excluding_today: 1150,
  daily_burn_rate: 50,
  spending_trend: "stable",
  confidence: "high",
  daily_allowance: 100,
  unpaid_fixed: 0,
  status: "safe",
  forecast_date: "2026-09-15",
  message: "Your finances are looking good!",
  projected_balance: 1000,
  tip: "Save more!",
  today_expenses: 30,
  today_income: 0,
  days_left_including_today: 10,
};

/**
 * Cada componente se renderiza aislado, así que el número de superficies de
 * cristal que aparecen es exactamente el que ese componente aporta.
 */
const SURFACES: {
  name: string;
  glassSurfaces: number;
  render: () => React.ReactElement;
}[] = [
  {
    name: "AnalyticsMonthHeader",
    glassSurfaces: 1,
    render: () => (
      <AnalyticsMonthHeader
        colors={Colors.light}
        currentMonthName="Enero"
        currentYear={2024}
        onPress={jest.fn()}
      />
    ),
  },
  {
    name: "CategoryCard (colapsada)",
    glassSurfaces: 1,
    render: () => (
      <CategoryCard
        colors={Colors.light}
        category={CATEGORY}
        isExpanded={false}
        onPress={jest.fn()}
      />
    ),
  },
  {
    name: "CategoryCard (desplegada, forceGlass en cada movimiento)",
    // La card más una fila por transacción, hermanas del mismo forceGlass.
    glassSurfaces: 1 + CATEGORY.transactions.length,
    render: () => (
      <CategoryCard
        colors={Colors.light}
        category={CATEGORY}
        isExpanded
        onPress={jest.fn()}
      />
    ),
  },
  {
    name: "FinancialTipsSection",
    // Una superficie por consejo: son cards hermanas sobre el canvas.
    glassSurfaces: 2,
    render: () => (
      <FinancialTipsSection
        colors={Colors.light}
        tips={["Gasta menos en café", "Ahorra el 10%"]}
      />
    ),
  },
  {
    name: "RecurringExpensesSection",
    glassSurfaces: 2,
    render: () => (
      <RecurringExpensesSection
        colors={Colors.light}
        expenses={[RECURRING, { ...RECURRING, description: "Spotify" }]}
        onViewAllPress={jest.fn()}
      />
    ),
  },
  {
    name: "TopCategoriesSection",
    // Envuelve `CategoryCard` por categoría, ninguna desplegada.
    glassSurfaces: 2,
    render: () => (
      <TopCategoriesSection
        colors={Colors.light}
        categories={[CATEGORY, CATEGORY_NO_TX]}
        expandedCategory={null}
        onCategoryPress={jest.fn()}
        onViewAllPress={jest.fn()}
      />
    ),
  },
  {
    name: "StatisticsCategoryCard (colapsada)",
    glassSurfaces: 1,
    render: () => (
      <StatisticsCategoryCard
        colors={Colors.light}
        category={CATEGORY}
        isExpanded={false}
        onPress={jest.fn()}
      />
    ),
  },
  {
    name: "StatisticsCategoriesList",
    glassSurfaces: 2,
    render: () => (
      <StatisticsCategoriesList
        colors={Colors.light}
        categories={[CATEGORY, CATEGORY_NO_TX]}
        expandedCategory={null}
        onCategoryPress={jest.fn()}
      />
    ),
  },
  {
    name: "StatisticsRecurringList",
    glassSurfaces: 2,
    render: () => (
      <StatisticsRecurringList
        colors={Colors.light}
        expenses={[RECURRING, { ...RECURRING, description: "Spotify" }]}
      />
    ),
  },
  {
    name: "ForecastCard (con tip)",
    // La card + los dos paneles `forceGlass` (desglose y consejo).
    glassSurfaces: 3,
    render: () => <ForecastCard forecast={BASE_FORECAST} />,
  },
];

describe("Analytics — cada componente con superficie propia lleva cristal", () => {
  it.each(SURFACES)(
    "$name aporta sus propias superficies de cristal con los dos gates en verde",
    async ({ glassSurfaces, render: renderComponent }) => {
      mockApiAvailable.mockReturnValue(true);
      renderInTheme(renderComponent());
      await settle();

      expect(screen.queryAllByTestId("glass-view")).toHaveLength(glassSurfaces);
    },
  );

  it.each(SURFACES)(
    "$name se queda plano cuando la API de cristal no está disponible",
    async ({ render: renderComponent }) => {
      mockApiAvailable.mockReturnValue(false);
      renderInTheme(renderComponent());
      await settle();

      expect(screen.queryByTestId("glass-view")).toBeNull();
    },
  );

  it.each([
    ["light" as const, Colors.light],
    ["dark" as const, Colors.dark],
  ])(
    "la fila de categoría cae a `background` + hairline inferior en modo %s (misma píldora que `TransactionItem`)",
    async (theme, colors) => {
      mockColorScheme.mockReturnValue(theme);
      mockApiAvailable.mockReturnValue(false);
      renderInTheme(
        <CategoryCard
          colors={colors}
          category={CATEGORY}
          isExpanded={false}
          onPress={jest.fn()}
        />,
      );
      await settle();

      const row = viewStyles().find(
        (s) =>
          s?.backgroundColor === colors.background && s?.borderBottomWidth,
      );
      expect(row).toBeDefined();
      expect(row?.borderBottomWidth).toBe(StyleSheet.hairlineWidth);
      expect(row?.borderBottomColor).toBe(colors.border);
      expect(row?.shadowOpacity).toBeUndefined();
    },
  );

  it.each([
    ["light" as const, Colors.light],
    ["dark" as const, Colors.dark],
  ])(
    "la píldora del selector de mes cae a `surfaceHighlight` + hairline en modo %s",
    async (theme, colors) => {
      mockColorScheme.mockReturnValue(theme);
      mockApiAvailable.mockReturnValue(false);
      renderInTheme(
        <AnalyticsMonthHeader
          colors={colors}
          currentMonthName="Enero"
          currentYear={2024}
          onPress={jest.fn()}
        />,
      );
      await settle();

      const pill = viewStyles().find(
        (s) => s?.backgroundColor === colors.surfaceHighlight && s?.borderWidth,
      );
      expect(pill).toBeDefined();
      expect(pill?.borderWidth).toBe(StyleSheet.hairlineWidth);
      expect(pill?.borderColor).toBe(colors.border);
    },
  );

  it.each([
    ["light" as const, Colors.light],
    ["dark" as const, Colors.dark],
  ])(
    "`ForecastCard` cae a `surface` + hairline en modo %s cuando no hay cristal",
    async (theme, colors) => {
      mockColorScheme.mockReturnValue(theme);
      mockApiAvailable.mockReturnValue(false);
      renderInTheme(<ForecastCard forecast={BASE_FORECAST} />);
      await settle();

      const card = viewStyles().find(
        (s) => s?.backgroundColor === colors.surface && s?.borderWidth,
      );
      expect(card).toBeDefined();
      expect(card?.borderWidth).toBe(StyleSheet.hairlineWidth);
      expect(card?.borderColor).toBe(colors.border);

      const panel = viewStyles().find(
        (s) =>
          s?.backgroundColor === colors.surfaceHighlight && s?.borderWidth,
      );
      expect(panel).toBeDefined();
      expect(panel?.borderColor).toBe(colors.border);
    },
  );

  it("con cristal ninguna superficie de Analytics lleva fondo opaco", async () => {
    mockApiAvailable.mockReturnValue(true);
    renderInTheme(
      <TopCategoriesSection
        colors={Colors.light}
        categories={[CATEGORY, CATEGORY_NO_TX]}
        expandedCategory={null}
        onCategoryPress={jest.fn()}
        onViewAllPress={jest.fn()}
      />,
    );
    await settle();

    screen.getAllByTestId("glass-view").forEach((node) => {
      const style = StyleSheet.flatten(node.props.style) as Record<
        string,
        unknown
      >;
      expect(style.backgroundColor).toBeUndefined();
      expect(style.borderWidth).toBeUndefined();
    });
  });
});

describe("Analytics — la regla del signo fuera de ForecastCard", () => {
  it("un gasto de categoría se pinta en `expense`, nunca en `error` ni `text`", async () => {
    renderInTheme(
      <CategoryCard
        colors={Colors.light}
        category={CATEGORY}
        isExpanded={false}
        onPress={jest.fn()}
      />,
    );
    await settle();

    const amount = styleOf(/^−\$400/);
    expect(amount.color).toBe(Colors.light.expense);
    expect(amount.color).not.toBe(Colors.light.error);
    expect(amount.color).not.toBe(Colors.light.text);
    // Elemento firma: dígitos tabulares alineados a la derecha.
    expect(amount.fontVariant).toEqual(["tabular-nums"]);
    expect(amount.textAlign).toBe("right");
  });

  it("un movimiento desplegado también va en `expense`", async () => {
    renderInTheme(
      <CategoryCard
        colors={Colors.light}
        category={CATEGORY}
        isExpanded
        onPress={jest.fn()}
      />,
    );
    await settle();

    expect(styleOf(/^−\$15\.50/).color).toBe(Colors.light.expense);
  });

  it("un recurrente se pinta en `expense`", async () => {
    renderInTheme(
      <RecurringExpensesSection
        colors={Colors.light}
        expenses={[RECURRING]}
        onViewAllPress={jest.fn()}
      />,
    );
    await settle();

    expect(styleOf(/^−\$15\.00/).color).toBe(Colors.light.expense);
  });

  it("la card de estadísticas de categoría también va en `expense`", async () => {
    renderInTheme(
      <StatisticsCategoryCard
        colors={Colors.light}
        category={CATEGORY}
        isExpanded={false}
        onPress={jest.fn()}
      />,
    );
    await settle();

    expect(styleOf(/^−\$400/).color).toBe(Colors.light.expense);
  });
});

describe("ForecastCard — la regla del signo en sus múltiples importes", () => {
  it("el gasto diario promedio va en `expense` con signo `−`", async () => {
    renderInTheme(<ForecastCard forecast={BASE_FORECAST} />);
    await settle();

    const amount = styleOf(/^−\$50\.00/);
    expect(amount.color).toBe(Colors.light.expense);
    expect(amount.color).not.toBe(Colors.light.error);
  });

  it("la proyección de fin de mes positiva va en `success`, sin signo (es un saldo)", async () => {
    renderInTheme(
      <ForecastCard forecast={{ ...BASE_FORECAST, projected_balance: 1000 }} />,
    );
    await settle();

    const amount = styleOf("$1,000.00");
    expect(amount.color).toBe(Colors.light.success);
  });

  it("la proyección de fin de mes negativa es el único `error` legítimo de la card", async () => {
    renderInTheme(
      <ForecastCard forecast={{ ...BASE_FORECAST, projected_balance: -200 }} />,
    );
    await settle();

    const amount = styleOf("-$200.00");
    expect(amount.color).toBe(Colors.light.error);
  });

  it("el desglose: ingresos en `success`, gastos y proyección restante en `expense`", async () => {
    renderInTheme(<ForecastCard forecast={BASE_FORECAST} />);
    await settle();

    expect(styleOf(/^\+\$2,000\.00/).color).toBe(Colors.light.success);
    expect(styleOf(/^−\$800\.00/).color).toBe(Colors.light.expense);
    // Proyección: daily_burn_rate(50) * (days_left_including_today(10) - 1) = 450.
    expect(styleOf(/^−\$450\.00/).color).toBe(Colors.light.expense);
  });

  it("el saldo disponible (sin hoy) no lleva signo ni color de estado: es un saldo", async () => {
    renderInTheme(<ForecastCard forecast={BASE_FORECAST} />);
    await settle();

    const amount = styleOf("$1,150.00");
    expect(amount.color).toBe(Colors.light.text);
    expect(amount.color).not.toBe(Colors.light.success);
    expect(amount.color).not.toBe(Colors.light.expense);
  });

  it("hoy: gastado en `expense`, ingresos en `success`, restante hero en `success`", async () => {
    renderInTheme(
      <ForecastCard
        forecast={{ ...BASE_FORECAST, today_expenses: 30, today_income: 20 }}
      />,
    );
    await settle();

    expect(styleOf(/^−\$30\.00/).color).toBe(Colors.light.expense);
    expect(styleOf(/^\+\$20\.00/).color).toBe(Colors.light.success);
    // dailyAllowance(100) + todayIncome(20) - todayExpenses(30) = 90.
    expect(styleOf("$90.00").color).toBe(Colors.light.success);
  });

  it("el presupuesto diario no lleva signo ni color de estado", async () => {
    renderInTheme(<ForecastCard forecast={BASE_FORECAST} />);
    await settle();

    const amount = styleOf("$100.00");
    expect(amount.color).toBe(Colors.light.text);
    expect(amount.color).not.toBe(Colors.light.success);
    expect(amount.color).not.toBe(Colors.light.expense);
  });

  it("la tendencia 'Al alza' es `warning`, ya no `error` (no es un fallo)", async () => {
    renderInTheme(
      <ForecastCard
        forecast={{ ...BASE_FORECAST, spending_trend: "accelerating" }}
      />,
    );
    await settle();

    const trend = styleOf("Al alza");
    expect(trend.color).toBe(Colors.light.warning);
    expect(trend.color).not.toBe(Colors.light.error);
  });

  it("la tendencia 'A la baja' es `success`", async () => {
    renderInTheme(
      <ForecastCard
        forecast={{ ...BASE_FORECAST, spending_trend: "decelerating" }}
      />,
    );
    await settle();

    expect(styleOf("A la baja").color).toBe(Colors.light.success);
  });

  it("la tendencia 'Estable' es `textSecondary`", async () => {
    renderInTheme(
      <ForecastCard forecast={{ ...BASE_FORECAST, spending_trend: "stable" }} />,
    );
    await settle();

    expect(styleOf("Estable").color).toBe(Colors.light.textSecondary);
  });

  it("la confianza baja es la única en `warning`", async () => {
    renderInTheme(
      <ForecastCard forecast={{ ...BASE_FORECAST, confidence: "low" }} />,
    );
    await settle();

    expect(styleOf("Confianza baja").color).toBe(Colors.light.warning);
  });

  it.each(["high", "medium"] as const)(
    "la confianza %s va `muted` (`textSecondary`), no `warning`",
    async (confidence) => {
      renderInTheme(
        <ForecastCard forecast={{ ...BASE_FORECAST, confidence }} />,
      );
      await settle();

      const text = confidence === "high" ? "Confianza alta" : "Confianza media";
      const style = styleOf(text);
      expect(style.color).toBe(Colors.light.textSecondary);
      expect(style.color).not.toBe(Colors.light.warning);
    },
  );
});

describe("ForecastCard — paneles `forceGlass` anidados dentro de la card", () => {
  it("el desglose y el consejo piden cristal aunque estén anidados en la card, que ya es cristal", async () => {
    mockApiAvailable.mockReturnValue(true);
    renderInTheme(<ForecastCard forecast={BASE_FORECAST} />);
    await settle();

    // La card exterior + el panel de desglose + el panel de consejo.
    expect(screen.queryAllByTestId("glass-view")).toHaveLength(3);
  });

  it("sin `tip` solo aparecen la card y el panel de desglose", async () => {
    mockApiAvailable.mockReturnValue(true);
    renderInTheme(<ForecastCard forecast={{ ...BASE_FORECAST, tip: "" }} />);
    await settle();

    expect(screen.queryAllByTestId("glass-view")).toHaveLength(2);
  });

  it("ninguno de los tres cristales de la card lleva fondo opaco", async () => {
    mockApiAvailable.mockReturnValue(true);
    renderInTheme(<ForecastCard forecast={BASE_FORECAST} />);
    await settle();

    screen.getAllByTestId("glass-view").forEach((node) => {
      const style = StyleSheet.flatten(node.props.style) as Record<
        string,
        unknown
      >;
      expect(style.backgroundColor).toBeUndefined();
      expect(style.borderWidth).toBeUndefined();
    });
  });

  it("sin cristal, el desglose y el consejo caen a `surfaceHighlight` + hairline en claro y oscuro", async () => {
    for (const [theme, colors] of [
      ["light", Colors.light],
      ["dark", Colors.dark],
    ] as const) {
      mockColorScheme.mockReturnValue(theme);
      mockApiAvailable.mockReturnValue(false);
      const { unmount } = renderInTheme(
        <ForecastCard forecast={BASE_FORECAST} />,
      );
      await settle();

      const panels = viewStyles().filter(
        (s) =>
          s?.backgroundColor === colors.surfaceHighlight && s?.borderWidth,
      );
      // El panel de desglose y el de consejo.
      expect(panels.length).toBe(2);
      panels.forEach((panel) => {
        expect(panel.borderWidth).toBe(StyleSheet.hairlineWidth);
        expect(panel.borderColor).toBe(colors.border);
      });

      unmount();
    }
  });
});

describe("ForecastCard — la card responde a la interacción sin romperse", () => {
  it("no renderiza nada si no hay forecast", async () => {
    const { toJSON } = renderInTheme(<ForecastCard forecast={null} />);
    expect(toJSON()).toBeNull();
  });

  it("muestra el aviso de fijos por pagar cuando corresponde", async () => {
    renderInTheme(
      <ForecastCard forecast={{ ...BASE_FORECAST, unpaid_fixed: 75 }} />,
    );
    await settle();

    expect(screen.getByText(/en fijos por pagar/)).toBeTruthy();
  });
});

describe("Analytics — los modales/handlers de los componentes se cablean igual que antes", () => {
  it("el selector de mes de Analytics dispara `onPress`", async () => {
    const onPress = jest.fn();
    renderInTheme(
      <AnalyticsMonthHeader
        colors={Colors.light}
        currentMonthName="Enero"
        currentYear={2024}
        onPress={onPress}
      />,
    );
    await settle();

    fireEvent.press(screen.getByLabelText("Cambiar mes"));
    expect(onPress).toHaveBeenCalled();
  });

  it("una categoría del top se expande al pulsarla", async () => {
    const onCategoryPress = jest.fn();
    renderInTheme(
      <TopCategoriesSection
        colors={Colors.light}
        categories={[CATEGORY]}
        expandedCategory={null}
        onCategoryPress={onCategoryPress}
        onViewAllPress={jest.fn()}
      />,
    );
    await settle();

    fireEvent.press(screen.getByText("Food"));
    expect(onCategoryPress).toHaveBeenCalledWith("Food");
  });
});
