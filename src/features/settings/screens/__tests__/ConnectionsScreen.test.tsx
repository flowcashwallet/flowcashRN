import { configureStore } from "@reduxjs/toolkit";
import { ThemeProvider } from "@/contexts/ThemeContext";
import binanceReducer from "@/features/exchange/data/binanceSlice";
import ConnectionsScreen from "@/features/settings/screens/ConnectionsScreen";
import STRINGS from "@/i18n/es.json";
import { fetchWithAuth } from "@/utils/apiClient";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { useRouter } from "expo-router";
import React from "react";
import { Provider } from "react-redux";

jest.mock("expo-router", () => ({
  useRouter: jest.fn(),
  Stack: { Screen: () => null },
}));

jest.mock("@/utils/apiClient", () => ({
  fetchWithAuth: jest.fn(),
}));

const mockFetchWithAuth = fetchWithAuth as jest.Mock;
const mockPush = jest.fn();

function renderScreen() {
  const store = configureStore({ reducer: { binance: binanceReducer } });
  return render(
    <Provider store={store}>
      <ThemeProvider>
        <ConnectionsScreen />
      </ThemeProvider>
    </Provider>,
  );
}

describe("ConnectionsScreen", () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockFetchWithAuth.mockReset();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush, back: jest.fn() });
  });

  it("muestra 'No conectado' antes de que responda el status", () => {
    mockFetchWithAuth.mockReturnValue(new Promise(() => {})); // nunca resuelve en este test
    renderScreen();
    expect(screen.getByText(STRINGS.settings.notConnectedLabel)).toBeTruthy();
  });

  it("muestra 'Conectado' cuando el backend dice que ya hay una conexión", async () => {
    mockFetchWithAuth.mockResolvedValue({
      ok: true,
      json: async () => ({ connected: true, masked_api_key: "abcd…5678", last_synced_at: null }),
    });
    renderScreen();
    await waitFor(() => expect(screen.getByText(STRINGS.settings.connectedLabel)).toBeTruthy());
  });

  it("navega a /settings/connections/binance al tocar la fila de Binance", () => {
    mockFetchWithAuth.mockReturnValue(new Promise(() => {}));
    renderScreen();
    fireEvent.press(screen.getByText("Binance"));
    expect(mockPush).toHaveBeenCalledWith("/settings/connections/binance");
  });
});
