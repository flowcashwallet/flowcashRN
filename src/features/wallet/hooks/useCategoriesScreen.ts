import { useTheme } from "@/contexts/ThemeContext";
import {
  addCategory,
  deleteCategory,
  fetchCategories,
  updateCategory,
} from "@/features/wallet/data/categoriesSlice";
import { AppDispatch, RootState } from "@/store/store";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";

export interface EditingCategory {
  id: string;
  name: string;
}

export const useCategoriesScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { categories, loading } = useSelector(
    (state: RootState) => state.categories,
  );
  const { colors } = useTheme();

  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingCategory, setEditingCategory] =
    useState<EditingCategory | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  useEffect(() => {
    if (user?.id) {
      dispatch(fetchCategories(user.id.toString()));
    }
  }, [dispatch, user]);

  const handleAddCategory = useCallback(async () => {
    if (!newCategoryName.trim() || !user?.id) return;
    try {
      await dispatch(
        addCategory({
          userId: user.id.toString(),
          name: newCategoryName.trim(),
        }),
      ).unwrap();
      setNewCategoryName("");
      setIsModalVisible(false);
    } catch {
      Alert.alert("Error", "No se pudo agregar la categoría");
    }
  }, [dispatch, newCategoryName, user]);

  const handleUpdateCategory = useCallback(async () => {
    if (!editingCategory || !editingCategory.name.trim()) return;
    try {
      await dispatch(
        updateCategory({
          id: editingCategory.id,
          name: editingCategory.name.trim(),
        }),
      ).unwrap();
      setEditingCategory(null);
      setIsModalVisible(false);
    } catch {
      Alert.alert("Error", "No se pudo actualizar la categoría");
    }
  }, [dispatch, editingCategory]);

  const handleDeleteCategory = useCallback(
    (id: string) => {
      Alert.alert(
        "Eliminar Categoría",
        "¿Estás seguro? Las transacciones asociadas no se eliminarán, pero perderán su categoría.",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Eliminar",
            style: "destructive",
            onPress: async () => {
              try {
                await dispatch(deleteCategory(id)).unwrap();
              } catch {
                Alert.alert("Error", "No se pudo eliminar la categoría");
              }
            },
          },
        ],
      );
    },
    [dispatch],
  );

  const openAddModal = useCallback(() => {
    setNewCategoryName("");
    setEditingCategory(null);
    setIsModalVisible(true);
  }, []);

  const openEditModal = useCallback((category: EditingCategory) => {
    setEditingCategory(category);
    setNewCategoryName(category.name);
    setIsModalVisible(true);
  }, []);

  const closeModal = useCallback(() => setIsModalVisible(false), []);

  const handleChangeCategoryName = useCallback(
    (text: string) => {
      if (editingCategory) {
        setEditingCategory({ ...editingCategory, name: text });
      } else {
        setNewCategoryName(text);
      }
    },
    [editingCategory],
  );

  const handleGoBack = useCallback(() => router.back(), [router]);

  const handleSubmitModal = editingCategory
    ? handleUpdateCategory
    : handleAddCategory;

  return {
    colors,
    insets,

    categories,
    loading,

    newCategoryName,
    editingCategory,
    isModalVisible,

    handleGoBack,
    openAddModal,
    openEditModal,
    handleDeleteCategory,
    closeModal,
    handleChangeCategoryName,
    handleSubmitModal,
  };
};
