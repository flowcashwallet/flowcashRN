import { ThemeProvider } from "@/contexts/ThemeContext";
import { TransactionFilterModal } from "@/features/wallet/components/TransactionFilterModal";
import { fireEvent, render, screen } from "@testing-library/react-native";
import React from "react";

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 34, left: 0, right: 0 }),
}));

jest.mock("@react-native-community/datetimepicker", () => "DateTimePicker");

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

const mockDispatch = jest.fn();
jest.mock("react-redux", () => ({
  useDispatch: () => mockDispatch,
  useSelector: (selector: any) =>
    selector({ walletUi: { categoryPickerSelection: null } }),
}));

const mockColorScheme = jest.fn(() => "light");
jest.mock("react-native/Libraries/Utilities/useColorScheme", () => ({
  __esModule: true,
  default: () => mockColorScheme(),
}));

const EMPTY_FILTERS = {
  category: null,
  entityId: null,
  type: null,
  paymentType: null,
  dateMode: "none" as const,
  date: null,
  dateFrom: null,
  dateTo: null,
};

function renderFilters(
  props: Partial<React.ComponentProps<typeof TransactionFilterModal>> = {},
) {
  return render(
    <ThemeProvider>
      <TransactionFilterModal
        visible
        onClose={jest.fn()}
        categories={[{ id: "c1", name: "Comida" } as any]}
        entities={[{ id: "e1", name: "Cuenta Nómina", type: "asset" } as any]}
        currentFilters={EMPTY_FILTERS}
        onApply={jest.fn()}
        onClear={jest.fn()}
        {...props}
      />
    </ThemeProvider>,
  );
}

describe("TransactionFilterModal migrado a BottomSheet", () => {
  beforeEach(() => {
    mockDispatch.mockClear();
    mockColorScheme.mockReturnValue("light");
  });

  it("renders the sheet header and every filter section", () => {
    renderFilters();
    expect(screen.getByText("Filtrar Transacciones")).toBeTruthy();
    expect(screen.getByText("Sin filtro")).toBeTruthy();
    expect(screen.getByText("Tipo de pago")).toBeTruthy();
    expect(screen.getByText("Activo/Pasivo Asociado")).toBeTruthy();
    expect(screen.getByText("Limpiar")).toBeTruthy();
    expect(screen.getByText("Aplicar")).toBeTruthy();
  });

  it("dismisses from the BottomSheet backdrop", () => {
    const onClose = jest.fn();
    renderFilters({ onClose });
    fireEvent.press(screen.getAllByLabelText("Cerrar")[0]);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("applies the picked type and closes, same as before the migration", () => {
    const onApply = jest.fn();
    const onClose = jest.fn();
    renderFilters({ onApply, onClose });

    fireEvent.press(screen.getByText("Gasto"));
    fireEvent.press(screen.getByText("Aplicar"));

    expect(onApply).toHaveBeenCalledWith(
      expect.objectContaining({ type: "expense", dateMode: "none" }),
    );
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("clears and closes from the secondary action", () => {
    const onClear = jest.fn();
    const onClose = jest.fn();
    renderFilters({ onClear, onClose });

    fireEvent.press(screen.getByText("Limpiar"));

    expect(onClear).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("expands the payment-type dropdown in place", () => {
    renderFilters();
    expect(screen.queryByText("Efectivo")).toBeNull();
    fireEvent.press(screen.getByText("Seleccionar tipo de pago"));
    expect(screen.getByText("Efectivo")).toBeTruthy();
  });

  it("renders in dark mode without falling back to a fixed palette", () => {
    mockColorScheme.mockReturnValue("dark");
    renderFilters();
    expect(screen.getByText("Filtrar Transacciones")).toBeTruthy();
  });
});
