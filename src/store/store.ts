import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import budgetReducer from "../features/budget/budgetSlice";
import visionReducer from "../features/vision/data/visionSlice";
import categoriesReducer from "../features/wallet/data/categoriesSlice";
import gamificationReducer from "../features/wallet/data/gamificationSlice";
import walletReducer from "../features/wallet/data/walletSlice";

export const store = configureStore({
  reducer: {
    wallet: walletReducer,
    categories: categoriesReducer,
    auth: authReducer,
    vision: visionReducer,
    budget: budgetReducer,
    gamification: gamificationReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
