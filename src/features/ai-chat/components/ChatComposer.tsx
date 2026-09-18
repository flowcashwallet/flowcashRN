import { GlassSurface } from "@/components/atoms/GlassSurface";
import { Input } from "@/components/atoms/Input";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { BorderRadius, Spacing } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";
import { OutgoingChatImage } from "@/features/ai-chat/data/aiChatSlice";
import STRINGS from "@/i18n/es.json";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import { Alert, Image, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";

/** Espejo del límite del backend (`MAX_IMAGES_PER_TURN` en `ai_chat.py`) — evita un round-trip que el 400 rechazaría igual. */
const MAX_IMAGES_PER_TURN = 4;

interface ComposerImage {
  uri: string;
  base64: string;
  mediaType: string;
}

export interface ChatComposerSubmission {
  text: string;
  images: OutgoingChatImage[];
  /** URIs locales, solo para pintar la miniatura en la burbuja del usuario. */
  attachmentUris: string[];
}

interface ChatComposerProps {
  onSend: (submission: ChatComposerSubmission) => void;
  disabled?: boolean;
}

function mediaTypeFromAsset(asset: ImagePicker.ImagePickerAsset): string {
  // `mimeType` no siempre viene (depende de plataforma/origen) — jpeg es un
  // default razonable, es el formato en el que `expo-image-picker` reencoda
  // el base64 cuando la fuente no es ya jpeg/png.
  return asset.mimeType ?? "image/jpeg";
}

/**
 * Barra de envío, anclada abajo de `AiChatScreen`. Es una superficie propia
 * flotando sobre la lista de mensajes, así que lleva cristal por defecto
 * (misma regla que el resto de superficies flotantes de la app).
 *
 * El botón de adjuntar deja elegir cámara o galería (esta última admite
 * varias a la vez) — igual que el flujo de escaneo de recibos de Wallet, pero
 * aquí las imágenes se mandan tal cual al modelo en vez de pasar por OCR
 * local: es Claude quien extrae las transacciones de la foto.
 */
export function ChatComposer({ onSend, disabled }: ChatComposerProps) {
  const { colors } = useTheme();
  const [text, setText] = useState("");
  const [images, setImages] = useState<ComposerImage[]>([]);

  const remainingSlots = MAX_IMAGES_PER_TURN - images.length;
  const canAttach = !disabled && remainingSlots > 0;
  const canSend = (text.trim().length > 0 || images.length > 0) && !disabled;

  const addImages = (assets: ImagePicker.ImagePickerAsset[]) => {
    const withBase64 = assets.filter((asset) => !!asset.base64);
    if (withBase64.length < assets.length) {
      Alert.alert(STRINGS.aiChat.imagePickerErrorTitle, STRINGS.aiChat.imageMissingDataMessage);
    }
    setImages((current) => [
      ...current,
      ...withBase64.slice(0, MAX_IMAGES_PER_TURN - current.length).map((asset) => ({
        uri: asset.uri,
        base64: asset.base64!,
        mediaType: mediaTypeFromAsset(asset),
      })),
    ]);
  };

  const pickFromCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(STRINGS.aiChat.permissionRequiredTitle, STRINGS.aiChat.cameraPermissionMessage);
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.6, base64: true });
    if (!result.canceled) addImages(result.assets);
  };

  const pickFromLibrary = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(STRINGS.aiChat.permissionRequiredTitle, STRINGS.aiChat.libraryPermissionMessage);
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.6,
      base64: true,
      allowsMultipleSelection: remainingSlots > 1,
      selectionLimit: remainingSlots,
    });
    if (!result.canceled) addImages(result.assets);
  };

  const handleAttach = () => {
    if (!canAttach) return;
    Alert.alert(STRINGS.aiChat.attachImage, undefined, [
      { text: STRINGS.aiChat.attachFromCamera, onPress: pickFromCamera },
      { text: STRINGS.aiChat.attachFromGallery, onPress: pickFromLibrary },
      { text: STRINGS.common.cancel, style: "cancel" },
    ]);
  };

  const removeImage = (uri: string) => {
    setImages((current) => current.filter((img) => img.uri !== uri));
  };

  const handleSend = () => {
    if (!canSend) return;
    onSend({
      text: text.trim(),
      images: images.map((img) => ({ mediaType: img.mediaType, base64: img.base64 })),
      attachmentUris: images.map((img) => img.uri),
    });
    setText("");
    setImages([]);
  };

  return (
    <GlassSurface
      style={styles.bar}
      fallbackStyle={[
        styles.flatBar,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      {images.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.previewStrip}
          contentContainerStyle={styles.previewContent}
        >
          {images.map((img) => (
            <View key={img.uri} style={styles.previewThumbWrapper}>
              <Image source={{ uri: img.uri }} style={styles.previewThumb} />
              <TouchableOpacity
                onPress={() => removeImage(img.uri)}
                accessibilityRole="button"
                accessibilityLabel={STRINGS.aiChat.removeImage}
                style={styles.previewRemove}
              >
                <IconSymbol name="xmark.circle.fill" size={18} color={colors.onPrimary} />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      ) : null}

      <View style={styles.row}>
        <TouchableOpacity
          onPress={handleAttach}
          disabled={!canAttach}
          accessibilityRole="button"
          accessibilityLabel={STRINGS.aiChat.attachImage}
          style={[styles.attachButton, { opacity: canAttach ? 1 : 0.4 }]}
        >
          <IconSymbol name="paperclip" size={20} color={colors.icon} />
        </TouchableOpacity>

        {/* `Input` trae un `marginBottom` fijo pensado para formularios apilados;
            se cancela aquí para que se alinee bien dentro de esta barra horizontal.
            Su caja interior pinta `colors.surface` por defecto — igual que el
            fondo plano de esta barra y el de las burbujas del asistente, así
            que sin el override de abajo el campo de texto se funde con todo lo
            que lo rodea y no se distingue. `surfaceHighlight` es el token que
            la app ya usa para "elemento realzado dentro de una superficie"
            (el disco de icono de `TransactionItem`, los toggles de
            `AddEntityModal`). */}
        <View style={styles.inputWrapper}>
          <Input
            value={text}
            onChangeText={setText}
            placeholder={STRINGS.aiChat.composerPlaceholder}
            multiline
            editable={!disabled}
            onSubmitEditing={handleSend}
            style={{ backgroundColor: colors.surfaceHighlight }}
          />
        </View>
        <TouchableOpacity
          onPress={handleSend}
          disabled={!canSend}
          accessibilityRole="button"
          accessibilityLabel={STRINGS.aiChat.sendMessage}
          style={[
            styles.sendButton,
            { backgroundColor: canSend ? colors.primary : colors.icon },
          ]}
        >
          <IconSymbol name="paperplane.fill" size={18} color={colors.onPrimary} />
        </TouchableOpacity>
      </View>
    </GlassSurface>
  );
}

const styles = StyleSheet.create({
  /** Layout de la barra, común a la variante con cristal y a la plana. */
  bar: {
    padding: Spacing.s,
    borderTopLeftRadius: BorderRadius.l,
    borderTopRightRadius: BorderRadius.l,
    overflow: "hidden",
  },
  /** Hairline superior: solo cuando no hay cristal. */
  flatBar: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: Spacing.s,
  },
  previewStrip: {
    marginBottom: Spacing.s,
  },
  previewContent: {
    gap: Spacing.s,
  },
  previewThumbWrapper: {
    position: "relative",
  },
  previewThumb: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.m,
  },
  previewRemove: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: BorderRadius.round,
  },
  attachButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.m,
  },
  inputWrapper: {
    flex: 1,
    marginBottom: Spacing.m,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.round,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xl,
  },
});
