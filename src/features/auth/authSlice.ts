import { endpoints } from "@/services/api";
import {
  KEY_ACCESS_TOKEN,
  KEY_REFRESH_TOKEN,
  getBiometricsEnabled,
  getToken,
  getUserData,
  removeToken,
  removeUserData,
  saveToken,
  saveUserData,
  setBiometricsEnabled,
} from "@/utils/secureStore";
import { PayloadAction, createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import * as LocalAuthentication from "expo-local-authentication";

// Serialized user type
interface SerializedUser {
  id: string;
  username: string;
  email: string | null;
  first_name?: string;
  last_name?: string;
}

interface AuthState {
  user: SerializedUser | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  biometricRequired: boolean; // New state for biometric check
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  biometricRequired: false,
  loading: false,
  error: null,
};

export const logout = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      await removeToken(KEY_ACCESS_TOKEN);
      await removeToken(KEY_REFRESH_TOKEN);
      await removeUserData();
      // Optional: Don't clear biometric preference on logout? Or maybe yes?
      // Usually biometric preference is per device/app, not per session.
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
      const token = await getToken(KEY_ACCESS_TOKEN);
      const refreshToken = await getToken(KEY_REFRESH_TOKEN);
      const user = await getUserData();
      const isBiometricsEnabled = await getBiometricsEnabled();

      if (token && user) {
        return {
          token,
          refreshToken,
          user,
          biometricRequired: isBiometricsEnabled,
        };
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

      // Save new access token
      await saveToken(KEY_ACCESS_TOKEN, data.access);

      return data.access;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

export const loginSuccess = createAsyncThunk(
  "auth/loginSuccess",
  async (
    payload: {
      user: SerializedUser;
      token: string;
      refreshToken: string;
    },
    _,
  ) => {
    // Save to SecureStore
    await saveToken(KEY_ACCESS_TOKEN, payload.token);
    await saveToken(KEY_REFRESH_TOKEN, payload.refreshToken);
    await saveUserData(payload.user);

    return payload;
  },
);

export const enableBiometrics = createAsyncThunk(
  "auth/enableBiometrics",
  async (_, { rejectWithValue }) => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        throw new Error("Biometrics not available or not enrolled");
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Activa biometría",
        fallbackLabel: "Usar contraseña",
      });

      if (!result.success) {
        throw new Error("Biometric enrollment cancelled");
      }

      await setBiometricsEnabled(true);
      return true;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

export const verifyBiometrics = createAsyncThunk(
  "auth/verifyBiometrics",
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Verifica tu identidad",
        fallbackLabel: "Usar contraseña",
      });

      if (result.success) {
        await dispatch(refreshToken()).unwrap();
        return true;
      } else {
        throw new Error("Authentication failed");
      }
    } catch (error: any) {
      dispatch(logout());
      return rejectWithValue(error.message);
    }
  },
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
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
      state.biometricRequired = false;
    });
    builder.addCase(loadUserFromStorage.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(loadUserFromStorage.rejected, (state) => {
      state.loading = false;
    });
    builder.addCase(loadUserFromStorage.fulfilled, (state, action) => {
      state.loading = false;
      if (action.payload) {
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken || null;
        state.user = action.payload.user;
        // If biometrics required, don't set isAuthenticated yet
        state.biometricRequired = action.payload.biometricRequired;
        state.isAuthenticated = !action.payload.biometricRequired;
      }
    });
    builder.addCase(refreshToken.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(refreshToken.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
    builder.addCase(refreshToken.fulfilled, (state, action) => {
      state.loading = false;
      state.token = action.payload;
    });
    builder.addCase(loginSuccess.fulfilled, (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.refreshToken = action.payload.refreshToken;
      state.isAuthenticated = true;
      state.biometricRequired = false;
    });
    builder.addCase(verifyBiometrics.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(verifyBiometrics.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
    builder.addCase(verifyBiometrics.fulfilled, (state) => {
      state.loading = false;
      state.biometricRequired = false;
      state.isAuthenticated = true;
    });
    builder.addCase(enableBiometrics.fulfilled, () => {
      // nothing to change in state besides maybe a toast?
    });
  },
});

export const { setLoading, setError } = authSlice.actions;
export default authSlice.reducer;
