import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { collection, addDoc, getDocs, query, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../../services/firebaseConfig';

export interface Transaction {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  description: string;
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
  'wallet/fetchTransactions',
  async (_, { rejectWithValue }) => {
    try {
      const q = query(collection(db, 'transactions'), orderBy('date', 'desc'));
      const querySnapshot = await getDocs(q);
      const transactions: Transaction[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        transactions.push({
          id: doc.id,
          amount: data.amount,
          type: data.type,
          description: data.description,
          date: data.date, // Assuming stored as number or convert from Timestamp
        });
      });
      return transactions;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const addTransaction = createAsyncThunk(
  'wallet/addTransaction',
  async (transaction: Omit<Transaction, 'id'>, { rejectWithValue }) => {
    try {
      const docRef = await addDoc(collection(db, 'transactions'), transaction);
      return { ...transaction, id: docRef.id };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTransactions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTransactions.fulfilled, (state, action: PayloadAction<Transaction[]>) => {
        state.loading = false;
        state.transactions = action.payload;
      })
      .addCase(fetchTransactions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(addTransaction.fulfilled, (state, action: PayloadAction<Transaction>) => {
        state.transactions.unshift(action.payload);
      });
  },
});

export default walletSlice.reducer;
