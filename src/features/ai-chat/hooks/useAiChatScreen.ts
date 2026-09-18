import { useTheme } from "@/contexts/ThemeContext";
import { ChatComposerSubmission } from "@/features/ai-chat/components/ChatComposer";
import {
  cancelTransactionProposal,
  confirmTransactionProposal,
  sendChatMessage,
  sendMessage,
  updateProposalAccount,
} from "@/features/ai-chat/data/aiChatSlice";
import { fetchVisionEntities } from "@/features/vision/data/visionSlice";
import { AppDispatch, RootState } from "@/store/store";
import { useRouter } from "expo-router";
import { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

/**
 * v1 es solo de sesión: el historial vive en `state.aiChat` mientras la app
 * esté abierta, sin fetch/persistencia al montar la pantalla (a diferencia de
 * otros hooks de screen que sí cargan datos del backend al entrar). Las
 * cuentas de Balance sí se cargan al entrar — el selector de cuenta de cada
 * tarjeta de propuesta las necesita y el chat puede abrirse sin haber
 * visitado antes esa pestaña.
 */
export const useAiChatScreen = () => {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { colors } = useTheme();

  const { messages, status, error } = useSelector(
    (state: RootState) => state.aiChat,
  );
  const visionEntities = useSelector((state: RootState) => state.vision.entities);

  useEffect(() => {
    dispatch(fetchVisionEntities());
  }, [dispatch]);

  const handleSend = useCallback(
    ({ text, images, attachmentUris }: ChatComposerSubmission) => {
      dispatch(sendMessage({ text, attachmentUris }));
      dispatch(sendChatMessage({ text, images }));
    },
    [dispatch],
  );

  const handleConfirmProposal = useCallback(
    (messageId: string, proposalId: string) => {
      const message = messages.find((m) => m.id === messageId);
      const entry = message?.proposals?.find((p) => p.id === proposalId);
      if (!entry) return;
      dispatch(
        confirmTransactionProposal({
          messageId,
          proposalId,
          proposal: entry.proposal,
        }),
      );
    },
    [dispatch, messages],
  );

  const handleCancelProposal = useCallback(
    (messageId: string, proposalId: string) => {
      dispatch(cancelTransactionProposal({ messageId, proposalId }));
    },
    [dispatch],
  );

  const handleSelectProposalAccount = useCallback(
    (
      messageId: string,
      proposalId: string,
      accountId: string | null,
      accountName: string | null,
    ) => {
      dispatch(updateProposalAccount({ messageId, proposalId, accountId, accountName }));
    },
    [dispatch],
  );

  const goBack = useCallback(() => router.back(), [router]);

  return {
    colors,
    messages,
    isLoading: status === "loading",
    error,
    visionEntities,
    handleSend,
    handleConfirmProposal,
    handleCancelProposal,
    handleSelectProposalAccount,
    goBack,
  };
};
