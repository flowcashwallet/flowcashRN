import { configureStore } from "@reduxjs/toolkit";
import aiChatReducer, {
  cancelTransactionProposal,
  clearChat,
  confirmTransactionProposal,
  sendChatMessage,
  sendMessage,
  TransactionProposal,
} from "@/features/ai-chat/data/aiChatSlice";
import { fetchWithAuth } from "@/utils/apiClient";

jest.mock("@/utils/apiClient", () => ({
  fetchWithAuth: jest.fn(),
}));

const mockFetchWithAuth = fetchWithAuth as jest.Mock;

function buildStore() {
  return configureStore({ reducer: { aiChat: aiChatReducer } });
}

/**
 * `confirmTransactionProposal` despacha `addTransaction`/`updateTransaction`/
 * `deleteTransaction` de `walletSlice` internamente, que a su vez leen
 * `state.auth.user` — un stub basta, no hace falta el `authSlice` real.
 */
function buildStoreWithAuth() {
  return configureStore({
    reducer: {
      aiChat: aiChatReducer,
      auth: (state = { user: { id: "1" }, token: "t" }) => state,
    },
  });
}

const backendTransaction = {
  id: 42,
  amount: "250.00",
  type: "expense",
  description: "Súper",
  category: "Comida",
  related_entity_id: null,
  transfer_related_entity_id: null,
  date: new Date("2026-09-17T12:00:00Z").toISOString(),
  payment_type: null,
  is_recurring: false,
  recurrence_frequency: null,
  recurrence_months: null,
};

const createProposal: TransactionProposal = {
  kind: "create",
  transactionId: null,
  amount: 250,
  type: "expense",
  description: "Súper",
  category: "Comida",
  accountId: null,
  accountName: null,
  previous: null,
};

describe("aiChatSlice", () => {
  beforeEach(() => {
    mockFetchWithAuth.mockReset();
  });

  it("sendMessage añade el turno del usuario y pone status en loading, sin esperar la red", () => {
    const store = buildStore();
    store.dispatch(sendMessage("hola"));

    const state = store.getState().aiChat;
    expect(state.messages).toHaveLength(1);
    expect(state.messages[0]).toMatchObject({ role: "user", content: "hola" });
    expect(state.status).toBe("loading");
  });

  it("sendChatMessage.fulfilled añade la respuesta del asistente y vuelve a idle", async () => {
    mockFetchWithAuth.mockResolvedValue({
      ok: true,
      json: async () => ({ reply: "Este mes has gastado $100.00" }),
    });

    const store = buildStore();
    store.dispatch(sendMessage("¿cuánto llevo gastado?"));
    await store.dispatch(sendChatMessage("¿cuánto llevo gastado?") as any);

    const state = store.getState().aiChat;
    expect(state.status).toBe("idle");
    expect(state.messages).toHaveLength(2);
    expect(state.messages[1]).toMatchObject({
      role: "assistant",
      content: "Este mes has gastado $100.00",
    });
  });

  it("sendChatMessage.rejected pone status en error y guarda el mensaje", async () => {
    mockFetchWithAuth.mockResolvedValue({ ok: false });

    const store = buildStore();
    store.dispatch(sendMessage("hola"));
    await store.dispatch(sendChatMessage("hola") as any);

    const state = store.getState().aiChat;
    expect(state.status).toBe("error");
    expect(state.error).toBe("chat_request_failed");
    // El mensaje del usuario ya enviado se mantiene; no se agrega respuesta del asistente.
    expect(state.messages).toHaveLength(1);
  });

  it("solo manda los últimos 20 turnos como historial, no la conversación completa", async () => {
    mockFetchWithAuth.mockResolvedValue({
      ok: true,
      json: async () => ({ reply: "ok" }),
    });

    const store = buildStore();
    for (let i = 0; i < 15; i++) {
      store.dispatch(sendMessage(`turno ${i}`));
    }
    expect(store.getState().aiChat.messages).toHaveLength(15);

    await store.dispatch(sendChatMessage("nuevo turno") as any);

    const [, options] = mockFetchWithAuth.mock.calls[0];
    const body = JSON.parse(options.body);
    expect(body.history).toHaveLength(15);
    expect(body.message).toBe("nuevo turno");
  });

  it("clearChat reinicia el estado", () => {
    const store = buildStore();
    store.dispatch(sendMessage("hola"));
    store.dispatch(clearChat());

    const state = store.getState().aiChat;
    expect(state.messages).toHaveLength(0);
    expect(state.status).toBe("idle");
    expect(state.error).toBeNull();
  });

  it("una respuesta con `transaction_proposal` (create) queda pendiente, mapeada a camelCase", async () => {
    mockFetchWithAuth.mockResolvedValue({
      ok: true,
      json: async () => ({
        reply: "Confírmalo abajo:",
        transaction_proposal: {
          kind: "create",
          transaction_id: null,
          amount: 250,
          type: "expense",
          description: "Súper",
          category: "Comida",
          account_id: "9",
          account_name: "BBVA",
          previous: null,
        },
      }),
    });

    const store = buildStore();
    await store.dispatch(sendChatMessage("agrega un gasto de 250 en comida") as any);

    const message = store.getState().aiChat.messages[0];
    expect(message.transactionProposal).toEqual({
      kind: "create",
      transactionId: null,
      amount: 250,
      type: "expense",
      description: "Súper",
      category: "Comida",
      accountId: "9",
      accountName: "BBVA",
      previous: null,
    });
    expect(message.proposalStatus).toBe("pending");
  });

  it("una respuesta con `transaction_proposal` (edit) incluye `previous` mapeado", async () => {
    mockFetchWithAuth.mockResolvedValue({
      ok: true,
      json: async () => ({
        reply: "Confírmalo abajo:",
        transaction_proposal: {
          kind: "edit",
          transaction_id: "7",
          amount: 300,
          type: "expense",
          description: "Súper",
          category: "Comida",
          account_id: null,
          account_name: null,
          previous: {
            amount: 250,
            type: "expense",
            description: "Súper",
            category: "Comida",
            account_name: null,
          },
        },
      }),
    });

    const store = buildStore();
    await store.dispatch(sendChatMessage("cambia el monto a 300") as any);

    const message = store.getState().aiChat.messages[0];
    expect(message.transactionProposal?.previous).toEqual({
      amount: 250,
      type: "expense",
      description: "Súper",
      category: "Comida",
      accountName: null,
    });
  });
});

describe("confirmTransactionProposal / cancelTransactionProposal", () => {
  beforeEach(() => {
    mockFetchWithAuth.mockReset();
  });

  function seedProposalMessage(
    store: ReturnType<typeof buildStoreWithAuth>,
    proposal: TransactionProposal = createProposal,
  ) {
    store.dispatch(
      sendChatMessage.fulfilled(
        { reply: "Confírmalo abajo:", transactionProposal: proposal },
        "request-id",
        "agrega un gasto de 250 en comida",
      ),
    );
    return store.getState().aiChat.messages[0];
  }

  it("confirmar un 'create' guarda la transacción y agrega un mensaje de confirmación", async () => {
    mockFetchWithAuth.mockResolvedValue({
      ok: true,
      json: async () => backendTransaction,
    });

    const store = buildStoreWithAuth();
    const proposalMessage = seedProposalMessage(store);

    await store.dispatch(
      confirmTransactionProposal({
        messageId: proposalMessage.id,
        proposal: proposalMessage.transactionProposal!,
      }) as any,
    );

    const state = store.getState().aiChat;
    const updated = state.messages.find((m) => m.id === proposalMessage.id);
    expect(updated?.proposalStatus).toBe("confirmed");
    expect(state.messages[state.messages.length - 1]).toMatchObject({
      role: "assistant",
      content: expect.stringContaining("Se agregó tu gasto de $250.00 en Comida"),
    });
  });

  it("confirmar un 'edit' llama al PATCH y avisa que se actualizó", async () => {
    mockFetchWithAuth.mockResolvedValue({ ok: true, json: async () => ({}) });

    const store = buildStoreWithAuth();
    const editProposal: TransactionProposal = {
      ...createProposal,
      kind: "edit",
      transactionId: "7",
      amount: 300,
    };
    const proposalMessage = seedProposalMessage(store, editProposal);

    await store.dispatch(
      confirmTransactionProposal({
        messageId: proposalMessage.id,
        proposal: proposalMessage.transactionProposal!,
      }) as any,
    );

    // updateTransaction hace PATCH a .../transactions/{id}/
    expect(mockFetchWithAuth).toHaveBeenCalledWith(
      expect.stringContaining("/7/"),
      expect.objectContaining({ method: "PATCH" }),
      expect.anything(),
      expect.anything(),
    );
    const state = store.getState().aiChat;
    expect(state.messages.find((m) => m.id === proposalMessage.id)?.proposalStatus).toBe(
      "confirmed",
    );
    expect(state.messages[state.messages.length - 1].content).toContain(
      "Se actualizó tu gasto de $300.00",
    );
  });

  it("confirmar un 'delete' llama al DELETE y avisa que se eliminó", async () => {
    mockFetchWithAuth.mockResolvedValue({ ok: true });

    const store = buildStoreWithAuth();
    const deleteProposal: TransactionProposal = {
      ...createProposal,
      kind: "delete",
      transactionId: "7",
    };
    const proposalMessage = seedProposalMessage(store, deleteProposal);

    await store.dispatch(
      confirmTransactionProposal({
        messageId: proposalMessage.id,
        proposal: proposalMessage.transactionProposal!,
      }) as any,
    );

    expect(mockFetchWithAuth).toHaveBeenCalledWith(
      expect.stringContaining("/7/"),
      expect.objectContaining({ method: "DELETE" }),
      expect.anything(),
      expect.anything(),
    );
    const state = store.getState().aiChat;
    expect(state.messages.find((m) => m.id === proposalMessage.id)?.proposalStatus).toBe(
      "confirmed",
    );
    expect(state.messages[state.messages.length - 1].content).toContain(
      'Se eliminó "Súper"',
    );
  });

  it("confirmTransactionProposal vuelve a `pending` (para reintentar) si falla el guardado", async () => {
    mockFetchWithAuth.mockResolvedValue({
      ok: false,
      json: async () => ({ error: "bad" }),
    });

    const store = buildStoreWithAuth();
    const proposalMessage = seedProposalMessage(store);

    await store.dispatch(
      confirmTransactionProposal({
        messageId: proposalMessage.id,
        proposal: proposalMessage.transactionProposal!,
      }) as any,
    );

    const state = store.getState().aiChat;
    const updated = state.messages.find((m) => m.id === proposalMessage.id);
    expect(updated?.proposalStatus).toBe("pending");
    expect(state.error).toBeTruthy();
    // No se agrega ningún mensaje de confirmación si falló.
    expect(state.messages).toHaveLength(1);
  });

  it("cancelTransactionProposal marca la tarjeta como cancelada sin tocar el backend", () => {
    const store = buildStoreWithAuth();
    const proposalMessage = seedProposalMessage(store);

    store.dispatch(cancelTransactionProposal(proposalMessage.id));

    expect(
      store.getState().aiChat.messages.find((m) => m.id === proposalMessage.id)
        ?.proposalStatus,
    ).toBe("cancelled");
    expect(mockFetchWithAuth).not.toHaveBeenCalled();
  });
});
