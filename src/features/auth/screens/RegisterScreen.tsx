import { Button } from "@/components/atoms/Button";
import { Card } from "@/components/atoms/Card";
import { Checkbox } from "@/components/atoms/Checkbox";
import { Input } from "@/components/atoms/Input";
import { Typography } from "@/components/atoms/Typography";
import { ThemedView } from "@/components/themed-view";
import { Colors, Spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import STRINGS from "@/i18n/es.json";
import { auth, db } from "@/services/firebaseConfig";
import { AppDispatch, RootState } from "@/store/store";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { setError, setLoading } from "../authSlice";

export default function RegisterScreen() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error } = useSelector((state: RootState) => state.auth);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);

  const handleRegister = async () => {
    if (!firstName || !lastName || !dob || !email || !password) {
      dispatch(setError("Por favor completa todos los campos"));
      return;
    }

    if (!termsAccepted) {
      dispatch(setError("Debes aceptar los términos y condiciones"));
      return;
    }

    dispatch(setLoading(true));
    dispatch(setError(null));

    try {
      // 1. Create Authentication User
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // 2. Save User Profile in Firestore
      await setDoc(doc(db, "users", user.uid), {
        firstName,
        lastName,
        dob,
        email,
        createdAt: new Date().toISOString(),
      });

      console.log("User registered and profile created:", user.uid);
      // Navigation is handled by auth state listener in _layout
    } catch (err: any) {
      console.error("Registration Error:", err);
      let msg = err.message;
      if (err.code === "auth/email-already-in-use")
        msg = "El correo ya está registrado";
      if (err.code === "auth/weak-password")
        msg = "La contraseña debe tener al menos 6 caracteres";
      if (err.code === "auth/invalid-email") msg = STRINGS.auth.invalidEmail;

      dispatch(setError(msg));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const openTerms = () => {
    Linking.openURL("https://www.walletBudget.net/Terms.pdf");
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Card variant="flat" style={styles.card}>
            <View style={styles.header}>
              <LinearGradient
                colors={
                  colors.gradients.primary as unknown as readonly [
                    string,
                    string
                  ]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.logoPlaceholder}
              >
                <Typography
                  variant="h2"
                  weight="bold"
                  style={{ color: "#FFF" }}
                >
                  +
                </Typography>
              </LinearGradient>

              <Typography
                variant="h1"
                weight="bold"
                style={{ textAlign: "center", marginBottom: Spacing.s }}
              >
                Crear Cuenta
              </Typography>
              <Typography
                variant="body"
                style={{ textAlign: "center", color: colors.icon }}
              >
                Únete para gestionar tus finanzas
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
                label="Nombre"
                placeholder="Ej. Juan"
                value={firstName}
                onChangeText={setFirstName}
              />
              <Input
                label="Apellido"
                placeholder="Ej. Pérez"
                value={lastName}
                onChangeText={setLastName}
              />
              <Input
                label="Fecha de Nacimiento"
                placeholder="DD/MM/AAAA"
                value={dob}
                onChangeText={setDob}
                keyboardType="numbers-and-punctuation"
              />
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

              <View style={styles.termsContainer}>
                <Checkbox
                  checked={termsAccepted}
                  onChange={setTermsAccepted}
                />
                <View style={{ flex: 1, marginLeft: Spacing.s }}>
                  <Typography variant="body" style={{ color: colors.text }}>
                    Acepto los{" "}
                    <Typography
                      variant="body"
                      weight="bold"
                      style={{ color: colors.primary }}
                      onPress={openTerms}
                    >
                      Términos y Condiciones
                    </Typography>
                  </Typography>
                </View>
              </View>

              {loading ? (
                <ActivityIndicator
                  size="large"
                  color={colors.primary}
                  style={{ marginTop: Spacing.m }}
                />
              ) : (
                <Button
                  title="Registrarse"
                  onPress={handleRegister}
                  style={{ marginTop: Spacing.m }}
                />
              )}

              <TouchableOpacity
                onPress={() => router.replace("/login")}
                style={{ marginTop: Spacing.l, alignItems: "center" }}
              >
                <Typography variant="body" style={{ color: colors.primary }}>
                  ¿Ya tienes cuenta? Inicia sesión
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
    paddingTop: Spacing.xxl,
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
    width: 60,
    height: 60,
    borderRadius: 18,
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
  termsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.s,
    marginBottom: Spacing.s,
  },
});
