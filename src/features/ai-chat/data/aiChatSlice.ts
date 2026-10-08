import {
  addTransaction,
  deleteTransaction,
  updateTransaction,
} from "@/features/wallet/data/walletSlice";
import { updateVisionEntity } from "@/features/vision/data/visionSlice";
import { endpoints } from "@/services/api";
import { AppDispatch, RootState } from "@/store/store";
import { fetchWithAuth } from "@/utils/apiClient";
import { formatCurrency } from "@/utils/format";
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";

export type TransactionProposalKind = "create" | "edit" | "delete" | "entity_edit";

export interface TransactionProposalSnapshot {
  amount: number;
  type: "income" | "expense";
  description: string;
  category: string | null;
  accountName: string | null;
}

export interface EntityEditProposalSnapshot {
  amount: number;
  name: string;
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
  /**
   * Solo en "create" — por default es "ahora", pero la tarjeta de
   * confirmación deja elegir otra antes de confirmar (el modelo no propone
   * fecha, ver `propose_transaction` en ai_chat.py).
   */
  date: number;
  /** Solo en "entity_edit" — ver `propose_entity_edit` en ai_chat.py. */
  entityId: string | null;
  entityType: "asset" | "liability" | null;
  name: string | null;
  previousEntity: EntityEditProposalSnapshot | null;
}

/** Forma tal cual la manda el backend (snake_case) — ver `ChatViewSet.message`/`ai_chat.py`. */
interface TransactionProposalWire {
  kind: TransactionProposalKind;
  transaction_id?: string | null;
  amount: number;
  type?: "income" | "expense";
  description?: string;
  category?: string | null;
  account_id?: string | null;
  account_name?: string | null;
  // Shape depends on `kind`: the transaction kinds send
  // {amount, type, description, category, account_name}; "entity_edit"
  // sends {amount, name} instead — see `_validate_entity_edit_proposal`.
  previous?:
    | {
        amount: number;
        type: "income" | "expense";
        description: string;
        category: string | null;
        account_name: string | null;
      }
    | { amount: number; name: string }
    | null;
  // "entity_edit" only:
  entity_id?: string;
  entity_type?: "asset" | "liability";
  name?: string;
}

function mapProposal(wire: TransactionProposalWire): TransactionProposal {
  if (wire.kind === "entity_edit") {
    const previous = wire.previous as { amount: number; name: string } | null | undefined;
    return {
      kind: "entity_edit",
      transactionId: null,
      amount: wire.amount,
      type: "expense",
      description: "",
      category: null,
      accountId: null,
      accountName: null,
      previous: null,
      date: Date.now(),
      entityId: wire.entity_id ?? null,
      entityType: wire.entity_type ?? null,
      name: wire.name ?? null,
      previousEntity: previous ?? null,
    };
  }

  const previous = wire.previous as
    | {
        amount: number;
        type: "income" | "expense";
        description: string;
        category: string | null;
        account_name: string | null;
      }
    | null
    | undefined;

  return {
    kind: wire.kind,
    transactionId: wire.transaction_id ?? null,
    amount: wire.amount,
    type: wire.type ?? "expense",
    description: wire.description ?? "",
    category: wire.category ?? null,
    accountId: wire.account_id ?? null,
    accountName: wire.account_name ?? null,
    previous: previous
      ? {
          amount: previous.amount,
          type: previous.type,
          description: previous.description,
          category: previous.category,
          accountName: previous.account_name,
        }
      : null,
    date: Date.now(),
    entityId: null,
    entityType: null,
    name: null,
    previousEntity: null,
  };
}

export type ProposalStatus = "pending" | "confirming" | "confirmed" | "cancelled";

/**
 * Una tarjeta de propuesta dentro de un turno del asistente. Un solo turno
 * puede traer varias (p. ej. una foto de un estado de cuenta con varios
 * cargos), así que cada una necesita su propio id para poder confirmar o
 * cancelar una sin afectar a las demás del mismo mensaje.
 */
export interface ChatProposal {
  id: string;
  proposal: TransactionProposal;
  status: ProposalStatus;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
  /** Solo en turnos del usuario que adjuntaron una o más imágenes — URIs locales, solo para mostrar la miniatura. */
  attachments?: string[];
  /** Solo en turnos del asistente donde el modelo propuso crear/editar/eliminar una o más transacciones. */
  proposals?: ChatProposal[];
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

/** Imagen ya leída en base64 (desde `expo-image-picker`), lista para mandar al backend. */
export interface OutgoingChatImage {
  mediaType: string;
  base64: string;
}

interface SendChatMessageResult {
  reply: string;
  proposals: TransactionProposal[];
}

export const sendChatMessage = createAsyncThunk<
  SendChatMessageResult,
  { text: string; images?: OutgoingChatImage[] },
  { state: RootState; rejectValue: string }
>("aiChat/sendMessage", async ({ text, images }, { dispatch, getState, rejectWithValue }) => {
  try {
    const state = getState();
    const recentTurns = state.aiChat.messages.slice(-MAX_HISTORY_TURNS_SENT).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const body: Record<string, unknown> = { message: text, history: recentTurns };
    if (images && images.length > 0) {
      body.images = images.map((img) => ({ media_type: img.mediaType, data: img.base64 }));
    }

    const response = await fetchWithAuth(
      endpoints.wallet.chat,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
      dispatch as AppDispatch,
      getState as () => RootState,
    );

    if (!response.ok) {
      const errorBody = await response.json().catch(() => null);
      throw new Error(errorBody?.error ?? "chat_request_failed");
    }

    const data = await response.json();
    const wireProposals: TransactionProposalWire[] = Array.isArray(
      data.transaction_proposals,
    )
      ? data.transaction_proposals
      : [];
    return {
      reply: data.reply as string,
      proposals: wireProposals.map(mapProposal),
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

interface EntityEditConfirmationSummary {
  amount: number;
  name: string;
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

/** Texto del mensaje de confirmación tras editar una cuenta de Balance. */
function entityEditConfirmationText(summary: EntityEditConfirmationSummary) {
  return `✅ Se actualizó "${summary.name}" a ${formatCurrency(summary.amount)}.`;
}

/**
 * Confirma una propuesta que el asistente hizo vía `propose_transaction`/
 * `propose_transaction_edit`/`propose_transaction_delete`/
 * `propose_entity_edit`: el modelo NUNCA crea, edita ni elimina nada — solo
 * la app, al confirmar el usuario la tarjeta en el chat, reutilizando los
 * mismos thunks que usa el resto de la app (Wallet, Balance, formulario
 * manual, comandos de voz) para cada acción.
 */
export const confirmTransactionProposal = createAsyncThunk<
  | { messageId: string; proposalId: string; kind: "create" | "edit" | "delete"; summary: ConfirmationSummary }
  | { messageId: string; proposalId: string; kind: "entity_edit"; summary: EntityEditConfirmationSummary },
  { messageId: string; proposalId: string; proposal: TransactionProposal },
  { state: RootState; dispatch: AppDispatch; rejectValue: string }
>(
  "aiChat/confirmTransactionProposal",
  async ({ messageId, proposalId, proposal }, { dispatch, getState, rejectWithValue }) => {
    try {
      if (proposal.kind === "entity_edit") {
        const existing = getState().vision.entities.find(
          (e) => e.id === proposal.entityId,
        );
        if (!existing) {
          return rejectWithValue("entity_not_found");
        }
        const name = proposal.name ?? existing.name;
        await dispatch(
          updateVisionEntity({ ...existing, name, amount: proposal.amount }),
        ).unwrap();
        return {
          messageId,
          proposalId,
          kind: "entity_edit" as const,
          summary: { amount: proposal.amount, name },
        };
      }

      const summary: ConfirmationSummary = {
        amount: proposal.amount,
        type: proposal.type,
        description: proposal.description,
        category: proposal.category,
      };

      if (proposal.kind === "delete") {
        await dispatch(deleteTransaction(proposal.transactionId!)).unwrap();
        return { messageId, proposalId, kind: "delete" as const, summary };
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
        return { messageId, proposalId, kind: "edit" as const, summary };
      }

      await dispatch(
        addTransaction({
          amount: proposal.amount,
          type: proposal.type,
          description: proposal.description,
          category: proposal.category,
          relatedEntityId: proposal.accountId,
          date: proposal.date,
        }),
      ).unwrap();
      return { messageId, proposalId, kind: "create" as const, summary };
    } catch (error: any) {
      return rejectWithValue(typeof error === "string" ? error : "confirm_failed");
    }
  },
);

/** Busca una propuesta específica dentro de un mensaje, o `undefined` si no existe. */
function findProposalEntry(
  state: AiChatState,
  messageId: string,
  proposalId: string,
): ChatProposal | undefined {
  return state.messages
    .find((m) => m.id === messageId)
    ?.proposals?.find((p) => p.id === proposalId);
}

const aiChatSlice = createSlice({
  name: "aiChat",
  initialState,
  reducers: {
    sendMessage: (
      state,
      action: PayloadAction<{ text: string; attachmentUris?: string[] }>,
    ) => {
      const { text, attachmentUris } = action.payload;
      state.messages.push({
        id: `${Date.now()}-user`,
        role: "user",
        content: text,
        createdAt: Date.now(),
        attachments: attachmentUris && attachmentUris.length > 0 ? attachmentUris : undefined,
      });
      state.status = "loading";
      state.error = null;
    },
    cancelTransactionProposal: (
      state,
      action: PayloadAction<{ messageId: string; proposalId: string }>,
    ) => {
      const entry = findProposalEntry(state, action.payload.messageId, action.payload.proposalId);
      if (entry) entry.status = "cancelled";
    },
    /** El usuario elige/cambia la cuenta directamente en la tarjeta, cuando el modelo no propuso ninguna. */
    updateProposalAccount: (
      state,
      action: PayloadAction<{
        messageId: string;
        proposalId: string;
        accountId: string | null;
        accountName: string | null;
      }>,
    ) => {
      const entry = findProposalEntry(state, action.payload.messageId, action.payload.proposalId);
      if (entry) {
        entry.proposal.accountId = action.payload.accountId;
        entry.proposal.accountName = action.payload.accountName;
      }
    },
    /** El usuario cambia la fecha propuesta en una tarjeta de "create" antes de confirmarla. */
    updateProposalDate: (
      state,
      action: PayloadAction<{ messageId: string; proposalId: string; date: number }>,
    ) => {
      const entry = findProposalEntry(state, action.payload.messageId, action.payload.proposalId);
      if (entry) entry.proposal.date = action.payload.date;
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
        const { reply, proposals } = action.payload;
        const messageId = `${Date.now()}-assistant`;
        state.messages.push({
          id: messageId,
          role: "assistant",
          content: reply,
          createdAt: Date.now(),
          proposals:
            proposals.length > 0
              ? proposals.map((proposal, index) => ({
                  id: `${messageId}-p${index}`,
                  proposal,
                  status: "pending" as const,
                }))
              : undefined,
        });
      })
      .addCase(sendChatMessage.rejected, (state, action) => {
        state.status = "error";
        state.error = action.payload ?? "chat_request_failed";
      })
      .addCase(confirmTransactionProposal.pending, (state, action) => {
        const entry = findProposalEntry(
          state,
          action.meta.arg.messageId,
          action.meta.arg.proposalId,
        );
        if (entry) entry.status = "confirming";
      })
      .addCase(confirmTransactionProposal.fulfilled, (state, action) => {
        const { messageId, proposalId, kind, summary } = action.payload;
        const entry = findProposalEntry(state, messageId, proposalId);
        if (entry) entry.status = "confirmed";

        let content: string;
        if (kind === "delete") {
          content = deletionConfirmationText(summary);
        } else if (kind === "entity_edit") {
          content = entityEditConfirmationText(summary);
        } else {
          content = confirmationText(kind, summary);
        }

        state.messages.push({
          id: `${Date.now()}-assistant-confirm`,
          role: "assistant",
          content,
          createdAt: Date.now(),
        });
      })
      .addCase(confirmTransactionProposal.rejected, (state, action) => {
        const entry = findProposalEntry(
          state,
          action.meta.arg.messageId,
          action.meta.arg.proposalId,
        );
        // Vuelve a "pending" para poder reintentar, no se pierde la tarjeta.
        if (entry) entry.status = "pending";
        state.error = action.payload ?? "confirm_failed";
      });
  },
});

export const {
  sendMessage,
  cancelTransactionProposal,
  updateProposalAccount,
  updateProposalDate,
  clearChat,
} = aiChatSlice.actions;
export default aiChatSlice.reducer;
