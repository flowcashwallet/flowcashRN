import { Button } from "@/components/atoms/Button";
import { Card } from "@/components/atoms/Card";
import { Checkbox } from "@/components/atoms/Checkbox";
import { Input } from "@/components/atoms/Input";
import { Typography } from "@/components/atoms/Typography";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors, Spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import STRINGS from "@/i18n/es.json";
import { endpoints } from "@/services/api";
import { AppDispatch, RootState } from "@/store/store";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { setAuthData, setError, setLoading } from "../authSlice";

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
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const handleDateChange = (text: string) => {
    // Remove non-numeric characters
    const cleaned = text.replace(/[^0-9]/g, "");

    // Limit length to 8 characters (DDMMAAAA)
    let formatted = cleaned.substring(0, 8);

    // Insert hyphens
    if (formatted.length > 4) {
      formatted = `${formatted.slice(0, 2)}-${formatted.slice(2, 4)}-${formatted.slice(4)}`;
    } else if (formatted.length > 2) {
      formatted = `${formatted.slice(0, 2)}-${formatted.slice(2)}`;
    }

    setDob(formatted);
  };

  const isValidDate = (dateString: string) => {
    const regex = /^(\d{2})-(\d{2})-(\d{4})$/;
    if (!regex.test(dateString)) return false;

    const parts = dateString.split("-");
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);

    if (year < 1900 || year > new Date().getFullYear()) return false;
    if (month < 1 || month > 12) return false;
    if (day < 1 || day > 31) return false;

    const date = new Date(year, month - 1, day);
    return (
      date.getDate() === day &&
      date.getMonth() === month - 1 &&
      date.getFullYear() === year
    );
  };

  const handleRegister = async () => {
    if (!firstName || !lastName || !dob || !email || !password) {
      dispatch(setError("Por favor completa todos los campos"));
      return;
    }

    if (!isValidDate(dob)) {
      dispatch(setError("Por favor ingresa una fecha válida (DD-MM-AAAA)"));
      return;
    }

    if (!termsAccepted) {
      dispatch(setError("Debes aceptar los términos y condiciones"));
      return;
    }

    dispatch(setLoading(true));
    dispatch(setError(null));

    try {
      const response = await fetch(endpoints.auth.register, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: email,
          email,
          password,
          first_name: firstName,
          last_name: lastName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle Django errors
        // Django returns { field: ["error message"], ... }
        let errorMessage = "Error en el registro";
        if (data.username) errorMessage = `Usuario: ${data.username[0]}`;
        else if (data.email) errorMessage = `Email: ${data.email[0]}`;
        else if (data.password)
          errorMessage = `Contraseña: ${data.password[0]}`;
        else if (data.detail) errorMessage = data.detail;

        throw new Error(errorMessage);
      }

      console.log("User registered:", data);

      // Auto-login if tokens are present
      if (data.access && data.refresh) {
        dispatch(
          setAuthData({
            token: data.access,
            refreshToken: data.refresh,
            user: data.user,
          }),
        );
        router.replace("/(drawer)/(tabs)");
      } else {
        // Fallback if no tokens (shouldn't happen with updated backend)
        router.replace("/login");
      }
    } catch (err: any) {
      console.error("Registration Error:", err);
      dispatch(setError(err.message || "Error desconocido"));
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
              <View
                style={[
                  styles.logoPlaceholder,
                  { backgroundColor: colors.primary }, // Solid primary color
                ]}
              >
                <Typography
                  variant="h2"
                  weight="bold"
                  style={{ color: "#FFF" }}
                >
                  +
                </Typography>
              </View>

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
                placeholder="DD-MM-AAAA"
                value={dob}
                onChangeText={handleDateChange}
                keyboardType="numeric"
                maxLength={10}
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
                secureTextEntry={!isPasswordVisible}
                rightIcon={
                  <TouchableOpacity
                    onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                  >
                    <IconSymbol
                      name={isPasswordVisible ? "eye.fill" : "eye.slash.fill"}
                      size={24}
                      color={colors.icon}
                    />
                  </TouchableOpacity>
                }
              />

              <View style={styles.termsContainer}>
                <Checkbox checked={termsAccepted} onChange={setTermsAccepted} />
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
