import { FloatingActionMenu } from "@/components/molecules/FloatingActionMenu";
import { TransactionList } from "@/components/organisms/TransactionList";
import { Spacing } from "@/constants/theme";
import React, { useMemo } from "react";
import { RefreshControl, StyleSheet, View } from "react-native";
import { ManualMultiTransactionModal } from "../components/ManualMultiTransactionModal";
import { MonthYearPickerModal } from "../components/MonthYearPickerModal";
import { ReceiptScannerModal } from "../components/ReceiptScannerModal";
import { StreakCalendarModal } from "../components/StreakCalendarModal";
import { TransactionFilterModal } from "../components/TransactionFilterModal";
import { VoiceCommandBar } from "../components/wallet/VoiceCommandBar";
import { WalletFilterToggle } from "../components/wallet/WalletFilterToggle";
import { WalletListHeader } from "../components/wallet/WalletListHeader";
import { useWalletScreen } from "../hooks/useWalletScreen";

export default function WalletScreen() {
  const {
    currentMonthTransactions,
    colors,
    visionEntities,
    repairedDays,
    categories,
    selectedDate,
    setSelectedDate,
    periodView,
    setPeriodView,
    currentMonthName,
    refreshing,
    onRefresh,
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
    handleTransactionPress,

    fabHandlers,
  } = useWalletScreen();

  const headerRight = useMemo(
    () => (
      <WalletFilterToggle
        hasActiveFilters={hasActiveFilters}
        color={colors.primary}
        onPress={() => setFilterVisible(true)}
      />
    ),
    [colors.primary, hasActiveFilters, setFilterVisible],
  );

  const listHeader = useMemo(
    () => (
      <WalletListHeader
        periodView={periodView}
        onChangePeriodView={setPeriodView}
        selectedDate={selectedDate}
        currentMonthName={currentMonthName}
        onPressMonth={() => setDatePickerVisible(true)}
        searchQuery={searchQuery}
        onChangeSearchQuery={setSearchQuery}
        colors={colors}
      />
    ),
    [
      periodView,
      setPeriodView,
      selectedDate,
      currentMonthName,
      setDatePickerVisible,
      searchQuery,
      setSearchQuery,
      colors,
    ],
  );

  return (
    <>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Removed Stack.Toolbar due to conflict with NativeTabs */}
        <FloatingActionMenu
          actions={[
            {
              id: "income",
              label: "Nuevo Ingreso",
              icon: "arrow.down.left",
              color: colors.success,
              onPress: fabHandlers.openIncomeForm,
            },
            {
              id: "expense",
              label: "Nuevo Gasto",
              icon: "arrow.up.right",
              // El gasto va en `text`, no en `error`: el rojo se reserva para lo
              // que está mal, igual que en las filas de la lista.
              color: colors.text,
              onPress: fabHandlers.openExpenseForm,
            },
            {
              id: "transfer",
              label: "Transferencia",
              icon: "arrow.right.arrow.left",
              color: colors.primary,
              onPress: fabHandlers.openTransferForm,
            },
            {
              id: "categories",
              label: "Categorías",
              icon: "list.bullet",
              color: colors.primary,
              onPress: fabHandlers.openCategories,
            },
            {
              id: "recurring",
              label: "Recurrentes",
              icon: "arrow.triangle.2.circlepath",
              // Antes un naranja suelto (#FF9500); ahora el token de la paleta.
              color: colors.warning,
              onPress: fabHandlers.openRecurring,
            },
            {
              id: "scan",
              label: "Escanear recibo",
              icon: "camera",
              color: colors.primary,
              onPress: fabHandlers.openScanReceipt,
            },
            {
              id: "manual-multi",
              label: "Añadir múltiples transacciones",
              icon: "square.and.pencil",
              color: colors.primary,
              onPress: fabHandlers.openManualMulti,
            },
          ]}
        />
        <View style={styles.listArea}>
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
            contentContainerStyle={styles.listContent}
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
            mode={periodView}
          />

          <TransactionFilterModal
            visible={filterVisible}
            onClose={() => setFilterVisible(false)}
            categories={categories}
            entities={visionEntities}
            currentFilters={filters}
            onApply={setFilters}
            onClear={clearFilters}
          />
          <ReceiptScannerModal
            visible={receiptModalVisible}
            onClose={() => setReceiptModalVisible(false)}
            visionEntities={visionEntities}
          />

          <ManualMultiTransactionModal
            visible={manualMultiModalVisible}
            onClose={() => setManualMultiModalVisible(false)}
            visionEntities={visionEntities}
          />

          <VoiceCommandBar
            visible={isVoiceCommandEnabled}
            isLoading={processingVoice}
            onCommandDetected={handleVoiceCommand}
          />
        </View>
      </View>
    </>
  );
}

/** Aire al final de la lista para que el FAB y la barra no tapen la última fila. */
const LIST_BOTTOM_OFFSET = Spacing.xxl * 3;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
  },
  listArea: {
    flex: 1,
  },
  listContent: {
    paddingBottom: LIST_BOTTOM_OFFSET,
    // paddingHorizontal: Spacing.m,
  },
});
