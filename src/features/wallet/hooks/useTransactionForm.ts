import { useVisionData } from "@/features/vision/hooks/useVisionData";
import { AppDispatch, RootState } from "@/store/store";
import { formatAmountInput } from "@/utils/format";
import { determineDefaultPaymentType } from "@/utils/transactionUtils";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { fetchCategories } from "../data/categoriesSlice";
import { useWalletTransactions } from "./useWalletTransactions";

export interface UseTransactionFormProps {
  id?: string;
  initialType?: "income" | "expense";
}

export const useTransactionForm = ({
  id,
  initialType,
}: UseTransactionFormProps) => {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { categories } = useSelector((state: RootState) => state.categories);
  const { transactions } = useSelector((state: RootState) => state.wallet);
  const { entities } = useVisionData();

  const { addTransaction, deleteTransaction, updateTransaction } =
    useWalletTransactions();

  const isEditing = !!id;
  const existingTransaction = isEditing
    ? transactions.find((t) => t.id === id)
    : null;

  const [type, setType] = useState<"income" | "expense">(
    (existingTransaction?.type as "income" | "expense") ||
      (initialType as "income" | "expense") ||
      "expense",
  );
  const [amount, setAmount] = useState(
    existingTransaction
      ? formatAmountInput(existingTransaction.amount.toFixed(2))
      : "",
  );
  const [description, setDescription] = useState(
    existingTransaction?.description || "",
  );
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    existingTransaction?.category || null,
  );
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(
    existingTransaction?.relatedEntityId || null,
  );
  const [selectedPaymentType, setSelectedPaymentType] = useState<
    "credit_card" | "debit_card" | "cash" | "transfer" | "payroll" | null
  >(
    existingTransaction?.paymentType ||
      determineDefaultPaymentType(transactions, type),
  );
  const [date, setDate] = useState(
    new Date(existingTransaction?.date || Date.now()),
  );

  const [isSaving, setIsSaving] = useState(false);
  const [isNotificationSetupVisible, setIsNotificationSetupVisible] =
    useState(false);

  // Load categories if needed
  useEffect(() => {
    if (user?.uid && categories.length === 0) {
      dispatch(fetchCategories(user.uid));
    }
  }, [user, dispatch, categories.length]);

  // Update default payment type
  useEffect(() => {
    if (!isEditing) {
      const suggestedPaymentType = determineDefaultPaymentType(
        transactions,
        type,
      );
      setSelectedPaymentType(suggestedPaymentType);
    }
  }, [type, transactions, isEditing]);

  // Frequent items logic
  const frequentCategories = useMemo(() => {
    if (!transactions || transactions.length === 0) return [];
    const categoryCounts: Record<string, number> = {};
    transactions
      .filter((t) => t.type === type)
      .forEach((t) => {
        if (t.category) {
          categoryCounts[t.category] = (categoryCounts[t.category] || 0) + 1;
        }
      });
    return Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([cat]) => cat);
  }, [transactions, type]);

  const frequentEntities = useMemo(() => {
    if (!transactions || !entities) return [];
    const entityCounts: Record<string, number> = {};
    transactions.forEach((t) => {
      if (t.relatedEntityId) {
        entityCounts[t.relatedEntityId] =
          (entityCounts[t.relatedEntityId] || 0) + 1;
      }
    });
    return Object.entries(entityCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id]) => entities.find((e) => e.id === id))
      .filter((e) => e !== undefined);
  }, [transactions, entities]);

  const resetForm = () => {
    setAmount("");
    setDescription("");
    setSelectedCategory(null);
    // Keep date and payment type as they are likely to be reused in batch entry
    // Keep entity as well? Maybe reset entity? Let's keep it for now.
    // Resetting entity might be annoying if entering multiple expenses for the same credit card.
  };

  const handleSave = async (shouldClose = true) => {
    if (!amount || !description || !user?.uid) {
      Alert.alert("Error", "Por favor completa los campos requeridos");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return false;
    }

    setIsSaving(true);
    try {
      let success = false;
      if (isEditing && existingTransaction) {
        success =
          (await updateTransaction({
            id: existingTransaction.id,
            amount: amount,
            description,
            type,
            category: selectedCategory || "General",
            relatedEntityId: selectedEntityId || null,
            oldAmount: existingTransaction.amount,
            oldEntityId: existingTransaction.relatedEntityId,
            date: date.getTime(),
            paymentType: selectedPaymentType,
          })) || false;
      } else {
        success =
          (await addTransaction({
            amount: amount,
            description,
            type,
            category: selectedCategory || "General",
            relatedEntityId: selectedEntityId || null,
            date: date.getTime(),
            paymentType: selectedPaymentType,
          })) || false;
      }

      if (success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        if (!shouldClose) {
          // Batch entry mode
          resetForm();
          Alert.alert(
            "Guardado",
            "Transacción guardada. Puedes ingresar otra.",
          );
          return true;
        }

        if (!isEditing) {
          const isFirstTransaction = transactions.length === 0;
          const hasAsked = await AsyncStorage.getItem(
            "has_asked_initial_reminder",
          );

          if (isFirstTransaction && !hasAsked) {
            setIsNotificationSetupVisible(true);
            return true;
          }
        }
        router.back();
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      return success;
    } catch (error) {
      console.error("Error saving transaction:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!existingTransaction) return;
    const success = await deleteTransaction(existingTransaction.id);
    if (success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  return {
    type,
    setType,
    amount,
    setAmount,
    description,
    setDescription,
    selectedCategory,
    setSelectedCategory,
    selectedEntityId,
    setSelectedEntityId,
    selectedPaymentType,
    setSelectedPaymentType,
    date,
    setDate,
    isSaving,
    isEditing,
    handleSave,
    handleDelete,
    frequentCategories,
    frequentEntities,
    categories,
    entities,
    isNotificationSetupVisible,
    setIsNotificationSetupVisible,
  };
};
