import { ThemeProvider } from "@/contexts/ThemeContext";
import { MenuPanelProvider, useMenuPanel } from "@/contexts/MenuPanelContext";
import { SideMenuPanel } from "@/components/organisms/SideMenuPanel";
import STRINGS from "@/i18n/es.json";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { useRouter } from "expo-router";
import React from "react";
import { Button, Text } from "react-native";

jest.mock("expo-router", () => ({
  useRouter: jest.fn(),
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 34, left: 0, right: 0 }),
}));

const mockPush = jest.fn();
(useRouter as jest.Mock).mockReturnValue({ push: mockPush });

/**
 * Un botón de prueba para abrir el panel desde fuera, como haría el ícono
 * de hamburguesa real, más una sonda de texto para leer `isOpen`
 * directamente — el cierre real de la `Modal` nativa solo pasa a
 * `mounted: false` cuando termina la animación de salida, así que no es
 * observable de forma síncrona en un test (mismo caso que `BottomSheet`,
 * que tampoco lo prueba); lo que sí es síncrono es el estado del contexto.
 */
function OpenButton() {
  const { isOpen, open } = useMenuPanel();
  return (
    <>
      <Text>{isOpen ? "open" : "closed"}</Text>
      <Button title="abrir" onPress={open} />
    </>
  );
}

function renderPanel() {
  return render(
    <ThemeProvider>
      <MenuPanelProvider>
        <OpenButton />
        <SideMenuPanel />
      </MenuPanelProvider>
    </ThemeProvider>,
  );
}

describe("SideMenuPanel", () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it("no muestra sus opciones hasta que se abre", () => {
    renderPanel();
    expect(screen.queryByText(STRINGS.menu.settings)).toBeNull();
  });

  it("muestra 'Ajustes' al abrirse desde el botón externo", () => {
    renderPanel();
    fireEvent.press(screen.getByText("abrir"));
    expect(screen.getByText(STRINGS.menu.settings)).toBeTruthy();
  });

  it("navega a /settings y se cierra al tocar la opción", () => {
    renderPanel();
    fireEvent.press(screen.getByText("abrir"));
    fireEvent.press(screen.getByLabelText(STRINGS.menu.settings));

    expect(mockPush).toHaveBeenCalledWith("/settings");
  });

  it("se cierra al tocar el backdrop", () => {
    renderPanel();
    fireEvent.press(screen.getByText("abrir"));
    expect(screen.getByText("open")).toBeTruthy();

    fireEvent.press(screen.getByLabelText(STRINGS.common.close));

    expect(screen.getByText("closed")).toBeTruthy();
  });
});
