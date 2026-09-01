import { Typography } from "@/components/atoms/Typography";
import { Spacing, ThemeColors } from "@/constants/theme";
import React from "react";
import { FlatList, StyleSheet } from "react-native";
import { EditingCategory } from "../../hooks/useCategoriesScreen";
import { CategoryListItem } from "./CategoryListItem";

interface CategoriesListProps {
  categories: EditingCategory[];
  colors: ThemeColors;
  onEdit: (category: EditingCategory) => void;
  onDelete: (id: string) => void;
}

export function CategoriesList({
  categories,
  colors,
  onEdit,
  onDelete,
}: CategoriesListProps) {
  return (
    <FlatList
      contentInsetAdjustmentBehavior="automatic"
      data={categories}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContent}
      renderItem={({ item }) => (
        <CategoryListItem
          category={item}
          colors={colors}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      )}
      ListEmptyComponent={
        <Typography variant="body" muted style={styles.emptyText}>
          No tienes categorías personalizadas.
        </Typography>
      }
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: Spacing.m,
    paddingBottom: Spacing.xl,
  },
  emptyText: {
    textAlign: "center",
    marginTop: Spacing.xxl,
  },
});
