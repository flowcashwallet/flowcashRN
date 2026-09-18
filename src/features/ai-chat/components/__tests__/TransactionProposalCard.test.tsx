import { Colors } from "@/constants/theme";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { TransactionProposalCard } from "@/features/ai-chat/components/TransactionProposalCard";
import { TransactionProposal } from "@/features/ai-chat/data/aiChatSlice";
import STRINGS from "@/i18n/es.json";
import { fireEvent, render, screen } from "@testing-library/react-native";
import React from "react";
import { StyleSheet } from "react-native";

const expenseProposal: TransactionProposal = {
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

describe("TransactionProposalCard — crear", () => {
  it("muestra monto, descripción y categoría de la propuesta", () => {
    renderCard();
    expect(screen.getByText("Súper")).toBeTruthy();
    expect(screen.getByText("Comida")).toBeTruthy();
    expect(screen.getByText(/250\.00/)).toBeTruthy();
  });

  it("muestra la cuenta cuando la propuesta trae una", () => {
    renderCard({ proposal: { ...expenseProposal, accountName: "BBVA" } });
    expect(screen.getByText(`${STRINGS.aiChat.accountLabel}: BBVA`)).toBeTruthy();
  });

  it("no muestra la fila de cuenta cuando no hay ninguna", () => {
    renderCard();
    expect(screen.queryByText(new RegExp(STRINGS.aiChat.accountLabel))).toBeNull();
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

describe("TransactionProposalCard — editar", () => {
  const editProposal: TransactionProposal = {
    kind: "edit",
    transactionId: "7",
    amount: 300,
    type: "expense",
    description: "Súper",
    category: "Comida",
    accountId: null,
    accountName: null,
    previous: {
      amount: 250,
      type: "expense",
      description: "Súper",
      category: "Comida",
      accountName: null,
    },
  };

  it("muestra el título de edición", () => {
    renderCard({ proposal: editProposal });
    expect(screen.getByText(STRINGS.aiChat.editTransactionTitle)).toBeTruthy();
  });

  it("muestra el monto como 'antes → ahora' cuando cambió", () => {
    renderCard({ proposal: editProposal });
    expect(screen.getByText(/\$250\.00 → −\$300\.00/)).toBeTruthy();
  });

  it("no muestra diff en campos que no cambiaron", () => {
    renderCard({ proposal: editProposal });
    // La descripción no cambió — se muestra el valor plano, sin flecha.
    expect(screen.getByText("Súper")).toBeTruthy();
    expect(screen.queryByText(/Súper → Súper/)).toBeNull();
  });

  it("muestra el estado 'Actualizada' al confirmar", () => {
    renderCard({ proposal: editProposal, status: "confirmed" });
    expect(screen.getByText(STRINGS.aiChat.proposalUpdated)).toBeTruthy();
  });
});

describe("TransactionProposalCard — eliminar", () => {
  const deleteProposal: TransactionProposal = {
    kind: "delete",
    transactionId: "7",
    amount: 250,
    type: "expense",
    description: "Súper",
    category: "Comida",
    accountId: null,
    accountName: null,
    previous: null,
  };

  it("muestra el título de eliminación y los datos de la transacción", () => {
    renderCard({ proposal: deleteProposal });
    expect(screen.getByText(STRINGS.aiChat.deleteTransactionTitle)).toBeTruthy();
    expect(screen.getByText("Súper")).toBeTruthy();
  });

  it("el botón de confirmar dice 'Eliminar', no 'Confirmar'", () => {
    renderCard({ proposal: deleteProposal });
    expect(screen.getByText(STRINGS.aiChat.deleteConfirm)).toBeTruthy();
    expect(screen.queryByText(STRINGS.aiChat.confirmProposal)).toBeNull();
  });

  it("muestra el estado 'Eliminada' al confirmar", () => {
    renderCard({ proposal: deleteProposal, status: "confirmed" });
    expect(screen.getByText(STRINGS.aiChat.proposalDeleted)).toBeTruthy();
  });
});
