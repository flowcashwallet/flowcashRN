import { configureStore } from "@reduxjs/toolkit";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import React from "react";
import { Provider } from "react-redux";
import authReducer from "../../authSlice";
import RegisterScreen from "../RegisterScreen";

// Mocks
const mockReplace = jest.fn();
const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({
    replace: mockReplace,
    push: mockPush,
  }),
}));

jest.mock("react-native/Libraries/Linking/Linking", () => ({
  openURL: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

describe("RegisterScreen", () => {
  let store: any;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        auth: authReducer,
      },
    });
    jest.clearAllMocks();
  });

  const renderWithStore = (component: React.ReactElement) => {
    return render(<Provider store={store}>{component}</Provider>);
  };

  it("renders correctly", () => {
    const { getByPlaceholderText, getByText } = renderWithStore(
      <RegisterScreen />,
    );

    expect(getByPlaceholderText("Ej. Juan")).toBeTruthy();
    expect(getByPlaceholderText("Ej. Pérez")).toBeTruthy();
    expect(getByPlaceholderText("DD-MM-AAAA")).toBeTruthy();
    expect(getByPlaceholderText("correo@ejemplo.com")).toBeTruthy();
    expect(getByText("Registrarse")).toBeTruthy();
  });

  it("formats date input correctly", () => {
    const { getByPlaceholderText } = renderWithStore(<RegisterScreen />);
    const dateInput = getByPlaceholderText("DD-MM-AAAA");

    fireEvent.changeText(dateInput, "01012000");
    expect(dateInput.props.value).toBe("01-01-2000");
  });

  it("validates required fields", () => {
    const { getByText } = renderWithStore(<RegisterScreen />);

    fireEvent.press(getByText("Registrarse"));

    expect(getByText("Por favor completa todos los campos")).toBeTruthy();
  });

  it("validates date format", () => {
    const { getByPlaceholderText, getByText } = renderWithStore(
      <RegisterScreen />,
    );

    // Fill all fields but with invalid date
    fireEvent.changeText(getByPlaceholderText("Ej. Juan"), "John");
    fireEvent.changeText(getByPlaceholderText("Ej. Pérez"), "Doe");
    fireEvent.changeText(
      getByPlaceholderText("correo@ejemplo.com"),
      "john@example.com",
    );
    fireEvent.changeText(getByPlaceholderText("******"), "password123");

    // Invalid date (month 13)
    const dateInput = getByPlaceholderText("DD-MM-AAAA");
    fireEvent.changeText(dateInput, "01132000"); // 01-13-2000

    fireEvent.press(getByText("Registrarse"));

    expect(
      getByText("Por favor ingresa una fecha válida (DD-MM-AAAA)"),
    ).toBeTruthy();
  });

  it("validates terms acceptance", () => {
    const { getByPlaceholderText, getByText } = renderWithStore(
      <RegisterScreen />,
    );

    fireEvent.changeText(getByPlaceholderText("Ej. Juan"), "John");
    fireEvent.changeText(getByPlaceholderText("Ej. Pérez"), "Doe");
    fireEvent.changeText(getByPlaceholderText("DD-MM-AAAA"), "01012000"); // 01-01-2000
    fireEvent.changeText(
      getByPlaceholderText("correo@ejemplo.com"),
      "john@example.com",
    );
    fireEvent.changeText(getByPlaceholderText("******"), "password123");

    // Terms not checked
    fireEvent.press(getByText("Registrarse"));

    expect(getByText("Debes aceptar los términos y condiciones")).toBeTruthy();
  });

  it("handles successful registration", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        access: "fake-access-token",
        refresh: "fake-refresh-token",
        user: { id: "1", email: "john@example.com" },
      }),
    });

    const { getByPlaceholderText, getByText, getByTestId } = renderWithStore(
      <RegisterScreen />,
    );

    fireEvent.changeText(getByPlaceholderText("Ej. Juan"), "John");
    fireEvent.changeText(getByPlaceholderText("Ej. Pérez"), "Doe");
    // Note: Trigger changeText with unformatted string to test formatter or formatted to skip
    fireEvent.changeText(getByPlaceholderText("DD-MM-AAAA"), "01012000");
    fireEvent.changeText(
      getByPlaceholderText("correo@ejemplo.com"),
      "john@example.com",
    );
    fireEvent.changeText(getByPlaceholderText("******"), "password123");

    // Check terms
    fireEvent.press(getByTestId("terms-checkbox"));

    fireEvent.press(getByText("Registrarse"));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/users/register/"),
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining('"email":"john@example.com"'),
        }),
      );
    });

    // Check if navigation occurred
    expect(mockReplace).toHaveBeenCalledWith("/(drawer)/(tabs)");
  });
});
