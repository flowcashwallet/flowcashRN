import { configureStore } from "@reduxjs/toolkit";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import React from "react";
import { Provider } from "react-redux";
import authReducer from "../../authSlice";
import LoginScreen from "../LoginScreen";

// Mocks
const mockReplace = jest.fn();
const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({
    replace: mockReplace,
    push: mockPush,
  }),
}));

jest.mock("expo-auth-session/providers/google", () => ({
  useAuthRequest: () => [null, null, jest.fn()],
}));

jest.mock("expo-web-browser", () => ({
  maybeCompleteAuthSession: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

describe("LoginScreen", () => {
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
      <LoginScreen />,
    );

    expect(getByPlaceholderText("correo@ejemplo.com")).toBeTruthy();
    expect(getByPlaceholderText("******")).toBeTruthy();
    expect(getByText("Iniciar Sesión")).toBeTruthy();
  });

  it("shows error when fields are empty", () => {
    const { getByText } = renderWithStore(<LoginScreen />);

    fireEvent.press(getByText("Iniciar Sesión"));

    expect(getByText("Por favor ingresa correo y contraseña")).toBeTruthy();
  });

  it("handles successful login", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        access: "fake-token",
        refresh: "fake-refresh-token",
        user: { id: "1", username: "testuser" },
      }),
    });

    const { getByPlaceholderText, getByText } = renderWithStore(
      <LoginScreen />,
    );

    fireEvent.changeText(
      getByPlaceholderText("correo@ejemplo.com"),
      "test@example.com",
    );
    fireEvent.changeText(getByPlaceholderText("******"), "password123");
    fireEvent.press(getByText("Iniciar Sesión"));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/token/"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            username: "test@example.com",
            password: "password123",
          }),
        }),
      );
    });

    // Check if navigation occurred
    expect(mockReplace).toHaveBeenCalledWith("/(drawer)/(tabs)");

    // Check if state was updated
    const state = store.getState().auth;
    expect(state.token).toBe("fake-token");
    expect(state.isAuthenticated).toBe(true);
  });

  it("handles login error", async () => {
    // Suppress console.error for this test
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        detail: "No active account found with the given credentials",
      }),
    });

    const { getByPlaceholderText, getByText } = renderWithStore(
      <LoginScreen />,
    );

    fireEvent.changeText(
      getByPlaceholderText("correo@ejemplo.com"),
      "wrong@example.com",
    );
    fireEvent.changeText(getByPlaceholderText("******"), "wrongpass");
    fireEvent.press(getByText("Iniciar Sesión"));

    await waitFor(() => {
      expect(
        getByText("No active account found with the given credentials"),
      ).toBeTruthy();
    });

    expect(mockReplace).not.toHaveBeenCalled();

    // Restore console.error
    consoleSpy.mockRestore();
  });
});
