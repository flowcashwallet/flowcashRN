import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

// Constants for storage keys
export const KEY_ACCESS_TOKEN = "access_token";
export const KEY_REFRESH_TOKEN = "refresh_token";
export const KEY_USER_DATA = "user_data";
export const KEY_BIOMETRICS_ENABLED = "biometrics_enabled";

const isSecureStoreAvailable = Platform.OS !== "web";

export const saveToken = async (key: string, value: string) => {
  if (isSecureStoreAvailable) {
    await SecureStore.setItemAsync(key, value);
  } else {
    await AsyncStorage.setItem(key, value);
  }
};

export const getToken = async (key: string): Promise<string | null> => {
  if (isSecureStoreAvailable) {
    return await SecureStore.getItemAsync(key);
  } else {
    return await AsyncStorage.getItem(key);
  }
};

export const removeToken = async (key: string) => {
  if (isSecureStoreAvailable) {
    await SecureStore.deleteItemAsync(key);
  } else {
    await AsyncStorage.removeItem(key);
  }
};

export const saveUserData = async (user: any) => {
  await AsyncStorage.setItem(KEY_USER_DATA, JSON.stringify(user));
};

export const getUserData = async (): Promise<any | null> => {
  const data = await AsyncStorage.getItem(KEY_USER_DATA);
  return data ? JSON.parse(data) : null;
};

export const removeUserData = async () => {
  await AsyncStorage.removeItem(KEY_USER_DATA);
};

export const setBiometricsEnabled = async (enabled: boolean) => {
  await AsyncStorage.setItem(KEY_BIOMETRICS_ENABLED, JSON.stringify(enabled));
};

export const getBiometricsEnabled = async (): Promise<boolean> => {
  const data = await AsyncStorage.getItem(KEY_BIOMETRICS_ENABLED);
  return data ? JSON.parse(data) : false;
};
