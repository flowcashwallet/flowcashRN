import { PayloadAction, createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { User, signOut } from "firebase/auth";
import { auth } from "../../services/firebaseConfig";

interface AuthState {
  user: User | null; // Note: User object is not serializable, typically we store only necessary fields
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

// Serialized user type to avoid Redux non-serializable error
interface SerializedUser {
  uid: string;
  email: string | null;
}

export const logout = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      await signOut(auth);
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<SerializedUser | null>) => {
      // @ts-ignore: simplified for demo, in real app map fields properly
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(logout.fulfilled, (state) => {
      state.user = null;
      state.isAuthenticated = false;
    });
  },
});

export const { setUser, setLoading, setError } = authSlice.actions;
export default authSlice.reducer;
