import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

interface SettingsState {
  isVoiceCommandEnabled: boolean;
  isLoading: boolean;
}

const initialState: SettingsState = {
  isVoiceCommandEnabled: false,
  isLoading: true,
};

export const loadSettings = createAsyncThunk("settings/load", async () => {
  const voiceEnabled = await AsyncStorage.getItem("settings_voice_enabled");
  return {
    isVoiceCommandEnabled:
      voiceEnabled !== null ? voiceEnabled === "true" : true,
  };
});

export const toggleVoiceCommand = createAsyncThunk(
  "settings/toggleVoice",
  async (enabled: boolean) => {
    await AsyncStorage.setItem("settings_voice_enabled", String(enabled));
    return enabled;
  },
);

const settingsSlice = createSlice({
  name: "settings",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loadSettings.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(loadSettings.fulfilled, (state, action) => {
        state.isVoiceCommandEnabled = action.payload.isVoiceCommandEnabled;
        state.isLoading = false;
      })
      .addCase(toggleVoiceCommand.fulfilled, (state, action) => {
        state.isVoiceCommandEnabled = action.payload;
      });
  },
});

export default settingsSlice.reducer;
