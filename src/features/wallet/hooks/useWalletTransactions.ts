import { updateVisionEntity } from "@/features/vision/data/visionSlice";
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
  type: "income" | "expense";
  category?: string | null;
  relatedEntityId?: string | null;
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
}

export const useWalletTransactions = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { entities: visionEntities } = useSelector(
    (state: RootState) => state.vision,
  );
  const { transactions } = useSelector((state: RootState) => state.wallet);
  const [isSaving, setIsSaving] = useState(false);

  const addTransaction = async (data: TransactionData) => {
    if (!data.amount || !data.description || !user?.uid) return;

    setIsSaving(true);
    try {
      await dispatch(
        addTransactionAction({
          userId: user.uid,
          amount: parseAmount(data.amount),
          description: data.description,
          type: data.type,
          ...(data.category ? { category: data.category } : {}),
          ...(data.relatedEntityId
            ? { relatedEntityId: data.relatedEntityId as string }
            : {}),
          date: data.date || Date.now(),
          paymentType: data.paymentType,
        }),
      ).unwrap();

      // Update Vision Entity if associated
      if (data.relatedEntityId) {
        const entity = visionEntities.find(
          (e) => e.id === data.relatedEntityId,
        );
        if (entity) {
          const transAmount = parseAmount(data.amount);
          let newAmount = entity.amount;

          if (entity.type === "asset") {
            if (data.type === "income") {
              newAmount += transAmount;
            } else {
              newAmount -= transAmount;
            }
          } else {
            // Liability
            if (data.type === "income") {
              newAmount -= transAmount;
            } else {
              newAmount += transAmount;
            }
          }
          dispatch(updateVisionEntity({ ...entity, amount: newAmount }));
        }
      }
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
    if (!user?.uid) return;
    setIsSaving(true);

    const newAmount = parseAmount(data.amount);
    const oldAmount = data.oldAmount;
    const type = data.type;
    const oldEntityId = data.oldEntityId;
    const newEntityId = data.relatedEntityId;

    // Handle Entity Updates if changed or amount changed
    if (oldEntityId !== newEntityId || oldAmount !== newAmount) {
      // Case 1: Entity Changed (A -> B) or (A -> null) or (null -> B)
      if (oldEntityId !== newEntityId) {
        // Revert Old Entity
        if (oldEntityId) {
          const oldEntity = visionEntities.find((e) => e.id === oldEntityId);
          if (oldEntity) {
            let updatedOldAmount = oldEntity.amount;
            if (oldEntity.type === "asset") {
              if (type === "income") updatedOldAmount -= oldAmount;
              else updatedOldAmount += oldAmount;
            } else {
              // Liability
              if (type === "income") updatedOldAmount += oldAmount;
              else updatedOldAmount -= oldAmount;
            }
            dispatch(
              updateVisionEntity({ ...oldEntity, amount: updatedOldAmount }),
            );
          }
        }

        // Apply New Entity
        if (newEntityId) {
          const newEntity = visionEntities.find((e) => e.id === newEntityId);
          if (newEntity) {
            let updatedNewAmount = newEntity.amount;
            if (newEntity.type === "asset") {
              if (type === "income") updatedNewAmount += newAmount;
              else updatedNewAmount -= newAmount;
            } else {
              // Liability
              if (type === "income") updatedNewAmount -= newAmount;
              else updatedNewAmount += newAmount;
            }
            dispatch(
              updateVisionEntity({ ...newEntity, amount: updatedNewAmount }),
            );
          }
        }
      }
      // Case 2: Entity Same (A -> A), but Amount Changed
      else if (oldEntityId && newEntityId) {
        const entity = visionEntities.find((e) => e.id === oldEntityId);
        if (entity) {
          let finalAmount = entity.amount;

          // Revert old
          if (entity.type === "asset") {
            if (type === "income") finalAmount -= oldAmount;
            else finalAmount += oldAmount;
          } else {
            if (type === "income") finalAmount += oldAmount;
            else finalAmount -= oldAmount;
          }

          // Apply new
          if (entity.type === "asset") {
            if (type === "income") finalAmount += newAmount;
            else finalAmount -= newAmount;
          } else {
            if (type === "income") finalAmount -= newAmount;
            else finalAmount += newAmount;
          }

          dispatch(updateVisionEntity({ ...entity, amount: finalAmount }));
        }
      }
    }

    try {
      await dispatch(
        updateTransactionAction({
          id: data.id,
          updates: {
            description: data.description,
            category: data.category || null,
            relatedEntityId: data.relatedEntityId || null,
            amount: newAmount,
            ...(data.date ? { date: data.date } : {}),
            ...(data.paymentType !== undefined
              ? { paymentType: data.paymentType }
              : {}),
          },
        }),
      ).unwrap();
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
              // Revert Entity Balance
              const transaction = transactions.find((t) => t.id === id);
              if (transaction && transaction.relatedEntityId) {
                const entity = visionEntities.find(
                  (e) => e.id === transaction.relatedEntityId,
                );
                if (entity) {
                  let newAmount = entity.amount;
                  const transAmount = transaction.amount;

                  if (entity.type === "asset") {
                    if (transaction.type === "income") {
                      newAmount -= transAmount;
                    } else {
                      newAmount += transAmount;
                    }
                  } else {
                    // Liability
                    if (transaction.type === "income") {
                      newAmount += transAmount;
                    } else {
                      newAmount -= transAmount;
                    }
                  }
                  try {
                    await dispatch(
                      updateVisionEntity({ ...entity, amount: newAmount }),
                    ).unwrap();
                  } catch (error) {
                    console.error("Error reverting entity balance:", error);
                  }
                }
              }

              dispatch(deleteTransactionAction(id))
                .unwrap()
                .then(() => resolve(true))
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
            // Calculate net changes per entity
            const entityChanges: Record<string, number> = {};

            transactionsToDelete.forEach((t) => {
              if (t.relatedEntityId) {
                const transAmount = t.amount;
                let change = 0;

                // Determine the "revert" effect on the entity's amount
                // Note: We need to know the entity type to know the sign, but we don't have the entity object here easily without lookup.
                // However, we can look up the entity from visionEntities using relatedEntityId.
                const entity = visionEntities.find(
                  (e) => e.id === t.relatedEntityId,
                );
                if (entity) {
                  if (entity.type === "asset") {
                    if (t.type === "income") change = -transAmount;
                    else change = transAmount;
                  } else {
                    // Liability
                    if (t.type === "income") change = transAmount;
                    else change = -transAmount;
                  }
                }

                entityChanges[t.relatedEntityId] =
                  (entityChanges[t.relatedEntityId] || 0) + change;
              }
            });

            // Apply updates
            for (const [entityId, change] of Object.entries(entityChanges)) {
              if (change !== 0) {
                const entity = visionEntities.find((e) => e.id === entityId);
                if (entity) {
                  try {
                    await dispatch(
                      updateVisionEntity({
                        ...entity,
                        amount: entity.amount + change,
                      }),
                    ).unwrap();
                  } catch (error) {
                    console.error(
                      `Error updating entity ${entityId} during bulk delete:`,
                      error,
                    );
                  }
                }
              }
            }

            const idsToDelete = transactionsToDelete.map((t) => t.id);
            dispatch(deleteMultipleTransactions(idsToDelete))
              .unwrap()
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
