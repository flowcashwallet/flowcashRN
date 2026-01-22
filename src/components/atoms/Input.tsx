import React from 'react';
import { TextInput, StyleSheet, View, TextInputProps } from 'react-native';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Typography } from './Typography';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function Input({ label, error, style, ...rest }: InputProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={styles.container}>
      {label && (
        <Typography variant="caption" style={{ marginBottom: Spacing.xs, color: colors.text }}>
          {label}
        </Typography>
      )}
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: colors.surface,
            borderColor: error ? colors.error : colors.border,
            color: colors.text,
          },
          style,
        ]}
        placeholderTextColor={colors.icon}
        {...rest}
      />
      {error && (
        <Typography variant="caption" style={{ marginTop: Spacing.xs, color: colors.error }}>
          {error}
        </Typography>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.m,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: BorderRadius.m,
    paddingHorizontal: Spacing.m,
    fontSize: 16,
  },
});
