import { GlassSurface } from "@/components/atoms/GlassSurface";
import { Input } from "@/components/atoms/Input";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { BorderRadius, Spacing } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";
import STRINGS from "@/i18n/es.json";
import React, { useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

interface ChatComposerProps {
  onSend: (text: string) => void;
  disabled?: boolean;
}

/**
 * Barra de envío, anclada abajo de `AiChatScreen`. Es una superficie propia
 * flotando sobre la lista de mensajes, así que lleva cristal por defecto
 * (misma regla que el resto de superficies flotantes de la app).
 */
export function ChatComposer({ onSend, disabled }: ChatComposerProps) {
  const { colors } = useTheme();
  const [text, setText] = useState("");

  const canSend = text.trim().length > 0 && !disabled;

  const handleSend = () => {
    if (!canSend) return;
    onSend(text.trim());
    setText("");
  };

  return (
    <GlassSurface
      style={styles.bar}
      fallbackStyle={[
        styles.flatBar,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      {/* `Input` trae un `marginBottom` fijo pensado para formularios apilados;
          se cancela aquí para que se alinee bien dentro de esta barra horizontal. */}
      <View style={styles.inputWrapper}>
        <Input
          value={text}
          onChangeText={setText}
          placeholder={STRINGS.aiChat.composerPlaceholder}
          multiline
          editable={!disabled}
          onSubmitEditing={handleSend}
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
    </GlassSurface>
  );
}

const styles = StyleSheet.create({
  /** Layout de la barra, común a la variante con cristal y a la plana. */
  bar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: Spacing.s,
    padding: Spacing.s,
    borderTopLeftRadius: BorderRadius.l,
    borderTopRightRadius: BorderRadius.l,
    overflow: "hidden",
  },
  /** Hairline superior: solo cuando no hay cristal. */
  flatBar: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  inputWrapper: {
    flex: 1,
    marginBottom: -Spacing.m,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.round,
    alignItems: "center",
    justifyContent: "center",
  },
});
