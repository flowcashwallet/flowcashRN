import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type CategoryPickerTarget = "transactionForm" | "transactionFilter";

type CategoryPickerSelection = {
  target: CategoryPickerTarget;
  value: string | null;
};

type WalletUiState = {
  categoryPickerSelection: CategoryPickerSelection | null;
};

const initialState: WalletUiState = {
  categoryPickerSelection: null,
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
  },
});

export const { setCategoryPickerSelection, clearCategoryPickerSelection } =
  walletUiSlice.actions;

export default walletUiSlice.reducer;
