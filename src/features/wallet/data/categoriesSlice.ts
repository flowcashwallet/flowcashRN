import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "../../../services/firebaseConfig";
import STRINGS from "../../../i18n/es.json";

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
  async (userId: string, { rejectWithValue, dispatch }) => {
    try {
      const q = query(
        collection(db, "categories"),
        where("userId", "==", userId)
      );
      const querySnapshot = await getDocs(q);
      const categories: Category[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        categories.push({
          id: doc.id,
          userId: data.userId,
          name: data.name,
          createdAt: data.createdAt,
        });
      });

      // If no categories found, seed defaults
      if (categories.length === 0) {
        // We dispatch the seed action but return empty array for now or optimized defaults
        // Better: seed and return the seeded items
        const seededCategories = await dispatch(seedDefaultCategories(userId)).unwrap();
        return seededCategories;
      }

      // Sort by name
      categories.sort((a, b) => a.name.localeCompare(b.name));
      return categories;
    } catch (error: any) {
      console.error("Error fetching categories:", error);
      return rejectWithValue(error.message);
    }
  }
);

export const seedDefaultCategories = createAsyncThunk(
  "categories/seedDefaultCategories",
  async (userId: string, { rejectWithValue }) => {
    try {
      const batch = writeBatch(db);
      const newCategories: Category[] = [];
      const timestamp = Date.now();

      DEFAULT_CATEGORIES.forEach((catName) => {
        const docRef = doc(collection(db, "categories"));
        const newCat = {
          userId,
          name: catName,
          createdAt: timestamp,
        };
        batch.set(docRef, newCat);
        newCategories.push({ ...newCat, id: docRef.id });
      });

      await batch.commit();
      newCategories.sort((a, b) => a.name.localeCompare(b.name));
      return newCategories;
    } catch (error: any) {
      console.error("Error seeding categories:", error);
      return rejectWithValue(error.message);
    }
  }
);

export const addCategory = createAsyncThunk(
  "categories/addCategory",
  async (
    { userId, name }: { userId: string; name: string },
    { rejectWithValue }
  ) => {
    try {
      const newCat = {
        userId,
        name,
        createdAt: Date.now(),
      };
      const docRef = await addDoc(collection(db, "categories"), newCat);
      return { ...newCat, id: docRef.id };
    } catch (error: any) {
      console.error("Error adding category:", error);
      return rejectWithValue(error.message);
    }
  }
);

export const updateCategory = createAsyncThunk(
  "categories/updateCategory",
  async (
    { id, name }: { id: string; name: string },
    { rejectWithValue }
  ) => {
    try {
      await updateDoc(doc(db, "categories", id), { name });
      return { id, name };
    } catch (error: any) {
      console.error("Error updating category:", error);
      return rejectWithValue(error.message);
    }
  }
);

export const deleteCategory = createAsyncThunk(
  "categories/deleteCategory",
  async (id: string, { rejectWithValue }) => {
    try {
      await deleteDoc(doc(db, "categories", id));
      return id;
    } catch (error: any) {
      console.error("Error deleting category:", error);
      return rejectWithValue(error.message);
    }
  }
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
        }
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
        }
      )
      // Add
      .addCase(
        addCategory.fulfilled,
        (state, action: PayloadAction<Category>) => {
          state.categories.push(action.payload);
          state.categories.sort((a, b) => a.name.localeCompare(b.name));
        }
      )
      // Update
      .addCase(
        updateCategory.fulfilled,
        (state, action: PayloadAction<{ id: string; name: string }>) => {
          const index = state.categories.findIndex(
            (c) => c.id === action.payload.id
          );
          if (index !== -1) {
            state.categories[index].name = action.payload.name;
            state.categories.sort((a, b) => a.name.localeCompare(b.name));
          }
        }
      )
      // Delete
      .addCase(
        deleteCategory.fulfilled,
        (state, action: PayloadAction<string>) => {
          state.categories = state.categories.filter(
            (c) => c.id !== action.payload
          );
        }
      );
  },
});

export default categoriesSlice.reducer;
