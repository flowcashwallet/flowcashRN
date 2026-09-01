import { Colors } from "@/constants/theme";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { CategoriesList } from "@/features/wallet/components/categories/CategoriesList";
import { CategoryFormModal } from "@/features/wallet/components/categories/modals/CategoryFormModal";
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

function renderForm(
  props: Partial<React.ComponentProps<typeof CategoryFormModal>> = {},
) {
  return render(
    <ThemeProvider>
      <CategoryFormModal
        visible
        editingCategory={null}
        newCategoryName=""
        onChangeName={jest.fn()}
        onClose={jest.fn()}
        onSubmit={jest.fn()}
        {...props}
      />
    </ThemeProvider>,
  );
}

describe("CategoryFormModal migrado a BottomSheet", () => {
  beforeEach(() => mockColorScheme.mockReturnValue("light"));

  it("titles the sheet by mode", () => {
    renderForm();
    expect(screen.getByText("Nueva Categoría")).toBeTruthy();
    screen.unmount();

    renderForm({ editingCategory: { id: "c1", name: "Comida" } });
    expect(screen.getByText("Editar Categoría")).toBeTruthy();
  });

  it("shows the edited name and reports changes", () => {
    const onChangeName = jest.fn();
    renderForm({
      editingCategory: { id: "c1", name: "Comida" },
      onChangeName,
    });

    const field = screen.getByPlaceholderText("Nombre de la categoría");
    expect(field.props.value).toBe("Comida");

    fireEvent.changeText(field, "Comidas");
    expect(onChangeName).toHaveBeenCalledWith("Comidas");
  });

  it("keeps cancel and save wired to the same callbacks", () => {
    const onClose = jest.fn();
    const onSubmit = jest.fn();
    renderForm({ onClose, onSubmit });

    fireEvent.press(screen.getByText("Guardar"));
    expect(onSubmit).toHaveBeenCalledTimes(1);

    fireEvent.press(screen.getByText("Cancelar"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("dismisses from the BottomSheet backdrop", () => {
    const onClose = jest.fn();
    renderForm({ onClose });
    fireEvent.press(screen.getAllByLabelText("Cerrar")[0]);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe("CategoriesList — filas con hairline", () => {
  const categories = [{ id: "c1", name: "Comida" }];

  const renderList = (theme: "light" | "dark") => {
    mockColorScheme.mockReturnValue(theme);
    return render(
      <ThemeProvider>
        <CategoriesList
          categories={categories}
          colors={Colors[theme]}
          onEdit={jest.fn()}
          onDelete={jest.fn()}
        />
      </ThemeProvider>,
    );
  };

  const rowStyle = () => {
    let node = screen.getByText("Comida").parent;
    while (node) {
      const flat = StyleSheet.flatten(node.props?.style) as Record<
        string,
        unknown
      >;
      if (flat?.borderBottomWidth) return flat;
      node = node.parent;
    }
    throw new Error("no se encontró la fila con hairline");
  };

  it("separates rows with a hairline in `border`, in light and dark", () => {
    renderList("light");
    expect(rowStyle().borderBottomWidth).toBe(StyleSheet.hairlineWidth);
    expect(rowStyle().borderBottomColor).toBe(Colors.light.border);
    screen.unmount();

    renderList("dark");
    expect(rowStyle().borderBottomColor).toBe(Colors.dark.border);
  });

  it("renders the empty state copy", () => {
    mockColorScheme.mockReturnValue("light");
    render(
      <ThemeProvider>
        <CategoriesList
          categories={[]}
          colors={Colors.light}
          onEdit={jest.fn()}
          onDelete={jest.fn()}
        />
      </ThemeProvider>,
    );
    expect(
      screen.getByText("No tienes categorías personalizadas."),
    ).toBeTruthy();
  });
});
