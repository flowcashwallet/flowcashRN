import { ThemedView } from "@/components/themed-view";
import React from "react";
import { ActivityIndicator, StyleSheet } from "react-native";
import { CategoriesHeader } from "../components/categories/CategoriesHeader";
import { CategoriesList } from "../components/categories/CategoriesList";
import { CategoryFormModal } from "../components/categories/modals/CategoryFormModal";
import { useCategoriesScreen } from "../hooks/useCategoriesScreen";

export default function CategoriesScreen() {
  const {
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
  } = useCategoriesScreen();

  if (loading && categories.length === 0) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <CategoriesHeader
        insets={insets}
        colors={colors}
        onGoBack={handleGoBack}
        onAdd={openAddModal}
      />

      <CategoriesList
        categories={categories}
        colors={colors}
        onEdit={openEditModal}
        onDelete={handleDeleteCategory}
      />

      <CategoryFormModal
        visible={isModalVisible}
        editingCategory={editingCategory}
        newCategoryName={newCategoryName}
        onChangeName={handleChangeCategoryName}
        onClose={closeModal}
        onSubmit={handleSubmitModal}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: "center",
  },
});
