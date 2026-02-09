import { fetchWithAuth } from "@/utils/apiClient";
import { PayloadAction, createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { endpoints } from "../../services/api";
import { AppDispatch, RootState } from "../../store/store";
import { addTransaction } from "../wallet/data/walletSlice";

export interface FixedExpense {
  id: string;
  name: string;
  amount: number;
  category: string;
}

interface BudgetState {
  monthlyIncome: number;
  fixedExpenses: FixedExpense[];
  isSetup: boolean;
  lastProcessedDate: string | null; // ISO string YYYY-MM
  loading: boolean;
  error: string | null;
}

const initialState: BudgetState = {
  monthlyIncome: 0,
  fixedExpenses: [],
  isSetup: false,
  lastProcessedDate: null,
  loading: false,
  error: null,
};

// Async Thunks

export const saveBudgetConfig = createAsyncThunk(
  "budget/saveConfig",
  async (
    {
      monthlyIncome,
      fixedExpenses,
    }: { monthlyIncome: number; fixedExpenses: FixedExpense[] },
    { getState, dispatch, rejectWithValue },
  ) => {
    try {
      const response = await fetchWithAuth(
        endpoints.wallet.budget,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            monthly_income: monthlyIncome,
            fixed_expenses: fixedExpenses.map((e) => ({
              name: e.name,
              amount: e.amount,
              category: e.category,
            })),
            is_setup: true,
          }),
        },
        dispatch as AppDispatch,
        getState as () => RootState,
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to save budget config");
      }

      const data = await response.json();

      // Return format matching what the reducer expects, or the updated data from backend
      // The reducer uses action.payload.monthlyIncome and action.payload.fixedExpenses
      // We should map the backend response back to the frontend format to be safe and consistent
      return {
        monthlyIncome: parseFloat(data.monthly_income),
        fixedExpenses: data.fixed_expenses.map((e: any) => ({
          id: e.id.toString(),
          name: e.name,
          amount: parseFloat(e.amount),
          category: e.category,
        })),
      };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

export const fetchBudgetConfig = createAsyncThunk(
  "budget/fetchConfig",
  async (_, { getState, dispatch, rejectWithValue }) => {
    try {
      const response = await fetchWithAuth(
        endpoints.wallet.budget,
        {},
        dispatch as AppDispatch,
        getState as () => RootState,
      );

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error("Failed to fetch budget config");
      }

      const data = await response.json();

      return {
        monthlyIncome: parseFloat(data.monthly_income),
        fixedExpenses: data.fixed_expenses.map((e: any) => ({
          id: e.id.toString(),
          name: e.name,
          amount: parseFloat(e.amount),
          category: e.category,
        })),
        isSetup: data.is_setup,
        lastProcessedDate: data.last_processed_date,
      };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

export const processMonthlyBudget = createAsyncThunk(
  "budget/processMonthly",
  async (_, { getState, dispatch, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const { monthlyIncome, fixedExpenses, lastProcessedDate } = state.budget;
      const { user, token } = state.auth;
      if (!token) throw new Error("No authentication token found");
      const userId = user?.id ? user.id.toString() : "0";

      const now = new Date();
      const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

      // If already processed this month, skip
      if (lastProcessedDate === currentMonthKey) {
        return null;
      }

      // Add Income
      await dispatch(
        addTransaction({
          amount: monthlyIncome,
          type: "income",
          description: "Ingreso Mensual Recurrente",
          category: "💰 Salario",
          date: Date.now(),
        }),
      ).unwrap();

      // Add Fixed Expenses
      for (const expense of fixedExpenses) {
        await dispatch(
          addTransaction({
            amount: expense.amount,
            type: "expense",
            description: expense.name,
            category: expense.category,
            date: Date.now(),
          }),
        ).unwrap();
      }

      // Update lastProcessedDate in Backend
      const response = await fetchWithAuth(
        endpoints.wallet.budget,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            last_processed_date: currentMonthKey,
          }),
        },
        dispatch as AppDispatch,
        getState as () => RootState,
      );

      if (!response.ok) {
        throw new Error("Failed to update last processed date");
      }

      return currentMonthKey;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

export const resetBudgetConfig = createAsyncThunk(
  "budget/resetConfig",
  async (_, { getState, dispatch, rejectWithValue }) => {
    try {
      const response = await fetchWithAuth(
        endpoints.wallet.budget,
        {
          method: "DELETE",
        },
        dispatch as AppDispatch,
        getState as () => RootState,
      );

      if (!response.ok) {
        throw new Error("Failed to reset budget");
      }

      return;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

const budgetSlice = createSlice({
  name: "budget",
  initialState,
  reducers: {
    setMonthlyIncome: (state, action: PayloadAction<number>) => {
      state.monthlyIncome = action.payload;
    },
    addFixedExpense: (state, action: PayloadAction<FixedExpense>) => {
      state.fixedExpenses.push(action.payload);
    },
    removeFixedExpense: (state, action: PayloadAction<string>) => {
      state.fixedExpenses = state.fixedExpenses.filter(
        (e) => e.id !== action.payload,
      );
    },
    resetBudget: (state) => {
      state.monthlyIncome = 0;
      state.fixedExpenses = [];
      state.isSetup = false;
      state.lastProcessedDate = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Save Config
      .addCase(saveBudgetConfig.pending, (state) => {
        state.loading = true;
      })
      .addCase(saveBudgetConfig.fulfilled, (state, action) => {
        state.loading = false;
        state.monthlyIncome = action.payload.monthlyIncome;
        state.fixedExpenses = action.payload.fixedExpenses;
        state.isSetup = true;
      })
      .addCase(saveBudgetConfig.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch Config
      .addCase(fetchBudgetConfig.fulfilled, (state, action) => {
        if (action.payload) {
          state.monthlyIncome = action.payload.monthlyIncome;
          state.fixedExpenses = action.payload.fixedExpenses || [];
          state.isSetup = action.payload.isSetup;
          state.lastProcessedDate = action.payload.lastProcessedDate || null;
        }
      })
      // Process Monthly
      .addCase(processMonthlyBudget.fulfilled, (state, action) => {
        if (action.payload) {
          state.lastProcessedDate = action.payload;
        }
      })
      // Reset Config
      .addCase(resetBudgetConfig.fulfilled, (state) => {
        state.monthlyIncome = 0;
        state.fixedExpenses = [];
        state.isSetup = false;
        state.lastProcessedDate = null;
      });
  },
});

export const {
  setMonthlyIncome,
  addFixedExpense,
  removeFixedExpense,
  resetBudget,
} = budgetSlice.actions;
export default budgetSlice.reducer;
