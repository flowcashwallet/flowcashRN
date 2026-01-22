import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Typography } from '../atoms/Typography';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';

interface TransactionItemProps {
  amount: number;
  description: string;
  date: number;
  type: 'income' | 'expense';
}

export function TransactionItem({ amount, description, date, type }: TransactionItemProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const isIncome = type === 'income';
  const iconName = isIncome ? 'arrow.down.left' : 'arrow.up.right'; // Example icons
  const iconColor = isIncome ? colors.success : colors.error;

  return (
    <View style={[styles.container, { borderBottomColor: colors.border }]}>
      <View style={[styles.iconContainer, { backgroundColor: isIncome ? '#E6F8EF' : '#FFEBE6' }]}>
         <IconSymbol name={isIncome ? 'chevron.right' : 'chevron.right'} size={24} color={iconColor} />
      </View>
      
      <View style={styles.content}>
        <Typography variant="body" weight="medium">{description}</Typography>
        <Typography variant="caption" style={{ color: colors.icon }}>
          {new Date(date).toLocaleDateString()}
        </Typography>
      </View>

      <Typography
        variant="body"
        weight="bold"
        style={{ color: isIncome ? colors.success : colors.error }}
      >
        {isIncome ? '+' : '-'}${amount.toFixed(2)}
      </Typography>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.m,
    borderBottomWidth: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.m,
  },
  content: {
    flex: 1,
  },
});
