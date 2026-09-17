import { Typography } from "@/components/atoms/Typography";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { StatisticsScreenStackHeader } from "@/features/analytics/components/StatisticsScreenStackHeader";
import { ChatComposer } from "@/features/ai-chat/components/ChatComposer";
import { ChatMessageList } from "@/features/ai-chat/components/ChatMessageList";
import { useAiChatScreen } from "@/features/ai-chat/hooks/useAiChatScreen";
import STRINGS from "@/i18n/es.json";
import React from "react";
import { KeyboardAvoidingView, Platform, StyleSheet } from "react-native";

/**
 * Ruta stack de nivel superior (`app/ai-chat.tsx`), no un tab ni un modal —
 * mismo patrón que `StatisticsCategoriesScreen`. Un push simple evita por
 * construcción la clase de bug de `presentation: "formSheet"` vs `"pageSheet"`
 * ya sufrida en Wallet/Vision con contenido `GlassSurface`.
 */
export default function AiChatScreen() {
  const { colors, messages, isLoading, error, handleSend, goBack } =
    useAiChatScreen();

  return (
    <>
      <StatisticsScreenStackHeader
        title={STRINGS.aiChat.title}
        colors={colors}
        onBack={goBack}
      />
      <ThemedView style={styles.container}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        >
          <ChatMessageList messages={messages} isLoading={isLoading} />
          {error ? (
            <Typography
              variant="caption"
              style={[styles.error, { color: colors.error }]}
            >
              {STRINGS.aiChat.genericError}
            </Typography>
          ) : null}
          <ChatComposer onSend={handleSend} disabled={isLoading} />
        </KeyboardAvoidingView>
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  error: {
    textAlign: "center",
    paddingVertical: Spacing.xs,
  },
});
