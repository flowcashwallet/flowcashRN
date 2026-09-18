import {
  addTransaction,
  deleteTransaction,
  updateTransaction,
} from "@/features/wallet/data/walletSlice";
import { endpoints } from "@/services/api";
import { AppDispatch, RootState } from "@/store/store";
import { fetchWithAuth } from "@/utils/apiClient";
import { formatCurrency } from "@/utils/format";
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";

export type TransactionProposalKind = "create" | "edit" | "delete";

export interface TransactionProposalSnapshot {
  amount: number;
  type: "income" | "expense";
  description: string;
  category: string | null;
  accountName: string | null;
}

export interface TransactionProposal {
  kind: TransactionProposalKind;
  /** Solo en "edit"/"delete" — el id real de la transacción existente. */
  transactionId: string | null;
  amount: number;
  type: "income" | "expense";
  description: string;
  category: string | null;
  accountId: string | null;
  accountName: string | null;
  /** Solo en "edit": los valores actuales antes del cambio, para mostrar el diff en la tarjeta. */
  previous: TransactionProposalSnapshot | null;
}

/** Forma tal cual la manda el backend (snake_case) — ver `ChatViewSet.message`/`ai_chat.py`. */
interface TransactionProposalWire {
  kind: TransactionProposalKind;
  transaction_id: string | null;
  amount: number;
  type: "income" | "expense";
  description: string;
  category: string | null;
  account_id: string | null;
  account_name: string | null;
  previous: {
    amount: number;
    type: "income" | "expense";
    description: string;
    category: string | null;
    account_name: string | null;
  } | null;
}

function mapProposal(wire: TransactionProposalWire): TransactionProposal {
  return {
    kind: wire.kind,
    transactionId: wire.transaction_id,
    amount: wire.amount,
    type: wire.type,
    description: wire.description,
    category: wire.category,
    accountId: wire.account_id,
    accountName: wire.account_name,
    previous: wire.previous
      ? {
          amount: wire.previous.amount,
          type: wire.previous.type,
          description: wire.previous.description,
          category: wire.previous.category,
          accountName: wire.previous.account_name,
        }
      : null,
  };
}

export type ProposalStatus = "pending" | "confirming" | "confirmed" | "cancelled";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
  /** Solo en turnos del asistente donde el modelo propuso crear/editar/eliminar una transacción. */
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
      transactionProposal: data.transaction_proposal
        ? mapProposal(data.transaction_proposal as TransactionProposalWire)
        : null,
    };
  } catch (error: any) {
    return rejectWithValue(error.message);
  }
});

interface ConfirmationSummary {
  amount: number;
  type: "income" | "expense";
  description: string;
  category: string | null;
}

/** Texto del mensaje de confirmación que aparece en el chat tras crear/editar. */
function confirmationText(kind: "create" | "edit", summary: ConfirmationSummary) {
  const label = summary.type === "income" ? "ingreso" : "gasto";
  const categoryPart = summary.category ? ` en ${summary.category}` : "";
  const verb = kind === "edit" ? "Se actualizó tu" : "Se agregó tu";
  return `✅ ${verb} ${label} de ${formatCurrency(summary.amount)}${categoryPart}.`;
}

/** Texto del mensaje de confirmación tras eliminar. */
function deletionConfirmationText(summary: ConfirmationSummary) {
  return `🗑️ Se eliminó "${summary.description}" (${formatCurrency(summary.amount)}).`;
}

/**
 * Confirma una propuesta que el asistente hizo vía `propose_transaction`/
 * `propose_transaction_edit`/`propose_transaction_delete`: el modelo NUNCA
 * crea, edita ni elimina nada — solo la app, al confirmar el usuario la
 * tarjeta en el chat, reutilizando los mismos thunks que usa el resto de la
 * app (Wallet, formulario manual, comandos de voz) para cada acción.
 */
export const confirmTransactionProposal = createAsyncThunk<
  { messageId: string; kind: TransactionProposalKind; summary: ConfirmationSummary },
  { messageId: string; proposal: TransactionProposal },
  { state: RootState; dispatch: AppDispatch; rejectValue: string }
>(
  "aiChat/confirmTransactionProposal",
  async ({ messageId, proposal }, { dispatch, rejectWithValue }) => {
    try {
      const summary: ConfirmationSummary = {
        amount: proposal.amount,
        type: proposal.type,
        description: proposal.description,
        category: proposal.category,
      };

      if (proposal.kind === "delete") {
        await dispatch(deleteTransaction(proposal.transactionId!)).unwrap();
        return { messageId, kind: "delete" as const, summary };
      }

      if (proposal.kind === "edit") {
        await dispatch(
          updateTransaction({
            id: proposal.transactionId!,
            updates: {
              amount: proposal.amount,
              type: proposal.type,
              description: proposal.description,
              category: proposal.category,
              relatedEntityId: proposal.accountId,
            },
          }),
        ).unwrap();
        return { messageId, kind: "edit" as const, summary };
      }

      await dispatch(
        addTransaction({
          amount: proposal.amount,
          type: proposal.type,
          description: proposal.description,
          category: proposal.category,
          relatedEntityId: proposal.accountId,
          date: Date.now(),
        }),
      ).unwrap();
      return { messageId, kind: "create" as const, summary };
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
        const { messageId, kind, summary } = action.payload;
        const message = state.messages.find((m) => m.id === messageId);
        if (message) message.proposalStatus = "confirmed";
        state.messages.push({
          id: `${Date.now()}-assistant-confirm`,
          role: "assistant",
          content:
            kind === "delete"
              ? deletionConfirmationText(summary)
              : confirmationText(kind, summary),
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
