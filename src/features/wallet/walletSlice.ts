import { PayloadAction, createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../../services/firebaseConfig";

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  type: "income" | "expense";
  description: string;
  category?: string; // e.g. "🍔 Comida"
  date: number; // timestamp
}

interface WalletState {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
}

const initialState: WalletState = {
  transactions: [],
  loading: false,
  error: null,
};

// Async thunks
export const fetchTransactions = createAsyncThunk(
  "wallet/fetchTransactions",
  async (userId: string, { rejectWithValue }) => {
    try {
      console.log("Fetching transactions for user:", userId);
      // Simple query first to avoid index issues, sort in memory
      const q = query(
        collection(db, "transactions"),
        where("userId", "==", userId),
      );
      const querySnapshot = await getDocs(q);
      const transactions: Transaction[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        transactions.push({
          id: doc.id,
          userId: data.userId,
          amount: data.amount,
          type: data.type,
          description: data.description,
          category: data.category,
          date: data.date,
        });
      });
      // Sort desc by date
      transactions.sort((a, b) => b.date - a.date);
      console.log("Fetched transactions count:", transactions.length);
      return transactions;
    } catch (error: any) {
      console.error("Error fetching transactions:", error);
      return rejectWithValue(error.message);
    }
  },
);

export const addTransaction = createAsyncThunk(
  "wallet/addTransaction",
  async (transaction: Omit<Transaction, "id">, { rejectWithValue }) => {
    try {
      const docRef = await addDoc(collection(db, "transactions"), transaction);
      return { ...transaction, id: docRef.id };
    } catch (error: any) {
      console.error("Error adding transaction:", error);
      return rejectWithValue(error.message);
    }
  },
);

export const deleteTransaction = createAsyncThunk(
  "wallet/deleteTransaction",
  async (transactionId: string, { rejectWithValue }) => {
    try {
      await deleteDoc(doc(db, "transactions", transactionId));
      return transactionId;
    } catch (error: any) {
      console.error("Error deleting transaction:", error);
      return rejectWithValue(error.message);
    }
  },
);

export const updateTransaction = createAsyncThunk(
  "wallet/updateTransaction",
  async (
    { id, updates }: { id: string; updates: Partial<Omit<Transaction, "id">> },
    { rejectWithValue },
  ) => {
    try {
      await updateDoc(doc(db, "transactions", id), updates);
      return { id, updates };
    } catch (error: any) {
      console.error("Error updating transaction:", error);
      return rejectWithValue(error.message);
    }
  },
);

const walletSlice = createSlice({
  name: "wallet",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchTransactions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchTransactions.fulfilled,
        (state, action: PayloadAction<Transaction[]>) => {
          state.loading = false;
          state.transactions = action.payload;
        },
      )
      .addCase(fetchTransactions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Add
      .addCase(
        addTransaction.fulfilled,
        (state, action: PayloadAction<Transaction>) => {
          state.transactions.unshift(action.payload);
        },
      )
      // Delete
      .addCase(
        deleteTransaction.fulfilled,
        (state, action: PayloadAction<string>) => {
          state.transactions = state.transactions.filter(
            (t) => t.id !== action.payload,
          );
        },
      )
      // Update
      .addCase(
        updateTransaction.fulfilled,
        (state, action: PayloadAction<{ id: string; updates: any }>) => {
          const index = state.transactions.findIndex(
            (t) => t.id === action.payload.id,
          );
          if (index !== -1) {
            state.transactions[index] = {
              ...state.transactions[index],
              ...action.payload.updates,
            };
          }
        },
      );
  },
});

export default walletSlice.reducer;
