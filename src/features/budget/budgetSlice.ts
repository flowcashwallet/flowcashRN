import { PayloadAction, createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { deleteDoc, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../../services/firebaseConfig";
import { RootState } from "../../store/store";
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
      userId,
      monthlyIncome,
      fixedExpenses,
    }: { userId: string; monthlyIncome: number; fixedExpenses: FixedExpense[] },
    { rejectWithValue },
  ) => {
    try {
      const budgetRef = doc(db, "budgets", userId);
      await setDoc(
        budgetRef,
        {
          monthlyIncome,
          fixedExpenses,
          isSetup: true,
        },
        { merge: true },
      ); // Merge to avoid overwriting lastProcessedDate if it exists
      return { monthlyIncome, fixedExpenses };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

export const fetchBudgetConfig = createAsyncThunk(
  "budget/fetchConfig",
  async (userId: string, { rejectWithValue }) => {
    try {
      const budgetRef = doc(db, "budgets", userId);
      const docSnap = await getDoc(budgetRef);
      if (docSnap.exists()) {
        return docSnap.data();
      } else {
        return null;
      }
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

export const processMonthlyBudget = createAsyncThunk(
  "budget/processMonthly",
  async (userId: string, { getState, dispatch, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const { monthlyIncome, fixedExpenses, lastProcessedDate } = state.budget;

      const now = new Date();
      const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

      // If already processed this month, skip
      if (lastProcessedDate === currentMonthKey) {
        return null;
      }

      // Add Income
      await dispatch(
        addTransaction({
          userId,
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
            userId,
            amount: expense.amount,
            type: "expense",
            description: expense.name,
            category: expense.category,
            date: Date.now(),
          }),
        ).unwrap();
      }

      // Update lastProcessedDate in Firestore
      const budgetRef = doc(db, "budgets", userId);
      await updateDoc(budgetRef, {
        lastProcessedDate: currentMonthKey,
      });

      return currentMonthKey;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

export const resetBudgetConfig = createAsyncThunk(
  "budget/resetConfig",
  async (userId: string, { rejectWithValue }) => {
    try {
      const budgetRef = doc(db, "budgets", userId);
      await deleteDoc(budgetRef);
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
