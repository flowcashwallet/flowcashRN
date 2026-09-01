import { Typography } from "@/components/atoms/Typography";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Spacing, ThemeColors } from "@/constants/theme";
import { VisionEntity } from "@/features/vision/data/visionSlice";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { EntitySelectionModal } from "./EntitySelectionModal";
import { chipStyles, dropdownStyles } from "./sharedStyles";

interface EntitySelectorFieldProps {
  label: string;
  entities: VisionEntity[];
  selectedEntityId: string | null;
  onSelect: (entityId: string | null) => void;
  placeholder: string;
  frequentEntities?: (VisionEntity | undefined)[];
  colors: ThemeColors;
}

export function EntitySelectorField({
  label,
  entities,
  selectedEntityId,
  onSelect,
  placeholder,
  frequentEntities,
  colors,
}: EntitySelectorFieldProps) {
  const [isModalVisible, setIsModalVisible] = useState(false);

  return (
    <View style={styles.container}>
      <Typography variant="overline" muted style={styles.label}>
        {label}
      </Typography>

      {frequentEntities && frequentEntities.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={chipStyles.scroll}
          contentContainerStyle={chipStyles.content}
        >
          {frequentEntities.map((entity) => {
            const selected = selectedEntityId === entity!.id;
            return (
              <TouchableOpacity
                key={entity!.id}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => {
                  onSelect(entity!.id);
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
                  style={selected ? { color: colors.onPrimary } : undefined}
                >
                  {entity!.name}
                </Typography>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      <TouchableOpacity
        onPress={() => setIsModalVisible(true)}
        style={[
          dropdownStyles.dropdown,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <View style={dropdownStyles.dropdownHeader}>
          <Typography variant="body" muted={!selectedEntityId}>
            {selectedEntityId
              ? entities.find((e) => e.id === selectedEntityId)?.name ||
                placeholder
              : placeholder}
          </Typography>
          <IconSymbol name="chevron.down" size={16} color={colors.icon} />
        </View>
      </TouchableOpacity>

      <EntitySelectionModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        onSelect={onSelect}
        visionEntities={entities}
        selectedEntityId={selectedEntityId}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.xl,
  },
  label: {
    marginBottom: Spacing.xs,
  },
});
