import { FloatingActionMenu } from "@/components/molecules/FloatingActionMenu";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { AddEntityModal } from "@/features/vision/components/AddEntityModal";
import { EntityDetailModal } from "@/features/vision/components/EntityDetailModal";
import { VisionEntityList } from "@/features/vision/components/VisionEntityList";
import { VisionFilterModal } from "@/features/vision/components/VisionFilterModal";
import { VisionHeader } from "@/features/vision/components/VisionHeader";
import { VisionSortModal } from "@/features/vision/components/VisionSortModal";
import { LiabilityManagementLink } from "@/features/vision/components/vision/LiabilityManagementLink";
import { VisionAssetLiabilityTabs } from "@/features/vision/components/vision/VisionAssetLiabilityTabs";
import { useVisionScreen } from "@/features/vision/hooks/useVisionScreen";
import { ExportButton } from "@/features/wallet/components/ExportTransactions";
import STRINGS from "@/i18n/es.json";
import { Stack } from "expo-router";
import React from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";

export default function VisionScreen() {
  const {
    colors,
    refreshing,
    onRefresh,
    netWorth,
    totalAssets,
    totalLiabilities,
    transactions,

    isSaving,
    handleAddEntity,
    handleAddTransactionToEntity,
    handleUpdateCryptoPrice,

    activeTab,
    selectedType,
    selectedEntity,
    addModalVisible,
    detailModalVisible,
    filterVisible,
    filterCategory,
    sortVisible,
    sortBy,

    sortedAssets,
    sortedLiabilities,
    filterCategories,

    handleTabChange,
    onAddPress,
    onEntityPress,
    handleDelete,
    handleDeleteEntity,
    handleEditEntity,
    handleSortChange,
    setFilterCategory,
    onOpenLiabilityManagement,

    onOpenFilter,
    onOpenSort,
    onCloseAddModal,
    onCloseDetailModal,
    onCloseFilterModal,
    onCloseSortModal,

    fabActions,
  } = useVisionScreen();

  return (
    <ThemedView lightColor="transparent" darkColor="transparent" style={styles.flex}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTransparent: true,
          headerTitle: "Balance",
          unstable_headerRightItems: () => [
            {
              type: "menu",
              label: " ",
              icon: {
                type: "sfSymbol",
                name: "ellipsis.circle",
              },
              tintColor: colors.primary,
              menu: {
                title: STRINGS.common.edit, // Using edit as a placeholder for Actions or add a new string
                items: [
                  {
                    id: "add",
                    type: "action",
                    label: STRINGS.vision.addAsset, // Or a generic Add string if available
                    title: STRINGS.vision.addAsset,
                    icon: {
                      type: "sfSymbol",
                      name: "plus",
                    },
                    onPress: onAddPress,
                  },
                  {
                    id: "filter",
                    type: "action",
                    label: "Filtrar", // Should add to strings if missing
                    title: "Filtrar",
                    icon: {
                      type: "sfSymbol",
                      name: filterCategory
                        ? "line.3.horizontal.decrease.circle.fill"
                        : "line.3.horizontal.decrease.circle",
                    },
                    onPress: onOpenFilter,
                  },
                  {
                    id: "sort",
                    type: "action",
                    label: "Ordenar", // Should add to strings if missing
                    title: "Ordenar",
                    icon: {
                      type: "sfSymbol",
                      name: "arrow.up.arrow.down",
                    },
                    onPress: onOpenSort,
                  },
                ],
              },
            },
          ],
        }}
      />
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        contentContainerStyle={styles.scrollContent}
        contentInsetAdjustmentBehavior="automatic"
      >
        <View style={styles.exportRow}>
          <ExportButton type="vision" />
        </View>

        <VisionHeader
          netWorth={netWorth}
          totalAssets={totalAssets}
          totalLiabilities={totalLiabilities}
        />

        <VisionAssetLiabilityTabs
          activeTab={activeTab}
          onChangeTab={handleTabChange}
        />

        {activeTab === "liability" && (
          <LiabilityManagementLink onPress={onOpenLiabilityManagement} />
        )}

        {/* Entity List */}
        <VisionEntityList
          data={activeTab === "asset" ? sortedAssets : sortedLiabilities}
          type={activeTab}
          onPress={onEntityPress}
          onDelete={handleDeleteEntity}
        />
      </ScrollView>

      {/* Floating Menu removed as we integrated add button in header/card */}
      {/* Or we can keep it if prefered, but minimalist usually means cleaner UI */}

      <AddEntityModal
        visible={addModalVisible}
        onClose={onCloseAddModal}
        onSave={handleAddEntity}
        selectedType={selectedType}
        initialEntity={selectedEntity}
        isSaving={isSaving}
      />

      <EntityDetailModal
        visible={detailModalVisible}
        onClose={onCloseDetailModal}
        entity={selectedEntity}
        transactions={transactions}
        isSaving={isSaving}
        onEdit={handleEditEntity}
        onDelete={handleDelete}
        onAddTransaction={handleAddTransactionToEntity}
        onUpdateCryptoPrice={handleUpdateCryptoPrice}
      />

      <VisionFilterModal
        visible={filterVisible}
        onClose={onCloseFilterModal}
        categories={filterCategories}
        selectedCategory={filterCategory}
        onSelectCategory={setFilterCategory}
      />

      <VisionSortModal
        visible={sortVisible}
        onClose={onCloseSortModal}
        selectedOption={sortBy}
        onSelectOption={handleSortChange}
      />

      <FloatingActionMenu actions={fabActions} />
    </ThemedView>
  );
}

/** Aire bajo el scroll para que el FAB no tape la última fila de la lista. */
const SCROLL_BOTTOM_INSET = 100;

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.m,
    paddingBottom: SCROLL_BOTTOM_INSET,
  },
  exportRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: Spacing.m,
  },
});
