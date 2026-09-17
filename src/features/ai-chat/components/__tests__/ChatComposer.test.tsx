import { ThemeProvider } from "@/contexts/ThemeContext";
import { ChatComposer } from "@/features/ai-chat/components/ChatComposer";
import STRINGS from "@/i18n/es.json";
import { fireEvent, render, screen } from "@testing-library/react-native";
import React from "react";

function renderComposer(
  props: Partial<React.ComponentProps<typeof ChatComposer>> = {},
) {
  return render(
    <ThemeProvider>
      <ChatComposer onSend={jest.fn()} {...props} />
    </ThemeProvider>,
  );
}

describe("ChatComposer", () => {
  it("no manda nada si el texto está vacío", () => {
    const onSend = jest.fn();
    renderComposer({ onSend });

    fireEvent.press(screen.getByLabelText(STRINGS.aiChat.sendMessage));

    expect(onSend).not.toHaveBeenCalled();
  });

  it("manda el texto recortado y limpia el campo al enviar", () => {
    const onSend = jest.fn();
    renderComposer({ onSend });

    const input = screen.getByPlaceholderText(STRINGS.aiChat.composerPlaceholder);
    fireEvent.changeText(input, "  ¿cuánto llevo gastado?  ");
    fireEvent.press(screen.getByLabelText(STRINGS.aiChat.sendMessage));

    expect(onSend).toHaveBeenCalledWith("¿cuánto llevo gastado?");
    expect(input.props.value).toBe("");
  });

  it("no permite enviar mientras `disabled` está activo, aunque haya texto", () => {
    const onSend = jest.fn();
    renderComposer({ onSend, disabled: true });

    const input = screen.getByPlaceholderText(STRINGS.aiChat.composerPlaceholder);
    fireEvent.changeText(input, "hola");
    fireEvent.press(screen.getByLabelText(STRINGS.aiChat.sendMessage));

    expect(onSend).not.toHaveBeenCalled();
  });
});
