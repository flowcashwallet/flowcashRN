import { Motion } from "@/constants/theme";
import { SortOption } from "@/features/vision/components/VisionSortModal";
import { VisionEntity } from "@/features/vision/data/visionSlice";
import { useVisionData } from "@/features/vision/hooks/useVisionData";
import { useVisionOperations } from "@/features/vision/hooks/useVisionOperations";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const VISION_SORT_PREF_KEY = "vision_sort_preference";

const sortEntities = (entities: VisionEntity[], sortBy: SortOption) => {
  return [...entities].sort((a, b) => {
    if (sortBy === "amount") {
      return b.amount - a.amount; // Descending
    } else {
      return a.name.localeCompare(b.name); // Ascending
    }
  });
};

const categoriesOf = (entities: VisionEntity[]) =>
  Array.from(
    new Set(entities.map((e) => e.category).filter((c): c is string => !!c)),
  );

/**
 * Compone `useVisionData()`/`useVisionOperations()` (sin duplicar su fetch
 * ni sus mutaciones) con todo el estado de UI que vivía en el cuerpo de
 * `VisionScreen`: tabs, modales, filtro/orden persistido y sus handlers.
 */
export const useVisionScreen = () => {
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

  const handleSortChange = useCallback(async (option: SortOption) => {
    setSortBy(option);
    try {
      await AsyncStorage.setItem(VISION_SORT_PREF_KEY, option);
    } catch (error) {
      console.error("Failed to save sort preference:", error);
    }
  }, []);

  const filteredAssets = useMemo(
    () =>
      assets.filter(
        (item) => !filterCategory || item.category === filterCategory,
      ),
    [assets, filterCategory],
  );
  const filteredLiabilities = useMemo(
    () =>
      liabilities.filter(
        (item) => !filterCategory || item.category === filterCategory,
      ),
    [liabilities, filterCategory],
  );

  const sortedAssets = useMemo(
    () => sortEntities(filteredAssets, sortBy),
    [filteredAssets, sortBy],
  );
  const sortedLiabilities = useMemo(
    () => sortEntities(filteredLiabilities, sortBy),
    [filteredLiabilities, sortBy],
  );

  const filterCategories = useMemo(
    () =>
      activeTab === "asset" ? categoriesOf(assets) : categoriesOf(liabilities),
    [activeTab, assets, liabilities],
  );

  const handleTabChange = useCallback((tab: "asset" | "liability") => {
    setActiveTab(tab);
    setFilterCategory(null);
  }, []);

  const onAddPress = useCallback(() => {
    setSelectedType(activeTab);
    setSelectedEntity(null);
    setAddModalVisible(true);
  }, [activeTab]);

  const onEntityPress = useCallback((entity: VisionEntity) => {
    setSelectedEntity(entity);
    setDetailModalVisible(true);
  }, []);

  const handleDelete = useCallback(() => {
    if (selectedEntity) {
      handleDeleteEntity(selectedEntity.id.toString());
      setDetailModalVisible(false);
      setSelectedEntity(null);
    }
  }, [handleDeleteEntity, selectedEntity]);

  /**
   * `AddEntityModal`/`EntityDetailModal` son dos `BottomSheet` independientes,
   * cada uno con su propio `Modal` nativo. Cerrar uno y abrir el otro en el
   * mismo tick deja los dos `Modal` con `visible=true` a la vez durante la
   * animación de salida del primero (`BottomSheet` no desmonta hasta que
   * termina, para que se vea salir) — iOS no soporta bien dos `Modal` nativos
   * presentados a la vez, y el síntoma es justo el bug reportado: un sheet
   * fantasma sin contenido que bloquea el toque sobre la pantalla. Se espera
   * a que termine la animación de salida (`Motion.exit`) antes de abrir el de
   * edición, para que nunca haya dos `Modal` nativos visibles a la vez.
   */
  const editModalTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  useEffect(() => {
    return () => {
      if (editModalTimeoutRef.current) clearTimeout(editModalTimeoutRef.current);
    };
  }, []);

  const handleEditEntity = useCallback(() => {
    if (selectedEntity) {
      setDetailModalVisible(false);
      setSelectedType(selectedEntity.type);
      if (editModalTimeoutRef.current) clearTimeout(editModalTimeoutRef.current);
      editModalTimeoutRef.current = setTimeout(() => {
        setAddModalVisible(true);
      }, Motion.exit);
    }
  }, [selectedEntity]);

  const onOpenFilter = useCallback(() => setFilterVisible(true), []);
  const onOpenSort = useCallback(() => setSortVisible(true), []);
  const onCloseAddModal = useCallback(() => setAddModalVisible(false), []);
  const onCloseDetailModal = useCallback(() => {
    setDetailModalVisible(false);
    setSelectedEntity(null);
  }, []);
  const onCloseFilterModal = useCallback(() => setFilterVisible(false), []);
  const onCloseSortModal = useCallback(() => setSortVisible(false), []);

  const onOpenLiabilityManagement = useCallback(() => {
    router.push("/balance/liability-payments-management");
  }, [router]);

  const fabActions = useMemo(
    () => [
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
        onPress: onOpenFilter,
      },
      {
        id: "sort",
        label: "Ordenar",
        icon: "arrow.up.arrow.down",
        color: colors.primary,
        onPress: onOpenSort,
      },
    ],
    [colors.primary, filterCategory, onAddPress, onOpenFilter, onOpenSort],
  );

  return {
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

    assets,
    liabilities,
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
  };
};
