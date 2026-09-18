import { ThemeProvider } from "@/contexts/ThemeContext";
import { ChatComposer } from "@/features/ai-chat/components/ChatComposer";
import STRINGS from "@/i18n/es.json";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import * as ImagePicker from "expo-image-picker";
import React from "react";
import { Alert } from "react-native";

jest.mock("expo-image-picker", () => ({
  MediaTypeOptions: { Images: "Images" },
  requestCameraPermissionsAsync: jest.fn(),
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));

const mockImagePicker = ImagePicker as jest.Mocked<typeof ImagePicker>;

function renderComposer(
  props: Partial<React.ComponentProps<typeof ChatComposer>> = {},
) {
  return render(
    <ThemeProvider>
      <ChatComposer onSend={jest.fn()} {...props} />
    </ThemeProvider>,
  );
}

/** Simula tocar el botón del `Alert.alert` de selección de fuente (cámara/galería). */
function pressAttachOption(label: string) {
  const alertSpy = jest.spyOn(Alert, "alert");
  fireEvent.press(screen.getByLabelText(STRINGS.aiChat.attachImage));
  const buttons = alertSpy.mock.calls[alertSpy.mock.calls.length - 1][2] as {
    text: string;
    onPress?: () => void;
  }[];
  buttons.find((b) => b.text === label)?.onPress?.();
}

describe("ChatComposer — texto", () => {
  it("no manda nada si el texto está vacío y no hay imágenes", () => {
    const onSend = jest.fn();
    renderComposer({ onSend });

    fireEvent.press(screen.getByLabelText(STRINGS.aiChat.sendMessage));

    expect(onSend).not.toHaveBeenCalled();
  });

  it("manda el texto recortado y limpia el campo al enviar", () => {
    const onSend = jest.fn();
    renderComposer({ onSend });

    const input = screen.getByPlaceholderText(STRINGS.aiChat.composerPlaceholder);
    fireEvent.changeText(input, "  ¿cuánto llevo gastado?  ");
    fireEvent.press(screen.getByLabelText(STRINGS.aiChat.sendMessage));

    expect(onSend).toHaveBeenCalledWith({
      text: "¿cuánto llevo gastado?",
      images: [],
      attachmentUris: [],
    });
    expect(input.props.value).toBe("");
  });

  it("no permite enviar mientras `disabled` está activo, aunque haya texto", () => {
    const onSend = jest.fn();
    renderComposer({ onSend, disabled: true });

    const input = screen.getByPlaceholderText(STRINGS.aiChat.composerPlaceholder);
    fireEvent.changeText(input, "hola");
    fireEvent.press(screen.getByLabelText(STRINGS.aiChat.sendMessage));

    expect(onSend).not.toHaveBeenCalled();
  });
});

describe("ChatComposer — adjuntar imágenes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("permite mandar solo imágenes, sin texto", async () => {
    mockImagePicker.requestMediaLibraryPermissionsAsync.mockResolvedValue({
      granted: true,
    } as any);
    mockImagePicker.launchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: "file://a.jpg", base64: "abc", mimeType: "image/jpeg" }],
    } as any);

    const onSend = jest.fn();
    renderComposer({ onSend });

    pressAttachOption(STRINGS.aiChat.attachFromGallery);
    await waitFor(() => expect(mockImagePicker.launchImageLibraryAsync).toHaveBeenCalled());

    fireEvent.press(screen.getByLabelText(STRINGS.aiChat.sendMessage));

    expect(onSend).toHaveBeenCalledWith({
      text: "",
      images: [{ mediaType: "image/jpeg", base64: "abc" }],
      attachmentUris: ["file://a.jpg"],
    });
  });

  it("la foto de cámara se agrega igual que la de galería", async () => {
    mockImagePicker.requestCameraPermissionsAsync.mockResolvedValue({ granted: true } as any);
    mockImagePicker.launchCameraAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: "file://cam.jpg", base64: "xyz", mimeType: "image/jpeg" }],
    } as any);

    const onSend = jest.fn();
    renderComposer({ onSend });

    pressAttachOption(STRINGS.aiChat.attachFromCamera);
    await waitFor(() => expect(mockImagePicker.launchCameraAsync).toHaveBeenCalled());

    fireEvent.press(screen.getByLabelText(STRINGS.aiChat.sendMessage));
    expect(onSend).toHaveBeenCalledWith(
      expect.objectContaining({ attachmentUris: ["file://cam.jpg"] }),
    );
  });

  it("no adjunta nada si se niega el permiso de galería", async () => {
    mockImagePicker.requestMediaLibraryPermissionsAsync.mockResolvedValue({
      granted: false,
    } as any);
    const alertSpy = jest.spyOn(Alert, "alert");

    renderComposer();
    pressAttachOption(STRINGS.aiChat.attachFromGallery);

    await waitFor(() =>
      expect(mockImagePicker.requestMediaLibraryPermissionsAsync).toHaveBeenCalled(),
    );
    expect(mockImagePicker.launchImageLibraryAsync).not.toHaveBeenCalled();
    expect(alertSpy).toHaveBeenCalledWith(
      STRINGS.aiChat.permissionRequiredTitle,
      STRINGS.aiChat.libraryPermissionMessage,
    );
  });

  it("se puede quitar una imagen ya adjuntada antes de enviar", async () => {
    mockImagePicker.requestMediaLibraryPermissionsAsync.mockResolvedValue({
      granted: true,
    } as any);
    mockImagePicker.launchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: "file://a.jpg", base64: "abc", mimeType: "image/jpeg" }],
    } as any);

    const onSend = jest.fn();
    renderComposer({ onSend });

    pressAttachOption(STRINGS.aiChat.attachFromGallery);
    await waitFor(() => expect(screen.getByLabelText(STRINGS.aiChat.removeImage)).toBeTruthy());

    fireEvent.press(screen.getByLabelText(STRINGS.aiChat.removeImage));
    fireEvent.press(screen.getByLabelText(STRINGS.aiChat.sendMessage));

    expect(onSend).not.toHaveBeenCalled();
  });
});
