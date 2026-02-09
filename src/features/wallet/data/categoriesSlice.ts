import { fetchWithAuth } from "@/utils/apiClient";
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import STRINGS from "../../../i18n/es.json";
import { endpoints } from "../../../services/api";
import { AppDispatch, RootState } from "../../../store/store";

export interface Category {
  id: string;
  userId: string;
  name: string;
  createdAt: number;
}

interface CategoriesState {
  categories: Category[];
  loading: boolean;
  error: string | null;
}

const initialState: CategoriesState = {
  categories: [],
  loading: false,
  error: null,
};

// Initial default categories
const DEFAULT_CATEGORIES = STRINGS.wallet.categories;

export const fetchCategories = createAsyncThunk(
  "categories/fetchCategories",
  async (userId: string, { getState, rejectWithValue, dispatch }) => {
    try {
      console.log("Fetching categories from:", endpoints.wallet.categories);
      const response = await fetchWithAuth(
        endpoints.wallet.categories,
        {},
        dispatch as AppDispatch,
        getState as () => RootState,
      );

      if (!response.ok) {
        console.error("Fetch categories failed with status:", response.status);
        try {
          const errText = await response.text();
          console.error("Error body:", errText);
        } catch (e) {}
        throw new Error("Failed to fetch categories");
      }
      const data = await response.json();

      const categories: Category[] = data.map((cat: any) => ({
        id: cat.id.toString(),
        userId: userId,
        name: cat.name,
        createdAt: new Date(cat.created_at).getTime(),
      }));

      // If no categories found, seed defaults
      if (categories.length === 0) {
        // We dispatch the seed action but return empty array for now or optimized defaults
        // Better: seed and return the seeded items
        const seededCategories = await dispatch(
          seedDefaultCategories(userId),
        ).unwrap();
        return seededCategories;
      }

      // Sort by name
      categories.sort((a, b) => a.name.localeCompare(b.name));
      return categories;
    } catch (error: any) {
      console.error("Error fetching categories:", error);
      return rejectWithValue(error.message);
    }
  },
);

export const seedDefaultCategories = createAsyncThunk(
  "categories/seedDefaultCategories",
  async (userId: string, { getState, dispatch, rejectWithValue }) => {
    try {
      // Prepare data for batch create
      const categoriesToCreate = DEFAULT_CATEGORIES.map((name) => ({
        name: name,
      }));

      console.log(
        "Seeding categories to:",
        `${endpoints.wallet.categories}batch_create/`,
      );
      const response = await fetchWithAuth(
        `${endpoints.wallet.categories}batch_create/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(categoriesToCreate),
        },
        dispatch as AppDispatch,
        getState as () => RootState,
      );

      if (!response.ok) {
        console.error("Seed categories failed with status:", response.status);
        try {
          const errText = await response.text();
          console.error("Error body:", errText);
        } catch (e) {}
        throw new Error("Failed to seed categories");
      }
      const data = await response.json();

      const newCategories: Category[] = data.map((cat: any) => ({
        id: cat.id.toString(),
        userId: userId,
        name: cat.name,
        createdAt: new Date(cat.created_at).getTime(),
      }));

      newCategories.sort((a, b) => a.name.localeCompare(b.name));
      return newCategories;
    } catch (error: any) {
      console.error("Error seeding categories:", error);
      return rejectWithValue(error.message);
    }
  },
);

export const addCategory = createAsyncThunk(
  "categories/addCategory",
  async (
    { userId, name }: { userId: string; name: string },
    { getState, dispatch, rejectWithValue },
  ) => {
    try {
      console.log("Adding category to:", endpoints.wallet.categories);
      const response = await fetchWithAuth(
        endpoints.wallet.categories,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name }),
        },
        dispatch as AppDispatch,
        getState as () => RootState,
      );

      if (!response.ok) {
        console.error("Add category failed with status:", response.status);
        try {
          const errText = await response.text();
          console.error("Error body:", errText);
        } catch (e) {}
        throw new Error("Failed to add category");
      }
      const data = await response.json();

      const newCat: Category = {
        id: data.id.toString(),
        userId,
        name: data.name,
        createdAt: new Date(data.created_at).getTime(),
      };
      return newCat;
    } catch (error: any) {
      console.error("Error adding category:", error);
      return rejectWithValue(error.message);
    }
  },
);

export const updateCategory = createAsyncThunk(
  "categories/updateCategory",
  async (
    { id, name }: { id: string; name: string },
    { getState, dispatch, rejectWithValue },
  ) => {
    try {
      const response = await fetchWithAuth(
        `${endpoints.wallet.categories}${id}/`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name }),
        },
        dispatch as AppDispatch,
        getState as () => RootState,
      );

      if (!response.ok) throw new Error("Failed to update category");

      return { id, name };
    } catch (error: any) {
      console.error("Error updating category:", error);
      return rejectWithValue(error.message);
    }
  },
);

export const deleteCategory = createAsyncThunk(
  "categories/deleteCategory",
  async (id: string, { getState, dispatch, rejectWithValue }) => {
    try {
      const response = await fetchWithAuth(
        `${endpoints.wallet.categories}${id}/`,
        {
          method: "DELETE",
        },
        dispatch as AppDispatch,
        getState as () => RootState,
      );

      if (!response.ok) throw new Error("Failed to delete category");

      return id;
    } catch (error: any) {
      console.error("Error deleting category:", error);
      return rejectWithValue(error.message);
    }
  },
);

const categoriesSlice = createSlice({
  name: "categories",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchCategories.fulfilled,
        (state, action: PayloadAction<Category[]>) => {
          state.loading = false;
          state.categories = action.payload;
        },
      )
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Seed (handled by fetch usually, but just in case called directly)
      .addCase(
        seedDefaultCategories.fulfilled,
        (state, action: PayloadAction<Category[]>) => {
          state.categories = action.payload;
        },
      )
      // Add
      .addCase(
        addCategory.fulfilled,
        (state, action: PayloadAction<Category>) => {
          state.categories.push(action.payload);
          state.categories.sort((a, b) => a.name.localeCompare(b.name));
        },
      )
      // Update
      .addCase(
        updateCategory.fulfilled,
        (state, action: PayloadAction<{ id: string; name: string }>) => {
          const index = state.categories.findIndex(
            (c) => c.id === action.payload.id,
          );
          if (index !== -1) {
            state.categories[index].name = action.payload.name;
            state.categories.sort((a, b) => a.name.localeCompare(b.name));
          }
        },
      )
      // Delete
      .addCase(
        deleteCategory.fulfilled,
        (state, action: PayloadAction<string>) => {
          state.categories = state.categories.filter(
            (c) => c.id !== action.payload,
          );
        },
      );
  },
});

export default categoriesSlice.reducer;
