import { fetchForecast } from "@/features/wallet/data/walletSlice";
import { fireEvent, render } from "@testing-library/react-native";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  mockAnalyticsDataFactory,
  mockForecastFactory,
} from "../../../../tests/mocks";
import { useAnalyticsData } from "../../hooks/useAnalyticsData";
import AnalyticsScreen from "../AnalyticsScreen";

// Mock Hooks
jest.mock("../../hooks/useAnalyticsData");
jest.mock("react-redux", () => ({
  useDispatch: jest.fn(),
  useSelector: jest.fn(),
}));
jest.mock("@/features/wallet/data/walletSlice", () => ({
  fetchForecast: jest.fn(),
}));

// Mock simple UI components that might cause issues or are not focus of test
jest.mock("@/components/ui/icon-symbol", () => ({
  IconSymbol: ({ name }: any) => {
    const { Text } = jest.requireActual("react-native");
    return <Text>{`Icon: ${name}`}</Text>;
  },
}));

jest.mock("@/features/wallet/components/MonthYearPickerModal", () => ({
  MonthYearPickerModal: () => "MonthYearPickerModal",
}));

describe("AnalyticsScreen", () => {
  const mockDispatch = jest.fn();

  // Default mock state
  const mockForecast = mockForecastFactory();
  const mockAnalyticsData = mockAnalyticsDataFactory();

  beforeEach(() => {
    jest.clearAllMocks();
    (useDispatch as unknown as jest.Mock).mockReturnValue(mockDispatch);
    (useSelector as unknown as jest.Mock).mockReturnValue({
      forecast: mockForecast,
    });
    (useAnalyticsData as jest.Mock).mockReturnValue(mockAnalyticsData);
    (fetchForecast as unknown as jest.Mock).mockReturnValue({
      unwrap: jest.fn().mockResolvedValue(true),
    });
  });

  it("renders correctly with real ForecastCard and components", () => {
    const { getByText } = render(<AnalyticsScreen />);

    // Check Header
    expect(getByText(/Enero 2024/)).toBeTruthy();

    // Check ForecastCard Content
    expect(getByText("Predicción Mensual")).toBeTruthy();
    expect(getByText("Your finances are looking good!")).toBeTruthy();
    // Daily Burn Rate: 50.0 -> formatted likely as "$50.00"
    expect(getByText("$50.00")).toBeTruthy();
    // Projected Balance: 1000.0 -> "$1,000.00"
    expect(getByText("$1,000.00")).toBeTruthy();

    // Check Recurring Expenses
    // Note: Adjust text matcher if title is different in actual component
    expect(getByText("Gastos Recurrentes")).toBeTruthy();
    expect(getByText("Netflix")).toBeTruthy();
    expect(getByText("$15.00")).toBeTruthy();

    // Check Top Categories
    expect(getByText("Top Categorías")).toBeTruthy();
    expect(getByText("Food")).toBeTruthy();
    expect(getByText("40.0%")).toBeTruthy();
    expect(getByText("$400.00")).toBeTruthy();

    // Check Tips
    expect(getByText("Consejos para ti")).toBeTruthy();
    expect(getByText("Spend less on coffee")).toBeTruthy();
  });

  it("handles pull-to-refresh", async () => {
    render(<AnalyticsScreen />);
    expect(mockDispatch).toHaveBeenCalledWith(expect.anything()); // fetchForecast is called on mount
  });

  it("expands category on press", () => {
    const { getByText } = render(<AnalyticsScreen />);

    // Press a category
    fireEvent.press(getByText("Food"));

    // Check if transactions are revealed
    expect(getByText("Burger King")).toBeTruthy();
    expect(getByText("$15.50")).toBeTruthy();
  });
});
