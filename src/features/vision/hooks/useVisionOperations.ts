import {
  VisionEntity,
  addVisionEntity,
  deleteVisionEntity,
  updateVisionEntity,
} from "@/features/vision/data/visionSlice";
import {
  addTransaction,
  fetchTransactions,
} from "@/features/wallet/data/walletSlice";
import STRINGS from "@/i18n/es.json";
import { fetchCryptoPrices } from "@/services/price/coingecko";
import { AppDispatch } from "@/store/store";
import { formatCurrency, parseAmount } from "@/utils/format";
import { useState } from "react";
import { Alert } from "react-native";
import { useDispatch } from "react-redux";

export interface AddEntityData {
  name: string;
  description: string;
  amount: string;
  type: "asset" | "liability";
  category: string;
  isCrypto: boolean;
  cryptoSymbol?: string;
  cryptoAmount?: string;
  // Credit Card fields
  isCreditCard?: boolean;
  cutoffDate?: string;
  paymentDate?: string;
  issuerBank?: string;
}

export interface AddTransactionToEntityData {
  amount: string;
  description: string;
  type: "income" | "expense";
  entity: VisionEntity;
}

export const useVisionOperations = (userId?: string) => {
  const dispatch = useDispatch<AppDispatch>();
  const [isSaving, setIsSaving] = useState(false);

  const handleAddEntity = async (
    data: AddEntityData,
    isEditing: boolean,
    selectedEntity: VisionEntity | null,
  ) => {
    if (!userId) return false;
    setIsSaving(true);

    const commonData = {
      userId,
      name: data.name,
      description: data.description,
      amount: parseAmount(data.amount),
      type: data.type,
      category: data.category,
      isCrypto: data.type === "asset" && data.isCrypto,
      ...(data.isCrypto && data.type === "asset"
        ? {
            cryptoSymbol: data.cryptoSymbol,
            cryptoAmount: parseAmount(data.cryptoAmount || "0"),
          }
        : {}),
      // Credit Card Logic
      isCreditCard: data.type === "liability" && data.isCreditCard,
      ...(data.isCreditCard && data.type === "liability"
        ? {
            cutoffDate: parseInt(data.cutoffDate || "0"),
            paymentDate: parseInt(data.paymentDate || "0"),
            issuerBank: data.issuerBank,
          }
        : {}),
    };

    try {
      if (isEditing && selectedEntity) {
        const updatedEntity = await dispatch(
          updateVisionEntity({
            ...selectedEntity,
            ...commonData,
          }),
        ).unwrap();
        return updatedEntity;
      } else {
        await dispatch(
          addVisionEntity({
            ...commonData,
            createdAt: Date.now(),
          }),
        ).unwrap();
        return true;
      }
    } catch (error: any) {
      Alert.alert(STRINGS.common.error, error);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteEntity = (id: string) => {
    return new Promise((resolve) => {
      Alert.alert(
        STRINGS.common.warning,
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
            onPress: () => {
              dispatch(deleteVisionEntity(id));
              resolve(true);
            },
          },
        ],
      );
    });
  };

  const handleAddTransactionToEntity = async (
    data: AddTransactionToEntityData,
  ) => {
    if (!userId) return false;
    setIsSaving(true);

    try {
      await dispatch(
        addTransaction({
          userId,
          amount: parseAmount(data.amount),
          description: data.description,
          type: data.type,
          date: Date.now(),
          relatedEntityId: data.entity.id,
          category: "Vision",
        }),
      ).unwrap();

      // Update Entity Amount
      const transAmount = parseAmount(data.amount);
      let newAmount = data.entity.amount;

      if (data.entity.type === "asset") {
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

      await dispatch(
        updateVisionEntity({
          ...data.entity,
          amount: newAmount,
        }),
      ).unwrap();

      // Refresh transactions
      dispatch(fetchTransactions());

      return { ...data.entity, amount: newAmount };
    } catch (error: any) {
      Alert.alert(STRINGS.common.error, STRINGS.wallet.saveError + error);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateCryptoPrice = async (entity: VisionEntity) => {
    if (!entity.cryptoSymbol || !entity.cryptoAmount) return null;

    setIsSaving(true);
    const coinIdMap: Record<string, string> = {
      BTC: "bitcoin",
      ETH: "ethereum",
      USDT: "tether",
    };

    const coinId = coinIdMap[entity.cryptoSymbol];
    const prices = await fetchCryptoPrices(coinId);

    if (prices && prices[coinId]) {
      const price = prices[coinId];
      const newFiatAmount = entity.cryptoAmount * price;

      try {
        const updatedEntity = await dispatch(
          updateVisionEntity({
            ...entity,
            amount: newFiatAmount,
          }),
        ).unwrap();

        Alert.alert(
          "Actualizado",
          `Precio actualizado a ${formatCurrency(price)} MXN`,
        );
        return updatedEntity;
      } catch (error: any) {
        Alert.alert(STRINGS.common.error, error);
        return null;
      } finally {
        setIsSaving(false);
      }
    } else {
      setIsSaving(false);
      Alert.alert(STRINGS.common.error, "No se pudo obtener el precio actual.");
      return null;
    }
  };

  return {
    isSaving,
    handleAddEntity,
    handleDeleteEntity,
    handleAddTransactionToEntity,
    handleUpdateCryptoPrice,
  };
};
