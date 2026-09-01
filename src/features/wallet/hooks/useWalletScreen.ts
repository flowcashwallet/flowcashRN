import { endpoints } from "@/services/api";
import { RootState } from "@/store/store";
import { fetchWithAuth } from "@/utils/apiClient";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Alert } from "react-native";
import { useDispatch, useSelector, useStore } from "react-redux";
import { Transaction } from "../data/walletSlice";
import { useWalletData } from "./useWalletData";
import { useWalletTransactions } from "./useWalletTransactions";

export type WalletPaymentType =
  | "credit_card"
  | "debit_card"
  | "cash"
  | "transfer"
  | "payroll"
  | null;

export interface WalletFilters {
  category: string | null;
  entityId: string | null;
  type: "income" | "expense" | null;
  paymentType: WalletPaymentType;
  dateMode: "none" | "single" | "range";
  date: number | null;
  dateFrom: number | null;
  dateTo: number | null;
}

const DEFAULT_FILTERS: WalletFilters = {
  category: null,
  entityId: null,
  type: null,
  paymentType: null,
  dateMode: "none",
  date: null,
  dateFrom: null,
  dateTo: null,
};

const toDayStart = (timestamp: number) => {
  const d = new Date(timestamp);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
};

const toDayEnd = (timestamp: number) => {
  const d = new Date(timestamp);
  return new Date(
    d.getFullYear(),
    d.getMonth(),
    d.getDate(),
    23,
    59,
    59,
    999,
  ).getTime();
};

export const useWalletScreen = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const store = useStore<RootState>();
  const { isVoiceCommandEnabled } = useSelector(
    (state: RootState) => state.settings,
  );

  const walletData = useWalletData();
  const { deleteTransaction, deleteMonthlyTransactions } =
    useWalletTransactions();

  const [calendarVisible, setCalendarVisible] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  const [receiptModalVisible, setReceiptModalVisible] = useState(false);
  const [manualMultiModalVisible, setManualMultiModalVisible] =
    useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<WalletFilters>(DEFAULT_FILTERS);
  const [processingVoice, setProcessingVoice] = useState(false);

  const handleVoiceCommand = useCallback(
    async (text: string) => {
      setProcessingVoice(true);
      try {
        // Call Backend to parse command
        const response = await fetchWithAuth(
          endpoints.wallet.parseCommand,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ text }),
          },
          dispatch,
          store.getState,
        );

        if (!response.ok) {
          throw new Error("Error procesando el comando");
        }

        const data = await response.json();

        // Redirect to Transaction Form with pre-filled data
        router.push({
          pathname: "/wallet/transaction-form",
          params: {
            amount: data.amount.toString(),
            description: data.description,
            category: data.category,
            initialType: (data.type || "expense").toLowerCase(),
            relatedEntityId: data.relatedEntityId,
            fromVoice: "true", // Flag to trigger auto-save if needed or just better UX
          },
        });
      } catch (error) {
        console.error("Voice command failed:", error);
        Alert.alert("Error", "No pude entender el comando. Intenta de nuevo.");
      } finally {
        setProcessingVoice(false);
      }
    },
    [dispatch, router, store.getState],
  );

  const handleDeleteMonthly = useCallback(() => {
    deleteMonthlyTransactions(
      walletData.currentMonthTransactions,
      walletData.currentMonthName,
    );
  }, [
    walletData.currentMonthTransactions,
    walletData.currentMonthName,
    deleteMonthlyTransactions,
  ]);

  const handleTransactionPress = useCallback(
    (transaction: Transaction) => {
      router.push({
        pathname: "/wallet/transaction-details",
        params: { id: transaction.id },
      });
    },
    [router],
  );

  const filteredTransactions = useMemo(() => {
    return walletData.currentMonthTransactions.filter((t) => {
      if (filters.category && t.category !== filters.category) return false;
      if (filters.entityId && t.relatedEntityId !== filters.entityId)
        return false;
      if (filters.type && t.type !== filters.type) return false;
      if (filters.paymentType && t.paymentType !== filters.paymentType)
        return false;
      if (filters.dateMode === "single" && filters.date) {
        const start = toDayStart(filters.date);
        const end = toDayEnd(filters.date);
        if (t.date < start || t.date > end) return false;
      }
      if (
        filters.dateMode === "range" &&
        (filters.dateFrom || filters.dateTo)
      ) {
        const startCandidate = filters.dateFrom
          ? toDayStart(filters.dateFrom)
          : undefined;
        const endCandidate = filters.dateTo
          ? toDayEnd(filters.dateTo)
          : undefined;

        const start =
          startCandidate !== undefined && endCandidate !== undefined
            ? Math.min(startCandidate, toDayStart(filters.dateTo as number))
            : startCandidate;
        const end =
          startCandidate !== undefined && endCandidate !== undefined
            ? Math.max(toDayEnd(filters.dateFrom as number), endCandidate)
            : endCandidate;

        if (start !== undefined && t.date < start) return false;
        if (end !== undefined && t.date > end) return false;
      }

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const description = t.description || "";
        if (!description.toLowerCase().includes(query)) {
          return false;
        }
      }

      return true;
    });
  }, [walletData.currentMonthTransactions, filters, searchQuery]);

  const hasActiveFilters = !!(
    filters.category ||
    filters.entityId ||
    filters.type ||
    filters.paymentType ||
    filters.dateMode !== "none"
  );

  const clearFilters = useCallback(() => setFilters(DEFAULT_FILTERS), []);

  const openIncomeForm = useCallback(
    () =>
      router.push({
        pathname: "/wallet/transaction-form",
        params: { initialType: "income" },
      }),
    [router],
  );
  const openExpenseForm = useCallback(
    () =>
      router.push({
        pathname: "/wallet/transaction-form",
        params: { initialType: "expense" },
      }),
    [router],
  );
  const openTransferForm = useCallback(
    () =>
      router.push({
        pathname: "/wallet/transaction-form",
        params: { initialType: "transfer" },
      }),
    [router],
  );
  const openCategories = useCallback(
    () => router.push("/wallet/categories"),
    [router],
  );
  const openRecurring = useCallback(
    () => router.push("/wallet/recurring"),
    [router],
  );
  const openScanReceipt = useCallback(
    () => setReceiptModalVisible(true),
    [],
  );
  const openManualMulti = useCallback(
    () => setManualMultiModalVisible(true),
    [],
  );

  return {
    ...walletData,
    isVoiceCommandEnabled,

    deleteTransaction,

    calendarVisible,
    setCalendarVisible,
    datePickerVisible,
    setDatePickerVisible,
    filterVisible,
    setFilterVisible,
    receiptModalVisible,
    setReceiptModalVisible,
    manualMultiModalVisible,
    setManualMultiModalVisible,
    searchQuery,
    setSearchQuery,
    filters,
    setFilters,
    processingVoice,

    filteredTransactions,
    hasActiveFilters,
    clearFilters,

    handleVoiceCommand,
    handleDeleteMonthly,
    handleTransactionPress,

    fabHandlers: {
      openIncomeForm,
      openExpenseForm,
      openTransferForm,
      openCategories,
      openRecurring,
      openScanReceipt,
      openManualMulti,
    },
  };
};
