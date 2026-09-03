import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Typography } from "@/components/atoms/Typography";
import { Spacing, ThemeColors } from "@/constants/theme";
import STRINGS from "@/i18n/es.json";
import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

interface LoginFormProps {
  colors: ThemeColors;
  loading: boolean;
  email: string;
  onEmailChange: (value: string) => void;
  password: string;
  onPasswordChange: (value: string) => void;
  onSubmit: () => void;
  onRegisterPress: () => void;
}

/**
 * The `<View style={styles.form}>` block that used to live directly in
 * `LoginScreen`: email/password inputs, submit button (or spinner while
 * loading), "O" divider and the "no tengo cuenta" link.
 */
export function LoginForm({
  colors,
  loading,
  email,
  onEmailChange,
  password,
  onPasswordChange,
  onSubmit,
  onRegisterPress,
}: LoginFormProps) {
  return (
    <View style={styles.form}>
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
        secureTextEntry
      />

      {loading ? (
        <ActivityIndicator
          size="large"
          color={colors.primary}
          style={styles.loadingIndicator}
        />
      ) : (
        <Button
          title={STRINGS.auth.login}
          onPress={onSubmit}
          style={styles.submitButton}
        />
      )}

      <View style={styles.dividerContainer}>
        <View style={[styles.line, { backgroundColor: colors.border }]} />
        <Typography
          variant="caption"
          style={[styles.dividerText, { color: colors.icon }]}
        >
          O
        </Typography>
        <View style={[styles.line, { backgroundColor: colors.border }]} />
      </View>

      <TouchableOpacity onPress={onRegisterPress} style={styles.registerLink}>
        <Typography variant="body" style={{ color: colors.primary }}>
          {STRINGS.auth.noAccount}
        </Typography>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    width: "100%",
  },
  loadingIndicator: {
    marginTop: Spacing.m,
  },
  submitButton: {
    marginTop: Spacing.m,
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
  dividerText: {
    marginHorizontal: Spacing.s,
  },
  registerLink: {
    marginTop: Spacing.l,
    alignItems: "center",
  },
});
