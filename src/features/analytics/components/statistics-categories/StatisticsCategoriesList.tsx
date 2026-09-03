import { Typography } from "@/components/atoms/Typography";
import { Spacing, ThemeColors } from "@/constants/theme";
import { CategoryInsight } from "@/features/analytics/utils/analyticsUtils";
import React from "react";
import { StyleSheet, View } from "react-native";
import { StatisticsCategoryCard } from "./StatisticsCategoryCard";

interface StatisticsCategoriesListProps {
  colors: ThemeColors;
  categories: CategoryInsight[];
  expandedCategory: string | null;
  onCategoryPress: (category: string) => void;
}

/**
 * La lista no tiene superficie propia: es el contenedor que da el ritmo entre
 * cards (por eso `gap` y no un `marginBottom` por card) más el empty state. El
 * cristal lo pone cada `StatisticsCategoryCard`.
 */
export const StatisticsCategoriesList: React.FC<
  StatisticsCategoriesListProps
> = ({ colors, categories, expandedCategory, onCategoryPress }) => {
  if (categories.length === 0) {
    return <Typography muted>No hay gastos registrados este mes.</Typography>;
  }

  return (
    <View style={styles.list}>
      {categories.map((category, index) => (
        <StatisticsCategoryCard
          key={index}
          colors={colors}
          category={category}
          isExpanded={expandedCategory === category.category}
          onPress={() => onCategoryPress(category.category)}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  list: {
    gap: Spacing.sm,
  },
});
