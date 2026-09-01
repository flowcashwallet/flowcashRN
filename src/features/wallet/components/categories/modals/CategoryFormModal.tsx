import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { BottomSheet } from "@/components/molecules/BottomSheet";
import { Spacing } from "@/constants/theme";
import React from "react";
import { StyleSheet, View } from "react-native";
import { EditingCategory } from "../../../hooks/useCategoriesScreen";

interface CategoryFormModalProps {
  visible: boolean;
  editingCategory: EditingCategory | null;
  newCategoryName: string;
  onChangeName: (text: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}

export function CategoryFormModal({
  visible,
  editingCategory,
  newCategoryName,
  onChangeName,
  onClose,
  onSubmit,
}: CategoryFormModalProps) {
  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={editingCategory ? "Editar Categoría" : "Nueva Categoría"}
    >
      <Input
        label="Nombre"
        placeholder="Nombre de la categoría"
        value={editingCategory ? editingCategory.name : newCategoryName}
        onChangeText={onChangeName}
        autoFocus
        returnKeyType="done"
        onSubmitEditing={onSubmit}
      />

      <View style={styles.actionsRow}>
        <Button
          title="Cancelar"
          variant="outline"
          onPress={onClose}
          style={styles.actionButton}
        />
        <Button
          title="Guardar"
          onPress={onSubmit}
          style={styles.actionButton}
        />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  actionsRow: {
    flexDirection: "row",
    gap: Spacing.s,
    marginTop: Spacing.s,
  },
  actionButton: {
    flex: 1,
  },
});
