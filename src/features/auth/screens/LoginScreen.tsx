import { auth } from "@/services/firebaseConfig";
import { AppDispatch, RootState } from "@/store/store";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import React, { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { setError, setLoading } from "../authSlice";
// Atomic Components
import { Button } from "@/components/atoms/Button";
import { Card } from "@/components/atoms/Card";
import { Typography } from "@/components/atoms/Typography";

import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors, Spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error } = useSelector((state: RootState) => state.auth);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId:
      "635821696580-ivj83nnvshqlvtp14qm9vrgtv9evlrnr.apps.googleusercontent.com",
    iosClientId:
      "635821696580-2cra0f8iruo4oblm9ufvf7051egp17kq.apps.googleusercontent.com",
    redirectUri: "https://auth.expo.io/@juliovargas/beta-1",
  });

  useEffect(() => {
    if (request) {
      console.log("Redirect URI:", request.redirectUri);
    }
  }, [request]);

  useEffect(() => {
    if (response?.type === "success") {
      const { id_token } = response.params;
      const credential = GoogleAuthProvider.credential(id_token);
      dispatch(setLoading(true));
      signInWithCredential(auth, credential)
        .catch((error) => {
          dispatch(setError(error.message));
        })
        .finally(() => {
          dispatch(setLoading(false));
        });
    }
  }, [response, dispatch]);

  return (
    <ThemedView style={styles.container}>
      <Card variant="flat" style={styles.card}>
        <View style={styles.header}>
          {/* Placeholder for App Logo */}
          <View
            style={[
              styles.logoPlaceholder,
              { backgroundColor: colors.primary },
            ]}
          >
            <IconSymbol name="wallet.pass" size={40} color="#fff" />
          </View>

          <Typography
            variant="h1"
            weight="bold"
            style={{ textAlign: "center", marginBottom: Spacing.s }}
          >
            Bienvenido
          </Typography>
          <Typography
            variant="body"
            style={{ textAlign: "center", color: colors.icon }}
          >
            Gestiona tus finanzas de forma inteligente
          </Typography>
        </View>

        {error && (
          <Card
            variant="flat"
            style={[styles.errorCard, { backgroundColor: "#FFEBEE" }]}
          >
            <Typography
              variant="caption"
              style={{ color: colors.error, textAlign: "center" }}
            >
              {error}
            </Typography>
          </Card>
        )}

        <View style={styles.actions}>
          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} />
          ) : (
            <Button
              title="Continuar con Google"
              disabled={!request}
              onPress={() => {
                promptAsync();
              }}
              icon={<IconSymbol name="g.circle.fill" size={20} color="#fff" />}
              style={{ width: "100%" }}
            />
          )}
        </View>
      </Card>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: Spacing.l,
  },
  card: {
    alignItems: "center",
    paddingVertical: Spacing.xxl,
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.l,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  errorCard: {
    width: "100%",
    padding: Spacing.s,
    marginBottom: Spacing.m,
    borderRadius: 8,
  },
  actions: {
    width: "100%",
    marginTop: Spacing.m,
  },
});
