import { Colors } from "@/constants/theme";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ChatBubble } from "@/features/ai-chat/components/ChatBubble";
import { ChatMessage, TransactionProposal } from "@/features/ai-chat/data/aiChatSlice";
import STRINGS from "@/i18n/es.json";
import { fireEvent, render, screen } from "@testing-library/react-native";
import React from "react";
import { StyleSheet } from "react-native";

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

function renderBubble(
  message: ChatMessage,
  props: Partial<React.ComponentProps<typeof ChatBubble>> = {},
) {
  return render(
    <ThemeProvider>
      <ChatBubble message={message} {...props} />
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

  it("renderiza la tarjeta de propuesta cuando el mensaje trae `transactionProposal`, y avisa al confirmar/cancelar", () => {
    const onConfirmProposal = jest.fn();
    const onCancelProposal = jest.fn();
    renderBubble(
      {
        id: "4",
        role: "assistant",
        content: "Confírmalo abajo:",
        createdAt: Date.now(),
        transactionProposal: createProposal,
        proposalStatus: "pending",
      },
      { onConfirmProposal, onCancelProposal },
    );

    expect(screen.getByText("Súper")).toBeTruthy();

    fireEvent.press(screen.getByText(STRINGS.aiChat.confirmProposal));
    expect(onConfirmProposal).toHaveBeenCalledWith("4");

    fireEvent.press(screen.getByText(STRINGS.common.cancel));
    expect(onCancelProposal).toHaveBeenCalledWith("4");
  });

  it("no renderiza ninguna tarjeta cuando el mensaje no trae propuesta", () => {
    renderBubble({
      id: "5",
      role: "assistant",
      content: "Sin propuesta",
      createdAt: Date.now(),
    });
    expect(screen.queryByText(STRINGS.aiChat.confirmProposal)).toBeNull();
  });
});
