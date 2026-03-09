import { Typography } from "@/components/atoms/Typography";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { BorderRadius, Colors, Spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import React from "react";
import { Modal, StyleSheet, TouchableOpacity, View } from "react-native";

export type SortOption = "amount" | "name";

interface VisionSortModalProps {
  visible: boolean;
  onClose: () => void;
  selectedOption: SortOption;
  onSelectOption: (option: SortOption) => void;
}

export const VisionSortModal: React.FC<VisionSortModalProps> = ({
  visible,
  onClose,
  selectedOption,
  onSelectOption,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === "dark" ? "dark" : "light"];

  const handleSelect = (option: SortOption) => {
    onSelectOption(option);
    onClose();
  };

  const sortOptions: { id: SortOption; label: string; icon: string }[] = [
    { id: "amount", label: "Monto (Mayor a Menor)", icon: "dollarsign.circle" },
    { id: "name", label: "Alfabético (A-Z)", icon: "textformat" },
  ];

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
            <Typography
              variant="h3"
              weight="bold"
              style={{ color: colors.text }}
            >
              Ordenar por
            </Typography>
            <TouchableOpacity onPress={onClose}>
              <IconSymbol name="xmark" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            {sortOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionRow,
                  {
                    backgroundColor:
                      selectedOption === option.id
                        ? colors.surfaceHighlight
                        : "transparent",
                    borderColor:
                      selectedOption === option.id
                        ? colors.primary
                        : colors.border,
                  },
                ]}
                onPress={() => handleSelect(option.id)}
              >
                <View style={styles.optionContent}>
                  <IconSymbol
                    name={option.icon as any}
                    size={24}
                    color={
                      selectedOption === option.id
                        ? colors.primary
                        : colors.text
                    }
                  />
                  <Typography
                    variant="body"
                    style={{
                      marginLeft: Spacing.m,
                      color: colors.text,
                      fontWeight:
                        selectedOption === option.id ? "bold" : "normal",
                    }}
                  >
                    {option.label}
                  </Typography>
                </View>
                {selectedOption === option.id && (
                  <IconSymbol
                    name="checkmark"
                    size={20}
                    color={colors.primary}
                  />
                )}
              </TouchableOpacity>
            ))}
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
    minHeight: "40%",
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
  content: {
    flex: 1,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.m,
    borderRadius: BorderRadius.m,
    borderWidth: 1,
    marginBottom: Spacing.m,
  },
  optionContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  footer: {
    marginTop: Spacing.l,
    marginBottom: Spacing.xl,
  },
});
