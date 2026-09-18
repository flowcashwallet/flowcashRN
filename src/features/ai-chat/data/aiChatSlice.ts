import { endpoints } from "@/services/api";
import { AppDispatch, RootState } from "@/store/store";
import { fetchWithAuth } from "@/utils/apiClient";
import { addTransaction, Transaction } from "@/features/wallet/data/walletSlice";
import { formatCurrency } from "@/utils/format";
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface TransactionProposal {
  amount: number;
  type: "income" | "expense";
  description: string;
  category: string | null;
}

export type ProposalStatus = "pending" | "confirming" | "confirmed" | "cancelled";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
  /** Solo en turnos del asistente donde el modelo llamó `propose_transaction`. */
  transactionProposal?: TransactionProposal;
  proposalStatus?: ProposalStatus;
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

interface SendChatMessageResult {
  reply: string;
  transactionProposal: TransactionProposal | null;
}

export const sendChatMessage = createAsyncThunk<
  SendChatMessageResult,
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
    return {
      reply: data.reply as string,
      transactionProposal: (data.transaction_proposal as TransactionProposal) ?? null,
    };
  } catch (error: any) {
    return rejectWithValue(error.message);
  }
});

/** Texto del mensaje de confirmación que aparece en el chat tras guardar. */
function confirmationText(transaction: Transaction) {
  const label = transaction.type === "income" ? "ingreso" : "gasto";
  const categoryPart = transaction.category ? ` en ${transaction.category}` : "";
  return `✅ Se agregó tu ${label} de ${formatCurrency(transaction.amount)}${categoryPart}.`;
}

/**
 * Confirma una propuesta que el asistente hizo vía `propose_transaction`: el
 * modelo NUNCA crea la transacción — solo la app, al confirmar el usuario la
 * tarjeta en el chat, reutilizando el mismo `addTransaction` que usa el resto
 * de la app (Wallet, formulario manual, comandos de voz).
 */
export const confirmTransactionProposal = createAsyncThunk<
  { messageId: string; transaction: Transaction },
  { messageId: string; proposal: TransactionProposal },
  { state: RootState; dispatch: AppDispatch; rejectValue: string }
>(
  "aiChat/confirmTransactionProposal",
  async ({ messageId, proposal }, { dispatch, rejectWithValue }) => {
    try {
      const transaction = await dispatch(
        addTransaction({
          amount: proposal.amount,
          type: proposal.type,
          description: proposal.description,
          category: proposal.category,
          date: Date.now(),
        }),
      ).unwrap();
      return { messageId, transaction };
    } catch (error: any) {
      return rejectWithValue(typeof error === "string" ? error : "confirm_failed");
    }
  },
);

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
    cancelTransactionProposal: (state, action: PayloadAction<string>) => {
      const message = state.messages.find((m) => m.id === action.payload);
      if (message) message.proposalStatus = "cancelled";
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
        const { reply, transactionProposal } = action.payload;
        state.messages.push({
          id: `${Date.now()}-assistant`,
          role: "assistant",
          content: reply,
          createdAt: Date.now(),
          transactionProposal: transactionProposal ?? undefined,
          proposalStatus: transactionProposal ? "pending" : undefined,
        });
      })
      .addCase(sendChatMessage.rejected, (state, action) => {
        state.status = "error";
        state.error = action.payload ?? "chat_request_failed";
      })
      .addCase(confirmTransactionProposal.pending, (state, action) => {
        const message = state.messages.find(
          (m) => m.id === action.meta.arg.messageId,
        );
        if (message) message.proposalStatus = "confirming";
      })
      .addCase(confirmTransactionProposal.fulfilled, (state, action) => {
        const { messageId, transaction } = action.payload;
        const message = state.messages.find((m) => m.id === messageId);
        if (message) message.proposalStatus = "confirmed";
        state.messages.push({
          id: `${Date.now()}-assistant-confirm`,
          role: "assistant",
          content: confirmationText(transaction),
          createdAt: Date.now(),
        });
      })
      .addCase(confirmTransactionProposal.rejected, (state, action) => {
        const message = state.messages.find(
          (m) => m.id === action.meta.arg.messageId,
        );
        // Vuelve a "pending" para poder reintentar, no se pierde la tarjeta.
        if (message) message.proposalStatus = "pending";
        state.error = action.payload ?? "confirm_failed";
      });
  },
});

export const { sendMessage, cancelTransactionProposal, clearChat } =
  aiChatSlice.actions;
export default aiChatSlice.reducer;
