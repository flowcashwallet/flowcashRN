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
import { db } from "../../services/firebaseConfig";

export interface VisionEntity {
  id: string;
  userId: string;
  name: string;
  description?: string;
  amount: number; // Manual valuation or Calculated Fiat Value
  type: "asset" | "liability";
  createdAt: number;
  isCrypto?: boolean;
  cryptoSymbol?: string;
  cryptoAmount?: number;
}

interface VisionState {
  entities: VisionEntity[];
  loading: boolean;
  error: string | null;
}

const initialState: VisionState = {
  entities: [],
  loading: false,
  error: null,
};

export const fetchVisionEntities = createAsyncThunk(
  "vision/fetchEntities",
  async (userId: string, { rejectWithValue }) => {
    try {
      const q = query(collection(db, "vision"), where("userId", "==", userId));
      const querySnapshot = await getDocs(q);
      const entities: VisionEntity[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        entities.push({
          id: doc.id,
          userId: data.userId,
          name: data.name,
          description: data.description,
          amount: data.amount || 0,
          type: data.type,
          createdAt: data.createdAt,
          isCrypto: data.isCrypto,
          cryptoSymbol: data.cryptoSymbol,
          cryptoAmount: data.cryptoAmount,
        });
      });
      return entities;
    } catch (error: any) {
      console.error("Error fetching vision entities:", error);
      return rejectWithValue(error.message);
    }
  },
);

export const addVisionEntity = createAsyncThunk(
  "vision/addEntity",
  async (entity: Omit<VisionEntity, "id">, { rejectWithValue }) => {
    try {
      const docRef = await addDoc(collection(db, "vision"), entity);
      return { ...entity, id: docRef.id };
    } catch (error: any) {
      console.error("Error adding vision entity:", error);
      return rejectWithValue(error.message);
    }
  },
);

export const deleteVisionEntity = createAsyncThunk(
  "vision/deleteEntity",
  async (entityId: string, { rejectWithValue }) => {
    try {
      await deleteDoc(doc(db, "vision", entityId));
      return entityId;
    } catch (error: any) {
      console.error("Error deleting vision entity:", error);
      return rejectWithValue(error.message);
    }
  },
);

export const updateVisionEntity = createAsyncThunk(
  "vision/updateEntity",
  async (entity: VisionEntity, { rejectWithValue }) => {
    try {
      const { id, ...data } = entity;
      await updateDoc(doc(db, "vision", id), data as any);
      return entity;
    } catch (error: any) {
      console.error("Error updating vision entity:", error);
      return rejectWithValue(error.message);
    }
  },
);

const visionSlice = createSlice({
  name: "vision",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchVisionEntities.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVisionEntities.fulfilled, (state, action) => {
        state.loading = false;
        state.entities = action.payload;
      })
      .addCase(fetchVisionEntities.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Add
      .addCase(addVisionEntity.fulfilled, (state, action) => {
        state.entities.push(action.payload);
      })
      // Delete
      .addCase(deleteVisionEntity.fulfilled, (state, action) => {
        state.entities = state.entities.filter((e) => e.id !== action.payload);
      })
      // Update
      .addCase(updateVisionEntity.fulfilled, (state, action) => {
        const index = state.entities.findIndex(
          (e) => e.id === action.payload.id,
        );
        if (index !== -1) {
          state.entities[index] = action.payload;
        }
      });
  },
});

export default visionSlice.reducer;
