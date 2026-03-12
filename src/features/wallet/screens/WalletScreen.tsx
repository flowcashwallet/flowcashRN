import { VoiceInputButton } from "@/components/atoms/VoiceInputButton";
import { FloatingActionMenu } from "@/components/molecules/FloatingActionMenu";
import { TransactionList } from "@/components/organisms/TransactionList";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { BorderRadius, Spacing } from "@/constants/theme";
import STRINGS from "@/i18n/es.json";
import { endpoints } from "@/services/api";
import { RootState } from "@/store/store";
import { fetchWithAuth } from "@/utils/apiClient";
import { useHeaderHeight } from "@react-navigation/elements";
import { useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Platform,
  RefreshControl,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useDispatch, useSelector, useStore } from "react-redux";
import { ExportButton } from "../components/ExportTransactions";
import { MonthSelector } from "../components/MonthSelector";
import { MonthYearPickerModal } from "../components/MonthYearPickerModal";
import { StreakCalendarModal } from "../components/StreakCalendarModal";
import { TransactionFilterModal } from "../components/TransactionFilterModal";
import { WalletHeader } from "../components/WalletHeader";
import { Transaction } from "../data/walletSlice";
import { useWalletData } from "../hooks/useWalletData";
import { useWalletTransactions } from "../hooks/useWalletTransactions";

export default function WalletScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const store = useStore<RootState>();
  const { isVoiceCommandEnabled } = useSelector(
    (state: RootState) => state.settings,
  );
  const {
    currentMonthTransactions,
    balance,
    income,
    expense,
    currentMonthName,
    refreshing,
    onRefresh,
    colors,
    visionEntities,
    streak,
    repairedDays,
    categories,
    selectedDate,
    setSelectedDate,
    forecast,
  } = useWalletData();

  const headerHeight = useHeaderHeight();
  console.log("headerHeight", headerHeight);
  const { deleteTransaction, deleteMonthlyTransactions } =
    useWalletTransactions();

  const [calendarVisible, setCalendarVisible] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<{
    category: string | null;
    entityId: string | null;
    type: "income" | "expense" | null;
    paymentType:
      | "credit_card"
      | "debit_card"
      | "cash"
      | "transfer"
      | "payroll"
      | null;
    dateMode: "none" | "single" | "range";
    date: number | null;
    dateFrom: number | null;
    dateTo: number | null;
  }>({
    category: null,
    entityId: null,
    type: null,
    paymentType: null,
    dateMode: "none",
    date: null,
    dateFrom: null,
    dateTo: null,
  });

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
    deleteMonthlyTransactions(currentMonthTransactions, currentMonthName);
  }, [currentMonthTransactions, currentMonthName, deleteMonthlyTransactions]);

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
    return currentMonthTransactions.filter((t) => {
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
  }, [currentMonthTransactions, filters, searchQuery]);

  const hasActiveFilters =
    filters.category ||
    filters.entityId ||
    filters.type ||
    filters.paymentType ||
    filters.dateMode !== "none";

  const headerRight = useMemo(
    () => (
      <TouchableOpacity onPress={() => setFilterVisible(true)}>
        <IconSymbol
          name={
            hasActiveFilters
              ? "line.3.horizontal.decrease.circle.fill"
              : "line.3.horizontal.decrease.circle"
          }
          size={24}
          color={colors.primary}
        />
      </TouchableOpacity>
    ),
    [colors.primary, hasActiveFilters],
  );

  const listHeader = useMemo(
    () => (
      <>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: Spacing.m,
          }}
        >
          <MonthSelector
            currentMonthName={currentMonthName}
            year={selectedDate.getFullYear()}
            showYear={selectedDate.getFullYear() !== new Date().getFullYear()}
            onPress={() => setDatePickerVisible(true)}
          />
          <ExportButton />
        </View>

        <WalletHeader
          balance={balance}
          currentMonthName={currentMonthName}
          income={income}
          expense={expense}
          onDeleteMonth={handleDeleteMonthly}
          streak={streak}
          onPressStreak={() => setCalendarVisible(true)}
          // onMonthPress={() => setDatePickerVisible(true)} // Removed from header
          showYear={selectedDate.getFullYear() !== new Date().getFullYear()}
          year={selectedDate.getFullYear()}
        />

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: colors.background,
            borderRadius: BorderRadius.l,
            paddingHorizontal: Spacing.s,
            paddingVertical: Platform.OS === "ios" ? Spacing.xs : 0,
            marginBottom: Spacing.m,
            borderWidth: 1.4,
            borderColor: colors.border,
          }}
        >
          <IconSymbol
            name="magnifyingglass"
            size={20}
            color={colors.textSecondary}
          />
          <TextInput
            style={{
              flex: 1,
              padding: Spacing.s,
              color: colors.text,
              fontSize: 16,
            }}
            placeholder={STRINGS.common.search}
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
          {Platform.OS === "android" && searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <IconSymbol
                name="xmark.circle.fill"
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          )}
        </View>
      </>
    ),
    [
      balance,
      colors.border,
      colors.surfaceHighlight,
      colors.text,
      colors.textSecondary,
      currentMonthName,
      expense,
      forecast,
      handleDeleteMonthly,
      income,
      router,
      searchQuery,
      selectedDate,
      streak,
    ],
  );

  return (
    <>
      <ThemedView collapsable={false} style={styles.container}>
        {/* Removed Stack.Toolbar due to conflict with NativeTabs */}
        <FloatingActionMenu
          actions={[
            {
              id: "income",
              label: "Nuevo Ingreso",
              icon: "arrow.down.left",
              color: colors.success,
              onPress: () =>
                router.push({
                  pathname: "/wallet/transaction-form",
                  params: { initialType: "income" },
                }),
            },
            {
              id: "expense",
              label: "Nuevo Gasto",
              icon: "arrow.up.right",
              color: colors.error,
              onPress: () =>
                router.push({
                  pathname: "/wallet/transaction-form",
                  params: { initialType: "expense" },
                }),
            },
            {
              id: "transfer",
              label: "Transferencia",
              icon: "arrow.right.arrow.left",
              color: colors.primary,
              onPress: () =>
                router.push({
                  pathname: "/wallet/transaction-form",
                  params: { initialType: "transfer" },
                }),
            },
            {
              id: "categories",
              label: "Categorías",
              icon: "list.bullet",
              color: colors.primary,
              onPress: () => router.push("/wallet/categories"),
            },
            {
              id: "recurring",
              label: "Recurrentes",
              icon: "arrow.triangle.2.circlepath",
              color: "#FF9500", // Orange
              onPress: () => router.push("/wallet/recurring"),
            },
          ]}
        />
        <View style={{ flex: 1 }}>
          <TransactionList
            transactions={filteredTransactions}
            onDelete={deleteTransaction}
            onTransactionPress={handleTransactionPress}
            headerRight={headerRight}
            listHeaderComponent={listHeader}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            }
            contentContainerStyle={{
              paddingBottom: 150,
              paddingHorizontal: Spacing.m,
            }}
          />

          <StreakCalendarModal
            visible={calendarVisible}
            onClose={() => setCalendarVisible(false)}
            transactions={currentMonthTransactions}
            repairedDays={repairedDays || []}
          />

          <MonthYearPickerModal
            visible={datePickerVisible}
            onClose={() => setDatePickerVisible(false)}
            selectedDate={selectedDate}
            onSelect={setSelectedDate}
          />

          <TransactionFilterModal
            visible={filterVisible}
            onClose={() => setFilterVisible(false)}
            categories={categories}
            entities={visionEntities}
            currentFilters={filters}
            onApply={setFilters}
            onClear={() =>
              setFilters({
                category: null,
                entityId: null,
                type: null,
                paymentType: null,
                dateMode: "none",
                date: null,
                dateFrom: null,
                dateTo: null,
              })
            }
          />
          {isVoiceCommandEnabled && (
            <View style={styles.fabContainer}>
              <VoiceInputButton
                onCommandDetected={handleVoiceCommand}
                isLoading={processingVoice}
              />
            </View>
          )}
        </View>
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
  },
  fabContainer: {
    position: "absolute",
    bottom: 130,
    right: 20,
    zIndex: 100,
  },
});
