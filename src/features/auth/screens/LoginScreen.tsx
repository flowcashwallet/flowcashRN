import { GlassSurface } from "@/components/atoms/GlassSurface";
import { Typography } from "@/components/atoms/Typography";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { BorderRadius, Spacing } from "@/constants/theme";
import STRINGS from "@/i18n/es.json";
import React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { AuthErrorBanner } from "../components/AuthErrorBanner";
import { LoginForm } from "../components/login/LoginForm";
import { useLoginForm } from "../hooks/useLoginForm";

export default function LoginScreen() {
  const {
    colors,
    loading,
    error,
    email,
    setEmail,
    password,
    setPassword,
    handleEmailAuth,
    onRegisterPress,
  } = useLoginForm();

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
                <IconSymbol
                  name="wallet.pass"
                  size={40}
                  color={colors.onPrimary}
                />
              </View>

              <Typography variant="title" style={styles.title}>
                {STRINGS.auth.welcome}
              </Typography>
              <Typography variant="body" muted style={styles.subtitle}>
                {STRINGS.auth.tagline}
              </Typography>
            </View>

            <AuthErrorBanner error={error} colors={colors} />

            <LoginForm
              colors={colors}
              loading={loading}
              email={email}
              onEmailChange={setEmail}
              password={password}
              onPasswordChange={setPassword}
              onSubmit={handleEmailAuth}
              onRegisterPress={onRegisterPress}
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
    justifyContent: "center",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: Spacing.l,
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
  title: {
    textAlign: "center",
    marginBottom: Spacing.s,
  },
  subtitle: {
    textAlign: "center",
  },
});
