import { Button } from "@/components/atoms/Button";
import { Typography } from "@/components/atoms/Typography";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { BorderRadius, Colors, Spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import STRINGS from "@/i18n/es.json";
import React, { useEffect, useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

interface VisionFilterModalProps {
  visible: boolean;
  onClose: () => void;
  activeTab: "asset" | "liability";
  currentCategory: string | null;
  onApply: (category: string | null) => void;
  onClear: () => void;
}

export const VisionFilterModal: React.FC<VisionFilterModalProps> = ({
  visible,
  onClose,
  activeTab,
  currentCategory,
  onApply,
  onClear,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    currentCategory
  );

  useEffect(() => {
    if (visible) {
      setSelectedCategory(currentCategory);
    }
  }, [visible, currentCategory]);

  const categories =
    activeTab === "asset"
      ? STRINGS.vision.categories.asset
      : STRINGS.vision.categories.liability;

  const handleApply = () => {
    onApply(selectedCategory);
    onClose();
  };

  const handleClear = () => {
    onClear();
    onClose();
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View
          style={[styles.modalView, { backgroundColor: colors.background }]}
        >
          <View style={styles.header}>
            <Typography variant="h3" weight="bold" style={{ color: colors.text }}>
              Filtrar por Categoría
            </Typography>
            <TouchableOpacity onPress={onClose}>
              <IconSymbol name="xmark" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollView}>
            <Typography variant="body" weight="bold" style={{ marginBottom: Spacing.s, color: colors.text }}>
              Categorías
            </Typography>
            <View style={styles.categoriesContainer}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryChip,
                    {
                      borderColor: colors.border,
                      backgroundColor:
                        selectedCategory === cat
                          ? colors.primary
                          : "transparent",
                    },
                  ]}
                  onPress={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
                >
                  <Typography
                    variant="caption"
                    style={{
                      color:
                        selectedCategory === cat
                          ? "#FFF"
                          : colors.text,
                    }}
                  >
                    {cat}
                  </Typography>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <Button
              title="Limpiar"
              onPress={handleClear}
              variant="outline"
              style={{ flex: 1, marginRight: Spacing.s }}
            />
            <Button
              title="Aplicar"
              onPress={handleApply}
              variant="primary"
              style={{ flex: 1, marginLeft: Spacing.s }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalView: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.l,
    height: "50%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.l,
  },
  scrollView: {
    flex: 1,
  },
  categoriesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.s,
  },
  categoryChip: {
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.s,
    borderRadius: BorderRadius.l,
    borderWidth: 1,
    marginBottom: Spacing.s,
    marginRight: Spacing.s,
  },
  footer: {
    flexDirection: "row",
    marginTop: Spacing.l,
    marginBottom: Spacing.xl,
  },
});
