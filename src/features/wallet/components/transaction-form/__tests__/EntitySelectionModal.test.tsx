import { Colors } from "@/constants/theme";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { EntitySelectionModal } from "@/features/wallet/components/transaction-form/EntitySelectionModal";
import { VisionEntity } from "@/features/vision/data/visionSlice";
import { fireEvent, render, screen } from "@testing-library/react-native";
import React from "react";
import { StyleSheet } from "react-native";

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 34, left: 0, right: 0 }),
}));

const mockColorScheme = jest.fn(() => "light");
jest.mock("react-native/Libraries/Utilities/useColorScheme", () => ({
  __esModule: true,
  default: () => mockColorScheme(),
}));

const entities = [
  { id: "a1", name: "Cuenta Nómina", type: "asset" },
  { id: "l1", name: "Tarjeta Oro", type: "liability" },
] as unknown as VisionEntity[];

function renderModal(
  props: Partial<React.ComponentProps<typeof EntitySelectionModal>> = {},
) {
  return render(
    <ThemeProvider>
      <EntitySelectionModal
        visible
        onClose={jest.fn()}
        onSelect={jest.fn()}
        visionEntities={entities}
        selectedEntityId={null}
        {...props}
      />
    </ThemeProvider>,
  );
}

describe("EntitySelectionModal migrado a BottomSheet", () => {
  beforeEach(() => {
    mockColorScheme.mockReturnValue("light");
  });

  it("renders the sheet header, the groups and every entity", () => {
    renderModal();
    expect(screen.getByText("Seleccionar Entidad")).toBeTruthy();
    expect(screen.getByText("Activos")).toBeTruthy();
    expect(screen.getByText("Pasivos")).toBeTruthy();
    expect(screen.getByText("Cuenta Nómina")).toBeTruthy();
    expect(screen.getByText("Tarjeta Oro")).toBeTruthy();
    expect(screen.getByText("Ninguno")).toBeTruthy();
  });

  it("keeps the previous select-then-close behaviour", () => {
    const onSelect = jest.fn();
    const onClose = jest.fn();
    renderModal({ onSelect, onClose });

    fireEvent.press(screen.getByText("Cuenta Nómina"));

    expect(onSelect).toHaveBeenCalledWith("a1");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("clears the selection through the 'Ninguno' row", () => {
    const onSelect = jest.fn();
    renderModal({ onSelect, selectedEntityId: "a1" });

    fireEvent.press(screen.getByText("Ninguno"));

    expect(onSelect).toHaveBeenCalledWith(null);
  });

  it("dismisses from the BottomSheet backdrop", () => {
    const onClose = jest.fn();
    renderModal({ onClose });
    fireEvent.press(screen.getAllByLabelText("Cerrar")[0]);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("filters entities by the search box", () => {
    renderModal();
    fireEvent.changeText(
      screen.getByPlaceholderText("Buscar activo/pasivo..."),
      "oro",
    );
    expect(screen.getByText("Tarjeta Oro")).toBeTruthy();
    expect(screen.queryByText("Cuenta Nómina")).toBeNull();
  });

  it("resolves row separators from theme tokens in light and dark", () => {
    const readBorder = () => {
      let node = screen.getByText("Cuenta Nómina").parent;
      while (node) {
        const flat = StyleSheet.flatten(node.props?.style) as
          | { borderBottomColor?: string }
          | undefined;
        if (flat?.borderBottomColor) return flat.borderBottomColor;
        node = node.parent;
      }
      throw new Error("no se encontró la fila con hairline");
    };

    renderModal();
    expect(readBorder()).toBe(Colors.light.border);
    screen.unmount();

    mockColorScheme.mockReturnValue("dark");
    renderModal();
    expect(readBorder()).toBe(Colors.dark.border);
  });
});
