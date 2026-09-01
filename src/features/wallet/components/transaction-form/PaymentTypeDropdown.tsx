import { Typography } from "@/components/atoms/Typography";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Spacing, ThemeColors } from "@/constants/theme";
import React, { useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { dropdownStyles } from "./sharedStyles";

export type PaymentType =
  | "credit_card"
  | "debit_card"
  | "cash"
  | "transfer"
  | "payroll";

interface PaymentTypeDropdownProps {
  selectedPaymentType: PaymentType | null;
  onSelectPaymentType: (paymentType: PaymentType) => void;
  colors: ThemeColors;
}

export function PaymentTypeDropdown({
  selectedPaymentType,
  onSelectPaymentType,
  colors,
}: PaymentTypeDropdownProps) {
  const [isPaymentTypeDropdownOpen, setIsPaymentTypeDropdownOpen] =
    useState(false);

  return (
    <View style={styles.container}>
      <Typography variant="overline" muted style={styles.label}>
        Tipo de pago
      </Typography>
      <TouchableOpacity
        onPress={() =>
          setIsPaymentTypeDropdownOpen(!isPaymentTypeDropdownOpen)
        }
        style={[
          dropdownStyles.dropdown,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            marginBottom: isPaymentTypeDropdownOpen ? 0 : Spacing.m,
          },
        ]}
      >
        <View style={dropdownStyles.dropdownHeader}>
          <Typography variant="body" muted={!selectedPaymentType}>
            {selectedPaymentType
              ? selectedPaymentType === "credit_card"
                ? "Tarjeta de crédito"
                : selectedPaymentType === "debit_card"
                  ? "Tarjeta de débito"
                  : selectedPaymentType === "cash"
                    ? "Efectivo"
                    : selectedPaymentType === "transfer"
                      ? "Transferencia"
                      : "Nómina"
              : "Seleccionar tipo de pago (opcional)"}
          </Typography>
          <IconSymbol
            name={isPaymentTypeDropdownOpen ? "chevron.up" : "chevron.down"}
            size={16}
            color={colors.icon}
          />
        </View>
      </TouchableOpacity>

      {isPaymentTypeDropdownOpen && (
        <View
          style={[
            dropdownStyles.dropdownList,
            { borderColor: colors.border, backgroundColor: colors.surface },
          ]}
        >
          {[
            { id: "credit_card", label: "Tarjeta de crédito" },
            { id: "debit_card", label: "Tarjeta de débito" },
            { id: "cash", label: "Efectivo" },
            { id: "transfer", label: "Transferencia" },
            { id: "payroll", label: "Nómina" },
          ].map((pt, index) => (
            <TouchableOpacity
              key={pt.id}
              onPress={() => {
                onSelectPaymentType(pt.id as PaymentType);
                setIsPaymentTypeDropdownOpen(false);
              }}
              style={[
                styles.item,
                index > 0 && {
                  borderTopWidth: StyleSheet.hairlineWidth,
                  borderTopColor: colors.border,
                },
              ]}
            >
              <Typography
                variant="body"
                weight={selectedPaymentType === pt.id ? "semibold" : "regular"}
              >
                {pt.label}
              </Typography>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.m,
  },
  label: {
    marginBottom: Spacing.xs,
  },
  item: {
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.sm,
  },
});
