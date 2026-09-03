import { Colors } from "@/constants/theme";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AddEntityModal } from "@/features/vision/components/AddEntityModal";
import { EntityDetailModal } from "@/features/vision/components/EntityDetailModal";
import { LiabilityPaymentRow } from "@/features/vision/components/liability-payments/LiabilityPaymentRow";
import { LiabilityPaymentsManagementHeader } from "@/features/vision/components/liability-payments/LiabilityPaymentsManagementHeader";
import { LiabilityPaymentsYearHeader } from "@/features/vision/components/liability-payments/LiabilityPaymentsYearHeader";
import { MonthPaymentRow } from "@/features/vision/components/liability-payments/MonthPaymentRow";
import { VisionEntityList } from "@/features/vision/components/VisionEntityList";
import { VisionFilterModal } from "@/features/vision/components/VisionFilterModal";
import { VisionHeader } from "@/features/vision/components/VisionHeader";
import { VisionSortModal } from "@/features/vision/components/VisionSortModal";
import { LiabilityManagementLink } from "@/features/vision/components/vision/LiabilityManagementLink";
import { VisionAssetLiabilityTabs } from "@/features/vision/components/vision/VisionAssetLiabilityTabs";
import type { VisionEntity } from "@/features/vision/data/visionSlice";
import type { Transaction } from "@/features/wallet/data/walletSlice";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { isGlassEffectAPIAvailable } from "expo-glass-effect";
import React from "react";
import { AccessibilityInfo, StyleSheet, View } from "react-native";

/**
 * Pase visual de Vision (2026-09-02).
 *
 * Cubre lo verificable sin simulador, con el mismo criterio que
 * `DashboardSections.test.tsx`:
 *
 * 1. cada componente con superficie propia aporta **su** superficie de cristal
 *    cuando los dos gates pasan, y cae a `surface` + hairline cuando no —
 *    afirmado contra `Colors.light` y `Colors.dark`, que es la verificación de
 *    tema claro/oscuro de este pase;
 * 2. las filas de lista siguen la fila del libro contable de `TransactionItem`:
 *    importe tabular alineado a la derecha y separación por hairline sin sombra;
 * 3. la regla del signo — `expense` para lo que sale, `success` para lo que
 *    entra, y **nunca** `error` para un importe normal;
 * 4. los modales migrados a `BottomSheet` siguen abriendo, seleccionando y
 *    cerrando igual que antes.
 */

/**
 * Reanimated no arranca bajo Jest sin runtime nativo (es lo que rompe la suite
 * preexistente de `VisionScreen`). `VisionHeader` solo lo usa para el fundido
 * del bloque expandido; aquí interesa la superficie, no la animación.
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

jest.mock("expo-router", () => ({
  router: { push: jest.fn() },
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 34, left: 0, right: 0 }),
}));

const mockApiAvailable = jest.mocked(isGlassEffectAPIAvailable);

const mockColorScheme = jest.fn(() => "light");
jest.mock("react-native/Libraries/Utilities/useColorScheme", () => ({
  __esModule: true,
  default: () => mockColorScheme(),
}));

const ASSET: VisionEntity = {
  id: "a1",
  name: "Cuenta de ahorro",
  amount: 25000,
  type: "asset",
  category: "🏦 Banco",
} as VisionEntity;

const LIABILITY: VisionEntity = {
  id: "l1",
  name: "Tarjeta oro",
  amount: 8400,
  type: "liability",
  category: "💳 Tarjeta de Crédito",
} as VisionEntity;

const PAYMENT_ROW = {
  id: "l1",
  name: "Tarjeta oro",
  amountPaid: 1500,
  minimumPayment: 900,
  dueDateLabel: "25 sep",
  noPaymentRequired: false,
  showPaid: true,
  statusIcon: "checkmark.circle.fill" as const,
  statusColor: Colors.light.success,
  statusText: "Pagado",
};

const MONTH_ROW = {
  monthIndex: 8,
  monthLabel: "Septiembre",
  amountPaid: 1500,
  showCheck: true,
  statusLabel: "Pagado",
};

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
    name: "VisionHeader",
    glassSurfaces: 1,
    render: () => (
      <VisionHeader netWorth={16600} totalAssets={25000} totalLiabilities={8400} />
    ),
  },
  {
    name: "VisionAssetLiabilityTabs",
    glassSurfaces: 1,
    render: () => (
      <VisionAssetLiabilityTabs activeTab="asset" onChangeTab={jest.fn()} />
    ),
  },
  {
    name: "LiabilityManagementLink",
    glassSurfaces: 1,
    render: () => <LiabilityManagementLink onPress={jest.fn()} />,
  },
  {
    name: "VisionEntityList",
    // Una superficie por fila: son hermanas, no anidadas.
    glassSurfaces: 2,
    render: () => (
      <VisionEntityList
        data={[ASSET, LIABILITY]}
        type="asset"
        onPress={jest.fn()}
        onDelete={jest.fn().mockResolvedValue(undefined)}
      />
    ),
  },
  {
    name: "LiabilityPaymentRow",
    glassSurfaces: 1,
    render: () => (
      <LiabilityPaymentRow
        item={PAYMENT_ROW}
        onPress={jest.fn()}
        onTogglePress={jest.fn()}
      />
    ),
  },
  {
    name: "MonthPaymentRow",
    glassSurfaces: 1,
    render: () => <MonthPaymentRow item={MONTH_ROW} minimumPayment={900} />,
  },
  {
    name: "LiabilityPaymentsManagementHeader",
    // Solo el panel de mes + resumen; el título va sobre el canvas.
    glassSurfaces: 1,
    render: () => (
      <LiabilityPaymentsManagementHeader
        monthLabel="Septiembre 2026"
        summary={{ paidCount: 1, total: 2, totalPaid: 1500 }}
        onPrevMonth={jest.fn()}
        onNextMonth={jest.fn()}
      />
    ),
  },
  {
    name: "LiabilityPaymentsYearHeader",
    // El panel del año más los dos botones de año: tres superficies hermanas.
    glassSurfaces: 3,
    render: () => (
      <LiabilityPaymentsYearHeader
        entityName="Tarjeta oro"
        year={2026}
        yearTotalPaid={12000}
        currentMonthSummary={{
          monthLabel: "Septiembre",
          amountPaid: 1500,
          showCheck: true,
        }}
        onPrevYear={jest.fn()}
        onNextYear={jest.fn()}
      />
    ),
  },
];

describe("Vision — cada componente con superficie propia lleva cristal", () => {
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
    "la fila de pasivo cae a `surface` + hairline en `border` en modo %s",
    async (theme, colors) => {
      mockColorScheme.mockReturnValue(theme);
      mockApiAvailable.mockReturnValue(false);
      renderInTheme(
        <LiabilityPaymentRow
          item={PAYMENT_ROW}
          onPress={jest.fn()}
          onTogglePress={jest.fn()}
        />,
      );
      await settle();

      const row = viewStyles().find(
        (s) => s?.backgroundColor === colors.surface && s?.borderWidth,
      );
      expect(row).toBeDefined();
      expect(row?.borderWidth).toBe(StyleSheet.hairlineWidth);
      expect(row?.borderColor).toBe(colors.border);
      // Es una fila, no una card: no lleva sombra ni elevación.
      expect(row?.shadowOpacity).toBeUndefined();
      expect(row?.elevation).toBeUndefined();
    },
  );

  it.each([
    ["light" as const, Colors.light],
    ["dark" as const, Colors.dark],
  ])(
    "la fila de entidad cae al fondo de pantalla + hairline inferior en modo %s",
    async (theme, colors) => {
      mockColorScheme.mockReturnValue(theme);
      mockApiAvailable.mockReturnValue(false);
      renderInTheme(
        <VisionEntityList
          data={[ASSET]}
          type="asset"
          onPress={jest.fn()}
          onDelete={jest.fn().mockResolvedValue(undefined)}
        />,
      );
      await settle();

      const row = viewStyles().find(
        (s) => s?.backgroundColor === colors.background && s?.borderBottomWidth,
      );
      expect(row).toBeDefined();
      expect(row?.borderBottomWidth).toBe(StyleSheet.hairlineWidth);
      expect(row?.borderBottomColor).toBe(colors.border);
      expect(row?.shadowOpacity).toBeUndefined();
    },
  );

  it("con cristal ninguna superficie de Vision lleva fondo opaco", async () => {
    mockApiAvailable.mockReturnValue(true);
    renderInTheme(
      <VisionEntityList
        data={[ASSET, LIABILITY]}
        type="liability"
        onPress={jest.fn()}
        onDelete={jest.fn().mockResolvedValue(undefined)}
      />,
    );
    await settle();

    screen.getAllByTestId("glass-view").forEach((node) => {
      const style = StyleSheet.flatten(node.props.style) as Record<
        string,
        unknown
      >;
      expect(style.backgroundColor).toBeUndefined();
      expect(style.borderBottomWidth).toBeUndefined();
    });
  });
});

describe("Vision — la fila del libro contable y la regla del signo", () => {
  it.each([
    ["light" as const, Colors.light],
    ["dark" as const, Colors.dark],
  ])(
    "un pasivo se pinta en `expense` con signo, nunca en `error` ni `text` (%s)",
    async (theme, colors) => {
      mockColorScheme.mockReturnValue(theme);
      renderInTheme(
        <VisionEntityList
          data={[LIABILITY]}
          type="liability"
          onPress={jest.fn()}
          onDelete={jest.fn().mockResolvedValue(undefined)}
        />,
      );
      await settle();

      const amount = styleOf(/^−/);
      expect(amount.color).toBe(colors.expense);
      expect(amount.color).not.toBe(colors.error);
      expect(amount.color).not.toBe(colors.text);
      // Elemento firma: dígitos tabulares alineados a la derecha.
      expect(amount.fontVariant).toEqual(["tabular-nums"]);
      expect(amount.textAlign).toBe("right");
    },
  );

  it("un activo no lleva signo y se queda en `text`", async () => {
    renderInTheme(
      <VisionEntityList
        data={[ASSET]}
        type="asset"
        onPress={jest.fn()}
        onDelete={jest.fn().mockResolvedValue(undefined)}
      />,
    );
    await settle();

    const amount = styleOf(/^\$/);
    expect(amount.color).toBe(Colors.light.text);
    expect(amount.fontVariant).toEqual(["tabular-nums"]);
  });

  it.each([
    ["light" as const, Colors.light],
    ["dark" as const, Colors.dark],
  ])(
    "un pago hecho se pinta en `success` y uno pendiente en `textSecondary` (%s)",
    async (theme, colors) => {
      mockColorScheme.mockReturnValue(theme);
      const { rerender } = renderInTheme(
        <MonthPaymentRow item={MONTH_ROW} minimumPayment={null} />,
      );
      await settle();
      expect(styleOf(/^\$/).color).toBe(colors.success);

      rerender(
        <ThemeProvider>
          <MonthPaymentRow
            item={{ ...MONTH_ROW, amountPaid: 0, showCheck: false }}
            minimumPayment={null}
          />
        </ThemeProvider>,
      );
      await settle();
      const pending = styleOf(/^\$/);
      expect(pending.color).toBe(colors.textSecondary);
      // Un mes sin pago todavía no es un fallo.
      expect(pending.color).not.toBe(colors.error);
    },
  );

  it("el detalle de entidad codifica entrada en `success` y salida en `expense`", async () => {
    const transactions: Transaction[] = [
      {
        id: "t1",
        amount: 500,
        description: "Abono",
        date: Date.UTC(2026, 8, 1),
        type: "income",
        relatedEntityId: LIABILITY.id,
      } as Transaction,
      {
        id: "t2",
        amount: 300,
        description: "Compra",
        date: Date.UTC(2026, 8, 2),
        type: "expense",
        relatedEntityId: LIABILITY.id,
      } as Transaction,
    ];

    renderInTheme(
      <EntityDetailModal
        visible
        onClose={jest.fn()}
        entity={LIABILITY}
        transactions={transactions}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
        onUpdateCryptoPrice={jest.fn()}
        onAddTransaction={jest.fn().mockResolvedValue(true)}
        isSaving={false}
      />,
    );
    await settle();

    expect(styleOf(/^\+/).color).toBe(Colors.light.success);
    const outgoing = styleOf(/^−\$300/);
    expect(outgoing.color).toBe(Colors.light.expense);
    expect(outgoing.color).not.toBe(Colors.light.error);
  });
});

describe("Vision — modales migrados a `BottomSheet`", () => {
  it("el filtro selecciona categoría y cierra, igual que antes", async () => {
    const onSelectCategory = jest.fn();
    const onClose = jest.fn();
    renderInTheme(
      <VisionFilterModal
        visible
        onClose={onClose}
        categories={["🏦 Banco", "💰 Efectivo"]}
        selectedCategory={null}
        onSelectCategory={onSelectCategory}
      />,
    );
    await settle();

    expect(screen.getByText("Filtrar por categoría")).toBeTruthy();

    fireEvent.press(screen.getByText("💰 Efectivo"));
    expect(onSelectCategory).toHaveBeenCalledWith("💰 Efectivo");
    expect(onClose).toHaveBeenCalled();
  });

  it("el filtro se cierra al pulsar el backdrop de la primitiva", async () => {
    const onClose = jest.fn();
    renderInTheme(
      <VisionFilterModal
        visible
        onClose={onClose}
        categories={[]}
        selectedCategory={null}
        onSelectCategory={jest.fn()}
      />,
    );
    await settle();

    fireEvent.press(screen.getAllByLabelText("Cerrar")[0]);
    expect(onClose).toHaveBeenCalled();
  });

  it("el orden selecciona opción y cierra", async () => {
    const onSelectOption = jest.fn();
    const onClose = jest.fn();
    renderInTheme(
      <VisionSortModal
        visible
        onClose={onClose}
        selectedOption="amount"
        onSelectOption={onSelectOption}
      />,
    );
    await settle();

    expect(screen.getByText("Ordenar por")).toBeTruthy();
    fireEvent.press(screen.getByText("Alfabético (A-Z)"));
    expect(onSelectOption).toHaveBeenCalledWith("name");
    expect(onClose).toHaveBeenCalled();
  });

  it("el alta de entidad abre como sheet con su título y guarda", async () => {
    const onSave = jest.fn().mockResolvedValue(true);
    renderInTheme(
      <AddEntityModal
        visible
        onClose={jest.fn()}
        onSave={onSave}
        selectedType="asset"
        initialEntity={null}
        isSaving={false}
      />,
    );
    await settle();

    expect(screen.getByText("Agregar Activo")).toBeTruthy();
    fireEvent.press(screen.getByText("Guardar"));
    expect(onSave).toHaveBeenCalled();
  });

  it("el detalle conserva la X de cierre pese a ocupar `headerRight`", async () => {
    const onClose = jest.fn();
    renderInTheme(
      <EntityDetailModal
        visible
        onClose={onClose}
        entity={ASSET}
        transactions={[]}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
        onUpdateCryptoPrice={jest.fn()}
        onAddTransaction={jest.fn().mockResolvedValue(true)}
        isSaving={false}
      />,
    );
    await settle();

    // El backdrop de la primitiva y la X repuesta comparten etiqueta "Cerrar".
    const closers = screen.getAllByLabelText("Cerrar");
    expect(closers.length).toBeGreaterThan(1);
    fireEvent.press(closers[closers.length - 1]);
    expect(onClose).toHaveBeenCalled();
  });

  it("las filas del historial piden cristal dentro del sheet, y nada más profundo", async () => {
    mockApiAvailable.mockReturnValue(true);
    const transactions: Transaction[] = [
      {
        id: "t1",
        amount: 500,
        description: "Abono",
        date: Date.UTC(2026, 8, 1),
        type: "income",
        relatedEntityId: LIABILITY.id,
      } as Transaction,
    ];

    renderInTheme(
      <EntityDetailModal
        visible
        onClose={jest.fn()}
        entity={LIABILITY}
        transactions={transactions}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
        onUpdateCryptoPrice={jest.fn()}
        onAddTransaction={jest.fn().mockResolvedValue(true)}
        isSaving={false}
      />,
    );
    await settle();

    // El panel del sheet más una fila por transacción (`forceGlass`).
    expect(screen.queryAllByTestId("glass-view")).toHaveLength(
      1 + transactions.length,
    );
  });
});
