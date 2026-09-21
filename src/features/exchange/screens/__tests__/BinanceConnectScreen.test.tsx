import { configureStore } from "@reduxjs/toolkit";
import { ThemeProvider } from "@/contexts/ThemeContext";
import binanceReducer from "@/features/exchange/data/binanceSlice";
import BinanceConnectScreen from "@/features/exchange/screens/BinanceConnectScreen";
import STRINGS from "@/i18n/es.json";
import { fetchWithAuth } from "@/utils/apiClient";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { useRouter } from "expo-router";
import React from "react";
import { Alert } from "react-native";
import { Provider } from "react-redux";

jest.mock("expo-router", () => ({
  useRouter: jest.fn(),
  Stack: { Screen: () => null },
}));

jest.mock("@/utils/apiClient", () => ({
  fetchWithAuth: jest.fn(),
}));

const mockFetchWithAuth = fetchWithAuth as jest.Mock;

function renderScreen() {
  const store = configureStore({ reducer: { binance: binanceReducer } });
  return render(
    <Provider store={store}>
      <ThemeProvider>
        <BinanceConnectScreen />
      </ThemeProvider>
    </Provider>,
  );
}

/** El status inicial (fetchBinanceStatus al montar) — "no conectado" por default. */
function mockDisconnectedStatus() {
  mockFetchWithAuth.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ connected: false, masked_api_key: null, last_synced_at: null }),
  });
}

describe("BinanceConnectScreen — no conectado", () => {
  beforeEach(() => {
    mockFetchWithAuth.mockReset();
    (useRouter as jest.Mock).mockReturnValue({ push: jest.fn(), back: jest.fn() });
  });

  it("muestra la advertencia de solo-lectura y el formulario", async () => {
    mockDisconnectedStatus();
    renderScreen();
    await waitFor(() => expect(screen.getByText(STRINGS.binance.readOnlyWarningTitle)).toBeTruthy());
    expect(screen.getByPlaceholderText(STRINGS.binance.apiKeyPlaceholder)).toBeTruthy();
    expect(screen.getByPlaceholderText(STRINGS.binance.apiSecretPlaceholder)).toBeTruthy();
  });

  it("al conectar exitosamente, manda api_key/api_secret y pasa a la vista conectada", async () => {
    mockDisconnectedStatus();
    mockFetchWithAuth.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ connected: true, masked_api_key: "abcd…5678", last_synced_at: null }),
    });
    mockFetchWithAuth.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ balances: [], total_value_usd: 0, synced_at: "2026-09-17T12:00:00Z" }),
    });

    renderScreen();
    await waitFor(() => expect(screen.getByPlaceholderText(STRINGS.binance.apiKeyPlaceholder)).toBeTruthy());

    fireEvent.changeText(screen.getByPlaceholderText(STRINGS.binance.apiKeyPlaceholder), "abcd1234efgh5678");
    fireEvent.changeText(screen.getByPlaceholderText(STRINGS.binance.apiSecretPlaceholder), "supersecretvalue");
    fireEvent.press(screen.getByText(STRINGS.binance.connect));

    // Pasó a la vista conectada — confirmado por el total (solo se renderiza ahí).
    await waitFor(() => expect(screen.getByText(STRINGS.binance.totalLabel)).toBeTruthy());

    const connectCall = mockFetchWithAuth.mock.calls[1];
    expect(JSON.parse(connectCall[1].body)).toEqual({
      api_key: "abcd1234efgh5678",
      api_secret: "supersecretvalue",
    });
  });

  it("muestra el mensaje de 'permisos de más' cuando el backend rechaza la key", async () => {
    mockDisconnectedStatus();
    mockFetchWithAuth.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "key_not_read_only:enableWithdrawals" }),
    });
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => {});

    renderScreen();
    await waitFor(() => expect(screen.getByPlaceholderText(STRINGS.binance.apiKeyPlaceholder)).toBeTruthy());

    fireEvent.changeText(screen.getByPlaceholderText(STRINGS.binance.apiKeyPlaceholder), "k");
    fireEvent.changeText(screen.getByPlaceholderText(STRINGS.binance.apiSecretPlaceholder), "s");
    fireEvent.press(screen.getByText(STRINGS.binance.connect));

    await waitFor(() =>
      expect(alertSpy).toHaveBeenCalledWith(STRINGS.common.error, STRINGS.binance.errorKeyNotReadOnly),
    );
    // Sigue en la vista de formulario — no "conectó" nada.
    expect(screen.queryByText(STRINGS.binance.totalLabel)).toBeNull();
  });
});

describe("BinanceConnectScreen — conectado", () => {
  beforeEach(() => {
    mockFetchWithAuth.mockReset();
    (useRouter as jest.Mock).mockReturnValue({ push: jest.fn(), back: jest.fn() });
  });

  function mockConnectedStatus() {
    mockFetchWithAuth.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ connected: true, masked_api_key: "abcd…5678", last_synced_at: "2026-09-17T12:00:00Z" }),
    });
  }

  it("muestra la key enmascarada y el estado vacío antes de sincronizar", async () => {
    mockConnectedStatus();
    renderScreen();

    // La key enmascarada va junto con el conteo de activos en un solo texto compuesto.
    await waitFor(() => expect(screen.getByText(/abcd…5678/)).toBeTruthy());
    // Sin sync todavía en este test — el estado vacío se muestra.
    expect(screen.getByText(STRINGS.binance.emptyPortfolio)).toBeTruthy();
  });

  it("al sincronizar, muestra el portafolio con el valor en USD que ya manda el backend", async () => {
    mockConnectedStatus();
    mockFetchWithAuth.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        balances: [
          { asset: "BTC", amount: 0.5, value_usd: 30000 },
          { asset: "SOMEOBSCURECOIN", amount: 12, value_usd: null },
        ],
        total_value_usd: 30000,
        synced_at: "2026-09-17T12:00:00Z",
      }),
    });

    renderScreen();
    await waitFor(() => expect(screen.getByText(/abcd…5678/)).toBeTruthy());
    // El botón de sincronizar ahora es un ícono compacto (sin texto visible), identificado por su accessibilityLabel.
    fireEvent.press(screen.getByLabelText(STRINGS.binance.syncNow));

    // "BTC" aparece dos veces por fila: el disco de color (iniciales) y el
    // nombre del activo — confirmamos que la fila se renderizó, no un texto único.
    await waitFor(() => expect(screen.getAllByText("BTC").length).toBeGreaterThan(0));
    // El valor aparece dos veces: el de la fila de BTC y el total (coinciden
    // porque el otro activo del portafolio no tiene precio y no aporta al total).
    expect(screen.getAllByText("$30,000.00")).toHaveLength(2);
    expect(screen.getByText(STRINGS.binance.noPriceAvailable)).toBeTruthy();
  });

  it("desconectar pide confirmación destructiva antes de llamar al backend", async () => {
    mockConnectedStatus();
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => {});
    renderScreen();

    await waitFor(() => expect(screen.getByText(STRINGS.binance.disconnect)).toBeTruthy());
    fireEvent.press(screen.getByText(STRINGS.binance.disconnect));

    expect(alertSpy).toHaveBeenCalledWith(
      STRINGS.binance.disconnectConfirmTitle,
      STRINGS.binance.disconnectConfirmMessage,
      expect.arrayContaining([
        expect.objectContaining({ text: STRINGS.common.cancel, style: "cancel" }),
        expect.objectContaining({ text: STRINGS.binance.disconnect, style: "destructive" }),
      ]),
    );
    // Solo el status inicial se llamó — nada de red por la sola confirmación.
    expect(mockFetchWithAuth).toHaveBeenCalledTimes(1);
  });

  it("confirmar la desconexión llama al DELETE y vuelve al formulario", async () => {
    mockConnectedStatus();
    mockFetchWithAuth.mockResolvedValueOnce({ ok: true }); // DELETE /connect/
    jest.spyOn(Alert, "alert").mockImplementation((_title, _msg, buttons) => {
      buttons?.find((b) => b.style === "destructive")?.onPress?.();
    });

    renderScreen();
    await waitFor(() => expect(screen.getByText(STRINGS.binance.disconnect)).toBeTruthy());
    fireEvent.press(screen.getByText(STRINGS.binance.disconnect));

    await waitFor(() =>
      expect(screen.getByPlaceholderText(STRINGS.binance.apiKeyPlaceholder)).toBeTruthy(),
    );
    expect(mockFetchWithAuth.mock.calls[1][1]).toMatchObject({ method: "DELETE" });
  });
});
