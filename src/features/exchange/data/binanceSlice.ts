import { endpoints } from "@/services/api";
import { AppDispatch, RootState } from "@/store/store";
import { fetchWithAuth } from "@/utils/apiClient";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

export interface BinanceBalance {
  asset: string;
  free: number;
  locked: number;
}

interface BinanceState {
  connected: boolean;
  maskedApiKey: string | null;
  lastSyncedAt: number | null;
  balances: BinanceBalance[];
  status: "idle" | "connecting" | "syncing" | "error";
  error: string | null;
}

const initialState: BinanceState = {
  connected: false,
  maskedApiKey: null,
  lastSyncedAt: null,
  balances: [],
  status: "idle",
  error: null,
};

interface StatusResponse {
  connected: boolean;
  masked_api_key: string | null;
  last_synced_at: string | null;
}

function parseTimestamp(value: string | null): number | null {
  if (!value) return null;
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? null : parsed;
}

export const fetchBinanceStatus = createAsyncThunk<
  StatusResponse,
  void,
  { state: RootState; rejectValue: string }
>("binance/fetchStatus", async (_arg, { dispatch, getState, rejectWithValue }) => {
  try {
    const response = await fetchWithAuth(
      endpoints.binance.status,
      { method: "GET" },
      dispatch as AppDispatch,
      getState as () => RootState,
    );
    if (!response.ok) throw new Error("binance_status_failed");
    return (await response.json()) as StatusResponse;
  } catch (error: any) {
    return rejectWithValue(error.message ?? "binance_status_failed");
  }
});

/**
 * `apiSecret` vive únicamente en el estado local del formulario que llama a
 * este thunk hasta este único POST — nunca se guarda en Redux ni en
 * AsyncStorage/SecureStore. El slice, después de esto, solo conserva
 * `maskedApiKey`/`connected`/`lastSyncedAt` — igual que `authSlice` nunca
 * guarda la contraseña, solo el token.
 */
export const connectBinance = createAsyncThunk<
  StatusResponse,
  { apiKey: string; apiSecret: string },
  { state: RootState; rejectValue: string }
>("binance/connect", async ({ apiKey, apiSecret }, { dispatch, getState, rejectWithValue }) => {
  try {
    const response = await fetchWithAuth(
      endpoints.binance.connect,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api_key: apiKey, api_secret: apiSecret }),
      },
      dispatch as AppDispatch,
      getState as () => RootState,
    );
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(data?.error ?? "binance_connect_failed");
    }
    return data as StatusResponse;
  } catch (error: any) {
    return rejectWithValue(error.message ?? "binance_connect_failed");
  }
});

export const disconnectBinance = createAsyncThunk<
  void,
  void,
  { state: RootState; rejectValue: string }
>("binance/disconnect", async (_arg, { dispatch, getState, rejectWithValue }) => {
  try {
    const response = await fetchWithAuth(
      endpoints.binance.connect,
      { method: "DELETE" },
      dispatch as AppDispatch,
      getState as () => RootState,
    );
    if (!response.ok) throw new Error("binance_disconnect_failed");
  } catch (error: any) {
    return rejectWithValue(error.message ?? "binance_disconnect_failed");
  }
});

interface SyncResponse {
  balances: BinanceBalance[];
  synced_at: string;
}

interface SyncRejection {
  message: string;
  /** El backend desconectó la key (permisos escalados después de conectarla) — el reducer de rejected limpia el estado de conexión en ese caso. */
  disconnected: boolean;
}

export const syncBinancePortfolio = createAsyncThunk<
  SyncResponse,
  void,
  { state: RootState; rejectValue: SyncRejection }
>("binance/sync", async (_arg, { dispatch, getState, rejectWithValue }) => {
  try {
    const response = await fetchWithAuth(
      endpoints.binance.sync,
      { method: "POST" },
      dispatch as AppDispatch,
      getState as () => RootState,
    );
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      return rejectWithValue({
        message: data?.error ?? "binance_sync_failed",
        disconnected: Boolean(data?.disconnected),
      });
    }
    return data as SyncResponse;
  } catch (error: any) {
    return rejectWithValue({ message: error.message ?? "binance_sync_failed", disconnected: false });
  }
});

function applyStatus(state: BinanceState, status: StatusResponse) {
  state.connected = status.connected;
  state.maskedApiKey = status.masked_api_key;
  state.lastSyncedAt = parseTimestamp(status.last_synced_at);
}

const binanceSlice = createSlice({
  name: "binance",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchBinanceStatus.fulfilled, (state, action) => {
        applyStatus(state, action.payload);
      })
      .addCase(connectBinance.pending, (state) => {
        state.status = "connecting";
        state.error = null;
      })
      .addCase(connectBinance.fulfilled, (state, action) => {
        state.status = "idle";
        applyStatus(state, action.payload);
      })
      .addCase(connectBinance.rejected, (state, action) => {
        state.status = "error";
        state.error = action.payload ?? "binance_connect_failed";
      })
      .addCase(disconnectBinance.fulfilled, (state) => {
        state.status = "idle";
        state.connected = false;
        state.maskedApiKey = null;
        state.lastSyncedAt = null;
        state.balances = [];
      })
      .addCase(syncBinancePortfolio.pending, (state) => {
        state.status = "syncing";
        state.error = null;
      })
      .addCase(syncBinancePortfolio.fulfilled, (state, action) => {
        state.status = "idle";
        state.balances = action.payload.balances;
        state.lastSyncedAt = parseTimestamp(action.payload.synced_at);
      })
      .addCase(syncBinancePortfolio.rejected, (state, action) => {
        state.status = "error";
        state.error = action.payload?.message ?? "binance_sync_failed";
        if (action.payload?.disconnected) {
          state.connected = false;
          state.maskedApiKey = null;
          state.lastSyncedAt = null;
          state.balances = [];
        }
      });
  },
});

export default binanceSlice.reducer;
