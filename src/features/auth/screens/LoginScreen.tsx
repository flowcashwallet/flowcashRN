import { auth } from "@/services/firebaseConfig";
import { AppDispatch, RootState } from "@/store/store";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import {
  GoogleAuthProvider,
  signInWithCredential,
  signInWithEmailAndPassword,
} from "firebase/auth";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { setError, setLoading } from "../authSlice";
// Atomic Components
import { Button } from "@/components/atoms/Button";
import { Card } from "@/components/atoms/Card";
import { Input } from "@/components/atoms/Input";
import { Typography } from "@/components/atoms/Typography";

import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors, Spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import STRINGS from "@/i18n/es.json";
import { useRouter } from "expo-router";

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error } = useSelector((state: RootState) => state.auth);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId:
      "635821696580-ivj83nnvshqlvtp14qm9vrgtv9evlrnr.apps.googleusercontent.com",
    iosClientId:
      "635821696580-2cra0f8iruo4oblm9ufvf7051egp17kq.apps.googleusercontent.com",
    androidClientId:
      "635821696580-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com", // TODO: Reemplazar con tu Client ID de Android
  });

  useEffect(() => {
    if (request) {
      console.log("Redirect URI:", request.redirectUri);
    }
  }, [request]);

  useEffect(() => {
    console.log("Response:", response);
    if (response?.type === "success") {
      const { id_token } = response.params;

      if (!id_token) {
        dispatch(setError("No se pudo obtener el token de Google."));
        return;
      }

      const credential = GoogleAuthProvider.credential(id_token);
      dispatch(setLoading(true));
      signInWithCredential(auth, credential)
        .then((userCredential) => {
          console.log("User logged in:", userCredential.user.uid);
          // El _layout.tsx escuchará el cambio de estado y actualizará Redux
        })
        .catch((error) => {
          console.error("Firebase Auth Error:", error);
          dispatch(setError(error.message));
        })
        .finally(() => {
          dispatch(setLoading(false));
        });
    }
  }, [response, dispatch]);

  const handleEmailAuth = async () => {
    if (!email || !password) {
      dispatch(setError("Por favor ingresa correo y contraseña"));
      return;
    }

    dispatch(setLoading(true));
    dispatch(setError(null));

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // _layout.tsx handles auth state change
    } catch (err: any) {
      console.error("Auth Error:", err);
      let msg = err.message;
      if (err.code === "auth/invalid-email") msg = STRINGS.auth.invalidEmail;
      if (err.code === "auth/weak-password") msg = STRINGS.auth.weakPassword;
      if (
        err.code === "auth/user-not-found" ||
        err.code === "auth/wrong-password" ||
        err.code === "auth/invalid-credential"
      ) {
        msg = "Credenciales incorrectas";
      }
      if (err.code === "auth/email-already-in-use")
        msg = "El correo ya está registrado";

      dispatch(setError(msg));
    } finally {
      dispatch(setLoading(false));
    }
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1, justifyContent: "center" }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Card variant="flat" style={styles.card}>
            <View style={styles.header}>
              <View
                style={[
                  styles.logoPlaceholder,
                  { backgroundColor: colors.primary }, // Solid primary color
                ]}
              >
                <IconSymbol name="wallet.pass" size={40} color="#fff" />
              </View>

              <Typography
                variant="h1"
                weight="bold"
                style={{ textAlign: "center", marginBottom: Spacing.s }}
              >
                {STRINGS.auth.welcome}
              </Typography>
              <Typography
                variant="body"
                style={{ textAlign: "center", color: colors.icon }}
              >
                {STRINGS.auth.tagline}
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

            <View style={styles.form}>
              <Input
                label={STRINGS.auth.email}
                placeholder={STRINGS.auth.emailPlaceholder}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <Input
                label={STRINGS.auth.password}
                placeholder={STRINGS.auth.passwordPlaceholder}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />

              {loading ? (
                <ActivityIndicator
                  size="large"
                  color={colors.primary}
                  style={{ marginTop: Spacing.m }}
                />
              ) : (
                <Button
                  title={STRINGS.auth.login}
                  onPress={handleEmailAuth}
                  style={{ marginTop: Spacing.m }}
                />
              )}

              <View style={styles.dividerContainer}>
                <View
                  style={[styles.line, { backgroundColor: colors.border }]}
                />
                <Typography
                  variant="caption"
                  style={{ marginHorizontal: Spacing.s, color: colors.icon }}
                >
                  O
                </Typography>
                <View
                  style={[styles.line, { backgroundColor: colors.border }]}
                />
              </View>

              {!loading && (
                <Button
                  title={STRINGS.auth.continueGoogle}
                  disabled={!request}
                  onPress={() => {
                    promptAsync({ showInRecents: true });
                  }}
                  icon={
                    <IconSymbol
                      name="g.circle.fill"
                      size={20}
                      color={colors.primary}
                    />
                  }
                  variant="outline"
                  style={{ marginTop: Spacing.s }}
                />
              )}

              <TouchableOpacity
                onPress={() => {
                  router.push("/register");
                  dispatch(setError(null));
                }}
                style={{ marginTop: Spacing.l, alignItems: "center" }}
              >
                <Typography variant="body" style={{ color: colors.primary }}>
                  {STRINGS.auth.noAccount}
                </Typography>
              </TouchableOpacity>
            </View>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
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
    width: "100%",
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
  form: {
    width: "100%",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: Spacing.l,
  },
  line: {
    flex: 1,
    height: 1,
  },
});
