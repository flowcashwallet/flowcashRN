import { Button } from "@/components/atoms/Button";
import { Typography } from "@/components/atoms/Typography";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors, Spacing } from "@/constants/theme";
import { VisionEntity } from "@/features/vision/data/visionSlice";
import { Category } from "@/features/wallet/data/categoriesSlice";
import { useColorScheme } from "@/hooks/use-color-scheme";
import STRINGS from "@/i18n/es.json";
import React, { useEffect, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";

interface TransactionFilterModalProps {
  visible: boolean;
  onClose: () => void;
  categories: Category[];
  entities: VisionEntity[];
  currentFilters: {
    category: string | null;
    entityId: string | null;
    type: "income" | "expense" | null;
  };
  onApply: (filters: {
    category: string | null;
    entityId: string | null;
    type: "income" | "expense" | null;
  }) => void;
  onClear: () => void;
}

export const TransactionFilterModal: React.FC<TransactionFilterModalProps> = ({
  visible,
  onClose,
  categories,
  entities,
  currentFilters,
  onApply,
  onClear,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    currentFilters.category
  );
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(
    currentFilters.entityId
  );
  const [selectedType, setSelectedType] = useState<
    "income" | "expense" | null
  >(currentFilters.type);

  useEffect(() => {
    if (visible) {
      setSelectedCategory(currentFilters.category);
      setSelectedEntityId(currentFilters.entityId);
      setSelectedType(currentFilters.type);
    }
  }, [visible, currentFilters]);

  const handleApply = () => {
    onApply({
      category: selectedCategory,
      entityId: selectedEntityId,
      type: selectedType,
    });
    onClose();
  };

  const handleClear = () => {
    setSelectedCategory(null);
    setSelectedEntityId(null);
    setSelectedType(null);
    onClear();
    onClose();
  };

  const OptionButton = ({
    label,
    selected,
    onPress,
  }: {
    label: string;
    selected: boolean;
    onPress: () => void;
  }) => (
    <Pressable
      onPress={onPress}
      style={[
        styles.optionButton,
        {
          backgroundColor: selected ? colors.primary : colors.surfaceHighlight,
          borderColor: selected ? colors.primary : "transparent",
        },
      ]}
    >
      <Typography
        variant="caption"
        weight={selected ? "bold" : "regular"}
        style={{ color: selected ? "#fff" : colors.text }}
      >
        {label}
      </Typography>
    </Pressable>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[styles.content, { backgroundColor: colors.surface }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.header}>
            <Typography variant="h3" weight="bold" style={{ color: colors.text }}>
              Filtrar Transacciones
            </Typography>
            <Pressable onPress={onClose}>
              <IconSymbol name="xmark" size={24} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView
            style={{ maxHeight: 500 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Type Filter */}
            <View style={styles.section}>
              <Typography
                variant="body"
                weight="bold"
                style={{ marginBottom: Spacing.s, color: colors.text }}
              >
                {STRINGS.wallet.type}
              </Typography>
              <View style={styles.optionsGrid}>
                <OptionButton
                  label={STRINGS.wallet.income}
                  selected={selectedType === "income"}
                  onPress={() =>
                    setSelectedType(selectedType === "income" ? null : "income")
                  }
                />
                <OptionButton
                  label={STRINGS.wallet.expense}
                  selected={selectedType === "expense"}
                  onPress={() =>
                    setSelectedType(selectedType === "expense" ? null : "expense")
                  }
                />
              </View>
            </View>

            {/* Entity Filter */}
            {entities.length > 0 && (
              <View style={styles.section}>
                <Typography
                  variant="body"
                  weight="bold"
                  style={{ marginBottom: Spacing.s, color: colors.text }}
                >
                  Activo/Pasivo Asociado
                </Typography>
                <View style={styles.optionsGrid}>
                  {entities.map((entity) => (
                    <OptionButton
                      key={entity.id}
                      label={entity.name}
                      selected={selectedEntityId === entity.id}
                      onPress={() =>
                        setSelectedEntityId(
                          selectedEntityId === entity.id ? null : entity.id
                        )
                      }
                    />
                  ))}
                </View>
              </View>
            )}

            {/* Category Filter */}
            {categories.length > 0 && (
              <View style={styles.section}>
                <Typography
                  variant="body"
                  weight="bold"
                  style={{ marginBottom: Spacing.s, color: colors.text }}
                >
                  {STRINGS.wallet.category}
                </Typography>
                <View style={styles.optionsGrid}>
                  {categories.map((cat) => (
                    <OptionButton
                      key={cat.id || cat.name}
                      label={cat.name}
                      selected={selectedCategory === cat.name}
                      onPress={() =>
                        setSelectedCategory(
                          selectedCategory === cat.name ? null : cat.name
                        )
                      }
                    />
                  ))}
                </View>
              </View>
            )}
          </ScrollView>

          <View style={styles.footer}>
            <Button
              title="Limpiar"
              onPress={handleClear}
              variant="outline"
              style={{ flex: 1, marginRight: Spacing.s }}
            />
            <Button title="Aplicar" onPress={handleApply} style={{ flex: 1 }} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  content: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Spacing.m,
    paddingBottom: 40,
    maxHeight: "90%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.m,
  },
  section: {
    marginBottom: Spacing.l,
  },
  optionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.s,
  },
  optionButton: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.m,
    borderRadius: 20,
    borderWidth: 1,
  },
  footer: {
    flexDirection: "row",
    marginTop: Spacing.m,
  },
});
