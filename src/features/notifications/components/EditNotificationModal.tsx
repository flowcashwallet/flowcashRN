import { Button } from "@/components/atoms/Button";
import { Typography } from "@/components/atoms/Typography";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors, Spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
    cancelScheduledNotification,
    registerForPushNotificationsAsync,
    scheduleCreditCardReminder,
    scheduleDailyNotification,
    scheduleMonthlyNotification,
    scheduleWeeklyNotification,
} from "@/services/notifications";
import DateTimePicker from "@react-native-community/datetimepicker";
import { NotificationRequest } from "expo-notifications";
import React, { useEffect, useState } from "react";
import {
    Alert,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

interface EditNotificationModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
  notification: NotificationRequest | null;
  initialType?: "temporal" | "credit_card";
}

type Frequency = "daily" | "weekly" | "monthly";

export const EditNotificationModal: React.FC<EditNotificationModalProps> = ({
  visible,
  onClose,
  onSave,
  notification,
  initialType = "temporal",
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const [type, setType] = useState<"temporal" | "credit_card">(initialType);

  // Temporal State
  const [frequency, setFrequency] = useState<Frequency>("daily");
  const [time, setTime] = useState(new Date());
  const [weekday, setWeekday] = useState(1); // 1-7 (Mon-Sun)
  const [day, setDay] = useState(1); // 1-31

  // Credit Card State
  const [bankName, setBankName] = useState("");
  const [paymentDay, setPaymentDay] = useState(1);

  const [loading, setLoading] = useState(false);
  const [showAndroidTimePicker, setShowAndroidTimePicker] = useState(false);

  useEffect(() => {
    if (visible) {
      if (notification) {
        // Parse existing notification data
        const data = notification.content.data as any;
        if (data) {
          if (data.type === "credit_card") {
            setType("credit_card");
            setBankName(data.bankName || "");
            setPaymentDay(data.paymentDay || 1);
          } else {
            setType("temporal");
            setFrequency(data.frequency || "daily");
            if (data.hour !== undefined && data.minute !== undefined) {
              const newTime = new Date();
              newTime.setHours(data.hour);
              newTime.setMinutes(data.minute);
              setTime(newTime);
            }
            if (data.weekday) setWeekday(data.weekday);
            if (data.day) setDay(data.day);
          }
        } else {
          // Fallback for legacy notifications without data
          // Try to guess from title
          if (notification.content.title?.includes("Tarjeta")) {
            setType("credit_card");
            // Can't easily parse bank name/day from body, leave empty/default
          } else {
            setType("temporal");
            // Default to daily
          }
        }
      } else {
        // Reset for new notification
        setType(initialType);
        setFrequency("daily");
        setTime(new Date());
        setBankName("");
        setPaymentDay(1);
      }
    }
  }, [visible, notification, initialType]);

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

      // If editing, cancel the old one first
      if (notification) {
        await cancelScheduledNotification(notification.identifier);
      }

      if (type === "temporal") {
        const hour = time.getHours();
        const minute = time.getMinutes();

        if (frequency === "daily") {
          await scheduleDailyNotification(hour, minute);
        } else if (frequency === "weekly") {
          await scheduleWeeklyNotification(weekday, hour, minute);
        } else if (frequency === "monthly") {
          await scheduleMonthlyNotification(day, hour, minute);
        }
      } else {
        if (!bankName) {
          Alert.alert("Error", "Por favor ingresa el nombre del banco.");
          setLoading(false);
          return;
        }
        await scheduleCreditCardReminder(bankName, paymentDay);
      }

      Alert.alert("¡Listo!", "Recordatorio guardado exitosamente.");
      onSave();
      onClose();
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "No se pudo guardar el recordatorio.");
    } finally {
      setLoading(false);
    }
  };

  const OptionButton = ({
    label,
    value,
    selected,
    onPress,
  }: {
    label: string;
    value: string;
    selected: boolean;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      onPress={onPress}
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
              {notification ? "Editar Recordatorio" : "Nuevo Recordatorio"}
            </Typography>
            <Pressable onPress={onClose}>
              <IconSymbol name="xmark" size={24} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView style={{ maxHeight: 500 }}>
            {/* Type Selection (only if creating new) */}
            {!notification && (
              <View style={styles.section}>
                <Typography
                  variant="body"
                  weight="bold"
                  style={{ marginBottom: Spacing.s, color: colors.text }}
                >
                  Tipo de Recordatorio
                </Typography>
                <View style={styles.optionsRow}>
                  <OptionButton
                    label="General"
                    value="temporal"
                    selected={type === "temporal"}
                    onPress={() => setType("temporal")}
                  />
                  <OptionButton
                    label="Tarjeta"
                    value="credit_card"
                    selected={type === "credit_card"}
                    onPress={() => setType("credit_card")}
                  />
                </View>
              </View>
            )}

            {type === "temporal" ? (
              <>
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
                      onPress={() => setFrequency("daily")}
                    />
                    <OptionButton
                      label="Semanal"
                      value="weekly"
                      selected={frequency === "weekly"}
                      onPress={() => setFrequency("weekly")}
                    />
                    <OptionButton
                      label="Mensual"
                      value="monthly"
                      selected={frequency === "monthly"}
                      onPress={() => setFrequency("monthly")}
                    />
                  </View>
                </View>

                {frequency === "weekly" && (
                  <View style={styles.section}>
                    <Typography
                      variant="body"
                      weight="bold"
                      style={{ marginBottom: Spacing.s, color: colors.text }}
                    >
                      Día de la semana (1=Lunes, 7=Domingo)
                    </Typography>
                    <TextInput
                      style={[
                        styles.input,
                        { color: colors.text, borderColor: colors.border },
                      ]}
                      value={weekday.toString()}
                      keyboardType="numeric"
                      onChangeText={(text) => {
                        const val = parseInt(text);
                        if (!isNaN(val) && val >= 1 && val <= 7)
                          setWeekday(val);
                      }}
                      placeholder="1-7"
                      placeholderTextColor={colors.textSecondary}
                    />
                  </View>
                )}

                {frequency === "monthly" && (
                  <View style={styles.section}>
                    <Typography
                      variant="body"
                      weight="bold"
                      style={{ marginBottom: Spacing.s, color: colors.text }}
                    >
                      Día del mes
                    </Typography>
                    <TextInput
                      style={[
                        styles.input,
                        { color: colors.text, borderColor: colors.border },
                      ]}
                      value={day.toString()}
                      keyboardType="numeric"
                      onChangeText={(text) => {
                        const val = parseInt(text);
                        if (!isNaN(val) && val >= 1 && val <= 31) setDay(val);
                      }}
                      placeholder="1-31"
                      placeholderTextColor={colors.textSecondary}
                    />
                  </View>
                )}

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
              </>
            ) : (
              // Credit Card Fields
              <>
                <View style={styles.section}>
                  <Typography
                    variant="body"
                    weight="bold"
                    style={{ marginBottom: Spacing.s, color: colors.text }}
                  >
                    Nombre del Banco
                  </Typography>
                  <TextInput
                    style={[
                      styles.input,
                      { color: colors.text, borderColor: colors.border },
                    ]}
                    value={bankName}
                    onChangeText={setBankName}
                    placeholder="Ej. BBVA, Santander"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>

                <View style={styles.section}>
                  <Typography
                    variant="body"
                    weight="bold"
                    style={{ marginBottom: Spacing.s, color: colors.text }}
                  >
                    Día de Pago
                  </Typography>
                  <TextInput
                    style={[
                      styles.input,
                      { color: colors.text, borderColor: colors.border },
                    ]}
                    value={paymentDay.toString()}
                    keyboardType="numeric"
                    onChangeText={(text) => {
                      const val = parseInt(text);
                      if (!isNaN(val) && val >= 1 && val <= 31)
                        setPaymentDay(val);
                    }}
                    placeholder="1-31"
                    placeholderTextColor={colors.textSecondary}
                  />
                  <Typography
                    variant="caption"
                    style={{ color: colors.textSecondary, marginTop: 4 }}
                  >
                    Te avisaremos 2 días antes.
                  </Typography>
                </View>
              </>
            )}

            <View style={{ height: 20 }} />
          </ScrollView>

          <View style={styles.footer}>
            <Button
              title={loading ? "Guardando..." : "Guardar"}
              onPress={handleSave}
              size="large"
              style={{ width: "100%" }}
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
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: Spacing.l,
    paddingBottom: 40,
    maxHeight: "90%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.l,
  },
  section: {
    marginBottom: Spacing.l,
  },
  optionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.s,
  },
  optionButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    width: "100%",
  },
  footer: {
    marginTop: Spacing.m,
  },
});
