import { configureStore } from "@reduxjs/toolkit";
import aiChatReducer, {
  clearChat,
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
});
