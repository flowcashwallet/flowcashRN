import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
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
import { db } from "../../../services/firebaseConfig";
import { RootState } from "../../../store/store";
import { updateVisionEntity } from "../../vision/data/visionSlice";
import { addTransaction } from "./walletSlice";

export interface Subscription {
  id: string;
  userId: string;
  name: string;
  amount: number;
  category: string;
  frequency: "weekly" | "monthly" | "yearly";
  nextPaymentDate: number; // timestamp
  relatedEntityId?: string; // Source wallet/account ID
  reminderEnabled: boolean;
  description?: string;
  icon?: string;
}

export interface SubscriptionState {
  subscriptions: Subscription[];
  loading: boolean;
  error: string | null;
}

const initialState: SubscriptionState = {
  subscriptions: [],
  loading: false,
  error: null,
};

export const fetchSubscriptions = createAsyncThunk(
  "subscriptions/fetch",
  async (userId: string, { rejectWithValue }) => {
    try {
      const q = query(
        collection(db, "subscriptions"),
        where("userId", "==", userId),
      );
      const querySnapshot = await getDocs(q);
      const subscriptions: Subscription[] = [];
      querySnapshot.forEach((doc) => {
        subscriptions.push({ id: doc.id, ...doc.data() } as Subscription);
      });
      return subscriptions;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

export const addSubscription = createAsyncThunk(
  "subscriptions/add",
  async (subscription: Omit<Subscription, "id">, { rejectWithValue }) => {
    try {
      const docRef = await addDoc(
        collection(db, "subscriptions"),
        subscription,
      );
      return { id: docRef.id, ...subscription };
    } catch (error: any) {
      console.error("Error adding subscription:", error);
      return rejectWithValue(error.message);
    }
  },
);

export const updateSubscription = createAsyncThunk(
  "subscriptions/update",
  async (subscription: Subscription, { rejectWithValue }) => {
    try {
      const docRef = doc(db, "subscriptions", subscription.id);
      await updateDoc(docRef, { ...subscription });
      return subscription;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

export const deleteSubscription = createAsyncThunk(
  "subscriptions/delete",
  async (id: string, { rejectWithValue }) => {
    try {
      await deleteDoc(doc(db, "subscriptions", id));
      return id;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

export const processDueSubscriptions = createAsyncThunk(
  "subscriptions/processDue",
  async (_, { getState, dispatch, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const { subscriptions } = state.subscriptions;
      const { user } = state.auth;
      const { entities } = state.vision;

      if (!user?.uid) return;

      const now = new Date();
      const dueSubscriptions = subscriptions.filter((sub) => {
        const subDate = new Date(sub.nextPaymentDate);
        // Process if strictly in the past OR if it falls on the same calendar day (Today)
        const isPast = sub.nextPaymentDate <= now.getTime();
        const isToday =
          subDate.getDate() === now.getDate() &&
          subDate.getMonth() === now.getMonth() &&
          subDate.getFullYear() === now.getFullYear();

        return isPast || isToday;
      });

      for (const sub of dueSubscriptions) {
        // 1. Create Transaction
        const transactionData = {
          userId: user.uid,
          amount: sub.amount,
          type: "expense" as const,
          description: `Suscripción: ${sub.name}`,
          category: sub.category,
          relatedEntityId: sub.relatedEntityId || null,
          transferRelatedEntityId: null,
          date: now.getTime(),
          paymentType: "debit_card" as const, // Default
        };
        await dispatch(addTransaction(transactionData));

        // 2. Update Vision Entity Balance (if applicable)
        if (sub.relatedEntityId) {
          const entity = entities.find((e) => e.id === sub.relatedEntityId);
          if (entity) {
            const newAmount =
              entity.type === "asset"
                ? entity.amount - sub.amount
                : entity.amount + sub.amount; // Liability increases
            await dispatch(
              updateVisionEntity({ ...entity, amount: newAmount }),
            );
          }
        }

        // 3. Update Next Payment Date
        const nextDate = new Date(sub.nextPaymentDate);
        if (sub.frequency === "weekly")
          nextDate.setDate(nextDate.getDate() + 7);
        if (sub.frequency === "monthly")
          nextDate.setMonth(nextDate.getMonth() + 1);
        if (sub.frequency === "yearly")
          nextDate.setFullYear(nextDate.getFullYear() + 1);

        // Update Subscription
        await dispatch(
          updateSubscription({ ...sub, nextPaymentDate: nextDate.getTime() }),
        );
      }
      return dueSubscriptions.length;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

const subscriptionSlice = createSlice({
  name: "subscriptions",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchSubscriptions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSubscriptions.fulfilled, (state, action) => {
        state.loading = false;
        state.subscriptions = action.payload;
      })
      .addCase(fetchSubscriptions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Add
      .addCase(addSubscription.fulfilled, (state, action) => {
        state.subscriptions.push(action.payload);
      })
      // Update
      .addCase(updateSubscription.fulfilled, (state, action) => {
        const index = state.subscriptions.findIndex(
          (s) => s.id === action.payload.id,
        );
        if (index !== -1) {
          state.subscriptions[index] = action.payload;
        }
      })
      // Delete
      .addCase(deleteSubscription.fulfilled, (state, action) => {
        state.subscriptions = state.subscriptions.filter(
          (s) => s.id !== action.payload,
        );
      });
  },
});

export default subscriptionSlice.reducer;
