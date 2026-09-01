import { TransactionItem } from "@/components/molecules/TransactionItem";
import { Colors } from "@/constants/theme";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { render, screen } from "@testing-library/react-native";
import React from "react";
import { StyleSheet } from "react-native";

jest.mock("react-native-gesture-handler/Swipeable", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View } = require("react-native");
  const SwipeableMock = ({ children }: { children: React.ReactNode }) => (
    <View>{children}</View>
  );
  SwipeableMock.displayName = "Swipeable";
  return SwipeableMock;
});

const mockColorScheme = jest.fn(() => "light");
jest.mock("react-native/Libraries/Utilities/useColorScheme", () => ({
  __esModule: true,
  default: () => mockColorScheme(),
}));

function renderItem(
  props: Partial<React.ComponentProps<typeof TransactionItem>> = {},
) {
  return render(
    <ThemeProvider>
      <TransactionItem
        id="t1"
        amount={1234.5}
        description="Supermercado"
        date={Date.now()}
        type="expense"
        category="🍔 Comida"
        {...props}
      />
    </ThemeProvider>,
  );
}

/** Aplana el estilo del nodo de texto que contiene `text`. */
function styleOf(text: string | RegExp) {
  return StyleSheet.flatten(screen.getByText(text).props.style) as Record<
    string,
    unknown
  >;
}

describe("TransactionItem — fila del libro contable", () => {
  beforeEach(() => mockColorScheme.mockReturnValue("light"));

  it("renders the amount with the tabular `number` variant, right aligned", () => {
    renderItem();
    const amount = styleOf(/1[.,]234/);
    expect(amount.fontVariant).toEqual(["tabular-nums"]);
    expect(amount.textAlign).toBe("right");
  });

  it("paints expenses with `expense` — the accounting red, never `error`", () => {
    renderItem({ type: "expense" });
    expect(styleOf(/1[.,]234/).color).toBe(Colors.light.expense);
    expect(styleOf(/1[.,]234/).color).not.toBe(Colors.light.error);
    expect(styleOf(/1[.,]234/).color).not.toBe(Colors.light.text);
  });

  it("leaves transfers in `text` — they are not a debit", () => {
    renderItem({ type: "transfer" });
    expect(styleOf(/1[.,]234/).color).toBe(Colors.light.text);
  });

  it("paints income with `success`", () => {
    renderItem({ type: "income" });
    expect(styleOf(/1[.,]234/).color).toBe(Colors.light.success);
  });

  it("marks the sign with − for expenses and + for income", () => {
    renderItem({ type: "expense" });
    expect(screen.getByText(/^−/)).toBeTruthy();
    screen.unmount();

    renderItem({ type: "income" });
    expect(screen.getByText(/^\+/)).toBeTruthy();
  });

  it("resolves every colour from the active theme in dark mode too", () => {
    mockColorScheme.mockReturnValue("dark");
    renderItem({ type: "expense" });
    expect(styleOf(/1[.,]234/).color).toBe(Colors.dark.expense);
    screen.unmount();

    renderItem({ type: "income" });
    expect(styleOf(/1[.,]234/).color).toBe(Colors.dark.success);
  });

  it("separates rows with a hairline in `border`, not with a shadowed card", () => {
    renderItem();
    let node = screen.getByText("Supermercado").parent;
    let row: Record<string, unknown> | undefined;
    while (node && !row) {
      const flat = StyleSheet.flatten(node.props?.style) as Record<
        string,
        unknown
      >;
      if (flat?.borderBottomWidth) row = flat;
      node = node.parent;
    }
    expect(row).toBeDefined();
    expect(row!.borderBottomWidth).toBe(StyleSheet.hairlineWidth);
    expect(row!.borderBottomColor).toBe(Colors.light.border);
    expect(row!.shadowOpacity).toBeUndefined();
    expect(row!.elevation).toBeUndefined();
  });
});
