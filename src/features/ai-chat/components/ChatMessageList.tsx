import { Typography } from "@/components/atoms/Typography";
import { Spacing } from "@/constants/theme";
import { ChatBubble } from "@/features/ai-chat/components/ChatBubble";
import { ChatTypingIndicator } from "@/features/ai-chat/components/ChatTypingIndicator";
import { ChatMessage } from "@/features/ai-chat/data/aiChatSlice";
import STRINGS from "@/i18n/es.json";
import React, { useRef } from "react";
import { FlatList, StyleSheet, View } from "react-native";

interface ChatMessageListProps {
  messages: ChatMessage[];
  isLoading: boolean;
}

/**
 * Sin streaming (v1), la lista simplemente crece turno a turno — el
 * `ChatTypingIndicator` en el pie es la única señal intermedia mientras se
 * espera la respuesta.
 */
export function ChatMessageList({ messages, isLoading }: ChatMessageListProps) {
  const listRef = useRef<FlatList<ChatMessage>>(null);

  if (messages.length === 0 && !isLoading) {
    return (
      <View style={styles.emptyState}>
        <Typography variant="heading" style={styles.emptyTitle}>
          {STRINGS.aiChat.emptyTitle}
        </Typography>
        <Typography variant="body" muted style={styles.emptySubtitle}>
          {STRINGS.aiChat.emptySubtitle}
        </Typography>
      </View>
    );
  }

  return (
    <FlatList
      ref={listRef}
      data={messages}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <ChatBubble message={item} />}
      contentContainerStyle={styles.content}
      ListFooterComponent={isLoading ? <ChatTypingIndicator /> : null}
      onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.m,
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: {
    marginBottom: Spacing.s,
    textAlign: "center",
  },
  emptySubtitle: {
    textAlign: "center",
  },
});
