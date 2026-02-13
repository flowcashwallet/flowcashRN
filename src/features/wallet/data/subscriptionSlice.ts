import { fetchWithAuth } from "@/utils/apiClient";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { endpoints } from "../../../services/api";
import { AppDispatch, RootState } from "../../../store/store";
import { fetchVisionEntities } from "../../vision/data/visionSlice";
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
  async (userId: string, { getState, dispatch, rejectWithValue }) => {
    try {
      const response = await fetchWithAuth(
        endpoints.wallet.subscriptions,
        {},
        dispatch as AppDispatch,
        getState as () => RootState,
      );

      if (!response.ok) throw new Error("Failed to fetch subscriptions");
      const data = await response.json();

      const subscriptions: Subscription[] = data.map((sub: any) => ({
        id: sub.id.toString(),
        userId: userId,
        name: sub.name,
        amount: parseFloat(sub.amount),
        category: sub.category,
        frequency: sub.frequency,
        nextPaymentDate: new Date(sub.next_payment_date).getTime(),
        relatedEntityId: sub.related_entity_id,
        reminderEnabled: sub.reminder_enabled,
        description: sub.description,
        icon: sub.icon,
      }));
      return subscriptions;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

export const addSubscription = createAsyncThunk(
  "subscriptions/add",
  async (
    subscription: Omit<Subscription, "id">,
    { getState, dispatch, rejectWithValue },
  ) => {
    try {
      const backendSub = {
        name: subscription.name,
        amount: subscription.amount,
        category: subscription.category,
        frequency: subscription.frequency,
        next_payment_date: new Date(subscription.nextPaymentDate).toISOString(),
        related_entity_id: subscription.relatedEntityId,
        reminder_enabled: subscription.reminderEnabled,
        description: subscription.description,
        icon: subscription.icon,
      };

      const response = await fetchWithAuth(
        endpoints.wallet.subscriptions,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(backendSub),
        },
        dispatch as AppDispatch,
        getState as () => RootState,
      );

      if (!response.ok) throw new Error("Failed to add subscription");
      const data = await response.json();

      return {
        ...subscription,
        id: data.id.toString(),
      };
    } catch (error: any) {
      console.error("Error adding subscription:", error);
      return rejectWithValue(error.message);
    }
  },
);

export const updateSubscription = createAsyncThunk(
  "subscriptions/update",
  async (
    subscription: Subscription,
    { getState, dispatch, rejectWithValue },
  ) => {
    try {
      const backendSub = {
        name: subscription.name,
        amount: subscription.amount,
        category: subscription.category,
        frequency: subscription.frequency,
        next_payment_date: new Date(subscription.nextPaymentDate).toISOString(),
        related_entity_id: subscription.relatedEntityId,
        reminder_enabled: subscription.reminderEnabled,
        description: subscription.description,
        icon: subscription.icon,
      };

      const response = await fetchWithAuth(
        `${endpoints.wallet.subscriptions}${subscription.id}/`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(backendSub),
        },
        dispatch as AppDispatch,
        getState as () => RootState,
      );

      if (!response.ok) throw new Error("Failed to update subscription");

      return subscription;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

export const deleteSubscription = createAsyncThunk(
  "subscriptions/delete",
  async (id: string, { getState, dispatch, rejectWithValue }) => {
    try {
      const response = await fetchWithAuth(
        `${endpoints.wallet.subscriptions}${id}/`,
        {
          method: "DELETE",
        },
        dispatch as AppDispatch,
        getState as () => RootState,
      );

      if (!response.ok) throw new Error("Failed to delete subscription");

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

      if (!(user as any)?.id) return;

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
          userId: (user as any).id,
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

      if (dueSubscriptions.length > 0) {
        dispatch(fetchVisionEntities());
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
