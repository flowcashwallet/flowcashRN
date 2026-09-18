import { ThemeProvider } from "@/contexts/ThemeContext";
import { ChatMessageList } from "@/features/ai-chat/components/ChatMessageList";
import { ChatMessage } from "@/features/ai-chat/data/aiChatSlice";
import STRINGS from "@/i18n/es.json";
import { render, screen } from "@testing-library/react-native";
import React from "react";

function renderList(messages: ChatMessage[], isLoading = false) {
  return render(
    <ThemeProvider>
      <ChatMessageList
        messages={messages}
        isLoading={isLoading}
        onConfirmProposal={jest.fn()}
        onCancelProposal={jest.fn()}
      />
    </ThemeProvider>,
  );
}

describe("ChatMessageList", () => {
  it("muestra el estado vacío cuando no hay mensajes ni carga en curso", () => {
    renderList([]);
    expect(screen.getByText(STRINGS.aiChat.emptyTitle)).toBeTruthy();
  });

  it("no muestra el estado vacío mientras se espera la primera respuesta", () => {
    renderList([], true);
    expect(screen.queryByText(STRINGS.aiChat.emptyTitle)).toBeNull();
  });

  it("renderiza cada mensaje de la conversación, en orden", () => {
    renderList([
      { id: "1", role: "user", content: "Hola", createdAt: 1 },
      {
        id: "2",
        role: "assistant",
        content: "¡Hola! ¿En qué te ayudo?",
        createdAt: 2,
      },
    ]);
    expect(screen.getByText("Hola")).toBeTruthy();
    expect(screen.getByText("¡Hola! ¿En qué te ayudo?")).toBeTruthy();
  });
});
