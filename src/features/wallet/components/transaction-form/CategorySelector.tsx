import { Typography } from "@/components/atoms/Typography";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Spacing, ThemeColors } from "@/constants/theme";
import STRINGS from "@/i18n/es.json";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { chipStyles, dropdownStyles } from "./sharedStyles";

interface CategorySelectorProps {
  selectedCategory: string | null;
  onSelectCategory: (category: string) => void;
  frequentCategories: string[];
  colors: ThemeColors;
}

export function CategorySelector({
  selectedCategory,
  onSelectCategory,
  frequentCategories,
  colors,
}: CategorySelectorProps) {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Typography variant="overline" muted style={styles.label}>
        {STRINGS.wallet.category}
      </Typography>

      {/* Quick Category Chips */}
      {frequentCategories.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={chipStyles.scroll}
          contentContainerStyle={chipStyles.content}
        >
          {frequentCategories.map((cat) => {
            const selected = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => {
                  onSelectCategory(cat);
                  Haptics.selectionAsync();
                }}
                style={[
                  chipStyles.chip,
                  {
                    backgroundColor: selected
                      ? colors.primary
                      : colors.surface,
                    borderColor: selected ? colors.primary : colors.border,
                  },
                ]}
              >
                <Typography
                  variant="bodySmall"
                  weight={selected ? "semibold" : "regular"}
                  // `onPrimary` respeta el aviso de contraste sobre `primary`.
                  style={selected ? { color: colors.onPrimary } : undefined}
                >
                  {cat}
                </Typography>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      <TouchableOpacity
        onPress={() =>
          router.push({
            pathname: "/wallet/category-picker",
            params: {
              target: "transactionForm",
              includeAll: "0",
              selected: selectedCategory || "",
            },
          })
        }
        style={[
          dropdownStyles.dropdown,
          styles.dropdown,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <View style={dropdownStyles.dropdownHeader}>
          <Typography variant="body" muted={!selectedCategory}>
            {selectedCategory || STRINGS.wallet.selectCategory}
          </Typography>
          <IconSymbol name="chevron.right" size={16} color={colors.icon} />
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.m,
  },
  label: {
    marginBottom: Spacing.xs,
  },
  dropdown: {
    marginBottom: Spacing.m,
  },
});
