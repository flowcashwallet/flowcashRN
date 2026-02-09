import { endpoints, getAuthHeaders } from "@/services/api";
import { RootState } from "@/store/store";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

export interface GamificationState {
  streakFreezes: number;
  repairedDays: string[]; // ISO date strings YYYY-MM-DD
  loading: boolean;
  error: string | null;
}

const initialState: GamificationState = {
  streakFreezes: 3, // Default 3 opportunities
  repairedDays: [],
  loading: false,
  error: null,
};

// Helper to map backend data to frontend model
const mapBackendToFrontend = (data: any): Partial<GamificationState> => ({
  streakFreezes: data.streak_freezes,
  repairedDays: data.repaired_days || [],
});

export const fetchGamificationData = createAsyncThunk(
  "gamification/fetchData",
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token;

      if (!token) {
        throw new Error("No auth token found");
      }

      const response = await fetch(endpoints.wallet.gamification, {
        headers: getAuthHeaders(token),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch gamification data");
      }

      const data = await response.json();
      return mapBackendToFrontend(data);
    } catch (error: any) {
      console.error("Error fetching gamification data:", error);
      return rejectWithValue(error.message);
    }
  },
);

export const consumeStreakFreeze = createAsyncThunk(
  "gamification/useFreeze",
  async (
    { date }: { date: string },
    { getState, rejectWithValue },
  ) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token;
      const gamificationState = state.gamification;

      if (!token) {
        throw new Error("No auth token found");
      }

      if (gamificationState.streakFreezes <= 0) {
        return rejectWithValue("No streak freezes remaining");
      }

      const newFreezes = gamificationState.streakFreezes - 1;
      const newRepairedDays = [...gamificationState.repairedDays, date];

      const backendData = {
        streak_freezes: newFreezes,
        repaired_days: newRepairedDays,
      };

      const response = await fetch(endpoints.wallet.gamification, {
        method: "PATCH",
        headers: getAuthHeaders(token),
        body: JSON.stringify(backendData),
      });

      if (!response.ok) {
        throw new Error("Failed to use streak freeze");
      }

      const data = await response.json();
      return mapBackendToFrontend(data);
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to use streak freeze");
    }
  },
);

const gamificationSlice = createSlice({
  name: "gamification",
  initialState,
  reducers: {
    // Local only reducers if needed
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchGamificationData.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchGamificationData.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.streakFreezes !== undefined) {
          state.streakFreezes = action.payload.streakFreezes;
        }
        if (action.payload.repairedDays !== undefined) {
          state.repairedDays = action.payload.repairedDays;
        }
      })
      .addCase(fetchGamificationData.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.error.message || "Failed to fetch gamification data";
      })
      .addCase(consumeStreakFreeze.fulfilled, (state, action) => {
        if (action.payload.streakFreezes !== undefined) {
          state.streakFreezes = action.payload.streakFreezes;
        }
        if (action.payload.repairedDays !== undefined) {
          state.repairedDays = action.payload.repairedDays;
        }
      });
  },
});

export default gamificationSlice.reducer;
