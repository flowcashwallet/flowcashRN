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

export interface EntitySelectionListProps {
  onClose: () => void;
  onSelect: (entityId: string | null) => void;
  visionEntities: VisionEntity[];
  selectedEntityId: string | null;
}

export const EntitySelectionList: React.FC<EntitySelectionListProps> = ({
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
  const others = filteredEntities.filter(
    (e) => e.type !== "asset" && e.type !== "liability",
  );

  return (
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
            {
              borderBottomColor: colors.border,
              backgroundColor: colors.surface,
            },
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

        {visionEntities.length === 0 ? (
          <View style={{ padding: Spacing.m, alignItems: "center" }}>
            <Typography
              variant="body"
              style={{ textAlign: "center", marginBottom: Spacing.s }}
            >
              No tienes cuentas ni tarjetas registradas.
            </Typography>
            <Typography
              variant="caption"
              style={{ textAlign: "center", color: colors.textSecondary }}
            >
              Ve a la sección &quot;Visión&quot; para agregar tus Activos
              (Cuentas) y Pasivos (Tarjetas).
            </Typography>
          </View>
        ) : filteredEntities.length === 0 ? (
          <Typography
            variant="body"
            style={{
              padding: Spacing.m,
              color: colors.icon,
              textAlign: "center",
            }}
          >
            No se encontraron resultados para &quot;{searchQuery}&quot;
          </Typography>
        ) : (
          <>
            {assets.length > 0 && (
              <View>
                <View
                  style={[
                    styles.sectionHeader,
                    { backgroundColor: colors.surfaceHighlight },
                  ]}
                >
                  <Typography
                    variant="caption"
                    weight="bold"
                    style={{ color: colors.textSecondary }}
                  >
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
                      {
                        borderBottomColor: colors.border,
                        backgroundColor: colors.surface,
                      },
                    ]}
                  >
                    <Typography
                      variant="body"
                      weight={
                        selectedEntityId === entity.id ? "bold" : "regular"
                      }
                    >
                      {entity.name}
                    </Typography>
                    {selectedEntityId === entity.id && (
                      <Typography
                        variant="body"
                        style={{ color: colors.primary }}
                      >
                        ✓
                      </Typography>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {liabilities.length > 0 && (
              <View>
                <View
                  style={[
                    styles.sectionHeader,
                    { backgroundColor: colors.surfaceHighlight },
                  ]}
                >
                  <Typography
                    variant="caption"
                    weight="bold"
                    style={{ color: colors.textSecondary }}
                  >
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
                      {
                        borderBottomColor: colors.border,
                        backgroundColor: colors.surface,
                      },
                    ]}
                  >
                    <Typography
                      variant="body"
                      weight={
                        selectedEntityId === entity.id ? "bold" : "regular"
                      }
                    >
                      {entity.name}
                    </Typography>
                    {selectedEntityId === entity.id && (
                      <Typography
                        variant="body"
                        style={{ color: colors.primary }}
                      >
                        ✓
                      </Typography>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {others.length > 0 && (
              <View>
                <View
                  style={[
                    styles.sectionHeader,
                    { backgroundColor: colors.surfaceHighlight },
                  ]}
                >
                  <Typography
                    variant="caption"
                    weight="bold"
                    style={{ color: colors.textSecondary }}
                  >
                    OTROS
                  </Typography>
                </View>
                {others.map((entity) => (
                  <TouchableOpacity
                    key={entity.id}
                    onPress={() => {
                      onSelect(entity.id);
                      onClose();
                    }}
                    style={[
                      styles.item,
                      {
                        borderBottomColor: colors.border,
                        backgroundColor: colors.surface,
                      },
                    ]}
                  >
                    <Typography
                      variant="body"
                      weight={
                        selectedEntityId === entity.id ? "bold" : "regular"
                      }
                    >
                      {entity.name}
                    </Typography>
                    {selectedEntityId === entity.id && (
                      <Typography
                        variant="body"
                        style={{ color: colors.primary }}
                      >
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
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <EntitySelectionList {...props} />
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
  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.m,
    borderBottomWidth: 1,
  },
  sectionHeader: {
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.s,
  },
});
