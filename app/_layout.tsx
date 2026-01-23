import { setUser } from "@/features/auth/authSlice";
import LoginScreen from "@/features/auth/screens/LoginScreen";
import { auth } from "@/services/firebaseConfig";
import { RootState, store } from "@/store/store";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect } from "react";
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

  if (!isAuthenticated) {
    return (
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <LoginScreen />
        <StatusBar style="auto" />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(drawer)" options={{ headerShown: false }} />
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
