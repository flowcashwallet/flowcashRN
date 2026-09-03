import { Typography } from "@/components/atoms/Typography";
import { Spacing, ThemeColors } from "@/constants/theme";
import { CategoryInsight } from "@/features/analytics/utils/analyticsUtils";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { CategoryCard } from "./CategoryCard";

interface TopCategoriesSectionProps {
  colors: ThemeColors;
  categories: CategoryInsight[];
  expandedCategory: string | null;
  onCategoryPress: (category: string) => void;
  onViewAllPress: () => void;
}

export const TopCategoriesSection: React.FC<TopCategoriesSectionProps> = ({
  colors,
  categories,
  expandedCategory,
  onCategoryPress,
  onViewAllPress,
}) => {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeaderRow}>
        <Typography variant="heading" style={styles.sectionTitle}>
          Top Categorías
        </Typography>
        <TouchableOpacity onPress={onViewAllPress} accessibilityRole="button">
          <Typography variant="button" style={{ color: colors.primary }}>
            Ver más
          </Typography>
        </TouchableOpacity>
      </View>
      {categories.length === 0 ? (
        <Typography muted>No hay gastos registrados este mes.</Typography>
      ) : (
        <View style={styles.list}>
          {categories.map((category, index) => (
            <CategoryCard
              key={index}
              colors={colors}
              category={category}
              isExpanded={expandedCategory === category.category}
              onPress={() => onCategoryPress(category.category)}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: Spacing.l,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    marginBottom: Spacing.s,
  },
  /** La separación entre cards la da el `gap`, no un `marginBottom` por card. */
  list: {
    gap: Spacing.s,
  },
});
