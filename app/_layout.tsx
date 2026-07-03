import {
  loadUserFromStorage,
  logout,
  registerPushToken,
  verifyBiometrics,
} from "@/features/auth/authSlice";
import {
  WALLET_TX_DISMISS_ACTION,
  ensureWalletNotificationCategoriesAsync,
} from "@/services/notifications";
import { AppDispatch, RootState, store } from "@/store/store";
import * as Linking from "expo-linking";
import * as Notifications from "expo-notifications";
import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Platform, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import { Provider, useDispatch, useSelector } from "react-redux";

import { ThemeProvider, useTheme } from "@/contexts/ThemeContext";

export const unstable_settings = {
  initialRouteName: "index",
};

type WalletDeepLink = {
  pathname: "/wallet/transaction-form";
  params: Record<string, string>;
};

function parseWalletDeepLink(url: string): WalletDeepLink | null {
  if (!url) return null;

  const scheme = "beta1://";
  if (!url.startsWith(scheme)) return null;
  const rest = url.slice(scheme.length);
  const queryIndex = rest.indexOf("?");
  const pathname = queryIndex >= 0 ? rest.slice(0, queryIndex) : rest;
  const search = queryIndex >= 0 ? rest.slice(queryIndex) : "";

  if (
    pathname !== "wallet/transaction-form" &&
    pathname !== "/wallet/transaction-form"
  ) {
    return null;
  }

  const params: Record<string, string> = {};
  if (search) {
    const queryString = search.startsWith("?") ? search.slice(1) : search;
    queryString.split("&").forEach((pair) => {
      const equalIndex = pair.indexOf("=");
      if (equalIndex === -1) {
        params[decodeURIComponent(pair)] = "";
      } else {
        const key = decodeURIComponent(pair.slice(0, equalIndex));
        const value = decodeURIComponent(pair.slice(equalIndex + 1));
        params[key] = value;
      }
    });
  }

  const initialType = params.initialType?.toLowerCase();
  if (
    !initialType ||
    !["income", "expense", "transfer"].includes(initialType)
  ) {
    params.initialType = "expense";
  }

  return { pathname: "/wallet/transaction-form", params };
}

function RootLayoutNav() {
  const { colors } = useTheme();
  const { isAuthenticated, loading, biometricRequired } = useSelector(
    (state: RootState) => state.auth,
  );

  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const segments = useSegments();
  const [isMounted, setIsMounted] = useState(false);
  const [biometricsTried, setBiometricsTried] = useState(false);
  const [pendingDeepLink, setPendingDeepLink] = useState<WalletDeepLink | null>(
    null,
  );
  const [hasHandledInitialUrl, setHasHandledInitialUrl] = useState(false);

  // Handle deep links from Shortcuts / Wallet automation
  useEffect(() => {
    if (Platform.OS === "web") return;
    if (hasHandledInitialUrl) return;
    setHasHandledInitialUrl(true);

    const handleUrl = (event: { url: string }) => {
      const link = parseWalletDeepLink(event.url);
      if (link) setPendingDeepLink(link);
    };

    Linking.getInitialURL().then((url) => {
      if (url) handleUrl({ url });
    });

    const subscription = Linking.addEventListener("url", handleUrl);
    return () => subscription.remove();
  }, [hasHandledInitialUrl]);

  // Handle push notification actions that open the transaction form
  useEffect(() => {
    if (Platform.OS === "web") return;

    ensureWalletNotificationCategoriesAsync();

    const handleResponse = (response: Notifications.NotificationResponse) => {
      const actionId = response.actionIdentifier;
      if (actionId === WALLET_TX_DISMISS_ACTION) return;

      const data = response.notification.request.content.data as any;
      if (data?.kind !== "wallet_tx_suggestion") return;

      setPendingDeepLink({
        pathname: "/wallet/transaction-form",
        params: {
          initialType: data.initialType ?? "expense",
          amount: data.amount,
          description: data.description,
          category: data.category,
          relatedEntityId: data.relatedEntityId,
        },
      });
    };

    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) handleResponse(response);
    });

    const subscription =
      Notifications.addNotificationResponseReceivedListener(handleResponse);
    return () => subscription.remove();
  }, []);

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
      return;
    }

    if (isAuthenticated && (inAuthGroup || inLanding)) {
      if (pendingDeepLink) {
        // Give the protected stack a moment to render the tabs group
        const timeoutId = setTimeout(() => {
          router.push(pendingDeepLink);
          setPendingDeepLink(null);
        }, 300);
        return () => clearTimeout(timeoutId);
      } else {
        router.replace("/(tabs)/wallet");
      }
      return;
    }

    if (isAuthenticated && pendingDeepLink) {
      router.push(pendingDeepLink);
      setPendingDeepLink(null);
    }
  }, [
    isAuthenticated,
    biometricRequired,
    segments,
    isMounted,
    loading,
    router,
    pendingDeepLink,
  ]);

  // Navigate to a pending deep link when the app is already authenticated
  // and not on the auth/landing screens (e.g. app was closed and opened via URL).
  useEffect(() => {
    if (!isMounted || loading || !isAuthenticated || !pendingDeepLink) return;

    const inAuthGroup = segments[0] === "login" || segments[0] === "register";
    const inLanding = segments[0] === "landing";

    if (!inAuthGroup && !inLanding) {
      // Use a small timeout to ensure the root stack and tabs are fully mounted
      const timeoutId = setTimeout(() => {
        router.push(pendingDeepLink);
        setPendingDeepLink(null);
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [isMounted, loading, isAuthenticated, pendingDeepLink, segments, router]);

  useEffect(() => {
    if (!isMounted) return;
    if (!isAuthenticated) return;
    if (Platform.OS === "web") return;
    dispatch(registerPushToken());
  }, [dispatch, isAuthenticated, isMounted]);

  if (loading && biometricRequired) {
    return (
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
    );
  }

  console.log("Rendering main stack navigator");
  return (
    <Stack>
      <Stack.Protected guard={isAuthenticated}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={!isAuthenticated}>
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ headerShown: false }} />
        <Stack.Screen name="landing" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <GestureHandlerRootView>
          <RootLayoutNav />
        </GestureHandlerRootView>
      </ThemeProvider>
    </Provider>
  );
}
