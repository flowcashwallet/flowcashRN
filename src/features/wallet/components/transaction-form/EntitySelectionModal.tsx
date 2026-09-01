import { Input } from "@/components/atoms/Input";
import { Typography } from "@/components/atoms/Typography";
import { BottomSheet } from "@/components/molecules/BottomSheet";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";
import { VisionEntity } from "@/features/vision/data/visionSlice";
import React, { useState } from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";

export interface EntitySelectionListProps {
  onClose: () => void;
  onSelect: (entityId: string | null) => void;
  visionEntities: VisionEntity[];
  selectedEntityId: string | null;
}

interface EntityRowProps {
  name: string;
  selected: boolean;
  italic?: boolean;
  onPress: () => void;
}

function EntityRow({ name, selected, italic = false, onPress }: EntityRowProps) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.item, { borderBottomColor: colors.border }]}
    >
      <Typography
        variant="body"
        weight={selected ? "semibold" : "regular"}
        style={italic ? styles.italic : undefined}
      >
        {name}
      </Typography>
      {selected ? (
        <IconSymbol name="checkmark" size={16} color={colors.primary} />
      ) : null}
    </TouchableOpacity>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Typography variant="overline" muted>
        {label}
      </Typography>
    </View>
  );
}

export const EntitySelectionList: React.FC<EntitySelectionListProps> = ({
  onClose,
  onSelect,
  visionEntities,
  selectedEntityId,
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredEntities = visionEntities.filter((e) =>
    e.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const assets = filteredEntities.filter((e) => e.type === "asset");
  const liabilities = filteredEntities.filter((e) => e.type === "liability");
  const others = filteredEntities.filter(
    (e) => e.type !== "asset" && e.type !== "liability",
  );

  const groups: { label: string; entities: VisionEntity[] }[] = [
    { label: "Activos", entities: assets },
    { label: "Pasivos", entities: liabilities },
    { label: "Otros", entities: others },
  ];

  return (
    <>
      <View style={styles.searchRow}>
        <Input
          placeholder="Buscar activo/pasivo..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
      >
        <EntityRow
          name="Ninguno"
          italic
          selected={selectedEntityId === null}
          onPress={() => {
            onSelect(null);
            onClose();
          }}
        />

        {visionEntities.length === 0 ? (
          <View style={styles.emptyState}>
            <Typography variant="body" style={styles.centeredText}>
              No tienes cuentas ni tarjetas registradas.
            </Typography>
            <Typography variant="caption" muted style={styles.centeredText}>
              Ve a la sección &quot;Visión&quot; para agregar tus Activos
              (Cuentas) y Pasivos (Tarjetas).
            </Typography>
          </View>
        ) : filteredEntities.length === 0 ? (
          <View style={styles.emptyState}>
            <Typography variant="body" muted style={styles.centeredText}>
              No se encontraron resultados para &quot;{searchQuery}&quot;
            </Typography>
          </View>
        ) : (
          groups.map(({ label, entities }) =>
            entities.length > 0 ? (
              <View key={label}>
                <SectionLabel label={label} />
                {entities.map((entity) => (
                  <EntityRow
                    key={entity.id}
                    name={entity.name}
                    selected={selectedEntityId === entity.id}
                    onPress={() => {
                      onSelect(entity.id);
                      onClose();
                    }}
                  />
                ))}
              </View>
            ) : null,
          )
        )}
      </ScrollView>
    </>
  );
};

interface EntitySelectionModalProps extends EntitySelectionListProps {
  visible: boolean;
}

export const EntitySelectionModal: React.FC<EntitySelectionModalProps> = ({
  visible,
  ...props
}) => {
  return (
    <BottomSheet
      visible={visible}
      onClose={props.onClose}
      title="Seleccionar Entidad"
      contentStyle={styles.sheetContent}
    >
      <EntitySelectionList {...props} />
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  // Las filas van a sangre; el padding horizontal lo pone cada bloque.
  sheetContent: {
    paddingHorizontal: 0,
    paddingTop: 0,
  },
  searchRow: {
    paddingHorizontal: Spacing.m,
    paddingTop: Spacing.m,
  },
  searchInput: {
    marginBottom: 0,
  },
  listContent: {
    paddingBottom: Spacing.m,
  },
  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  italic: {
    fontStyle: "italic",
  },
  sectionHeader: {
    paddingHorizontal: Spacing.m,
    paddingTop: Spacing.m,
    paddingBottom: Spacing.s,
  },
  emptyState: {
    padding: Spacing.xxl,
    gap: Spacing.s,
  },
  centeredText: {
    textAlign: "center",
  },
});
