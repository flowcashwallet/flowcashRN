import { endpoints } from "@/services/api";
import { AppDispatch, RootState } from "@/store/store";
import { fetchWithAuth } from "@/utils/apiClient";
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
}

interface AiChatState {
  messages: ChatMessage[];
  status: "idle" | "loading" | "error";
  error: string | null;
}

const initialState: AiChatState = {
  messages: [],
  status: "idle",
  error: null,
};

/**
 * v1 es solo de sesión (sin persistencia en el backend): el historial vive
 * únicamente en este slice y se manda acotado en cada turno — ver
 * `docs`/el plan de la feature. Solo se acotan los últimos
 * `MAX_HISTORY_TURNS_SENT` turnos para no dejar crecer sin límite el tamaño
 * del request (y el costo del prompt) a medida que la conversación avanza.
 */
const MAX_HISTORY_TURNS_SENT = 20;

export const sendChatMessage = createAsyncThunk<
  string,
  string,
  { state: RootState; rejectValue: string }
>("aiChat/sendMessage", async (text, { dispatch, getState, rejectWithValue }) => {
  try {
    const state = getState();
    const recentTurns = state.aiChat.messages.slice(-MAX_HISTORY_TURNS_SENT).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const response = await fetchWithAuth(
      endpoints.wallet.chat,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history: recentTurns }),
      },
      dispatch as AppDispatch,
      getState as () => RootState,
    );

    if (!response.ok) {
      throw new Error("chat_request_failed");
    }

    const data = await response.json();
    return data.reply as string;
  } catch (error: any) {
    return rejectWithValue(error.message);
  }
});

const aiChatSlice = createSlice({
  name: "aiChat",
  initialState,
  reducers: {
    sendMessage: (state, action: PayloadAction<string>) => {
      state.messages.push({
        id: `${Date.now()}-user`,
        role: "user",
        content: action.payload,
        createdAt: Date.now(),
      });
      state.status = "loading";
      state.error = null;
    },
    clearChat: (state) => {
      state.messages = [];
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendChatMessage.fulfilled, (state, action) => {
        state.status = "idle";
        state.messages.push({
          id: `${Date.now()}-assistant`,
          role: "assistant",
          content: action.payload,
          createdAt: Date.now(),
        });
      })
      .addCase(sendChatMessage.rejected, (state, action) => {
        state.status = "error";
        state.error = action.payload ?? "chat_request_failed";
      });
  },
});

export const { sendMessage, clearChat } = aiChatSlice.actions;
export default aiChatSlice.reducer;
