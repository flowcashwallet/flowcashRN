import { endpoints } from "@/services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { PayloadAction, createAsyncThunk, createSlice } from "@reduxjs/toolkit";

interface AuthState {
  user: SerializedUser | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
  refreshToken: null,
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
      await AsyncStorage.removeItem("userToken");
      await AsyncStorage.removeItem("refreshToken");
      await AsyncStorage.removeItem("userData");
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
      const token = await AsyncStorage.getItem("userToken");
      const refreshToken = await AsyncStorage.getItem("refreshToken");
      const userStr = await AsyncStorage.getItem("userData");

      if (token && userStr) {
        return { token, refreshToken, user: JSON.parse(userStr) };
      }
      return null;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

export const refreshToken = createAsyncThunk(
  "auth/refreshToken",
  async (_, { getState, dispatch, rejectWithValue }) => {
    try {
      const state = getState() as { auth: AuthState };
      const currentRefreshToken = state.auth.refreshToken;

      if (!currentRefreshToken) {
        throw new Error("No refresh token available");
      }

      const response = await fetch(endpoints.auth.refresh, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          refresh: currentRefreshToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // If refresh fails, logout user
        dispatch(logout());
        throw new Error("Session expired");
      }

      return data.access;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuthData: (
      state,
      action: PayloadAction<{
        user: SerializedUser;
        token: string;
        refreshToken?: string;
      }>,
    ) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      if (action.payload.refreshToken) {
        state.refreshToken = action.payload.refreshToken;
        AsyncStorage.setItem("refreshToken", action.payload.refreshToken);
      }
      state.isAuthenticated = true;

      // Persist to storage
      AsyncStorage.setItem("userToken", action.payload.token);
      AsyncStorage.setItem("userData", JSON.stringify(action.payload.user));
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
      state.refreshToken = null;
      state.isAuthenticated = false;
    });
    builder.addCase(loadUserFromStorage.fulfilled, (state, action) => {
      if (action.payload) {
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken || null;
        state.user = action.payload.user;
        state.isAuthenticated = true;
      }
    });
    builder.addCase(refreshToken.fulfilled, (state, action) => {
      state.token = action.payload;
      AsyncStorage.setItem("userToken", action.payload);
    });
  },
});

export const { setAuthData, setLoading, setError } = authSlice.actions;
export default authSlice.reducer;
