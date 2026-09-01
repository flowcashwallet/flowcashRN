/* global jest */
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

/**
 * `jest-expo` corre con `defaultPlatform: "ios"`, así que Metro/Jest resuelven
 * las variantes `.ios` de `expo-glass-effect`, que llaman a `requireNativeModule`
 * / `requireNativeViewManager` al importarse y revientan sin runtime nativo.
 *
 * El default es `isGlassEffectAPIAvailable() === false`, o sea **la fila plana**:
 * es el fallback que ve Android y el que deben seguir viendo todas las suites
 * que no estén probando el cristal. Quien quiera probar la rama con cristal
 * hace `jest.mocked(isGlassEffectAPIAvailable).mockReturnValue(true)`.
 */
jest.mock("expo-glass-effect", () => {
  const React = require("react");
  const { View } = require("react-native");
  const GlassView = ({ children, ...props }) =>
    React.createElement(View, { testID: "glass-view", ...props }, children);
  GlassView.displayName = "GlassView";
  return {
    GlassView,
    GlassContainer: GlassView,
    isGlassEffectAPIAvailable: jest.fn(() => false),
    isLiquidGlassAvailable: jest.fn(() => false),
  };
});
