import { Button } from "@/components/atoms/Button";
import { Checkbox } from "@/components/atoms/Checkbox";
import { Input } from "@/components/atoms/Input";
import { Typography } from "@/components/atoms/Typography";
import { Spacing, ThemeColors } from "@/constants/theme";
import { IconSymbol } from "@/components/ui/icon-symbol";
import STRINGS from "@/i18n/es.json";
import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

interface RegisterFormProps {
  colors: ThemeColors;
  loading: boolean;
  firstName: string;
  onFirstNameChange: (value: string) => void;
  lastName: string;
  onLastNameChange: (value: string) => void;
  dob: string;
  onDobChange: (value: string) => void;
  email: string;
  onEmailChange: (value: string) => void;
  password: string;
  onPasswordChange: (value: string) => void;
  isPasswordVisible: boolean;
  onTogglePasswordVisibility: () => void;
  termsAccepted: boolean;
  onTermsAcceptedChange: (checked: boolean) => void;
  onOpenTerms: () => void;
  onSubmit: () => void;
  onLoginPress: () => void;
}

/**
 * The `<View style={styles.form}>` block that used to live directly in
 * `RegisterScreen`: name/DOB/email/password inputs, the terms checkbox,
 * submit button (or spinner while loading) and the "ya tengo cuenta" link.
 */
export function RegisterForm({
  colors,
  loading,
  firstName,
  onFirstNameChange,
  lastName,
  onLastNameChange,
  dob,
  onDobChange,
  email,
  onEmailChange,
  password,
  onPasswordChange,
  isPasswordVisible,
  onTogglePasswordVisibility,
  termsAccepted,
  onTermsAcceptedChange,
  onOpenTerms,
  onSubmit,
  onLoginPress,
}: RegisterFormProps) {
  return (
    <View style={styles.form}>
      <Input
        label="Nombre"
        placeholder="Ej. Juan"
        value={firstName}
        onChangeText={onFirstNameChange}
      />
      <Input
        label="Apellido"
        placeholder="Ej. Pérez"
        value={lastName}
        onChangeText={onLastNameChange}
      />
      <Input
        label="Fecha de Nacimiento"
        placeholder="DD-MM-AAAA"
        value={dob}
        onChangeText={onDobChange}
        keyboardType="numeric"
        maxLength={10}
      />
      <Input
        label={STRINGS.auth.email}
        placeholder={STRINGS.auth.emailPlaceholder}
        value={email}
        onChangeText={onEmailChange}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <Input
        label={STRINGS.auth.password}
        placeholder={STRINGS.auth.passwordPlaceholder}
        value={password}
        onChangeText={onPasswordChange}
        secureTextEntry={!isPasswordVisible}
        rightIcon={
          <TouchableOpacity onPress={onTogglePasswordVisibility}>
            <IconSymbol
              name={isPasswordVisible ? "eye.fill" : "eye.slash.fill"}
              size={24}
              color={colors.icon}
            />
          </TouchableOpacity>
        }
      />

      <View style={styles.termsContainer}>
        <Checkbox
          checked={termsAccepted}
          onChange={onTermsAcceptedChange}
          testID="terms-checkbox"
        />
        <View style={styles.termsTextWrapper}>
          <Typography variant="body" style={{ color: colors.text }}>
            Acepto los{" "}
            <Typography
              variant="body"
              weight="bold"
              style={{ color: colors.primary }}
              onPress={onOpenTerms}
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
          style={styles.loadingIndicator}
        />
      ) : (
        <Button
          title="Registrarse"
          onPress={onSubmit}
          style={styles.submitButton}
        />
      )}

      <TouchableOpacity onPress={onLoginPress} style={styles.loginLink}>
        <Typography variant="body" style={{ color: colors.primary }}>
          ¿Ya tienes cuenta? Inicia sesión
        </Typography>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    width: "100%",
  },
  termsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.s,
    marginBottom: Spacing.s,
  },
  termsTextWrapper: {
    flex: 1,
    marginLeft: Spacing.s,
  },
  loadingIndicator: {
    marginTop: Spacing.m,
  },
  submitButton: {
    marginTop: Spacing.m,
  },
  loginLink: {
    marginTop: Spacing.l,
    alignItems: "center",
  },
});
