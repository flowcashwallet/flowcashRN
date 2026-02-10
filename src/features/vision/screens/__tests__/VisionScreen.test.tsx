import { fireEvent, render } from "@testing-library/react-native";
import React from "react";
import { useSelector } from "react-redux";
import {
    mockVisionDataFactory,
    mockVisionOperationsFactory,
} from "../../../../tests/mocks";
import { useVisionData } from "../../hooks/useVisionData";
import { useVisionOperations } from "../../hooks/useVisionOperations";
import VisionScreen from "../VisionScreen";

// Mock Hooks
jest.mock("../../hooks/useVisionData");
jest.mock("../../hooks/useVisionOperations");
jest.mock("react-redux", () => ({
  useSelector: jest.fn(),
  useDispatch: jest.fn(),
}));
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

// Mock Notifications
jest.mock("@/services/notifications", () => ({
  registerForPushNotificationsAsync: jest.fn(),
  scheduleCreditCardReminder: jest.fn(),
}));

// Mock simple UI components
jest.mock("@/components/ui/icon-symbol", () => ({
  IconSymbol: ({ name }: any) => {
    const { Text } = jest.requireActual("react-native");
    return <Text>{`Icon: ${name}`}</Text>;
  },
}));

// Mock Components with Dependencies
jest.mock("../../components/AddEntityModal", () => ({
  AddEntityModal: ({ visible }: any) => {
    const { Text } = jest.requireActual("react-native");
    return visible ? <Text>AddEntityModal</Text> : null;
  },
}));

jest.mock("../../components/EntityDetailModal", () => ({
  EntityDetailModal: ({ visible, onDelete }: any) => {
    const { Text, TouchableOpacity } = jest.requireActual("react-native");
    return visible ? (
      <TouchableOpacity onPress={onDelete}>
        <Text>EntityDetailModal</Text>
        <Text>Delete Entity</Text>
      </TouchableOpacity>
    ) : null;
  },
}));

jest.mock("../../components/VisionFilterModal", () => ({
  VisionFilterModal: ({ visible }: any) => {
    const { Text } = jest.requireActual("react-native");
    return visible ? <Text>VisionFilterModal</Text> : null;
  },
}));

jest.mock("../../components/VisionSortModal", () => ({
  VisionSortModal: ({ visible }: any) => {
    const { Text } = jest.requireActual("react-native");
    return visible ? <Text>VisionSortModal</Text> : null;
  },
}));

// Mock Chart Library (causes syntax errors if not mocked)
jest.mock("react-native-gifted-charts", () => ({
  PieChart: () => "PieChart",
}));

// Mock ExportTransactions to avoid Redux dependency
jest.mock("@/features/wallet/components/ExportTransactions", () => ({
  ExportTransactions: () => "ExportTransactions",
}));

// Keep VisionHeader and VisionEntityList real if possible,
// but if they have complex dependencies, we might mock them.
// Let's assume they are "Safe" to render or we mock specific parts inside them if needed.
// However, VisionEntityList might use FlashList. If so, we might need to mock FlashList.
// For now, let's try to render them.

describe("VisionScreen", () => {
  // Default mock state
  const mockVisionData = mockVisionDataFactory();
  const mockVisionOperations = mockVisionOperationsFactory();

  beforeEach(() => {
    jest.clearAllMocks();
    (useVisionData as jest.Mock).mockReturnValue(mockVisionData);
    (useVisionOperations as jest.Mock).mockReturnValue(mockVisionOperations);
    (useSelector as unknown as jest.Mock).mockReturnValue({
      user: { id: "1" },
    });
  });

  it("renders correctly", async () => {
    const { getByText, getAllByText } = render(<VisionScreen />);

    // Check Header Stats
    expect(getByText("$250,000.00")).toBeTruthy(); // Net Worth

    // Use loose match (multiple because of Tab and Header)
    expect(getAllByText(/Activos/).length).toBeGreaterThan(0);
    expect(getAllByText(/Pasivos/).length).toBeGreaterThan(0);

    // Check Assets Tab Selected by default
    expect(getByText("House")).toBeTruthy();
    expect(getByText("$500,000.00")).toBeTruthy();
    expect(getByText("Stocks")).toBeTruthy();
  });

  it("switches to Liabilities tab", async () => {
    const { getByText, getByRole } = render(<VisionScreen />);

    // Best Practice: Access by Role (Accessibility) instead of TestID
    fireEvent.press(getByRole("tab", { name: "Pasivos" }));

    expect(getByText("Mortgage")).toBeTruthy();
  });

  it("deletes entity on confirm", async () => {
    const { getByText } = render(<VisionScreen />);

    // Open Detail
    fireEvent.press(getByText("House"));
    expect(getByText("EntityDetailModal")).toBeTruthy();

    // Trigger delete via Mock Modal
    fireEvent.press(getByText("Delete Entity"));

    // Verify delete operation was called
    expect(mockVisionOperations.handleDeleteEntity).toHaveBeenCalledWith("1");

    // Modal should close (or we wait for it to close)
    // In logic: handleDelete -> await handleDeleteEntity -> setDetailModalVisible(false)
    // Since mock is synchronous here, it should be immediate or require waitFor.
    // However, setDetailModalVisible(false) might not remove the element immediately if it was real modal,
    // but here it is a conditional render.
    // Let's verify operation call first.
  });

  it("opens Add Modal", async () => {
    const { getByText } = render(<VisionScreen />);

    // Press Add Button (Floating Action Button usually has an Icon)
    // We mocked IconSymbol. The FAB likely has "Icon: plus".
    fireEvent.press(getByText("Icon: plus"));

    expect(getByText("AddEntityModal")).toBeTruthy();
  });

  it("opens Detail Modal on item press", async () => {
    const { getByText } = render(<VisionScreen />);

    // Press an item
    fireEvent.press(getByText("House"));

    expect(getByText("EntityDetailModal")).toBeTruthy();
  });
});
