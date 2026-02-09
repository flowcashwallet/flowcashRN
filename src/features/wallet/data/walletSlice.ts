import { PayloadAction, createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { endpoints, getAuthHeaders } from "../../../services/api";
import { RootState } from "../../../store/store";

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  type: "income" | "expense" | "transfer";
  description: string;
  category?: string | null; // e.g. "🍔 Comida"
  relatedEntityId?: string | null; // ID of the Asset or Liability (Source for Transfer)
  transferRelatedEntityId?: string | null; // ID of the Destination Entity for Transfer
  date: number; // timestamp
  paymentType?:
    | "credit_card"
    | "debit_card"
    | "cash"
    | "transfer"
    | "payroll"
    | null;
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
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token;
      if (!token) throw new Error("No authentication token found");

      console.log("Fetching transactions from API...");
      const response = await fetch(endpoints.wallet.transactions, {
        headers: getAuthHeaders(token),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch transactions");
      }

      const data = await response.json();

      const transactions: Transaction[] = data.map((tx: any) => ({
        id: tx.id.toString(),
        userId: (state.auth.user as any)?.id || "0", // Fallback
        amount: parseFloat(tx.amount),
        type: tx.type,
        description: tx.description,
        category: tx.category,
        relatedEntityId: tx.related_entity_id,
        transferRelatedEntityId: tx.transfer_related_entity_id,
        date: new Date(tx.date).getTime(),
        paymentType: tx.payment_type,
      }));

      // Sort desc by date (already sorted by backend but good to ensure)
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
  async (
    transaction: Omit<Transaction, "id" | "userId">,
    { getState, rejectWithValue },
  ) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token;
      if (!token) throw new Error("No authentication token found");

      // Map frontend to backend
      const payload = {
        amount: transaction.amount,
        type: transaction.type,
        description: transaction.description,
        category: transaction.category,
        related_entity_id: transaction.relatedEntityId,
        transfer_related_entity_id: transaction.transferRelatedEntityId,
        date: new Date(transaction.date).toISOString(),
        payment_type: transaction.paymentType,
      };

      const response = await fetch(endpoints.wallet.transactions, {
        method: "POST",
        headers: getAuthHeaders(token),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(JSON.stringify(err));
      }

      const tx = await response.json();

      // Map back to frontend
      return {
        id: tx.id.toString(),
        userId: (state.auth.user as any)?.id || "0",
        amount: parseFloat(tx.amount),
        type: tx.type,
        description: tx.description,
        category: tx.category,
        relatedEntityId: tx.related_entity_id,
        transferRelatedEntityId: tx.transfer_related_entity_id,
        date: new Date(tx.date).getTime(),
        paymentType: tx.payment_type,
      };
    } catch (error: any) {
      console.error("Error adding transaction:", error);
      return rejectWithValue(error.message);
    }
  },
);

export const deleteTransaction = createAsyncThunk(
  "wallet/deleteTransaction",
  async (transactionId: string, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token;
      if (!token) throw new Error("No authentication token found");

      const response = await fetch(
        `${endpoints.wallet.transactions}${transactionId}/`,
        {
          method: "DELETE",
          headers: getAuthHeaders(token),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to delete transaction");
      }

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
    { getState, rejectWithValue },
  ) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token;
      if (!token) throw new Error("No authentication token found");

      // Map updates to backend format
      const payload: any = {};
      if (updates.amount !== undefined) payload.amount = updates.amount;
      if (updates.type !== undefined) payload.type = updates.type;
      if (updates.description !== undefined)
        payload.description = updates.description;
      if (updates.category !== undefined) payload.category = updates.category;
      if (updates.relatedEntityId !== undefined)
        payload.related_entity_id = updates.relatedEntityId;
      if (updates.transferRelatedEntityId !== undefined)
        payload.transfer_related_entity_id = updates.transferRelatedEntityId;
      const response = await fetch(`${endpoints.wallet.transactions}${id}/`, {
        method: "PATCH",
        headers: getAuthHeaders(token),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to update transaction");
      }

      return { id, updates };
    } catch (error: any) {
      console.error("Error updating transaction:", error);
      return rejectWithValue(error.message);
    }
  },
);

export const deleteMultipleTransactions = createAsyncThunk(
  "wallet/deleteMultipleTransactions",
  async (transactionIds: string[], { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token;
      if (!token) throw new Error("No authentication token found");

      // Execute deletes in parallel
      await Promise.all(
        transactionIds.map((id) =>
          fetch(`${endpoints.wallet.transactions}${id}/`, {
            method: "DELETE",
            headers: getAuthHeaders(token),
          }).then((res) => {
            if (!res.ok) throw new Error(`Failed to delete transaction ${id}`);
            return res;
          }),
        ),
      );

      return transactionIds;
    } catch (error: any) {
      console.error("Error deleting multiple transactions:", error);
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
      .addCase(
        addTransaction.fulfilled,
        (state, action: PayloadAction<Transaction>) => {
          state.transactions.unshift(action.payload);
          // Keep sorted
          state.transactions.sort((a, b) => b.date - a.date);
        },
      )
      .addCase(
        deleteTransaction.fulfilled,
        (state, action: PayloadAction<string>) => {
          state.transactions = state.transactions.filter(
            (t) => t.id !== action.payload,
          );
        },
      )
      .addCase(
        updateTransaction.fulfilled,
        (
          state,
          action: PayloadAction<{
            id: string;
            updates: Partial<Omit<Transaction, "id">>;
          }>,
        ) => {
          const index = state.transactions.findIndex(
            (t) => t.id === action.payload.id,
          );
          if (index !== -1) {
            state.transactions[index] = {
              ...state.transactions[index],
              ...action.payload.updates,
            };
            // Keep sorted if date changed
            if (action.payload.updates.date) {
              state.transactions.sort((a, b) => b.date - a.date);
            }
          }
        },
      )
      .addCase(
        deleteMultipleTransactions.fulfilled,
        (state, action: PayloadAction<string[]>) => {
          state.transactions = state.transactions.filter(
            (t) => !action.payload.includes(t.id),
          );
        },
      );
  },
});

export default walletSlice.reducer;
