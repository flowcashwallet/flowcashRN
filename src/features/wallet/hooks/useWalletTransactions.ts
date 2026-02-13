import { fetchVisionEntities } from "@/features/vision/data/visionSlice";
import STRINGS from "@/i18n/es.json";
import { AppDispatch, RootState } from "@/store/store";
import { parseAmount } from "@/utils/format";
import { useState } from "react";
import { Alert } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import {
  addTransaction as addTransactionAction,
  deleteMultipleTransactions,
  deleteTransaction as deleteTransactionAction,
  updateTransaction as updateTransactionAction,
} from "../data/walletSlice";

interface TransactionData {
  amount: string;
  description: string;
  type: "income" | "expense" | "transfer";
  category?: string | null;
  relatedEntityId?: string | null;
  transferRelatedEntityId?: string | null;
  date?: number;
  paymentType?:
    | "credit_card"
    | "debit_card"
    | "cash"
    | "transfer"
    | "payroll"
    | null;
}

interface UpdateTransactionData extends TransactionData {
  id: string;
  oldAmount: number;
  oldEntityId?: string | null;
  oldTransferRelatedEntityId?: string | null;
}

export const useWalletTransactions = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const [isSaving, setIsSaving] = useState(false);

  const addTransaction = async (data: TransactionData) => {
    if (!data.amount || !data.description || !user?.id) return;

    setIsSaving(true);
    try {
      await dispatch(
        addTransactionAction({
          amount: parseAmount(data.amount),
          description: data.description,
          type: data.type,
          ...(data.category ? { category: data.category } : {}),
          ...(data.relatedEntityId
            ? { relatedEntityId: data.relatedEntityId as string }
            : {}),
          ...(data.transferRelatedEntityId
            ? {
                transferRelatedEntityId: data.transferRelatedEntityId as string,
              }
            : {}),
          date: data.date || Date.now(),
          paymentType: data.paymentType,
        }),
      ).unwrap();

      dispatch(fetchVisionEntities());
      return true;
    } catch (error) {
      console.error("Error adding transaction:", error);
      alert(STRINGS.wallet.saveError + error);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const updateTransaction = async (data: UpdateTransactionData) => {
    if (!user?.id) return;
    setIsSaving(true);

    const newAmount = parseAmount(data.amount);

    try {
      await dispatch(
        updateTransactionAction({
          id: data.id,
          updates: {
            description: data.description,
            category: data.category || null,
            relatedEntityId: data.relatedEntityId || null,
            transferRelatedEntityId: data.transferRelatedEntityId || null,
            amount: newAmount,
            ...(data.date ? { date: data.date } : {}),
            ...(data.paymentType !== undefined
              ? { paymentType: data.paymentType }
              : {}),
          },
        }),
      ).unwrap();
      dispatch(fetchVisionEntities());
      return true;
    } catch (error: any) {
      console.error("Error updating transaction:", error);
      alert(STRINGS.wallet.updateError + error);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const deleteTransaction = (id: string) => {
    return new Promise((resolve) => {
      Alert.alert(
        STRINGS.wallet.deleteTransactionTitle,
        STRINGS.wallet.deleteTransactionMessage,
        [
          {
            text: STRINGS.common.cancel,
            style: "cancel",
            onPress: () => resolve(false),
          },
          {
            text: STRINGS.common.delete,
            style: "destructive",
            onPress: async () => {
              dispatch(deleteTransactionAction(id))
                .unwrap()
                .then(() => {
                  dispatch(fetchVisionEntities());
                  resolve(true);
                })
                .catch((error: any) => {
                  console.error("Error deleting transaction:", error);
                  resolve(false);
                });
            },
          },
        ],
      );
    });
  };

  const deleteMonthlyTransactions = (
    transactionsToDelete: any[],
    monthName: string,
  ) => {
    if (transactionsToDelete.length === 0) {
      Alert.alert(
        STRINGS.common.warning,
        STRINGS.wallet.noTransactionsToDelete,
      );
      return;
    }

    Alert.alert(
      STRINGS.wallet.deleteMonthTitle,
      STRINGS.wallet.deleteMonthMessage.replace("{month}", monthName),
      [
        {
          text: STRINGS.common.cancel,
          style: "cancel",
        },
        {
          text: STRINGS.wallet.deleteAll,
          style: "destructive",
          onPress: async () => {
            const idsToDelete = transactionsToDelete.map((t) => t.id);
            dispatch(deleteMultipleTransactions(idsToDelete))
              .unwrap()
              .then(() => {
                dispatch(fetchVisionEntities());
              })
              .catch((error: any) => {
                console.error("Error deleting monthly transactions:", error);
                alert(STRINGS.wallet.deleteError + error);
              });
          },
        },
      ],
    );
  };

  return {
    isSaving,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    deleteMonthlyTransactions,
  };
};
