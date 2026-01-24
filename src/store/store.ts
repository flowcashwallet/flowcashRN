import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import visionReducer from "../features/vision/visionSlice";
import walletReducer from "../features/wallet/walletSlice";
import budgetReducer from "../features/budget/budgetSlice";

export const store = configureStore({
  reducer: {
    wallet: walletReducer,
    auth: authReducer,
    vision: visionReducer,
    budget: budgetReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
