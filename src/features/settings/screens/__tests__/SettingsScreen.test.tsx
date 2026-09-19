import { ThemeProvider } from "@/contexts/ThemeContext";
import SettingsScreen from "@/features/settings/screens/SettingsScreen";
import STRINGS from "@/i18n/es.json";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { useRouter } from "expo-router";
import React from "react";

jest.mock("expo-router", () => ({
  useRouter: jest.fn(),
  Stack: { Screen: () => null },
}));

const mockPush = jest.fn();
const mockBack = jest.fn();

describe("SettingsScreen", () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockBack.mockClear();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush, back: mockBack });
  });

  it("muestra la fila de conexiones externas", () => {
    render(
      <ThemeProvider>
        <SettingsScreen />
      </ThemeProvider>,
    );
    expect(screen.getByText(STRINGS.settings.connectionsRow)).toBeTruthy();
  });

  it("navega a /settings/connections al tocar la fila", () => {
    render(
      <ThemeProvider>
        <SettingsScreen />
      </ThemeProvider>,
    );
    fireEvent.press(screen.getByText(STRINGS.settings.connectionsRow));
    expect(mockPush).toHaveBeenCalledWith("/settings/connections");
  });
});
