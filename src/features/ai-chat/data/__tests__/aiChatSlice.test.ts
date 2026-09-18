import { configureStore } from "@reduxjs/toolkit";
import aiChatReducer, {
  cancelTransactionProposal,
  clearChat,
  confirmTransactionProposal,
  sendChatMessage,
  sendMessage,
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
 * `confirmTransactionProposal` despacha `addTransaction` de `walletSlice`
 * internamente, que a su vez lee `state.auth.user` — un stub basta, no hace
 * falta el `authSlice` real para este test.
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

  it("una respuesta con `transaction_proposal` queda pendiente en el mensaje del asistente", async () => {
    mockFetchWithAuth.mockResolvedValue({
      ok: true,
      json: async () => ({
        reply: "Confírmalo abajo:",
        transaction_proposal: {
          amount: 250,
          type: "expense",
          description: "Súper",
          category: "Comida",
        },
      }),
    });

    const store = buildStore();
    await store.dispatch(sendChatMessage("agrega un gasto de 250 en comida") as any);

    const message = store.getState().aiChat.messages[0];
    expect(message.transactionProposal).toEqual({
      amount: 250,
      type: "expense",
      description: "Súper",
      category: "Comida",
    });
    expect(message.proposalStatus).toBe("pending");
  });
});

describe("confirmTransactionProposal / cancelTransactionProposal", () => {
  beforeEach(() => {
    mockFetchWithAuth.mockReset();
  });

  function seedProposalMessage(store: ReturnType<typeof buildStoreWithAuth>) {
    store.dispatch(
      sendChatMessage.fulfilled(
        {
          reply: "Confírmalo abajo:",
          transactionProposal: {
            amount: 250,
            type: "expense" as const,
            description: "Súper",
            category: "Comida",
          },
        },
        "request-id",
        "agrega un gasto de 250 en comida",
      ),
    );
    return store.getState().aiChat.messages[0];
  }

  it("confirmTransactionProposal guarda la transacción y agrega un mensaje de confirmación", async () => {
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
