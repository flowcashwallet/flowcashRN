import { Button } from "@/components/atoms/Button";
import { Typography } from "@/components/atoms/Typography";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { BorderRadius, Colors, Spacing } from "@/constants/theme";
import { VisionEntity } from "@/features/vision/data/visionSlice";
import { Category } from "@/features/wallet/data/categoriesSlice";
import { useColorScheme } from "@/hooks/use-color-scheme";
import STRINGS from "@/i18n/es.json";
import React, { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

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
    currentFilters.category,
  );
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(
    currentFilters.entityId,
  );
  const [selectedType, setSelectedType] = useState<"income" | "expense" | null>(
    currentFilters.type,
  );
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isEntityDropdownOpen, setIsEntityDropdownOpen] = useState(false);

  useEffect(() => {
    if (visible) {
      setSelectedCategory(currentFilters.category);
      setSelectedEntityId(currentFilters.entityId);
      setSelectedType(currentFilters.type);
      setIsCategoryDropdownOpen(false);
      setIsEntityDropdownOpen(false);
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
            <Typography
              variant="h3"
              weight="bold"
              style={{ color: colors.text }}
            >
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
              <View style={styles.optionsRow}>
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
                    setSelectedType(
                      selectedType === "expense" ? null : "expense",
                    )
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
                <TouchableOpacity
                  onPress={() => setIsEntityDropdownOpen(!isEntityDropdownOpen)}
                  style={[
                    styles.dropdown,
                    {
                      backgroundColor: colors.surfaceHighlight,
                      borderColor: colors.border,
                      marginBottom: isEntityDropdownOpen ? 0 : Spacing.m,
                      borderBottomLeftRadius: isEntityDropdownOpen
                        ? 0
                        : BorderRadius.m,
                      borderBottomRightRadius: isEntityDropdownOpen
                        ? 0
                        : BorderRadius.m,
                    },
                  ]}
                >
                  <View style={styles.dropdownHeader}>
                    <Typography
                      variant="body"
                      style={{
                        color: selectedEntityId
                          ? colors.text
                          : colors.textSecondary,
                      }}
                    >
                      {selectedEntityId
                        ? entities.find((e) => e.id === selectedEntityId)
                            ?.name || "Seleccionar Entidad"
                        : "Seleccionar Entidad"}
                    </Typography>
                    <Typography variant="body" style={{ color: colors.text }}>
                      {isEntityDropdownOpen ? "▲" : "▼"}
                    </Typography>
                  </View>
                </TouchableOpacity>

                {isEntityDropdownOpen && (
                  <View
                    style={[
                      styles.dropdownList,
                      {
                        borderColor: colors.border,
                        backgroundColor: colors.surfaceHighlight,
                      },
                    ]}
                  >
                    <ScrollView nestedScrollEnabled style={{ maxHeight: 200 }}>
                      <TouchableOpacity
                        onPress={() => {
                          setSelectedEntityId(null);
                          setIsEntityDropdownOpen(false);
                        }}
                        style={[
                          styles.dropdownItem,
                          { borderBottomColor: colors.border },
                        ]}
                      >
                        <Typography
                          variant="body"
                          style={{ color: colors.text }}
                        >
                          Todos
                        </Typography>
                      </TouchableOpacity>
                      {entities.map((entity, index) => (
                        <TouchableOpacity
                          key={entity.id}
                          onPress={() => {
                            setSelectedEntityId(entity.id);
                            setIsEntityDropdownOpen(false);
                          }}
                          style={[
                            styles.dropdownItem,
                            {
                              borderTopWidth: 1,
                              borderTopColor: colors.border,
                            },
                          ]}
                        >
                          <Typography
                            variant="body"
                            weight={
                              selectedEntityId === entity.id
                                ? "bold"
                                : "regular"
                            }
                            style={{ color: colors.text }}
                          >
                            {entity.name}
                          </Typography>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
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
                <TouchableOpacity
                  onPress={() =>
                    setIsCategoryDropdownOpen(!isCategoryDropdownOpen)
                  }
                  style={[
                    styles.dropdown,
                    {
                      backgroundColor: colors.surfaceHighlight,
                      borderColor: colors.border,
                      marginBottom: isCategoryDropdownOpen ? 0 : Spacing.m,
                      borderBottomLeftRadius: isCategoryDropdownOpen
                        ? 0
                        : BorderRadius.m,
                      borderBottomRightRadius: isCategoryDropdownOpen
                        ? 0
                        : BorderRadius.m,
                    },
                  ]}
                >
                  <View style={styles.dropdownHeader}>
                    <Typography
                      variant="body"
                      style={{
                        color: selectedCategory
                          ? colors.text
                          : colors.textSecondary,
                        flex: 1,
                      }}
                    >
                      {selectedCategory || "Seleccionar Categoría"}
                    </Typography>
                    <Typography variant="body" style={{ color: colors.text }}>
                      {isCategoryDropdownOpen ? "▲" : "▼"}
                    </Typography>
                  </View>
                </TouchableOpacity>

                {isCategoryDropdownOpen && (
                  <View
                    style={[
                      styles.dropdownList,
                      {
                        borderColor: colors.border,
                        backgroundColor: colors.surfaceHighlight,
                      },
                    ]}
                  >
                    <ScrollView nestedScrollEnabled style={{ maxHeight: 200 }}>
                      <TouchableOpacity
                        onPress={() => {
                          setSelectedCategory(null);
                          setIsCategoryDropdownOpen(false);
                        }}
                        style={[
                          styles.dropdownItem,
                          { borderBottomColor: colors.border },
                        ]}
                      >
                        <Typography
                          variant="body"
                          style={{ color: colors.text }}
                        >
                          Todas
                        </Typography>
                      </TouchableOpacity>
                      {categories.map((cat, index) => (
                        <TouchableOpacity
                          key={cat.id || cat.name}
                          onPress={() => {
                            setSelectedCategory(cat.name);
                            setIsCategoryDropdownOpen(false);
                          }}
                          style={[
                            styles.dropdownItem,
                            {
                              borderTopWidth: 1,
                              borderTopColor: colors.border,
                            },
                          ]}
                        >
                          <Typography
                            variant="body"
                            weight={
                              selectedCategory === cat.name ? "bold" : "regular"
                            }
                            style={{ color: colors.text }}
                          >
                            {cat.name}
                          </Typography>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
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
  optionsRow: {
    flexDirection: "row",
    gap: Spacing.s,
  },
  optionButton: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.m,
    borderRadius: 20,
    borderWidth: 1,
  },
  dropdown: {
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.m,
    borderRadius: BorderRadius.m,
    borderWidth: 1,
  },
  dropdownHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dropdownList: {
    borderWidth: 1,
    borderTopWidth: 0,
    borderBottomLeftRadius: BorderRadius.m,
    borderBottomRightRadius: BorderRadius.m,
    marginBottom: Spacing.m,
  },
  dropdownItem: {
    padding: Spacing.m,
  },
  footer: {
    flexDirection: "row",
    marginTop: Spacing.m,
  },
});
