import { Colors } from "@/constants/theme";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ChatBubble } from "@/features/ai-chat/components/ChatBubble";
import { ChatMessage } from "@/features/ai-chat/data/aiChatSlice";
import { render, screen } from "@testing-library/react-native";
import React from "react";
import { StyleSheet } from "react-native";

function renderBubble(message: ChatMessage) {
  return render(
    <ThemeProvider>
      <ChatBubble message={message} />
    </ThemeProvider>,
  );
}

function styleOf(text: string) {
  return StyleSheet.flatten(screen.getByText(text).props.style) as Record<
    string,
    unknown
  >;
}

describe("ChatBubble", () => {
  it("pinta el texto del usuario con `onPrimary` — contrasta contra el tinte de su burbuja", () => {
    renderBubble({
      id: "1",
      role: "user",
      content: "Hola",
      createdAt: Date.now(),
    });
    expect(styleOf("Hola").color).toBe(Colors.light.onPrimary);
  });

  it("pinta el texto del asistente con `text` — sin tinte, es la burbuja neutral", () => {
    renderBubble({
      id: "2",
      role: "assistant",
      content: "¡Hola!",
      createdAt: Date.now(),
    });
    expect(styleOf("¡Hola!").color).toBe(Colors.light.text);
  });

  it("muestra el contenido del mensaje sin importar el rol", () => {
    renderBubble({
      id: "3",
      role: "assistant",
      content: "Este mes gastaste $100",
      createdAt: Date.now(),
    });
    expect(screen.getByText("Este mes gastaste $100")).toBeTruthy();
  });
});
