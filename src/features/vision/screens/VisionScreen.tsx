import { Typography } from "@/components/atoms/Typography";
import { FloatingActionMenu } from "@/components/molecules/FloatingActionMenu";
import { ThemedView } from "@/components/themed-view";
import { BorderRadius, Spacing } from "@/constants/theme";
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
import { useVisionOperations } from "@/features/vision/hooks/useVisionOperations";
import { ExportButton } from "@/features/wallet/components/ExportTransactions";
import STRINGS from "@/i18n/es.json";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";

const VISION_SORT_PREF_KEY = "vision_sort_preference";

export default function VisionScreen() {
  const router = useRouter();
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

  const handleDelete = () => {
    if (selectedEntity) {
      handleDeleteEntity(selectedEntity.id.toString());
      setDetailModalVisible(false);
      setSelectedEntity(null);
    }
  };

  const handleEditEntity = () => {
    if (selectedEntity) {
      setDetailModalVisible(false);
      setSelectedType(selectedEntity.type);
      setAddModalVisible(true);
    }
  };

  return (
    <ThemedView style={{ flex: 1 }}>
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
                    onPress: () => setFilterVisible(true),
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
                    onPress: () => setSortVisible(true),
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
        contentContainerStyle={{
          paddingHorizontal: Spacing.m,
          paddingBottom: 100,
        }}
        contentInsetAdjustmentBehavior="automatic"
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "flex-end",
            marginBottom: Spacing.m,
          }}
        >
          <ExportButton type="vision" />
        </View>

        <VisionHeader
          netWorth={netWorth}
          totalAssets={totalAssets}
          totalLiabilities={totalLiabilities}
        />

        {/* Tabs */}
        <View
          style={{
            flexDirection: "row",
            backgroundColor: "#2C2C2E",
            borderRadius: BorderRadius.l,
            padding: 4,
            marginBottom: Spacing.m,
          }}
        >
          <TouchableOpacity
            style={{
              flex: 1,
              paddingVertical: 8,
              alignItems: "center",
              backgroundColor:
                activeTab === "asset" ? "#3A3A3C" : "transparent",
              borderRadius: BorderRadius.m,
            }}
            onPress={() => handleTabChange("asset")}
          >
            <Typography
              variant="body"
              weight="bold"
              style={{ color: activeTab === "asset" ? "#FFFFFF" : "#8E8E93" }}
            >
              {STRINGS.vision.assets}
            </Typography>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              flex: 1,
              paddingVertical: 8,
              alignItems: "center",
              backgroundColor:
                activeTab === "liability" ? "#3A3A3C" : "transparent",
              borderRadius: BorderRadius.m,
            }}
            onPress={() => handleTabChange("liability")}
          >
            <Typography
              variant="body"
              weight="bold"
              style={{
                color: activeTab === "liability" ? "#FFFFFF" : "#8E8E93",
              }}
            >
              {STRINGS.vision.liabilities}
            </Typography>
          </TouchableOpacity>
        </View>

        {activeTab === "liability" && (
          <View
            style={{
              flexDirection: "row",
              justifyContent: "flex-end",
              marginBottom: Spacing.m,
            }}
          >
            <TouchableOpacity
              onPress={() => router.push("/balance/liability-payments-management")}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: Spacing.xs,
                paddingHorizontal: Spacing.m,
                paddingVertical: Spacing.s,
                borderRadius: BorderRadius.l,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.surface,
              }}
            >
              <Typography variant="body" weight="bold" style={{ color: colors.text }}>
                Gestión de pagos
              </Typography>
            </TouchableOpacity>
          </View>
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
        onClose={() => setAddModalVisible(false)}
        onSave={handleAddEntity}
        selectedType={selectedType}
        initialEntity={selectedEntity}
        isSaving={isSaving}
      />

      <EntityDetailModal
        visible={detailModalVisible}
        onClose={() => {
          setDetailModalVisible(false);
          setSelectedEntity(null);
        }}
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
        onClose={() => setFilterVisible(false)}
        categories={
          activeTab === "asset"
            ? Array.from(
                new Set(
                  assets.map((a) => a.category).filter((c): c is string => !!c),
                ),
              )
            : Array.from(
                new Set(
                  liabilities
                    .map((l) => l.category)
                    .filter((c): c is string => !!c),
                ),
              )
        }
        selectedCategory={filterCategory}
        onSelectCategory={setFilterCategory}
      />

      <VisionSortModal
        visible={sortVisible}
        onClose={() => setSortVisible(false)}
        selectedOption={sortBy}
        onSelectOption={handleSortChange}
      />

      <FloatingActionMenu
        actions={[
          {
            id: "add",
            label: "Agregar",
            icon: "plus",
            color: colors.primary,
            onPress: onAddPress,
          },
          {
            id: "filter",
            label: "Filtrar",
            icon: filterCategory
              ? "line.3.horizontal.decrease.circle.fill"
              : "line.3.horizontal.decrease.circle",
            color: colors.primary,
            onPress: () => setFilterVisible(true),
          },
          {
            id: "sort",
            label: "Ordenar",
            icon: "arrow.up.arrow.down",
            color: colors.primary,
            onPress: () => setSortVisible(true),
          },
        ]}
      />
    </ThemedView>
  );
}
