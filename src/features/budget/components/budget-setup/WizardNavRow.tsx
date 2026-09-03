import { Button } from "@/components/atoms/Button";
import { Spacing } from "@/constants/theme";
import React from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";

interface WizardNavRowProps {
  backLabel?: string;
  onBack: () => void;
  nextLabel: string;
  onNext: () => void;
  /** El paso 2 agrega `marginTop: Spacing.l`, el paso 3 no lleva ninguno. */
  style?: StyleProp<ViewStyle>;
}

/**
 * Fila "Atrás" / "Siguiente" (o "Finalizar") de los pasos 2 y 3 del wizard —
 * mismo layout de dos botones `flex: 1` con `gap: Spacing.m` en ambos.
 */
export const WizardNavRow: React.FC<WizardNavRowProps> = ({
  backLabel = "Atrás",
  onBack,
  nextLabel,
  onNext,
  style,
}) => {
  return (
    <View style={[styles.row, style]}>
      <Button
        title={backLabel}
        variant="outline"
        onPress={onBack}
        style={styles.button}
      />
      <Button title={nextLabel} onPress={onNext} style={styles.button} />
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: Spacing.m,
  },
  button: {
    flex: 1,
  },
});
