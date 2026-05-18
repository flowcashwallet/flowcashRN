import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

export const WALLET_TX_SUGGESTION_CATEGORY = "wallet_tx_suggestion";
export const WALLET_TX_ADD_ACTION = "wallet_tx_add";
export const WALLET_TX_DISMISS_ACTION = "wallet_tx_dismiss";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function ensureWalletNotificationCategoriesAsync() {
  await Notifications.setNotificationCategoryAsync(
    WALLET_TX_SUGGESTION_CATEGORY,
    [
      {
        identifier: WALLET_TX_ADD_ACTION,
        buttonTitle: "Agregar",
        options: { opensAppToForeground: true },
      },
      {
        identifier: WALLET_TX_DISMISS_ACTION,
        buttonTitle: "Ignorar",
        options: { opensAppToForeground: false },
      },
    ],
  );
}

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

export async function getExpoPushTokenAsync() {
  const projectId =
    (Constants.expoConfig as any)?.extra?.eas?.projectId ||
    (Constants as any)?.easConfig?.projectId;

  if (!projectId) {
    return null;
  }

  const token = await Notifications.getExpoPushTokenAsync({ projectId });
  return token.data;
}

type WalletTxSuggestionData = {
  kind: "wallet_tx_suggestion";
  initialType?: "income" | "expense" | "transfer";
  amount?: string;
  description?: string;
  category?: string;
  relatedEntityId?: string;
};

export async function scheduleWalletTransactionSuggestionNotification(input: {
  title: string;
  body: string;
  data: Omit<WalletTxSuggestionData, "kind">;
}) {
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: input.title,
      body: input.body,
      sound: true,
      categoryIdentifier: WALLET_TX_SUGGESTION_CATEGORY,
      data: {
        kind: "wallet_tx_suggestion",
        ...input.data,
      } satisfies WalletTxSuggestionData,
    },
    trigger: null,
  });
  return id;
}

export async function scheduleDailyNotification(hour: number, minute: number) {
  // Removed cancelAll to allow multiple notifications
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: "Recordatorio Diario",
      body: "¡Es hora de registrar tus transacciones del día!",
      sound: true,
      data: {
        type: "temporal",
        frequency: "daily",
        hour,
        minute,
      },
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
      data: {
        type: "temporal",
        frequency: "weekly",
        weekday,
        hour,
        minute,
      },
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
      data: {
        type: "temporal",
        frequency: "monthly",
        day,
        hour,
        minute,
      },
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
      data: {
        type: "credit_card",
        bankName,
        paymentDay,
      },
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
