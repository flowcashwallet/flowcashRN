import { Button } from "@/components/atoms/Button";
import { Spacing } from "@/constants/theme";
import STRINGS from "@/i18n/es.json";
import React from "react";
import { StyleSheet, View } from "react-native";

interface FormFooterActionsProps {
  isEditing: boolean;
  isSaving: boolean;
  onSave: (shouldClose: boolean) => void;
}

export function FormFooterActions({
  isEditing,
  isSaving,
  onSave,
}: FormFooterActionsProps) {
  return (
    <View style={styles.row}>
      <View style={styles.button}>
        <Button
          title={STRINGS.common.save}
          onPress={() => onSave(true)}
          loading={isSaving}
          variant="primary"
        />
      </View>
      {!isEditing && (
        <View style={styles.button}>
          <Button
            title="Guardar y otro"
            onPress={() => onSave(false)}
            loading={isSaving}
            variant="outline"
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: Spacing.m,
  },
  button: {
    flex: 1,
  },
});
