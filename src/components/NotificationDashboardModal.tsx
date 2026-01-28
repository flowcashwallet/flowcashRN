import { Button } from "@/components/atoms/Button";
import { Typography } from "@/components/atoms/Typography";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors, Spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
    cancelScheduledNotification,
    getAllScheduledNotifications
} from "@/services/notifications";
import { NotificationRequest } from "expo-notifications";
import React, { useEffect, useState } from "react";
import {
    Alert,
    FlatList,
    Modal,
    Pressable,
    StyleSheet,
    View,
} from "react-native";
import { NotificationSetupModal } from "./NotificationSetupModal";

interface NotificationDashboardModalProps {
  visible: boolean;
  onClose: () => void;
}

export const NotificationDashboardModal: React.FC<
  NotificationDashboardModalProps
> = ({ visible, onClose }) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const [notifications, setNotifications] = useState<NotificationRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [setupVisible, setSetupVisible] = useState(false);

  useEffect(() => {
    if (visible) {
      loadNotifications();
    }
  }, [visible]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      // Ensure permissions before fetching? Not strictly needed to fetch local, but good practice.
      // await registerForPushNotificationsAsync();
      const list = await getAllScheduledNotifications();
      setNotifications(list);
    } catch (error) {
      console.error("Failed to load notifications", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (identifier: string) => {
    Alert.alert(
      "Eliminar recordatorio",
      "¿Estás seguro de que quieres eliminar este recordatorio?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await cancelScheduledNotification(identifier);
              loadNotifications();
            } catch (error) {
              console.error(error);
              Alert.alert("Error", "No se pudo eliminar el recordatorio.");
            }
          },
        },
      ],
    );
  };

  const formatTrigger = (trigger: any) => {
    if (!trigger) return "Sin hora";

    // Normalize trigger data
    // Expo can return structure differently on platforms or depending on version
    // It might be trigger.dateComponents (iOS) or direct properties (Android/Input)
    const components = trigger.dateComponents || trigger;
    const { hour, minute, weekday, day } = components;

    if (hour !== undefined && minute !== undefined) {
      const time = new Date();
      time.setHours(hour);
      time.setMinutes(minute);
      const timeStr = time.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      let freq = "Diario";
      if (weekday !== undefined) freq = "Semanal";
      if (day !== undefined) freq = "Mensual";

      return `${freq} - ${timeStr}`;
    }
    return "Personalizado";
  };

  const renderItem = ({ item }: { item: NotificationRequest }) => (
    <View
      style={[
        styles.item,
        {
          backgroundColor: colors.surfaceHighlight,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={{ flex: 1 }}>
        <Typography variant="body" weight="bold" style={{ color: colors.text }}>
          {item.content.title || "Recordatorio"}
        </Typography>
        <Typography
          variant="caption"
          style={{ color: colors.textSecondary, marginTop: 4 }}
        >
          {formatTrigger(item.trigger)}
        </Typography>
      </View>
      <Pressable
        onPress={() => handleDelete(item.identifier)}
        style={{ padding: Spacing.s }}
      >
        <IconSymbol name="trash" size={20} color={colors.error || "#FF3B30"} />
      </Pressable>
    </View>
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
              Recordatorios
            </Typography>
            <Pressable onPress={onClose}>
              <IconSymbol name="xmark" size={24} color={colors.textSecondary} />
            </Pressable>
          </View>

          {notifications.length === 0 && !loading ? (
            <View style={styles.emptyState}>
              <IconSymbol
                name="bell.slash"
                size={48}
                color={colors.textSecondary}
              />
              <Typography
                variant="body"
                style={{
                  color: colors.textSecondary,
                  textAlign: "center",
                  marginTop: Spacing.m,
                }}
              >
                No tienes recordatorios configurados.
              </Typography>
            </View>
          ) : (
            <FlatList
              data={notifications}
              renderItem={renderItem}
              keyExtractor={(item) => item.identifier}
              contentContainerStyle={{ paddingBottom: Spacing.m }}
              style={{ maxHeight: 400 }}
            />
          )}

          <View style={styles.footer}>
            <Button
              title="Agregar Recordatorio"
              onPress={() => setSetupVisible(true)}
              size="large"
              style={{ width: "100%" }}
              icon={<IconSymbol name="plus" size={24} color="#fff" />}
            />
          </View>
        </Pressable>
      </Pressable>

      <NotificationSetupModal
        visible={setupVisible}
        onClose={() => setSetupVisible(false)}
        onSave={() => {
          // Refresh list after saving
          loadNotifications();
        }}
      />
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
  item: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.m,
    borderRadius: 12,
    marginBottom: Spacing.s,
    borderWidth: 1,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
  },
  footer: {
    marginTop: Spacing.m,
  },
});
