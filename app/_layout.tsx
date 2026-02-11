import { loadUserFromStorage } from "@/features/auth/authSlice";
import { AppDispatch, RootState, store } from "@/store/store";
import {
    DarkTheme,
    DefaultTheme,
    ThemeProvider,
} from "@react-navigation/native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { Platform } from "react-native";
import "react-native-gesture-handler";
import "react-native-reanimated";
import { Provider, useDispatch, useSelector } from "react-redux";

import { useColorScheme } from "@/hooks/use-color-scheme";

export const unstable_settings = {
  anchor: "(drawer)",
};

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { isAuthenticated, loading } = useSelector(
    (state: RootState) => state.auth,
  );
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const segments = useSegments();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // Load user from storage on app start
    dispatch(loadUserFromStorage());
  }, [dispatch]);

  useEffect(() => {
    if (!isMounted || loading) return;

    // Check if user is in an auth screen (login or register)
    const inAuthGroup = segments[0] === "login" || segments[0] === "register";
    const inLanding = segments[0] === "landing";

    if (!isAuthenticated) {
      if (Platform.OS === "web") {
        if (!inAuthGroup && !inLanding) {
          router.replace("/landing");
        }
      } else if (!inAuthGroup) {
        // If not authenticated and trying to access protected route, redirect to login
        router.replace("/login");
      }
    } else if (isAuthenticated && (inAuthGroup || inLanding)) {
      // If authenticated and on login/register/landing, redirect to home
      router.replace("/(drawer)/(tabs)/budget");
    }
  }, [isAuthenticated, segments, isMounted, loading, router]);

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
