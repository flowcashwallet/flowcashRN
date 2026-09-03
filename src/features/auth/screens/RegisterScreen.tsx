import { GlassSurface } from "@/components/atoms/GlassSurface";
import { Typography } from "@/components/atoms/Typography";
import { ThemedView } from "@/components/themed-view";
import { BorderRadius, Spacing } from "@/constants/theme";
import React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { AuthErrorBanner } from "../components/AuthErrorBanner";
import { RegisterForm } from "../components/register/RegisterForm";
import { useRegisterForm } from "../hooks/useRegisterForm";

export default function RegisterScreen() {
  const {
    colors,
    loading,
    error,
    firstName,
    setFirstName,
    lastName,
    setLastName,
    dob,
    handleDateChange,
    email,
    setEmail,
    password,
    setPassword,
    isPasswordVisible,
    togglePasswordVisibility,
    termsAccepted,
    setTermsAccepted,
    handleRegister,
    openTerms,
    onLoginPress,
  } = useRegisterForm();

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoiding}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <GlassSurface
            style={styles.card}
            fallbackStyle={[
              styles.flatCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.header}>
              <View
                style={[
                  styles.logoPlaceholder,
                  { backgroundColor: colors.primary }, // Solid primary color
                ]}
              >
                <Typography variant="heading" style={{ color: colors.onPrimary }}>
                  +
                </Typography>
              </View>

              <Typography variant="title" style={styles.title}>
                Crear Cuenta
              </Typography>
              <Typography variant="body" muted style={styles.subtitle}>
                Únete para gestionar tus finanzas
              </Typography>
            </View>

            <AuthErrorBanner error={error} colors={colors} />

            <RegisterForm
              colors={colors}
              loading={loading}
              firstName={firstName}
              onFirstNameChange={setFirstName}
              lastName={lastName}
              onLastNameChange={setLastName}
              dob={dob}
              onDobChange={handleDateChange}
              email={email}
              onEmailChange={setEmail}
              password={password}
              onPasswordChange={setPassword}
              isPasswordVisible={isPasswordVisible}
              onTogglePasswordVisibility={togglePasswordVisibility}
              termsAccepted={termsAccepted}
              onTermsAcceptedChange={setTermsAccepted}
              onOpenTerms={openTerms}
              onSubmit={handleRegister}
              onLoginPress={onLoginPress}
            />
          </GlassSurface>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoiding: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: Spacing.l,
    paddingTop: Spacing.xxl,
  },
  /** Layout de la card, común a la variante con cristal y a la plana. */
  card: {
    alignItems: "center",
    padding: Spacing.m,
    paddingVertical: Spacing.xxl,
    borderRadius: BorderRadius.l,
    overflow: "hidden",
  },
  /** Fondo opaco + hairline: solo cuando no hay cristal. */
  flatCard: {
    borderWidth: StyleSheet.hairlineWidth,
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
  title: {
    textAlign: "center",
    marginBottom: Spacing.s,
  },
  subtitle: {
    textAlign: "center",
  },
});
