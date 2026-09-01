import { Typography } from "@/components/atoms/Typography";
import {
  BorderRadius,
  FontWeight,
  Spacing,
  ThemeColors,
  TypographyScale,
} from "@/constants/theme";
import STRINGS from "@/i18n/es.json";
import { formatAmountInput } from "@/utils/format";
import React from "react";
import { StyleSheet, TextInput, View } from "react-native";

interface AmountInputProps {
  type: "income" | "expense" | "transfer";
  amount: string;
  onChangeAmount: (value: string) => void;
  colors: ThemeColors;
}

export function AmountInput({
  type,
  amount,
  onChangeAmount,
  colors,
}: AmountInputProps) {
  return (
    <View style={styles.container}>
      <Typography variant="overline" muted style={styles.label}>
        {STRINGS.wallet.amount}
      </Typography>
      <View
        style={[
          styles.amountBox,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        {/*
          El signo es un importe con signo, aunque no esté en una fila de lista:
          le aplica la misma regla de paleta que a `TransactionItem` —
          `success` para ingreso, `expense` para gasto. `expense` es la tinta
          roja contable, no `error`. Una transferencia no mueve saldo neto, así
          que se queda en `text`.
        */}
        <Typography
          variant="heading"
          style={[
            styles.sign,
            {
              color:
                type === "income"
                  ? colors.success
                  : type === "expense"
                    ? colors.expense
                    : colors.text,
            },
          ]}
        >
          {type === "income" ? "+" : "-"}
        </Typography>
        <TextInput
          value={amount}
          onChangeText={(text) => onChangeAmount(formatAmountInput(text))}
          placeholder="0.00"
          placeholderTextColor={colors.textSecondary}
          keyboardType="numeric"
          style={[styles.amountInput, { color: colors.text }]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.l,
  },
  label: {
    marginBottom: Spacing.xs,
    textAlign: "center",
  },
  amountBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BorderRadius.m,
    borderWidth: 1,
    paddingVertical: Spacing.s,
    paddingHorizontal: Spacing.m,
  },
  sign: {
    marginRight: Spacing.s,
  },
  /**
   * La cifra protagonista de la pantalla. `TextInput` no puede usar
   * `Typography`, así que toma la variante `display` de la escala y los dígitos
   * tabulares de la firma visual.
   */
  amountInput: {
    fontSize: TypographyScale.display.fontSize,
    lineHeight: TypographyScale.display.lineHeight,
    fontWeight: FontWeight.bold,
    letterSpacing: TypographyScale.display.letterSpacing,
    fontVariant: ["tabular-nums"],
    textAlign: "center",
    minWidth: 100,
    padding: 0,
  },
});
