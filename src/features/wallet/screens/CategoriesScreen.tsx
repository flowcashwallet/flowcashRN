import { Button } from "@/components/atoms/Button";
import { Card } from "@/components/atoms/Card";
import { Input } from "@/components/atoms/Input";
import { Typography } from "@/components/atoms/Typography";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors, Spacing } from "@/constants/theme";
import {
  addCategory,
  deleteCategory,
  fetchCategories,
  updateCategory,
} from "@/features/wallet/data/categoriesSlice";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { AppDispatch, RootState } from "@/store/store";
import { Stack } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";

export default function CategoriesScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { categories, loading } = useSelector(
    (state: RootState) => state.categories,
  );
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingCategory, setEditingCategory] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  useEffect(() => {
    if (user?.uid) {
      dispatch(fetchCategories(user.uid));
    }
  }, [dispatch, user]);

  const handleAddCategory = async () => {
    if (!newCategoryName.trim() || !user?.uid) return;
    try {
      await dispatch(
        addCategory({ userId: user.uid, name: newCategoryName.trim() }),
      ).unwrap();
      setNewCategoryName("");
      setIsModalVisible(false);
    } catch (error) {
      Alert.alert("Error", "No se pudo agregar la categoría");
    }
  };

  const handleUpdateCategory = async () => {
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
    } catch (error) {
      Alert.alert("Error", "No se pudo actualizar la categoría");
    }
  };

  const handleDeleteCategory = (id: string) => {
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
            } catch (error) {
              Alert.alert("Error", "No se pudo eliminar la categoría");
            }
          },
        },
      ],
    );
  };

  const openAddModal = () => {
    setNewCategoryName("");
    setEditingCategory(null);
    setIsModalVisible(true);
  };

  const openEditModal = (category: { id: string; name: string }) => {
    setEditingCategory(category);
    setNewCategoryName(category.name);
    setIsModalVisible(true);
  };

  if (loading && categories.length === 0) {
    return (
      <ThemedView style={[styles.container, { justifyContent: "center" }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          title: "Categorías",
          headerStyle: {
            backgroundColor: colors.surfaceHighlight || colors.surface,
          },
          headerTintColor: colors.text,
          headerTitleStyle: {
            fontWeight: "bold",
          },
          headerRight: () => (
            <TouchableOpacity onPress={openAddModal}>
              <IconSymbol
                name="plus.circle.fill"
                size={24}
                color={colors.primary}
              />
            </TouchableOpacity>
          ),
        }}
      />

      <FlatList
        data={categories}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: Spacing.m }}
        renderItem={({ item }) => (
          <Card
            style={{
              marginBottom: Spacing.s,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingVertical: Spacing.m,
            }}
          >
            <Typography variant="body">{item.name}</Typography>
            <View style={{ flexDirection: "row", gap: Spacing.m }}>
              <TouchableOpacity onPress={() => openEditModal(item)}>
                <IconSymbol name="pencil" size={20} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDeleteCategory(item.id)}>
                <IconSymbol name="trash" size={20} color={colors.error} />
              </TouchableOpacity>
            </View>
          </Card>
        )}
        ListEmptyComponent={
          <Typography
            style={{
              textAlign: "center",
              marginTop: Spacing.xl,
              color: colors.textSecondary,
            }}
          >
            No tienes categorías personalizadas.
          </Typography>
        }
      />

      <Modal
        visible={isModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.modalContent,
                { backgroundColor: colors.surface, shadowColor: "#000" },
              ]}
            >
              <Typography
                variant="h3"
                weight="bold"
                style={{ marginBottom: Spacing.m }}
              >
                {editingCategory ? "Editar Categoría" : "Nueva Categoría"}
              </Typography>

              <Input
                placeholder="Nombre de la categoría"
                value={editingCategory ? editingCategory.name : newCategoryName}
                onChangeText={(text) =>
                  editingCategory
                    ? setEditingCategory({ ...editingCategory, name: text })
                    : setNewCategoryName(text)
                }
                autoFocus
              />

              <View
                style={{
                  flexDirection: "row",
                  gap: Spacing.m,
                  marginTop: Spacing.l,
                }}
              >
                <Button
                  title="Cancelar"
                  variant="outline"
                  onPress={() => setIsModalVisible(false)}
                  style={{ flex: 1 }}
                />
                <Button
                  title="Guardar"
                  onPress={
                    editingCategory ? handleUpdateCategory : handleAddCategory
                  }
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.m,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: Spacing.l,
  },
  modalContent: {
    borderRadius: Spacing.m,
    padding: Spacing.l,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});
