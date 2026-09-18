import { Colors } from "@/constants/theme";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { TransactionProposalCard } from "@/features/ai-chat/components/TransactionProposalCard";
import { TransactionProposal } from "@/features/ai-chat/data/aiChatSlice";
import STRINGS from "@/i18n/es.json";
import { fireEvent, render, screen } from "@testing-library/react-native";
import React from "react";
import { StyleSheet } from "react-native";

const expenseProposal: TransactionProposal = {
  amount: 250,
  type: "expense",
  description: "Súper",
  category: "Comida",
};

function renderCard(
  props: Partial<React.ComponentProps<typeof TransactionProposalCard>> = {},
) {
  return render(
    <ThemeProvider>
      <TransactionProposalCard
        proposal={expenseProposal}
        status="pending"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
        {...props}
      />
    </ThemeProvider>,
  );
}

describe("TransactionProposalCard", () => {
  it("muestra monto, descripción y categoría de la propuesta", () => {
    renderCard();
    expect(screen.getByText("Súper")).toBeTruthy();
    expect(screen.getByText("Comida")).toBeTruthy();
    expect(screen.getByText(/250\.00/)).toBeTruthy();
  });

  it("pinta el monto de un gasto en `expense`, nunca `error`", () => {
    renderCard();
    const amount = StyleSheet.flatten(screen.getByText(/250\.00/).props.style) as Record<
      string,
      unknown
    >;
    expect(amount.color).toBe(Colors.light.expense);
    expect(amount.color).not.toBe(Colors.light.error);
  });

  it("pinta el monto de un ingreso en `success`", () => {
    renderCard({
      proposal: { ...expenseProposal, type: "income", description: "Nómina" },
    });
    const amount = StyleSheet.flatten(screen.getByText(/250\.00/).props.style) as Record<
      string,
      unknown
    >;
    expect(amount.color).toBe(Colors.light.success);
  });

  it("llama onConfirm/onCancel al tocar los botones cuando está `pending`", () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();
    renderCard({ onConfirm, onCancel });

    fireEvent.press(screen.getByText(STRINGS.aiChat.confirmProposal));
    expect(onConfirm).toHaveBeenCalledTimes(1);

    fireEvent.press(screen.getByText(STRINGS.common.cancel));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("oculta los botones y muestra el estado una vez confirmada o cancelada", () => {
    const { rerender } = renderCard({ status: "confirmed" });
    expect(screen.getByText(STRINGS.aiChat.proposalConfirmed)).toBeTruthy();
    expect(screen.queryByText(STRINGS.aiChat.confirmProposal)).toBeNull();

    rerender(
      <ThemeProvider>
        <TransactionProposalCard
          proposal={expenseProposal}
          status="cancelled"
          onConfirm={jest.fn()}
          onCancel={jest.fn()}
        />
      </ThemeProvider>,
    );
    expect(screen.getByText(STRINGS.aiChat.proposalCancelled)).toBeTruthy();
  });
});
