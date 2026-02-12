import { VoiceInputButton } from "@/components/atoms/VoiceInputButton";
import { TransactionList } from "@/components/organisms/TransactionList";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { BorderRadius, Spacing } from "@/constants/theme";
import STRINGS from "@/i18n/es.json";
import { endpoints } from "@/services/api";
import { RootState } from "@/store/store";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import { MonthYearPickerModal } from "../components/MonthYearPickerModal";
import { QuickActions } from "../components/QuickActions";
import { StreakCalendarModal } from "../components/StreakCalendarModal";
import { TransactionFilterModal } from "../components/TransactionFilterModal";
import { WalletHeader } from "../components/WalletHeader";
import { FinancialWeatherWidget } from "../components/molecules/FinancialWeatherWidget";
import { Transaction } from "../data/walletSlice";
import { useWalletData } from "../hooks/useWalletData";
import { useWalletTransactions } from "../hooks/useWalletTransactions";

export default function WalletScreen() {
  const router = useRouter();
  const { token } = useSelector((state: RootState) => state.auth);
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

  const insets = useSafeAreaInsets();

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
  }>({
    category: null,
    entityId: null,
    type: null,
    paymentType: null,
  });

  const [processingVoice, setProcessingVoice] = useState(false);

  const handleVoiceCommand = async (text: string) => {
    setProcessingVoice(true);
    try {
      // Call Backend to parse command
      const response = await fetch(endpoints.wallet.parseCommand, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error("Error procesando el comando");
      }

      const data = await response.json();

      // Redirect to Transaction Form with pre-filled data
      router.push({
        pathname: "/transaction-form",
        params: {
          amount: data.amount.toString(),
          description: data.description,
          category: data.category,
          type: data.type,
          fromVoice: "true", // Flag to trigger auto-save if needed or just better UX
        },
      });
    } catch (error) {
      console.error("Voice command failed:", error);
      Alert.alert("Error", "No pude entender el comando. Intenta de nuevo.");
    } finally {
      setProcessingVoice(false);
    }
  };

  const handleDeleteMonthly = () => {
    deleteMonthlyTransactions(currentMonthTransactions, currentMonthName);
  };

  const handleTransactionPress = (transaction: Transaction) => {
    router.push({
      pathname: "/transaction-form",
      params: { id: transaction.id },
    });
  };

  const filteredTransactions = currentMonthTransactions.filter((t) => {
    if (filters.category && t.category !== filters.category) return false;
    if (filters.entityId && t.relatedEntityId !== filters.entityId)
      return false;
    if (filters.type && t.type !== filters.type) return false;
    if (filters.paymentType && t.paymentType !== filters.paymentType)
      return false;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const description = t.description || "";
      if (!description.toLowerCase().includes(query)) {
        return false;
      }
    }

    return true;
  });

  const hasActiveFilters =
    filters.category || filters.entityId || filters.type || filters.paymentType;

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={{
          paddingBottom: 150 + insets.bottom,
          paddingHorizontal: Spacing.m,
          paddingTop: 10,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]} // Android
          />
        }
      >
        <WalletHeader
          balance={balance}
          currentMonthName={currentMonthName}
          income={income}
          expense={expense}
          onDeleteMonth={handleDeleteMonthly}
          streak={streak}
          onPressStreak={() => setCalendarVisible(true)}
          onMonthPress={() => setDatePickerVisible(true)}
          showYear={selectedDate.getFullYear() !== new Date().getFullYear()}
          year={selectedDate.getFullYear()}
        />

        <FinancialWeatherWidget forecast={forecast} />

        <QuickActions
          onPressIncome={() => {
            router.push({
              pathname: "/transaction-form",
              params: { initialType: "income" },
            });
          }}
          onPressExpense={() => {
            router.push({
              pathname: "/transaction-form",
              params: { initialType: "expense" },
            });
          }}
          onPressCategories={() => {
            router.push("/wallet/categories");
          }}
          onPressSubscriptions={() => {
            router.push("/wallet/subscriptions");
          }}
        />

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: colors.surfaceHighlight,
            borderRadius: BorderRadius.l,
            paddingHorizontal: Spacing.s,
            paddingVertical: Platform.OS === "ios" ? Spacing.xs : 0,
            marginBottom: Spacing.m,
            borderWidth: 1,
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

        <TransactionList
          transactions={filteredTransactions}
          onDelete={deleteTransaction}
          onTransactionPress={handleTransactionPress}
          headerRight={
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
          }
        />
      </ScrollView>

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
    </ThemedView>
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
