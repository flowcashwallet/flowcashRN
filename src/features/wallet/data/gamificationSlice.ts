import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../../../services/firebaseConfig";

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

export const fetchGamificationData = createAsyncThunk(
  "gamification/fetchData",
  async (userId: string) => {
    const docRef = doc(db, "users", userId, "gamification", "stats");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as Partial<GamificationState>;
    } else {
      // Initialize if not exists
      const initialData = { streakFreezes: 3, repairedDays: [] };
      await setDoc(docRef, initialData);
      return initialData;
    }
  },
);

export const consumeStreakFreeze = createAsyncThunk(
  "gamification/useFreeze",
  async (
    { userId, date }: { userId: string; date: string },
    { getState, rejectWithValue },
  ) => {
    // Optimistic update could be done here, but let's just do standard async
    try {
      const docRef = doc(db, "users", userId, "gamification", "stats");
      const state = (getState() as any).gamification as GamificationState;

      if (state.streakFreezes <= 0) {
        return rejectWithValue("No streak freezes remaining");
      }

      const newFreezes = state.streakFreezes - 1;
      const newRepairedDays = [...state.repairedDays, date];

      await updateDoc(docRef, {
        streakFreezes: newFreezes,
        repairedDays: newRepairedDays,
      });

      return { streakFreezes: newFreezes, repairedDays: newRepairedDays };
    } catch (error) {
      return rejectWithValue("Failed to use streak freeze");
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
        state.streakFreezes = action.payload.streakFreezes;
        state.repairedDays = action.payload.repairedDays;
      });
  },
});

export default gamificationSlice.reducer;
