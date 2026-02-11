import { Button } from "@/components/atoms/Button";
import { Card } from "@/components/atoms/Card";
import { Input } from "@/components/atoms/Input";
import { Typography } from "@/components/atoms/Typography";
import { BorderRadius, Colors, Spacing } from "@/constants/theme";
import { useDebtPlanner } from "@/features/vision/hooks/useDebtPlanner";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { formatAmountInput, formatCurrency } from "@/utils/format";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
    Modal,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View
} from "react-native";

interface DebtPayoffPlannerProps {
  visible: boolean;
  onClose: () => void;
}

export const DebtPayoffPlanner: React.FC<DebtPayoffPlannerProps> = ({
  visible,
  onClose,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { loading, plans, fetchDebtPlans } = useDebtPlanner();
  const [extraPayment, setExtraPayment] = useState("");

  const handleCalculate = () => {
    const amount = parseFloat(extraPayment.replace(/[^0-9.]/g, "")) || 0;
    fetchDebtPlans(amount);
  };

  const renderPlanCard = (title: string, plan: any, isBest: boolean) => (
    <Card
      style={[
        styles.planCard,
        isBest && { borderColor: colors.success, borderWidth: 2 },
      ]}
    >
      <Typography
        variant="h3"
        weight="bold"
        style={{ marginBottom: Spacing.s }}
      >
        {title}
      </Typography>

      <View style={styles.row}>
        <Typography variant="bodySmall" style={{ color: colors.textSecondary }}>
          Tiempo:
        </Typography>
        <Typography variant="body" weight="bold">
          {plan.months_to_payoff} meses
        </Typography>
      </View>

      <View style={styles.row}>
        <Typography variant="bodySmall" style={{ color: colors.textSecondary }}>
          Fecha Fin:
        </Typography>
        <Typography variant="body">{plan.payoff_date}</Typography>
      </View>

      <View style={styles.row}>
        <Typography variant="bodySmall" style={{ color: colors.textSecondary }}>
          Intereses:
        </Typography>
        <Typography
          variant="body"
          style={{ color: isBest ? colors.success : colors.text }}
        >
          {formatCurrency(plan.total_interest_paid)}
        </Typography>
      </View>

      {isBest && (
        <View
          style={{
            marginTop: Spacing.s,
            backgroundColor: colors.success + "20",
            padding: Spacing.xs,
            borderRadius: BorderRadius.s,
            alignItems: "center",
          }}
        >
          <Typography
            variant="caption"
            weight="bold"
            style={{ color: colors.success }}
          >
            ¡Mejor Opción!
          </Typography>
        </View>
      )}
    </Card>
  );

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View
          style={[styles.modalView, { backgroundColor: colors.background }]}
        >
          <View style={styles.header}>
            <Typography variant="h3" weight="bold">
              Planificador de Deudas
            </Typography>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            <Typography variant="body" style={{ marginBottom: Spacing.m }}>
              Calcula cuándo serás libre financieramente aplicando un pago extra
              mensual a tus deudas.
            </Typography>

            <Input
              label="Pago Extra Mensual ($)"
              value={extraPayment}
              onChangeText={(t) => setExtraPayment(formatAmountInput(t))}
              placeholder="0.00"
              keyboardType="numeric"
            />

            <Button
              title="Calcular Plan"
              onPress={handleCalculate}
              loading={loading}
              style={{ marginTop: Spacing.m }}
            />

            {plans && (
              <View style={{ marginTop: Spacing.l }}>
                <Typography variant="h3" style={{ marginBottom: Spacing.m }}>
                  Comparativa de Estrategias
                </Typography>

                {renderPlanCard(
                  "Bola de Nieve ❄️",
                  plans.snowball,
                  plans.snowball.total_interest_paid >
                    plans.avalanche.total_interest_paid
                    ? false
                    : false,
                )}

                <View style={{ height: Spacing.m }} />

                {renderPlanCard(
                  "Avalancha 🏔️",
                  plans.avalanche,
                  plans.avalanche.total_interest_paid <
                    plans.snowball.total_interest_paid,
                )}

                <View
                  style={{
                    marginTop: Spacing.l,
                    padding: Spacing.m,
                    backgroundColor: colors.surface,
                    borderRadius: BorderRadius.m,
                  }}
                >
                  <Typography
                    variant="bodySmall"
                    style={{ textAlign: "center" }}
                  >
                    {plans.avalanche.total_interest_paid <
                    plans.snowball.total_interest_paid
                      ? `Ahorrarías ${formatCurrency(plans.snowball.total_interest_paid - plans.avalanche.total_interest_paid)} en intereses usando el método Avalancha.`
                      : "Ambas estrategias tienen el mismo costo en tu caso."}
                  </Typography>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalView: {
    borderTopLeftRadius: BorderRadius.l,
    borderTopRightRadius: BorderRadius.l,
    padding: Spacing.l,
    height: "90%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.l,
  },
  content: {
    flex: 1,
  },
  planCard: {
    padding: Spacing.m,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.xs,
  },
});
