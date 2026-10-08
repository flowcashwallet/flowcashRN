import { Colors } from "@/constants/theme";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { TransactionProposalCard } from "@/features/ai-chat/components/TransactionProposalCard";
import { TransactionProposal } from "@/features/ai-chat/data/aiChatSlice";
import STRINGS from "@/i18n/es.json";
import { fireEvent, render, screen } from "@testing-library/react-native";
import React from "react";
import { StyleSheet } from "react-native";

// El selector de cuenta abre `EntitySelectionModal`, que es un `BottomSheet` y
// necesita `useSafeAreaInsets` — mismo mock que usa `BottomSheet.test.tsx`.
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 34, left: 0, right: 0 }),
}));

// `DateField` lo requiere condicionalmente, vía `require(...).default` — a
// diferencia de `TransactionFormScreen.test.tsx` (que nunca llega a abrir el
// picker), esta tarjeta sí lo abre, así que el mock necesita el `.default`.
jest.mock("@react-native-community/datetimepicker", () => {
  const { View } = jest.requireActual("react-native");
  const MockDateTimePicker = (props: any) => (
    <View testID="dateTimePicker" {...props} />
  );
  MockDateTimePicker.displayName = "MockDateTimePicker";
  return { default: MockDateTimePicker };
});

/** Campos nuevos que no varían entre los fixtures de propuestas de transacción. */
const TX_PROPOSAL_EXTRA = {
  date: new Date(2026, 0, 15).getTime(),
  entityId: null,
  entityType: null,
  name: null,
  previousEntity: null,
} as const;

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
  ...TX_PROPOSAL_EXTRA,
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
    ...TX_PROPOSAL_EXTRA,
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

describe("TransactionProposalCard — selector de cuenta inline", () => {
  const visionEntities = [
    { id: "1", userId: "u", name: "BBVA", amount: 1000, type: "asset" as const, createdAt: 0 },
    {
      id: "2",
      userId: "u",
      name: "Tarjeta Oro",
      amount: 500,
      type: "liability" as const,
      createdAt: 0,
    },
  ];

  it("no muestra el selector si no se pasan `visionEntities`/`onSelectAccount`", () => {
    renderCard();
    expect(screen.queryByText(STRINGS.aiChat.selectAccountPlaceholder)).toBeNull();
  });

  it("muestra el selector cuando la propuesta está pendiente y no tiene cuenta", () => {
    renderCard({ visionEntities, onSelectAccount: jest.fn() });
    expect(screen.getByText(STRINGS.aiChat.selectAccountPlaceholder)).toBeTruthy();
  });

  it("no muestra el selector en una propuesta de tipo 'delete'", () => {
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
      ...TX_PROPOSAL_EXTRA,
    };
    renderCard({ proposal: deleteProposal, visionEntities, onSelectAccount: jest.fn() });
    expect(screen.queryByText(STRINGS.aiChat.selectAccountPlaceholder)).toBeNull();
  });

  it("no muestra el selector una vez confirmada/cancelada — solo la fila de texto plano", () => {
    renderCard({
      proposal: { ...expenseProposal, accountName: "BBVA" },
      status: "confirmed",
      visionEntities,
      onSelectAccount: jest.fn(),
    });
    expect(screen.queryByText(STRINGS.aiChat.selectAccountPlaceholder)).toBeNull();
    expect(screen.getByText(`${STRINGS.aiChat.accountLabel}: BBVA`)).toBeTruthy();
  });

  it("al elegir una cuenta del selector llama a onSelectAccount con id y nombre", () => {
    const onSelectAccount = jest.fn();
    renderCard({ visionEntities, onSelectAccount });

    fireEvent.press(screen.getByText(STRINGS.aiChat.selectAccountPlaceholder));
    fireEvent.press(screen.getByText("BBVA"));

    expect(onSelectAccount).toHaveBeenCalledWith("1", "BBVA");
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
    ...TX_PROPOSAL_EXTRA,
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

describe("TransactionProposalCard — fecha editable al crear", () => {
  it("no muestra el selector de fecha si no se pasa onChangeDate", () => {
    renderCard();
    expect(screen.queryByTestId("dateTimePicker")).toBeNull();
  });

  it("no muestra el selector de fecha en una propuesta de edición/eliminación", () => {
    const editProposal: TransactionProposal = {
      ...expenseProposal,
      kind: "edit",
      transactionId: "7",
    };
    renderCard({ proposal: editProposal, onChangeDate: jest.fn() });
    // El botón de fecha (formateada en es-ES) solo aparece para "create".
    expect(screen.queryByText(/de \d{4}/)).toBeNull();
  });

  it("llama a onChangeDate con el timestamp elegido", () => {
    const onChangeDate = jest.fn();
    renderCard({ onChangeDate });

    // El picker nativo solo se monta tras tocar el botón de fecha.
    fireEvent.press(screen.getByText(/de \d{4}/));
    fireEvent(screen.getByTestId("dateTimePicker"), "onChange", {}, new Date(2026, 1, 20));

    expect(onChangeDate).toHaveBeenCalledWith(new Date(2026, 1, 20).getTime());
  });
});

describe("TransactionProposalCard — editar cuenta (Balance)", () => {
  const entityEditProposal: TransactionProposal = {
    kind: "entity_edit",
    transactionId: null,
    amount: 1200,
    type: "expense",
    description: "",
    category: null,
    accountId: null,
    accountName: null,
    previous: null,
    date: Date.now(),
    entityId: "9",
    entityType: "asset",
    name: "BBVA",
    previousEntity: { amount: 1000, name: "BBVA" },
  };

  it("muestra el título de edición de cuenta y el tipo", () => {
    renderCard({ proposal: entityEditProposal });
    expect(screen.getByText(STRINGS.aiChat.editAccountTitle)).toBeTruthy();
    expect(screen.getByText("Activo")).toBeTruthy();
  });

  it("muestra el pasivo correctamente", () => {
    renderCard({
      proposal: { ...entityEditProposal, entityType: "liability" },
    });
    expect(screen.getByText("Pasivo")).toBeTruthy();
  });

  it("muestra el monto como 'antes → ahora' cuando cambió", () => {
    renderCard({ proposal: entityEditProposal });
    expect(screen.getByText(/\$1,000\.00 → \$1,200\.00/)).toBeTruthy();
  });

  it("muestra el nombre de la cuenta", () => {
    renderCard({ proposal: entityEditProposal });
    expect(screen.getByText("BBVA")).toBeTruthy();
  });

  it("confirma/cancela igual que las propuestas de transacción", () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();
    renderCard({ proposal: entityEditProposal, onConfirm, onCancel });

    fireEvent.press(screen.getByText(STRINGS.aiChat.confirmProposal));
    expect(onConfirm).toHaveBeenCalledTimes(1);

    fireEvent.press(screen.getByText(STRINGS.common.cancel));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("muestra el estado 'Actualizada' al confirmar, no 'Agregada'", () => {
    renderCard({ proposal: entityEditProposal, status: "confirmed" });
    expect(screen.getByText(STRINGS.aiChat.proposalUpdated)).toBeTruthy();
  });

  it("nunca muestra el selector de cuenta ni de fecha", () => {
    const visionEntities = [
      { id: "1", userId: "u", name: "BBVA", amount: 1000, type: "asset" as const, createdAt: 0 },
    ];
    renderCard({
      proposal: entityEditProposal,
      visionEntities,
      onSelectAccount: jest.fn(),
      onChangeDate: jest.fn(),
    });
    expect(screen.queryByText(STRINGS.aiChat.selectAccountPlaceholder)).toBeNull();
    expect(screen.queryByTestId("dateTimePicker")).toBeNull();
  });
});
