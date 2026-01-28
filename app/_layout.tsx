import { setUser } from "@/features/auth/authSlice";
import { auth } from "@/services/firebaseConfig";
import { RootState, store } from "@/store/store";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import "react-native-gesture-handler";
import "react-native-reanimated";
import { Provider, useDispatch, useSelector } from "react-redux";

import { useColorScheme } from "@/hooks/use-color-scheme";

export const unstable_settings = {
  anchor: "(drawer)",
};

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const router = useRouter();
  const segments = useSegments();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("AuthStateChanged: User is logged in:", user.uid);
        dispatch(setUser({ uid: user.uid, email: user.email }));
      } else {
        console.log("AuthStateChanged: User is logged out");
        dispatch(setUser(null));
      }
    });
    return unsubscribe;
  }, [dispatch]);

  useEffect(() => {
    if (!isMounted) return;

    // Check if user is in an auth screen (login or register)
    // segments[0] might be undefined initially or empty string?
    // Let's check specifically for "login" or "register"
    const inAuthGroup = segments[0] === "login" || segments[0] === "register";

    if (!isAuthenticated && !inAuthGroup) {
      // If not authenticated and trying to access protected route, redirect to login
      // But we need to be careful not to loop.
      // If segments is empty (root), redirect to login.
      router.replace("/login");
    } else if (isAuthenticated && inAuthGroup) {
      // If authenticated and on login/register, redirect to home
      router.replace("/(drawer)/(tabs)/budget");
    }
  }, [isAuthenticated, segments, isMounted, router]);

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ headerShown: false }} />
        <Stack.Screen name="(drawer)" options={{ headerShown: false }} />
        <Stack.Screen name="wallet" options={{ headerShown: false }} />
        <Stack.Screen name="transaction-form" options={{ headerShown: false }} />
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
