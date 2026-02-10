import { fireEvent, render } from "@testing-library/react-native";
import { useRouter } from "expo-router";
import React from "react";
import { mockWalletDataFactory } from "../../../../tests/mocks";
import { useWalletData } from "../../hooks/useWalletData";
import { useWalletTransactions } from "../../hooks/useWalletTransactions";
import WalletScreen from "../WalletScreen";

// Mock Hooks
jest.mock("../../hooks/useWalletData");
jest.mock("../../hooks/useWalletTransactions");
jest.mock("expo-router", () => ({
  useRouter: jest.fn(),
}));

// Mock only complex components or those with native dependencies that break tests
jest.mock("@/components/ui/icon-symbol", () => ({
  IconSymbol: ({ name, size, color }: any) => {
    // Return a text representation for easy testing
    return <>{`Icon: ${name}`}</>;
  },
}));

// Mock specialized modals to avoid complex setup, but leave main UI components intact
jest.mock("../../components/StreakCalendarModal", () => ({
  StreakCalendarModal: "StreakCalendarModal",
}));
jest.mock("../../components/MonthYearPickerModal", () => ({
  MonthYearPickerModal: "MonthYearPickerModal",
}));
jest.mock("../../components/TransactionFilterModal", () => ({
  TransactionFilterModal: "TransactionFilterModal",
}));

// Mock ExportTransactions to avoid Redux Provider requirement
jest.mock("../../components/ExportTransactions", () => ({
  ExportTransactions: () => "ExportTransactions",
}));

// We use real components for WalletHeader, QuickActions, and TransactionList
// but they might use some hooks/modules we need to mock.
jest.mock("@/hooks/use-color-scheme", () => ({
  useColorScheme: () => "light",
}));

describe("WalletScreen", () => {
  const mockRouter = { push: jest.fn() };
  const mockDeleteTransaction = jest.fn();
  const mockDeleteMonthlyTransactions = jest.fn();
  const mockSetSelectedDate = jest.fn();
  const mockOnRefresh = jest.fn();

  const mockWalletData = mockWalletDataFactory({
    onRefresh: mockOnRefresh,
    setSelectedDate: mockSetSelectedDate,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useWalletData as jest.Mock).mockReturnValue(mockWalletData);
    (useWalletTransactions as jest.Mock).mockReturnValue({
      deleteTransaction: mockDeleteTransaction,
      deleteMonthlyTransactions: mockDeleteMonthlyTransactions,
    });
  });

  it("renders correctly with real components", () => {
    const { getByText, getByPlaceholderText } = render(<WalletScreen />);

    // Check elements from WalletHeader
    expect(getByText(/Enero/)).toBeTruthy(); // Month name (regex for potential spaces)
    expect(getByText("Balance Total")).toBeTruthy();

    // Check elements from QuickActions
    expect(getByText("Ingreso")).toBeTruthy();
    expect(getByText("Gasto")).toBeTruthy();

    // Check elements from TransactionList
    expect(getByText("Movimientos Recientes")).toBeTruthy();
    expect(getByText("Grocery")).toBeTruthy();
    expect(getByText("Salary")).toBeTruthy();

    // Check Search Bar
    expect(getByPlaceholderText("Buscar...")).toBeTruthy();
  });

  it("handles navigation via QuickActions", () => {
    const { getByText } = render(<WalletScreen />);

    // Press "Ingreso" button (from real QuickActions component)
    fireEvent.press(getByText("Ingreso"));
    expect(mockRouter.push).toHaveBeenCalledWith({
      pathname: "/transaction-form",
      params: { initialType: "income" },
    });
  });

  it("handles transaction press navigation", () => {
    const { getByText } = render(<WalletScreen />);

    // Press a transaction item
    fireEvent.press(getByText("Salary"));

    expect(mockRouter.push).toHaveBeenCalledWith({
      pathname: "/transaction-form",
      params: { id: "2" },
    });
  });

  it("filters transactions by search query", () => {
    const { getByPlaceholderText, queryByText, getByText } = render(
      <WalletScreen />,
    );

    const searchInput = getByPlaceholderText("Buscar...");

    // Verify both exist initially
    expect(getByText("Grocery")).toBeTruthy();
    expect(getByText("Salary")).toBeTruthy();

    // Filter for "Grocery"
    fireEvent.changeText(searchInput, "Grocery");

    // "Grocery" should remain, "Salary" should disappear
    expect(getByText("Grocery")).toBeTruthy();
    expect(queryByText("Salary")).toBeNull();
  });
});
