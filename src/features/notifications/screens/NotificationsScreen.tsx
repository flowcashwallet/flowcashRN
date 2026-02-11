import { Typography } from "@/components/atoms/Typography";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors, Spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
    cancelScheduledNotification,
    getAllScheduledNotifications,
} from "@/services/notifications";
import { NotificationRequest } from "expo-notifications";
import React, { useEffect, useState } from "react";
import {
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";
import { EditNotificationModal } from "../components/EditNotificationModal";

export default function NotificationsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const [notifications, setNotifications] = useState<NotificationRequest[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Edit Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedNotification, setSelectedNotification] =
    useState<NotificationRequest | null>(null);
  const [initialType, setInitialType] = useState<"temporal" | "credit_card">(
    "temporal",
  );

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const list = await getAllScheduledNotifications();
      setNotifications(list);
    } catch (error) {
      console.error("Failed to load notifications", error);
    } finally {
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadNotifications();
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

  const handleEdit = (notification: NotificationRequest) => {
    setSelectedNotification(notification);
    setModalVisible(true);
  };

  const handleAdd = (type: "temporal" | "credit_card") => {
    setSelectedNotification(null);
    setInitialType(type);
    setModalVisible(true);
  };

  const formatTrigger = (trigger: any) => {
    if (!trigger) return "Sin hora";
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

  // Categorize Notifications
  const cardNotifications = notifications.filter((n) => {
    const data = n.content.data as any;
    if (data && data.type === "credit_card") return true;
    // Fallback for legacy
    return n.content.title?.toLowerCase().includes("tarjeta");
  });

  const temporalNotifications = notifications.filter((n) => {
    const data = n.content.data as any;
    if (data && data.type === "temporal") return true;
    if (data && data.type === "credit_card") return false;
    // Fallback
    return !n.content.title?.toLowerCase().includes("tarjeta");
  });

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
          {item.content.body}
        </Typography>
        <Typography
          variant="caption"
          style={{ color: colors.primary, marginTop: 4, fontWeight: "600" }}
        >
          {formatTrigger(item.trigger)}
        </Typography>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          onPress={() => handleEdit(item)}
          style={[styles.actionButton, { backgroundColor: colors.surface }]}
        >
          <IconSymbol name="pencil" size={18} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleDelete(item.identifier)}
          style={[styles.actionButton, { backgroundColor: colors.surface }]}
        >
          <IconSymbol
            name="trash"
            size={18}
            color={colors.error || "#FF3B30"}
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header removed as it is handled by the navigation stack */}

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ padding: Spacing.m, paddingBottom: 100 }}
      >
        {/* Temporal Section */}
        <View style={styles.sectionHeader}>
          <Typography
            variant="h3"
            weight="bold"
            style={{ color: colors.text, fontSize: 18 }}
          >
            Recordatorios Generales
          </Typography>
          <TouchableOpacity onPress={() => handleAdd("temporal")}>
            <IconSymbol
              name="plus.circle.fill"
              size={24}
              color={colors.primary}
            />
          </TouchableOpacity>
        </View>

        {temporalNotifications.length === 0 ? (
          <Typography
            variant="body"
            style={{ color: colors.textSecondary, marginBottom: Spacing.l }}
          >
            No tienes recordatorios generales.
          </Typography>
        ) : (
          temporalNotifications.map((item) => (
            <View key={item.identifier}>{renderItem({ item })}</View>
          ))
        )}

        {/* Card Section */}
        <View style={[styles.sectionHeader, { marginTop: Spacing.l }]}>
          <Typography
            variant="h3"
            weight="bold"
            style={{ color: colors.text, fontSize: 18 }}
          >
            Recordatorios de Tarjetas
          </Typography>
          <TouchableOpacity onPress={() => handleAdd("credit_card")}>
            <IconSymbol
              name="plus.circle.fill"
              size={24}
              color={colors.primary}
            />
          </TouchableOpacity>
        </View>

        {cardNotifications.length === 0 ? (
          <Typography variant="body" style={{ color: colors.textSecondary }}>
            No tienes recordatorios de tarjetas.
          </Typography>
        ) : (
          cardNotifications.map((item) => (
            <View key={item.identifier}>{renderItem({ item })}</View>
          ))
        )}
      </ScrollView>

      <EditNotificationModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={loadNotifications}
        notification={selectedNotification}
        initialType={initialType}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.s,
  },
  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.m,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: Spacing.s,
  },
  actions: {
    flexDirection: "row",
    gap: Spacing.s,
  },
  actionButton: {
    padding: 8,
    borderRadius: 20,
  },
});
