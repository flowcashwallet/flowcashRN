import { Input } from "@/components/atoms/Input";
import { Typography } from "@/components/atoms/Typography";
import { Colors, Spacing } from "@/constants/theme";
import { VisionEntity } from "@/features/vision/data/visionSlice";
import { useColorScheme } from "@/hooks/use-color-scheme";
import React, { useState } from "react";
import {
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

interface EntitySelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (entityId: string | null) => void;
  visionEntities: VisionEntity[];
  selectedEntityId: string | null;
}

export const EntitySelectionModal: React.FC<EntitySelectionModalProps> = ({
  visible,
  onClose,
  onSelect,
  visionEntities,
  selectedEntityId,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const [searchQuery, setSearchQuery] = useState("");

  const filteredEntities = visionEntities.filter((e) =>
    e.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const assets = filteredEntities.filter((e) => e.type === "asset");
  const liabilities = filteredEntities.filter((e) => e.type === "liability");

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={styles.header}>
          <Typography variant="h3" weight="bold">
            Seleccionar Entidad
          </Typography>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Typography variant="body" style={{ color: colors.primary }}>
              Cerrar
            </Typography>
          </TouchableOpacity>
        </View>

        <View style={{ paddingHorizontal: Spacing.m, paddingBottom: Spacing.m }}>
          <Input
            placeholder="Buscar activo/pasivo..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={{ marginBottom: 0 }}
          />
        </View>

        <ScrollView
          contentContainerStyle={{ paddingBottom: Spacing.xl }}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity
            onPress={() => {
              onSelect(null);
              onClose();
            }}
            style={[
              styles.item,
              { borderBottomColor: colors.border, backgroundColor: colors.surface },
            ]}
          >
            <Typography
              variant="body"
              style={{ color: colors.text, fontStyle: "italic" }}
            >
              Ninguno
            </Typography>
            {selectedEntityId === null && (
              <Typography variant="body" style={{ color: colors.primary }}>
                ✓
              </Typography>
            )}
          </TouchableOpacity>

          {filteredEntities.length === 0 ? (
            <Typography
              variant="body"
              style={{ padding: Spacing.m, color: colors.icon, textAlign: "center" }}
            >
              No se encontraron resultados
            </Typography>
          ) : (
            <>
              {assets.length > 0 && (
                <View>
                  <View style={[styles.sectionHeader, { backgroundColor: colors.surfaceHighlight }]}>
                    <Typography variant="caption" weight="bold" style={{ color: colors.textSecondary }}>
                      ACTIVOS
                    </Typography>
                  </View>
                  {assets.map((entity) => (
                    <TouchableOpacity
                      key={entity.id}
                      onPress={() => {
                        onSelect(entity.id);
                        onClose();
                      }}
                      style={[
                        styles.item,
                        { borderBottomColor: colors.border, backgroundColor: colors.surface },
                      ]}
                    >
                      <Typography variant="body" weight={selectedEntityId === entity.id ? "bold" : "regular"}>
                        {entity.name}
                      </Typography>
                      {selectedEntityId === entity.id && (
                        <Typography variant="body" style={{ color: colors.primary }}>
                          ✓
                        </Typography>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {liabilities.length > 0 && (
                <View>
                  <View style={[styles.sectionHeader, { backgroundColor: colors.surfaceHighlight }]}>
                    <Typography variant="caption" weight="bold" style={{ color: colors.textSecondary }}>
                      PASIVOS
                    </Typography>
                  </View>
                  {liabilities.map((entity) => (
                    <TouchableOpacity
                      key={entity.id}
                      onPress={() => {
                        onSelect(entity.id);
                        onClose();
                      }}
                      style={[
                        styles.item,
                        { borderBottomColor: colors.border, backgroundColor: colors.surface },
                      ]}
                    >
                      <Typography variant="body" weight={selectedEntityId === entity.id ? "bold" : "regular"}>
                        {entity.name}
                      </Typography>
                      {selectedEntityId === entity.id && (
                        <Typography variant="body" style={{ color: colors.primary }}>
                          ✓
                        </Typography>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.m,
  },
  closeButton: {
    padding: Spacing.s,
  },
  sectionHeader: {
    padding: Spacing.s,
    paddingHorizontal: Spacing.m,
  },
  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.m,
    borderBottomWidth: 1,
  },
});
