import React from 'react';
import { TextInput, StyleSheet, View, TextInputProps } from 'react-native';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Typography } from './Typography';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  rightIcon?: React.ReactNode;
}

export function Input({ label, error, style, rightIcon, ...rest }: InputProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={styles.container}>
      {label && (
        <Typography variant="caption" style={{ marginBottom: Spacing.xs, color: colors.text }}>
          {label}
        </Typography>
      )}
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: colors.surface,
            borderColor: error ? colors.error : colors.border,
          },
          style,
        ]}
      >
        <TextInput
          style={[
            styles.input,
            {
              color: colors.text,
            },
          ]}
          placeholderTextColor={colors.icon}
          {...rest}
        />
        {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
      </View>
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
  inputContainer: {
    height: 48,
    borderWidth: 1,
    borderRadius: BorderRadius.m,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.m,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
  },
  rightIcon: {
    marginLeft: Spacing.s,
  },
});
