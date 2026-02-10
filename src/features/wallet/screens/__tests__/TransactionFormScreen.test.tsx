import { fireEvent, render } from "@testing-library/react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { useTransactionForm } from "../../hooks/useTransactionForm";
import TransactionFormScreen from "../TransactionFormScreen";

// Mock Hooks
jest.mock("../../hooks/useTransactionForm");
jest.mock("expo-router", () => ({
  useRouter: jest.fn(),
  useLocalSearchParams: jest.fn(),
}));

// Mock complex child components
jest.mock("@/components/ui/icon-symbol", () => ({
  IconSymbol: ({ name }: any) => {
    const { Text } = jest.requireActual("react-native");
    return <Text>{`Icon: ${name}`}</Text>;
  },
}));

jest.mock("@react-native-community/datetimepicker", () => {
  const { View } = jest.requireActual("react-native");
  const MockDateTimePicker = (props: any) => (
    <View testID="dateTimePicker" {...props} />
  );
  MockDateTimePicker.displayName = "MockDateTimePicker";
  return MockDateTimePicker;
});

jest.mock("../../components/EntitySelectionModal", () => ({
  EntitySelectionModal: () => "EntitySelectionModal",
}));

jest.mock("@/components/NotificationSetupModal", () => ({
  NotificationSetupModal: () => "NotificationSetupModal",
}));

describe("TransactionFormScreen", () => {
  const mockRouter = { back: jest.fn(), push: jest.fn() };

  // Default mock state for useTransactionForm
  const defaultFormState = {
    type: "expense",
    setType: jest.fn(),
    amount: "",
    setAmount: jest.fn(),
    description: "",
    setDescription: jest.fn(),
    selectedCategory: null,
    setSelectedCategory: jest.fn(),
    selectedEntityId: null,
    setSelectedEntityId: jest.fn(),
    transferRelatedEntityId: null,
    setTransferRelatedEntityId: jest.fn(),
    selectedPaymentType: null,
    setSelectedPaymentType: jest.fn(),
    date: new Date("2024-01-01"),
    setDate: jest.fn(),
    isSaving: false,
    isEditing: false,
    handleSave: jest.fn(),
    handleDelete: jest.fn(),
    frequentCategories: [],
    frequentEntities: [],
    categories: [],
    entities: [],
    isNotificationSetupVisible: false,
    setIsNotificationSetupVisible: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useLocalSearchParams as jest.Mock).mockReturnValue({});
    (useTransactionForm as jest.Mock).mockReturnValue(defaultFormState);
  });

  it("renders correctly for new expense", () => {
    const { getByText, getByPlaceholderText } = render(
      <TransactionFormScreen />,
    );

    expect(getByText("Nuevo Gasto")).toBeTruthy();
    expect(getByPlaceholderText("0.00")).toBeTruthy();
    expect(getByPlaceholderText("Ej: Comida, Salario...")).toBeTruthy();
    expect(getByText("Guardar")).toBeTruthy();
  });

  it("renders correctly for new income", () => {
    (useTransactionForm as jest.Mock).mockReturnValue({
      ...defaultFormState,
      type: "income",
    });

    const { getByText } = render(<TransactionFormScreen />);
    expect(getByText("Nuevo Ingreso")).toBeTruthy();
  });

  it("renders correctly for editing", () => {
    (useTransactionForm as jest.Mock).mockReturnValue({
      ...defaultFormState,
      isEditing: true,
      amount: "100.00",
      description: "Test Transaction",
    });

    const { getByText, getByDisplayValue } = render(<TransactionFormScreen />);

    expect(getByText("Editar Transacción")).toBeTruthy();
    expect(getByDisplayValue("100.00")).toBeTruthy();
    expect(getByDisplayValue("Test Transaction")).toBeTruthy();
    // Check for delete button icon
    expect(getByText("Icon: trash")).toBeTruthy();
  });

  it("updates amount and description inputs", () => {
    const { getByPlaceholderText } = render(<TransactionFormScreen />);

    const amountInput = getByPlaceholderText("0.00");
    const descriptionInput = getByPlaceholderText("Ej: Comida, Salario...");

    fireEvent.changeText(amountInput, "50");
    fireEvent.changeText(descriptionInput, "Lunch");

    expect(defaultFormState.setAmount).toHaveBeenCalledWith("50");
    expect(defaultFormState.setDescription).toHaveBeenCalledWith("Lunch");
  });

  it("calls handleSave when save button is pressed", () => {
    const { getByText } = render(<TransactionFormScreen />);

    fireEvent.press(getByText("Guardar"));
    expect(defaultFormState.handleSave).toHaveBeenCalled();
  });

  it("calls handleDelete when delete button is pressed (edit mode)", () => {
    (useTransactionForm as jest.Mock).mockReturnValue({
      ...defaultFormState,
      isEditing: true,
    });

    const { getByText } = render(<TransactionFormScreen />);

    // The trash icon is wrapped in a TouchableOpacity in the header
    // Since we mocked IconSymbol to return text, we might need to find the parent or just find by text if the pressable is the text itself (it's not).
    // The structure is <TouchableOpacity><IconSymbol /></TouchableOpacity>
    // `getByText('Icon: trash')` returns the Text node.
    // In React Native Testing Library, fireEvent.press bubbles up.

    fireEvent.press(getByText("Icon: trash"));
    expect(defaultFormState.handleDelete).toHaveBeenCalled();
  });

  it("navigates back when back button is pressed", () => {
    const { getByText } = render(<TransactionFormScreen />);

    fireEvent.press(getByText("Icon: chevron.left"));
    expect(mockRouter.back).toHaveBeenCalled();
  });

  it("toggles transaction type segments", () => {
    const { getByText } = render(<TransactionFormScreen />);

    // Switch to Income
    fireEvent.press(getByText("Ingreso"));
    expect(defaultFormState.setType).toHaveBeenCalledWith("income");

    // Switch to Transfer
    fireEvent.press(getByText("Transf."));
    expect(defaultFormState.setType).toHaveBeenCalledWith("transfer");

    // Switch back to Expense
    fireEvent.press(getByText("Gasto"));
    expect(defaultFormState.setType).toHaveBeenCalledWith("expense");
  });
});
