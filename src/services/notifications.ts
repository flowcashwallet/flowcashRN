import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotificationsAsync() {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  if (!Device.isDevice) {
    console.log(
      "Estás en un simulador. Las notificaciones Push no funcionarán, pero las locales sí deberían mostrarse.",
    );
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") {
    return false;
  }
  return true;
}

export async function scheduleDailyNotification(hour: number, minute: number) {
  // Removed cancelAll to allow multiple notifications
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: "Recordatorio Diario",
      body: "¡Es hora de registrar tus transacciones del día!",
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      hour,
      minute,
      repeats: true,
    },
  });
  return id;
}

export async function scheduleWeeklyNotification(
  weekday: number, // 1-7
  hour: number,
  minute: number,
) {
  // Removed cancelAll
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: "Recordatorio Semanal",
      body: "¡No olvides registrar tus gastos de la semana!",
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      weekday,
      hour,
      minute,
      repeats: true,
    },
  });
  return id;
}

export async function scheduleMonthlyNotification(
  day: number,
  hour: number,
  minute: number,
) {
  // Removed cancelAll
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: "Recordatorio Mensual",
      body: "Es momento de revisar tu presupuesto del mes.",
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      day,
      hour,
      minute,
      repeats: true,
    },
  });
  return id;
}

export async function scheduleCreditCardReminder(
  bankName: string,
  paymentDay: number,
) {
  // Logic: 2 days before paymentDay
  let reminderDay = paymentDay - 2;
  if (reminderDay < 1) {
    // Fallback for beginning of month: set to 28th to ensure it triggers
    reminderDay = 28;
  }

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: "Pago de Tarjeta",
      body: `¡Recuerda pagar tu tarjeta ${bankName}! Vence el día ${paymentDay}.`,
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      day: reminderDay,
      hour: 9, // Default to 9 AM
      minute: 0,
      repeats: true,
    },
  });
  return id;
}

export async function getAllScheduledNotifications() {
  return await Notifications.getAllScheduledNotificationsAsync();
}

export async function cancelScheduledNotification(identifier: string) {
  await Notifications.cancelScheduledNotificationAsync(identifier);
}

export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
