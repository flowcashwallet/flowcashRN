import { configureStore } from "@reduxjs/toolkit";
import binanceReducer, {
  connectBinance,
  disconnectBinance,
  fetchBinanceStatus,
  syncBinancePortfolio,
} from "@/features/exchange/data/binanceSlice";
import { fetchWithAuth } from "@/utils/apiClient";

jest.mock("@/utils/apiClient", () => ({
  fetchWithAuth: jest.fn(),
}));

const mockFetchWithAuth = fetchWithAuth as jest.Mock;

function buildStore() {
  return configureStore({ reducer: { binance: binanceReducer } });
}

describe("binanceSlice", () => {
  beforeEach(() => {
    mockFetchWithAuth.mockReset();
  });

  it("fetchBinanceStatus refleja el estado 'no conectado' del backend", async () => {
    mockFetchWithAuth.mockResolvedValue({
      ok: true,
      json: async () => ({ connected: false, masked_api_key: null, last_synced_at: null }),
    });

    const store = buildStore();
    await store.dispatch(fetchBinanceStatus() as any);

    expect(store.getState().binance).toMatchObject({
      connected: false,
      maskedApiKey: null,
      lastSyncedAt: null,
    });
  });

  it("connectBinance.fulfilled guarda solo la key enmascarada, nunca el secreto", async () => {
    mockFetchWithAuth.mockResolvedValue({
      ok: true,
      json: async () => ({ connected: true, masked_api_key: "abcd…5678", last_synced_at: null }),
    });

    const store = buildStore();
    await store.dispatch(
      connectBinance({ apiKey: "abcd1234efgh5678", apiSecret: "supersecretvalue" }) as any,
    );

    const state = store.getState().binance;
    expect(state.connected).toBe(true);
    expect(state.maskedApiKey).toBe("abcd…5678");
    // El secreto/la key completa jamás quedan en ninguna parte del estado.
    expect(JSON.stringify(state)).not.toContain("supersecretvalue");
    expect(JSON.stringify(state)).not.toContain("abcd1234efgh5678");
  });

  it("connectBinance manda api_key/api_secret en el body, en snake_case", async () => {
    mockFetchWithAuth.mockResolvedValue({
      ok: true,
      json: async () => ({ connected: true, masked_api_key: "abcd…5678", last_synced_at: null }),
    });

    const store = buildStore();
    await store.dispatch(connectBinance({ apiKey: "key123", apiSecret: "secret456" }) as any);

    const [, options] = mockFetchWithAuth.mock.calls[0];
    expect(JSON.parse(options.body)).toEqual({ api_key: "key123", api_secret: "secret456" });
  });

  it("connectBinance.rejected pone status en error y guarda el código de error del backend", async () => {
    mockFetchWithAuth.mockResolvedValue({
      ok: false,
      json: async () => ({ error: "key_not_read_only:enableWithdrawals" }),
    });

    const store = buildStore();
    await store.dispatch(connectBinance({ apiKey: "k", apiSecret: "s" }) as any);

    const state = store.getState().binance;
    expect(state.status).toBe("error");
    expect(state.error).toBe("key_not_read_only:enableWithdrawals");
    expect(state.connected).toBe(false);
  });

  it("disconnectBinance.fulfilled limpia todo el estado de conexión", async () => {
    mockFetchWithAuth.mockResolvedValue({ ok: true });

    const store = buildStore();
    // Seed a "connected" state first.
    await store.dispatch(
      connectBinance.fulfilled(
        { connected: true, masked_api_key: "abcd…5678", last_synced_at: null },
        "req",
        { apiKey: "k", apiSecret: "s" },
      ) as any,
    );
    expect(store.getState().binance.connected).toBe(true);

    await store.dispatch(disconnectBinance() as any);

    expect(store.getState().binance).toMatchObject({
      connected: false,
      maskedApiKey: null,
      lastSyncedAt: null,
      balances: [],
    });
  });

  it("syncBinancePortfolio.fulfilled guarda los balances y la hora de sincronización", async () => {
    mockFetchWithAuth.mockResolvedValue({
      ok: true,
      json: async () => ({
        balances: [{ asset: "BTC", free: 0.5, locked: 0 }],
        synced_at: "2026-09-17T12:00:00Z",
      }),
    });

    const store = buildStore();
    await store.dispatch(syncBinancePortfolio() as any);

    const state = store.getState().binance;
    expect(state.balances).toEqual([{ asset: "BTC", free: 0.5, locked: 0 }]);
    expect(state.lastSyncedAt).not.toBeNull();
  });

  it("syncBinancePortfolio.rejected con `disconnected: true` limpia el estado de conexión", async () => {
    mockFetchWithAuth.mockResolvedValue({
      ok: false,
      json: async () => ({ error: "key_not_read_only:enableSpotAndMarginTrading", disconnected: true }),
    });

    const store = buildStore();
    await store.dispatch(
      connectBinance.fulfilled(
        { connected: true, masked_api_key: "abcd…5678", last_synced_at: null },
        "req",
        { apiKey: "k", apiSecret: "s" },
      ) as any,
    );

    await store.dispatch(syncBinancePortfolio() as any);

    const state = store.getState().binance;
    expect(state.status).toBe("error");
    expect(state.connected).toBe(false);
    expect(state.maskedApiKey).toBeNull();
  });

  it("syncBinancePortfolio.rejected sin `disconnected` conserva el estado de conexión (para poder reintentar)", async () => {
    mockFetchWithAuth.mockResolvedValue({
      ok: false,
      json: async () => ({ error: "binance_service_unavailable" }),
    });

    const store = buildStore();
    await store.dispatch(
      connectBinance.fulfilled(
        { connected: true, masked_api_key: "abcd…5678", last_synced_at: null },
        "req",
        { apiKey: "k", apiSecret: "s" },
      ) as any,
    );

    await store.dispatch(syncBinancePortfolio() as any);

    const state = store.getState().binance;
    expect(state.connected).toBe(true);
    expect(state.maskedApiKey).toBe("abcd…5678");
  });
});
