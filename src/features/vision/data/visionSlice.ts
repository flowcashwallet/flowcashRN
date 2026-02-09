import { endpoints } from "@/services/api";
import { AppDispatch, RootState } from "@/store/store";
import { fetchWithAuth } from "@/utils/apiClient";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

export interface VisionEntity {
  id: string;
  userId: string;
  name: string;
  description?: string;
  amount: number; // Manual valuation or Calculated Fiat Value
  type: "asset" | "liability";
  createdAt: number;
  isCrypto?: boolean;
  cryptoSymbol?: string;
  cryptoAmount?: number;
  category?: string;
  // Credit Card Specific
  isCreditCard?: boolean;
  cutoffDate?: number; // Day of month 1-31
  paymentDate?: number; // Day of month 1-31
  issuerBank?: string;
}

interface VisionState {
  entities: VisionEntity[];
  loading: boolean;
  error: string | null;
}

const initialState: VisionState = {
  entities: [],
  loading: false,
  error: null,
};

// Helper to map backend data to frontend model
const mapBackendToFrontend = (data: any): VisionEntity => ({
  id: data.id.toString(),
  userId: data.user?.toString() || "",
  name: data.name,
  description: data.description,
  amount: parseFloat(data.amount),
  type: data.type,
  createdAt: new Date(data.created_at).getTime(),
  isCrypto: data.is_crypto,
  cryptoSymbol: data.crypto_symbol,
  cryptoAmount: data.crypto_amount ? parseFloat(data.crypto_amount) : undefined,
  category: data.category,
  isCreditCard: data.is_credit_card,
  cutoffDate: data.cutoff_date,
  paymentDate: data.payment_date,
  issuerBank: data.issuer_bank,
});

// Helper to map frontend model to backend data
const mapFrontendToBackend = (entity: Partial<VisionEntity>) => {
  return {
    name: entity.name,
    description: entity.description,
    amount: entity.amount,
    type: entity.type,
    category: entity.category,
    is_crypto: entity.isCrypto,
    crypto_symbol: entity.cryptoSymbol,
    crypto_amount: entity.cryptoAmount,
    is_credit_card: entity.isCreditCard,
    cutoff_date: entity.cutoffDate,
    payment_date: entity.paymentDate,
    issuer_bank: entity.issuerBank,
  };
};

export const fetchVisionEntities = createAsyncThunk(
  "vision/fetchEntities",
  async (_, { rejectWithValue, getState, dispatch }) => {
    try {
      const response = await fetchWithAuth(
        endpoints.wallet.vision,
        {},
        dispatch as AppDispatch,
        getState as () => RootState,
      );

      if (!response.ok) {
        throw new Error("Failed to fetch vision entities");
      }

      const data = await response.json();
      return data.map(mapBackendToFrontend);
    } catch (error: any) {
      console.error("Error fetching vision entities:", error);
      return rejectWithValue(error.message);
    }
  },
);

export const addVisionEntity = createAsyncThunk(
  "vision/addEntity",
  async (
    entity: Omit<VisionEntity, "id">,
    { rejectWithValue, getState, dispatch },
  ) => {
    try {
      const backendData = mapFrontendToBackend(entity);

      const response = await fetchWithAuth(
        endpoints.wallet.vision,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(backendData),
        },
        dispatch as AppDispatch,
        getState as () => RootState,
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(JSON.stringify(errorData));
      }

      const data = await response.json();
      return mapBackendToFrontend(data);
    } catch (error: any) {
      console.error("Error adding vision entity:", error);
      return rejectWithValue(error.message);
    }
  },
);

export const deleteVisionEntity = createAsyncThunk(
  "vision/deleteEntity",
  async (entityId: string, { rejectWithValue, getState, dispatch }) => {
    try {
      const response = await fetchWithAuth(
        `${endpoints.wallet.vision}${entityId}/`,
        {
          method: "DELETE",
        },
        dispatch as AppDispatch,
        getState as () => RootState,
      );

      if (!response.ok) {
        throw new Error("Failed to delete vision entity");
      }

      return entityId;
    } catch (error: any) {
      console.error("Error deleting vision entity:", error);
      return rejectWithValue(error.message);
    }
  },
);

export const updateVisionEntity = createAsyncThunk(
  "vision/updateEntity",
  async (entity: VisionEntity, { rejectWithValue, getState, dispatch }) => {
    try {
      const { id, ...data } = entity;
      const backendData = mapFrontendToBackend(data);

      const response = await fetchWithAuth(
        `${endpoints.wallet.vision}${id}/`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(backendData),
        },
        dispatch as AppDispatch,
        getState as () => RootState,
      );

      if (!response.ok) {
        throw new Error("Failed to update vision entity");
      }

      const responseData = await response.json();
      return mapBackendToFrontend(responseData);
    } catch (error: any) {
      console.error("Error updating vision entity:", error);
      return rejectWithValue(error.message);
    }
  },
);

const visionSlice = createSlice({
  name: "vision",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchVisionEntities.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVisionEntities.fulfilled, (state, action) => {
        state.loading = false;
        state.entities = action.payload;
      })
      .addCase(fetchVisionEntities.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Add
      .addCase(addVisionEntity.fulfilled, (state, action) => {
        state.entities.push(action.payload);
      })
      // Delete
      .addCase(deleteVisionEntity.fulfilled, (state, action) => {
        state.entities = state.entities.filter((e) => e.id !== action.payload);
      })
      // Update
      .addCase(updateVisionEntity.fulfilled, (state, action) => {
        const index = state.entities.findIndex(
          (e) => e.id === action.payload.id,
        );
        if (index !== -1) {
          state.entities[index] = action.payload;
        }
      });
  },
});

export default visionSlice.reducer;
