import { GlassSurface } from "@/components/atoms/GlassSurface";
import { Typography } from "@/components/atoms/Typography";
import { BorderRadius, Spacing, ThemeColors } from "@/constants/theme";
import { stepStyles } from "@/features/budget/components/budget-setup/sharedStyles";
import { WizardNavRow } from "@/features/budget/components/budget-setup/WizardNavRow";
import { formatCurrency } from "@/utils/format";
import React from "react";
import { StyleSheet, View } from "react-native";

interface BudgetSummaryStepProps {
  colors: ThemeColors;
  parsedIncome: number;
  totalExpenses: number;
  onBack: () => void;
  onFinish: () => void;
}

/** Paso 3 del wizard: resumen de ingreso y gastos fijos antes de guardar. */
export const BudgetSummaryStep: React.FC<BudgetSummaryStepProps> = ({
  colors,
  parsedIncome,
  totalExpenses,
  onBack,
  onFinish,
}) => {
  return (
    <View style={stepStyles.stepContainer}>
      <Typography variant="subheading" style={styles.title}>
        Resumen
      </Typography>

      <GlassSurface
        style={styles.card}
        fallbackStyle={[
          styles.flatCard,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <Typography variant="caption" muted>
          Ingreso Mensual
        </Typography>
        <Typography variant="display" style={{ color: colors.success }}>
          {formatCurrency(parsedIncome)}
        </Typography>
      </GlassSurface>

      <GlassSurface
        style={styles.card}
        fallbackStyle={[
          styles.flatCard,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <Typography variant="caption" muted>
          Total Gastos Fijos
        </Typography>
        <Typography variant="display" style={{ color: colors.expense }}>
          {formatCurrency(totalExpenses)}
        </Typography>
      </GlassSurface>

      <Typography variant="body" muted style={styles.disclaimer}>
        Al finalizar, estos ingresos y gastos se agregarán automáticamente a
        tu Wallet cada inicio de mes.
      </Typography>

      <WizardNavRow onBack={onBack} nextLabel="Finalizar" onNext={onFinish} />
    </View>
  );
};

const styles = StyleSheet.create({
  title: {
    marginBottom: Spacing.m,
  },
  /** Layout de la card, común a la variante con cristal y a la plana. */
  card: {
    borderRadius: BorderRadius.l,
    padding: Spacing.m,
    marginBottom: Spacing.m,
    overflow: "hidden",
  },
  /** Fondo opaco + hairline: solo cuando no hay cristal. */
  flatCard: {
    borderWidth: StyleSheet.hairlineWidth,
  },
  disclaimer: {
    textAlign: "center",
    marginBottom: Spacing.l,
    fontStyle: "italic",
  },
});
