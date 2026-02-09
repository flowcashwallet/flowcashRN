import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { AddEntityModal } from "@/features/vision/components/AddEntityModal";
import { EntityDetailModal } from "@/features/vision/components/EntityDetailModal";
import { VisionEntityList } from "@/features/vision/components/VisionEntityList";
import { VisionFilterModal } from "@/features/vision/components/VisionFilterModal";
import { VisionHeader } from "@/features/vision/components/VisionHeader";
import {
    SortOption,
    VisionSortModal,
} from "@/features/vision/components/VisionSortModal";
import { VisionEntity } from "@/features/vision/data/visionSlice";
import { useVisionData } from "@/features/vision/hooks/useVisionData";
import {
    AddEntityData,
    useVisionOperations,
} from "@/features/vision/hooks/useVisionOperations";
import {
    registerForPushNotificationsAsync,
    scheduleCreditCardReminder,
} from "@/services/notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import { Alert, RefreshControl, ScrollView, StyleSheet } from "react-native";

const VISION_SORT_PREF_KEY = "vision_sort_preference";

export default function VisionScreen() {
  const {
    user,
    transactions,
    refreshing,
    onRefresh,
    assets,
    liabilities,
    totalAssets,
    totalLiabilities,
    netWorth,
    colors,
  } = useVisionData();

  const {
    isSaving,
    handleAddEntity,
    handleDeleteEntity,
    handleAddTransactionToEntity,
    handleUpdateCryptoPrice,
  } = useVisionOperations(user?.id?.toString());

  const [addModalVisible, setAddModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<"asset" | "liability">("asset");
  const [selectedType, setSelectedType] = useState<"asset" | "liability">(
    "asset",
  );
  const [selectedEntity, setSelectedEntity] = useState<VisionEntity | null>(
    null,
  );
  const [filterVisible, setFilterVisible] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [sortVisible, setSortVisible] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("amount");

  useEffect(() => {
    const loadSortPreference = async () => {
      try {
        const savedSort = await AsyncStorage.getItem(VISION_SORT_PREF_KEY);
        if (savedSort) {
          setSortBy(savedSort as SortOption);
        }
      } catch (error) {
        console.error("Failed to load sort preference:", error);
      }
    };
    loadSortPreference();
  }, []);

  const handleSortChange = async (option: SortOption) => {
    setSortBy(option);
    try {
      await AsyncStorage.setItem(VISION_SORT_PREF_KEY, option);
    } catch (error) {
      console.error("Failed to save sort preference:", error);
    }
  };

  const filteredAssets = assets.filter(
    (item) => !filterCategory || item.category === filterCategory,
  );
  const filteredLiabilities = liabilities.filter(
    (item) => !filterCategory || item.category === filterCategory,
  );

  const sortEntities = (entities: VisionEntity[]) => {
    return [...entities].sort((a, b) => {
      if (sortBy === "amount") {
        return b.amount - a.amount; // Descending
      } else {
        return a.name.localeCompare(b.name); // Ascending
      }
    });
  };

  const sortedAssets = sortEntities(filteredAssets);
  const sortedLiabilities = sortEntities(filteredLiabilities);

  const handleTabChange = (tab: "asset" | "liability") => {
    setActiveTab(tab);
    setFilterCategory(null);
  };

  const onAddPress = () => {
    setSelectedType(activeTab);
    setSelectedEntity(null);
    setAddModalVisible(true);
  };

  const onEntityPress = (entity: VisionEntity) => {
    setSelectedEntity(entity);
    setDetailModalVisible(true);
  };

  const handleEditEntity = () => {
    if (selectedEntity) {
      setSelectedType(selectedEntity.type);
      setDetailModalVisible(false);
      setAddModalVisible(true);
    }
  };

  const handleDelete = async () => {
    if (selectedEntity) {
      const deleted = await handleDeleteEntity(selectedEntity.id);
      if (deleted) {
        setDetailModalVisible(false);
        setSelectedEntity(null);
      }
    }
  };

  const handleSaveEntity = async (
    data: AddEntityData,
    isEditing: boolean,
    entity: VisionEntity | null,
  ) => {
    const result = await handleAddEntity(data, isEditing, entity);
    if (result) {
      setAddModalVisible(false);
      // If editing, update selected entity so detail view updates if we came from there
      // Logic: if we were editing, we might want to re-open detail view or just stay closed.
      // The requirement usually implies updating the list.
      // If we want to support updating the detail view LIVE, we would need to pass the updated entity back.
      if (isEditing && typeof result !== "boolean") {
        // If we were editing from the detail view, we closed it to open this modal.
        // So we don't need to update selectedEntity for the detail view immediately unless we re-open it.
        // But let's keep it simple.
      } else if (!isEditing) {
        // Post-save logic for new Credit Card Liability
        if (
          data.type === "liability" &&
          data.isCreditCard &&
          data.paymentDate &&
          data.issuerBank
        ) {
          Alert.alert(
            "Recordatorio de Pago",
            `¿Quieres que te enviemos un recordatorio mensual 2 días antes de tu fecha de pago (${data.paymentDate})?`,
            [
              {
                text: "No",
                style: "cancel",
              },
              {
                text: "Sí, por favor",
                onPress: async () => {
                  const hasPermission =
                    await registerForPushNotificationsAsync();
                  if (hasPermission) {
                    await scheduleCreditCardReminder(
                      data.issuerBank!,
                      parseInt(data.paymentDate!),
                    );
                    Alert.alert(
                      "Listo",
                      "Te recordaremos 2 días antes de tu fecha de pago.",
                    );
                  } else {
                    Alert.alert(
                      "Error",
                      "No tenemos permisos para enviar notificaciones.",
                    );
                  }
                },
              },
            ],
          );
        }
      }
    }
    return result;
  };

  return (
    <ThemedView
      style={[
        styles.container,
        { paddingTop: Spacing.s, backgroundColor: colors.background },
      ]}
    >
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <VisionHeader
          netWorth={netWorth}
          totalAssets={totalAssets}
          totalLiabilities={totalLiabilities}
        />

        <VisionEntityList
          activeTab={activeTab}
          setActiveTab={handleTabChange}
          assets={sortedAssets}
          liabilities={sortedLiabilities}
          onAddPress={onAddPress}
          onEntityPress={onEntityPress}
          onDeleteEntity={handleDeleteEntity}
          onFilterPress={() => setFilterVisible(true)}
          activeFilterCategory={filterCategory}
          onSortPress={() => setSortVisible(true)}
        />
      </ScrollView>

      <VisionFilterModal
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        activeTab={activeTab}
        currentCategory={filterCategory}
        onApply={setFilterCategory}
        onClear={() => setFilterCategory(null)}
      />

      <VisionSortModal
        visible={sortVisible}
        onClose={() => setSortVisible(false)}
        currentSort={sortBy}
        onApply={handleSortChange}
      />

      <AddEntityModal
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
        onSave={handleSaveEntity}
        selectedType={selectedType}
        initialEntity={selectedEntity}
        isSaving={isSaving}
      />

      <EntityDetailModal
        visible={detailModalVisible}
        onClose={() => setDetailModalVisible(false)}
        entity={selectedEntity}
        transactions={transactions}
        onEdit={handleEditEntity}
        onDelete={handleDelete}
        onUpdateCryptoPrice={handleUpdateCryptoPrice}
        onAddTransaction={handleAddTransactionToEntity}
        isSaving={isSaving}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.m,
  },
});
