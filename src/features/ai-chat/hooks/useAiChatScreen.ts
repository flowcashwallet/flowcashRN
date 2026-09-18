import { useTheme } from "@/contexts/ThemeContext";
import {
  cancelTransactionProposal,
  confirmTransactionProposal,
  sendChatMessage,
  sendMessage,
} from "@/features/ai-chat/data/aiChatSlice";
import { AppDispatch, RootState } from "@/store/store";
import { useRouter } from "expo-router";
import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";

/**
 * v1 es solo de sesión: el historial vive en `state.aiChat` mientras la app
 * esté abierta, sin fetch/persistencia al montar la pantalla (a diferencia de
 * otros hooks de screen que sí cargan datos del backend al entrar).
 */
export const useAiChatScreen = () => {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { colors } = useTheme();

  const { messages, status, error } = useSelector(
    (state: RootState) => state.aiChat,
  );

  const handleSend = useCallback(
    (text: string) => {
      dispatch(sendMessage(text));
      dispatch(sendChatMessage(text));
    },
    [dispatch],
  );

  const handleConfirmProposal = useCallback(
    (messageId: string) => {
      const message = messages.find((m) => m.id === messageId);
      if (!message?.transactionProposal) return;
      dispatch(
        confirmTransactionProposal({
          messageId,
          proposal: message.transactionProposal,
        }),
      );
    },
    [dispatch, messages],
  );

  const handleCancelProposal = useCallback(
    (messageId: string) => {
      dispatch(cancelTransactionProposal(messageId));
    },
    [dispatch],
  );

  const goBack = useCallback(() => router.back(), [router]);

  return {
    colors,
    messages,
    isLoading: status === "loading",
    error,
    handleSend,
    handleConfirmProposal,
    handleCancelProposal,
    goBack,
  };
};
