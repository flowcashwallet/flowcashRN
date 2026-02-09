import { PayloadAction, createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthState {
  user: SerializedUser | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

// Serialized user type
interface SerializedUser {
  id: string;
  username: string;
  email: string | null;
  first_name?: string;
  last_name?: string;
}

export const logout = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userData');
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

// Thunk to load user from storage on app start
export const loadUserFromStorage = createAsyncThunk(
  "auth/loadUser",
  async (_, { rejectWithValue }) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const userStr = await AsyncStorage.getItem('userData');
      
      if (token && userStr) {
        return { token, user: JSON.parse(userStr) };
      }
      return null;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuthData: (state, action: PayloadAction<{ user: SerializedUser; token: string }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      
      // Persist to storage
      AsyncStorage.setItem('userToken', action.payload.token);
      AsyncStorage.setItem('userData', JSON.stringify(action.payload.user));
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
      state.token = null;
      state.isAuthenticated = false;
    });
    builder.addCase(loadUserFromStorage.fulfilled, (state, action) => {
      if (action.payload) {
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.isAuthenticated = true;
      }
    });
  },
});

export const { setAuthData, setLoading, setError } = authSlice.actions;
export default authSlice.reducer;
