import { Colors } from "@/constants/theme";
import {
  loadUserFromStorage,
  logout,
  verifyBiometrics,
} from "@/features/auth/authSlice";
import { AppDispatch, RootState, store } from "@/store/store";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { ActivityIndicator, Platform, View } from "react-native";
import "react-native-gesture-handler";
import "react-native-reanimated";
import { Provider, useDispatch, useSelector } from "react-redux";

import { useColorScheme } from "@/hooks/use-color-scheme";

export const unstable_settings = {
  initialRouteName: "(drawer)",
};

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { isAuthenticated, loading, biometricRequired } = useSelector(
    (state: RootState) => state.auth,
  );
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const segments = useSegments();
  const [isMounted, setIsMounted] = useState(false);
  const [biometricsTried, setBiometricsTried] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // Load user from storage on app start
    dispatch(loadUserFromStorage());
  }, [dispatch]);

  // Biometric check
  useEffect(() => {
    if (biometricRequired && !biometricsTried) {
      setBiometricsTried(true);
      dispatch(verifyBiometrics())
        .unwrap()
        .catch(() => {
          dispatch(logout());
        });
    }
  }, [biometricRequired, biometricsTried, dispatch]);

  useEffect(() => {
    if (!isMounted || loading) return;

    const inAuthGroup = segments[0] === "login" || segments[0] === "register";
    const inLanding = segments[0] === "landing";

    const hasSession = isAuthenticated || biometricRequired;

    if (!hasSession) {
      if (Platform.OS === "web") {
        if (!inAuthGroup && !inLanding) {
          router.replace("/landing");
        }
      } else if (!inAuthGroup && !inLanding) {
        // If not authenticated and trying to access protected route, redirect to login
        router.replace("/login");
      }
    } else if (isAuthenticated && (inAuthGroup || inLanding)) {
      router.replace("/(drawer)/(tabs)");
    }
  }, [
    isAuthenticated,
    biometricRequired,
    segments,
    isMounted,
    loading,
    router,
  ]);

  if (loading && biometricRequired) {
    return (
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.background,
          }}
        >
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="landing" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ headerShown: false }} />
        <Stack.Screen name="(drawer)" options={{ headerShown: false }} />
        <Stack.Screen name="wallet" options={{ headerShown: false }} />
        <Stack.Screen
          name="transaction-form"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="modal"
          options={{ presentation: "modal", title: "Modal" }}
        />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <Provider store={store}>
      <RootLayoutNav />
    </Provider>
  );
}
