import { Colors } from "@/constants/theme";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { MonthYearPickerModal } from "@/features/wallet/components/MonthYearPickerModal";
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

const SELECTED = new Date(2026, 2, 15); // 15 de marzo de 2026

function renderPicker(
  props: Partial<React.ComponentProps<typeof MonthYearPickerModal>> = {},
) {
  return render(
    <ThemeProvider>
      <MonthYearPickerModal
        visible
        onClose={jest.fn()}
        selectedDate={SELECTED}
        onSelect={jest.fn()}
        {...props}
      />
    </ThemeProvider>,
  );
}

describe("MonthYearPickerModal migrado a BottomSheet", () => {
  beforeEach(() => mockColorScheme.mockReturnValue("light"));

  it("renders the sheet header and the twelve months", () => {
    renderPicker();
    expect(screen.getByText("2026")).toBeTruthy();
    expect(screen.getByText("Ene")).toBeTruthy();
    expect(screen.getByText("Dic")).toBeTruthy();
  });

  it("keeps the select-then-close behaviour on a month", () => {
    const onSelect = jest.fn();
    const onClose = jest.fn();
    renderPicker({ onSelect, onClose });

    fireEvent.press(screen.getByText("Ene"));

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect.mock.calls[0][0].getMonth()).toBe(0);
    expect(onSelect.mock.calls[0][0].getFullYear()).toBe(2026);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("steps the year without closing the sheet", () => {
    const onClose = jest.fn();
    renderPicker({ onClose });

    fireEvent.press(screen.getByLabelText("Año anterior"));
    expect(screen.getByText("2025")).toBeTruthy();

    fireEvent.press(screen.getByLabelText("Año siguiente"));
    expect(screen.getByText("2026")).toBeTruthy();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("dismisses from the BottomSheet backdrop", () => {
    const onClose = jest.fn();
    renderPicker({ onClose });
    fireEvent.press(screen.getAllByLabelText("Cerrar")[0]);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("offers a single year CTA in year mode", () => {
    const onSelect = jest.fn();
    renderPicker({ mode: "year", onSelect });

    expect(screen.queryByText("Ene")).toBeNull();
    fireEvent.press(screen.getByText(/^Año 2026$/));
    expect(onSelect).toHaveBeenCalled();
  });

  it("uses `onPrimary` on the selected month in light and dark", () => {
    renderPicker();
    expect(
      (StyleSheet.flatten(screen.getByText("Mar").props.style) as any).color,
    ).toBe(Colors.light.onPrimary);
    screen.unmount();

    mockColorScheme.mockReturnValue("dark");
    renderPicker();
    expect(
      (StyleSheet.flatten(screen.getByText("Mar").props.style) as any).color,
    ).toBe(Colors.dark.onPrimary);
  });
});
