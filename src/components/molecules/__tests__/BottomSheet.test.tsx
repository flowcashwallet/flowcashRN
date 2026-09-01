import { BottomSheet } from "@/components/molecules/BottomSheet";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import React from "react";
import { Text } from "react-native";

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 34, left: 0, right: 0 }),
}));

function renderSheet(props: Partial<React.ComponentProps<typeof BottomSheet>>) {
  return render(
    <ThemeProvider>
      <BottomSheet visible onClose={jest.fn()} title="Filtros" {...props}>
        <Text>contenido</Text>
      </BottomSheet>
    </ThemeProvider>,
  );
}

describe("BottomSheet smoke", () => {
  it("renders title, children and close affordance when visible", () => {
    renderSheet({});
    expect(screen.getByText("Filtros")).toBeTruthy();
    expect(screen.getByText("contenido")).toBeTruthy();
    expect(screen.getAllByLabelText("Cerrar").length).toBeGreaterThan(0);
  });

  it("calls onClose when the backdrop is pressed", () => {
    const onClose = jest.fn();
    renderSheet({ onClose });
    fireEvent.press(screen.getAllByLabelText("Cerrar")[0]);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not dismiss on backdrop press when disabled", () => {
    const onClose = jest.fn();
    renderSheet({ onClose, dismissOnBackdropPress: false, hideCloseButton: true });
    fireEvent.press(screen.getAllByLabelText("Cerrar")[0]);
    expect(onClose).not.toHaveBeenCalled();
  });

  it("unmounts the modal after the exit animation finishes", async () => {
    const { rerender } = renderSheet({});
    expect(screen.getByText("contenido")).toBeTruthy();

    rerender(
      <ThemeProvider>
        <BottomSheet visible={false} onClose={jest.fn()} title="Filtros">
          <Text>contenido</Text>
        </BottomSheet>
      </ThemeProvider>,
    );

    await act(async () => {
      await new Promise((r) => setTimeout(r, 400));
    });

    expect(screen.queryByText("contenido")).toBeNull();
  });
});
