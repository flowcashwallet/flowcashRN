import { configureStore } from "@reduxjs/toolkit";
import aiChatReducer, {
  cancelTransactionProposal,
  clearChat,
  confirmTransactionProposal,
  sendChatMessage,
  sendMessage,
  TransactionProposal,
  updateProposalAccount,
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
    store.dispatch(sendMessage({ text: "hola" }));

    const state = store.getState().aiChat;
    expect(state.messages).toHaveLength(1);
    expect(state.messages[0]).toMatchObject({ role: "user", content: "hola" });
    expect(state.status).toBe("loading");
  });

  it("sendMessage guarda los URIs de las imágenes adjuntas como `attachments`", () => {
    const store = buildStore();
    store.dispatch(
      sendMessage({ text: "", attachmentUris: ["file://a.jpg", "file://b.jpg"] }),
    );

    const message = store.getState().aiChat.messages[0];
    expect(message.attachments).toEqual(["file://a.jpg", "file://b.jpg"]);
  });

  it("sendMessage no agrega `attachments` cuando no se mandó ninguna imagen", () => {
    const store = buildStore();
    store.dispatch(sendMessage({ text: "hola" }));
    expect(store.getState().aiChat.messages[0].attachments).toBeUndefined();
  });

  it("sendChatMessage.fulfilled añade la respuesta del asistente y vuelve a idle", async () => {
    mockFetchWithAuth.mockResolvedValue({
      ok: true,
      json: async () => ({ reply: "Este mes has gastado $100.00" }),
    });

    const store = buildStore();
    store.dispatch(sendMessage({ text: "¿cuánto llevo gastado?" }));
    await store.dispatch(sendChatMessage({ text: "¿cuánto llevo gastado?" }) as any);

    const state = store.getState().aiChat;
    expect(state.status).toBe("idle");
    expect(state.messages).toHaveLength(2);
    expect(state.messages[1]).toMatchObject({
      role: "assistant",
      content: "Este mes has gastado $100.00",
    });
  });

  it("sendChatMessage manda las imágenes en el body como `images` (media_type/data)", async () => {
    mockFetchWithAuth.mockResolvedValue({
      ok: true,
      json: async () => ({ reply: "ok" }),
    });

    const store = buildStore();
    await store.dispatch(
      sendChatMessage({
        text: "",
        images: [{ mediaType: "image/jpeg", base64: "abc123" }],
      }) as any,
    );

    const [, options] = mockFetchWithAuth.mock.calls[0];
    const body = JSON.parse(options.body);
    expect(body.images).toEqual([{ media_type: "image/jpeg", data: "abc123" }]);
  });

  it("sendChatMessage no manda `images` cuando el turno no adjuntó ninguna", async () => {
    mockFetchWithAuth.mockResolvedValue({ ok: true, json: async () => ({ reply: "ok" }) });

    const store = buildStore();
    await store.dispatch(sendChatMessage({ text: "hola" }) as any);

    const [, options] = mockFetchWithAuth.mock.calls[0];
    const body = JSON.parse(options.body);
    expect(body.images).toBeUndefined();
  });

  it("sendChatMessage.rejected pone status en error y guarda el mensaje", async () => {
    mockFetchWithAuth.mockResolvedValue({ ok: false, json: async () => ({}) });

    const store = buildStore();
    store.dispatch(sendMessage({ text: "hola" }));
    await store.dispatch(sendChatMessage({ text: "hola" }) as any);

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
      store.dispatch(sendMessage({ text: `turno ${i}` }));
    }
    expect(store.getState().aiChat.messages).toHaveLength(15);

    await store.dispatch(sendChatMessage({ text: "nuevo turno" }) as any);

    const [, options] = mockFetchWithAuth.mock.calls[0];
    const body = JSON.parse(options.body);
    expect(body.history).toHaveLength(15);
    expect(body.message).toBe("nuevo turno");
  });

  it("clearChat reinicia el estado", () => {
    const store = buildStore();
    store.dispatch(sendMessage({ text: "hola" }));
    store.dispatch(clearChat());

    const state = store.getState().aiChat;
    expect(state.messages).toHaveLength(0);
    expect(state.status).toBe("idle");
    expect(state.error).toBeNull();
  });

  it("una respuesta con `transaction_proposals` (create) queda pendiente, mapeada a camelCase", async () => {
    mockFetchWithAuth.mockResolvedValue({
      ok: true,
      json: async () => ({
        reply: "Confírmalo abajo:",
        transaction_proposals: [
          {
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
        ],
      }),
    });

    const store = buildStore();
    await store.dispatch(sendChatMessage({ text: "agrega un gasto de 250 en comida" }) as any);

    const message = store.getState().aiChat.messages[0];
    expect(message.proposals).toHaveLength(1);
    expect(message.proposals![0].status).toBe("pending");
    expect(message.proposals![0].proposal).toEqual({
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
  });

  it("una respuesta con varias `transaction_proposals` a la vez (captura de un listado) las mapea todas, cada una con su propio id", async () => {
    mockFetchWithAuth.mockResolvedValue({
      ok: true,
      json: async () => ({
        reply: "Encontré 2 transacciones. Confírmalas abajo:",
        transaction_proposals: [
          {
            kind: "create",
            transaction_id: null,
            amount: 250,
            type: "expense",
            description: "Súper",
            category: "Comida",
            account_id: null,
            account_name: null,
            previous: null,
          },
          {
            kind: "create",
            transaction_id: null,
            amount: 80,
            type: "expense",
            description: "Café",
            category: "Comida",
            account_id: null,
            account_name: null,
            previous: null,
          },
        ],
      }),
    });

    const store = buildStore();
    await store.dispatch(sendChatMessage({ text: "" }) as any);

    const message = store.getState().aiChat.messages[0];
    expect(message.proposals).toHaveLength(2);
    expect(message.proposals![0].id).not.toBe(message.proposals![1].id);
    expect(message.proposals!.map((p) => p.proposal.description)).toEqual(["Súper", "Café"]);
  });

  it("una respuesta con `transaction_proposals` (edit) incluye `previous` mapeado", async () => {
    mockFetchWithAuth.mockResolvedValue({
      ok: true,
      json: async () => ({
        reply: "Confírmalo abajo:",
        transaction_proposals: [
          {
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
        ],
      }),
    });

    const store = buildStore();
    await store.dispatch(sendChatMessage({ text: "cambia el monto a 300" }) as any);

    const message = store.getState().aiChat.messages[0];
    expect(message.proposals![0].proposal.previous).toEqual({
      amount: 250,
      type: "expense",
      description: "Súper",
      category: "Comida",
      accountName: null,
    });
  });

  it("una respuesta sin propuestas no agrega `proposals` al mensaje", async () => {
    mockFetchWithAuth.mockResolvedValue({
      ok: true,
      json: async () => ({ reply: "Este mes has gastado $100.00" }),
    });

    const store = buildStore();
    await store.dispatch(sendChatMessage({ text: "¿cuánto llevo gastado?" }) as any);

    expect(store.getState().aiChat.messages[0].proposals).toBeUndefined();
  });
});

describe("confirmTransactionProposal / cancelTransactionProposal / updateProposalAccount", () => {
  beforeEach(() => {
    mockFetchWithAuth.mockReset();
  });

  function seedProposalMessage(
    store: ReturnType<typeof buildStoreWithAuth>,
    proposal: TransactionProposal = createProposal,
  ) {
    store.dispatch(
      sendChatMessage.fulfilled(
        { reply: "Confírmalo abajo:", proposals: [proposal] },
        "request-id",
        { text: "agrega un gasto de 250 en comida" },
      ),
    );
    const message = store.getState().aiChat.messages[0];
    return { messageId: message.id, proposalId: message.proposals![0].id };
  }

  it("confirmar un 'create' guarda la transacción y agrega un mensaje de confirmación", async () => {
    mockFetchWithAuth.mockResolvedValue({
      ok: true,
      json: async () => backendTransaction,
    });

    const store = buildStoreWithAuth();
    const { messageId, proposalId } = seedProposalMessage(store);
    const proposal = store.getState().aiChat.messages[0].proposals![0].proposal;

    await store.dispatch(
      confirmTransactionProposal({ messageId, proposalId, proposal }) as any,
    );

    const state = store.getState().aiChat;
    const updated = state.messages.find((m) => m.id === messageId);
    expect(updated?.proposals![0].status).toBe("confirmed");
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
    const { messageId, proposalId } = seedProposalMessage(store, editProposal);
    const proposal = store.getState().aiChat.messages[0].proposals![0].proposal;

    await store.dispatch(
      confirmTransactionProposal({ messageId, proposalId, proposal }) as any,
    );

    // updateTransaction hace PATCH a .../transactions/{id}/
    expect(mockFetchWithAuth).toHaveBeenCalledWith(
      expect.stringContaining("/7/"),
      expect.objectContaining({ method: "PATCH" }),
      expect.anything(),
      expect.anything(),
    );
    const state = store.getState().aiChat;
    expect(
      state.messages.find((m) => m.id === messageId)?.proposals![0].status,
    ).toBe("confirmed");
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
    const { messageId, proposalId } = seedProposalMessage(store, deleteProposal);
    const proposal = store.getState().aiChat.messages[0].proposals![0].proposal;

    await store.dispatch(
      confirmTransactionProposal({ messageId, proposalId, proposal }) as any,
    );

    expect(mockFetchWithAuth).toHaveBeenCalledWith(
      expect.stringContaining("/7/"),
      expect.objectContaining({ method: "DELETE" }),
      expect.anything(),
      expect.anything(),
    );
    const state = store.getState().aiChat;
    expect(
      state.messages.find((m) => m.id === messageId)?.proposals![0].status,
    ).toBe("confirmed");
    expect(state.messages[state.messages.length - 1].content).toContain(
      'Se eliminó "Súper"',
    );
  });

  it("confirmar una propuesta no afecta a las demás del mismo mensaje", async () => {
    mockFetchWithAuth.mockResolvedValue({ ok: true, json: async () => backendTransaction });

    const store = buildStoreWithAuth();
    const second: TransactionProposal = { ...createProposal, description: "Café", amount: 80 };
    store.dispatch(
      sendChatMessage.fulfilled(
        { reply: "Confírmalas abajo:", proposals: [createProposal, second] },
        "request-id",
        { text: "" },
      ),
    );
    const message = store.getState().aiChat.messages[0];
    const [first, secondEntry] = message.proposals!;

    await store.dispatch(
      confirmTransactionProposal({
        messageId: message.id,
        proposalId: first.id,
        proposal: first.proposal,
      }) as any,
    );

    const updated = store
      .getState()
      .aiChat.messages.find((m) => m.id === message.id)!;
    expect(updated.proposals!.find((p) => p.id === first.id)?.status).toBe("confirmed");
    expect(updated.proposals!.find((p) => p.id === secondEntry.id)?.status).toBe("pending");
  });

  it("confirmTransactionProposal vuelve a `pending` (para reintentar) si falla el guardado", async () => {
    mockFetchWithAuth.mockResolvedValue({
      ok: false,
      json: async () => ({ error: "bad" }),
    });

    const store = buildStoreWithAuth();
    const { messageId, proposalId } = seedProposalMessage(store);
    const proposal = store.getState().aiChat.messages[0].proposals![0].proposal;

    await store.dispatch(
      confirmTransactionProposal({ messageId, proposalId, proposal }) as any,
    );

    const state = store.getState().aiChat;
    const updated = state.messages.find((m) => m.id === messageId);
    expect(updated?.proposals![0].status).toBe("pending");
    expect(state.error).toBeTruthy();
    // No se agrega ningún mensaje de confirmación si falló.
    expect(state.messages).toHaveLength(1);
  });

  it("cancelTransactionProposal marca la tarjeta como cancelada sin tocar el backend", () => {
    const store = buildStoreWithAuth();
    const { messageId, proposalId } = seedProposalMessage(store);

    store.dispatch(cancelTransactionProposal({ messageId, proposalId }));

    expect(
      store
        .getState()
        .aiChat.messages.find((m) => m.id === messageId)
        ?.proposals!.find((p) => p.id === proposalId)?.status,
    ).toBe("cancelled");
    expect(mockFetchWithAuth).not.toHaveBeenCalled();
  });

  it("updateProposalAccount actualiza la cuenta de una propuesta sin tocar el backend", () => {
    const store = buildStoreWithAuth();
    const { messageId, proposalId } = seedProposalMessage(store);

    store.dispatch(
      updateProposalAccount({
        messageId,
        proposalId,
        accountId: "9",
        accountName: "BBVA",
      }),
    );

    const proposal = store
      .getState()
      .aiChat.messages.find((m) => m.id === messageId)
      ?.proposals!.find((p) => p.id === proposalId)?.proposal;
    expect(proposal?.accountId).toBe("9");
    expect(proposal?.accountName).toBe("BBVA");
    expect(mockFetchWithAuth).not.toHaveBeenCalled();
  });
});
