import { Button } from "@/components/atoms/Button";
import { Typography } from "@/components/atoms/Typography";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors, Spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  registerForPushNotificationsAsync,
  scheduleDailyNotification,
  scheduleMonthlyNotification,
  scheduleWeeklyNotification,
} from "@/services/notifications";
import DateTimePicker from "@react-native-community/datetimepicker";
import React, { useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

interface NotificationSetupModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
}

type Frequency = "daily" | "weekly" | "monthly";

export const NotificationSetupModal: React.FC<NotificationSetupModalProps> = ({
  visible,
  onClose,
  onSave,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const [frequency, setFrequency] = useState<Frequency>("daily");
  const [time, setTime] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [showAndroidTimePicker, setShowAndroidTimePicker] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      const hasPermission = await registerForPushNotificationsAsync();
      if (!hasPermission) {
        Alert.alert(
          "Permiso denegado",
          "Necesitamos permiso para enviarte notificaciones.",
        );
        setLoading(false);
        return;
      }

      const hour = time.getHours();
      const minute = time.getMinutes();

      if (frequency === "daily") {
        await scheduleDailyNotification(hour, minute);
      } else if (frequency === "weekly") {
        const currentDay = new Date().getDay(); // 0-6
        await scheduleWeeklyNotification(currentDay + 1, hour, minute); // weekday 1-7
      } else if (frequency === "monthly") {
        await scheduleMonthlyNotification(1, hour, minute);
      }

      Alert.alert("¡Listo!", "Recordatorio agregado exitosamente.");
      onSave();
      onClose();
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "No se pudo configurar el recordatorio.");
    } finally {
      setLoading(false);
    }
  };

  const OptionButton = ({
    label,
    value,
    selected,
  }: {
    label: string;
    value: Frequency;
    selected: boolean;
  }) => (
    <TouchableOpacity
      onPress={() => setFrequency(value)}
      style={[
        styles.optionButton,
        {
          backgroundColor: selected ? colors.primary : colors.surfaceHighlight,
          borderColor: selected ? colors.primary : "transparent",
        },
      ]}
    >
      <Typography
        variant="body"
        weight={selected ? "bold" : "regular"}
        style={{ color: selected ? "#fff" : colors.text }}
      >
        {label}
      </Typography>
    </TouchableOpacity>
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
              Nuevo Recordatorio
            </Typography>
            <Pressable onPress={onClose}>
              <IconSymbol name="xmark" size={24} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView style={{ maxHeight: 500 }}>
            <Typography
              variant="body"
              style={{ marginBottom: Spacing.m, color: colors.textSecondary }}
            >
              Configura un nuevo recordatorio para no olvidar registrar tus
              transacciones.
            </Typography>

            <View style={styles.section}>
              <Typography
                variant="body"
                weight="bold"
                style={{ marginBottom: Spacing.s, color: colors.text }}
              >
                Frecuencia
              </Typography>
              <View style={styles.optionsRow}>
                <OptionButton
                  label="Diaria"
                  value="daily"
                  selected={frequency === "daily"}
                />
                <OptionButton
                  label="Semanal"
                  value="weekly"
                  selected={frequency === "weekly"}
                />
                <OptionButton
                  label="Mensual"
                  value="monthly"
                  selected={frequency === "monthly"}
                />
              </View>
            </View>

            <View style={styles.section}>
              <Typography
                variant="body"
                weight="bold"
                style={{ marginBottom: Spacing.s, color: colors.text }}
              >
                Hora
              </Typography>
              <View style={{ alignItems: "flex-start" }}>
                {Platform.OS === "ios" ? (
                  <DateTimePicker
                    value={time}
                    mode="time"
                    display="spinner"
                    onChange={(e, date) => date && setTime(date)}
                    textColor={colors.text}
                    themeVariant={colorScheme ?? "light"}
                  />
                ) : (
                  <>
                    <Button
                      title={time.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      onPress={() => setShowAndroidTimePicker(true)}
                      variant="outline"
                    />
                    {showAndroidTimePicker && (
                      <DateTimePicker
                        value={time}
                        mode="time"
                        display="default"
                        onChange={(e, date) => {
                          setShowAndroidTimePicker(false);
                          if (date) setTime(date);
                        }}
                      />
                    )}
                  </>
                )}
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <Button
              title="Cancelar"
              onPress={onClose}
              variant="outline"
              style={{ flex: 1, marginRight: Spacing.s }}
            />
            <Button
              title={loading ? "Guardando..." : "Guardar"}
              onPress={handleSave}
              style={{ flex: 1 }}
              disabled={loading}
            />
          </View>
        </Pressable>
      </Pressable>
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
  section: {
    marginBottom: Spacing.l,
  },
  optionsRow: {
    flexDirection: "row",
    gap: Spacing.s,
    flexWrap: "wrap",
  },
  optionButton: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.m,
    borderRadius: 20,
    borderWidth: 1,
  },
  footer: {
    flexDirection: "row",
    marginTop: Spacing.m,
  },
});
