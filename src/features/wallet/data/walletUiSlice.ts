import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type CategoryPickerTarget = "transactionForm" | "transactionFilter";

type CategoryPickerSelection = {
  target: CategoryPickerTarget;
  value: string | null;
};

type WalletUiState = {
  categoryPickerSelection: CategoryPickerSelection | null;
  selectedMonthTimestamp: number;
  periodView: "month" | "year";
};

const initialState: WalletUiState = {
  categoryPickerSelection: null,
  selectedMonthTimestamp: new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1,
  ).getTime(),
  periodView: "month",
};

const walletUiSlice = createSlice({
  name: "walletUi",
  initialState,
  reducers: {
    setCategoryPickerSelection: (
      state,
      action: PayloadAction<CategoryPickerSelection>,
    ) => {
      state.categoryPickerSelection = action.payload;
    },
    clearCategoryPickerSelection: (state) => {
      state.categoryPickerSelection = null;
    },
    setSelectedMonthTimestamp: (state, action: PayloadAction<number>) => {
      state.selectedMonthTimestamp = action.payload;
    },
    setPeriodView: (state, action: PayloadAction<"month" | "year">) => {
      state.periodView = action.payload;
    },
  },
});

export const { setCategoryPickerSelection, clearCategoryPickerSelection } =
  walletUiSlice.actions;

export const { setSelectedMonthTimestamp } = walletUiSlice.actions;
export const { setPeriodView } = walletUiSlice.actions;

export default walletUiSlice.reducer;
