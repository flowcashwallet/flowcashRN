import { AppDispatch, RootState } from "@/store/store";
import React, { useEffect, useState } from "react";
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    StyleSheet,
    View,
} from "react-native";
import { PieChart } from "react-native-gifted-charts";
import { useDispatch, useSelector } from "react-redux";
import { addTransaction, fetchTransactions } from "../walletSlice";

// Atomic Components
import { Button } from "@/components/atoms/Button";
import { Card } from "@/components/atoms/Card";
import { Input } from "@/components/atoms/Input";
import { Typography } from "@/components/atoms/Typography";
import { TransactionList } from "@/components/organisms/TransactionList";

import { ThemedView } from "@/components/themed-view";
import { BorderRadius, Colors, Spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function WalletScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const { transactions } = useSelector((state: RootState) => state.wallet);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const [modalVisible, setModalVisible] = useState(false);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"income" | "expense">("expense");

  useEffect(() => {
    dispatch(fetchTransactions());
  }, [dispatch]);

  const balance = transactions.reduce((acc, curr) => {
    return curr.type === "income" ? acc + curr.amount : acc - curr.amount;
  }, 0);

  const income = transactions
    .filter((t) => t.type === "income")
    .reduce((acc, curr) => acc + curr.amount, 0);
  const expense = transactions
    .filter((t) => t.type === "expense")
    .reduce((acc, curr) => acc + curr.amount, 0);

  const chartData = [
    {
      value: income > 0 ? income : 0.01,
      color: colors.success,
      text: "Ingresos",
    },
    {
      value: expense > 0 ? expense : 0.01,
      color: colors.error,
      text: "Gastos",
    },
  ];

  const handleAddTransaction = () => {
    if (!amount || !description) return;
    dispatch(
      addTransaction({
        amount: parseFloat(amount),
        description,
        type,
        date: Date.now(),
      }),
    );
    setModalVisible(false);
    setAmount("");
    setDescription("");
  };

  return (
    <ThemedView style={styles.container}>
      {/* Header / Balance Card */}
      <Card variant="elevated" style={styles.balanceCard}>
        <Typography
          variant="caption"
          style={{ color: colors.text, opacity: 0.7 }}
        >
          Balance Total
        </Typography>
        <Typography
          variant="h1"
          weight="bold"
          style={{ color: colors.primary, marginTop: Spacing.xs }}
        >
          ${balance.toFixed(2)}
        </Typography>
        <View style={styles.chartContainer}>
          <PieChart
            data={chartData}
            donut
            radius={60}
            innerRadius={45}
            centerLabelComponent={() => (
              <Typography variant="caption" weight="medium">
                Resumen
              </Typography>
            )}
          />
        </View>
      </Card>

      {/* Quick Actions */}
      <View style={styles.actions}>
        <Button
          title="Ingreso"
          variant="secondary"
          onPress={() => {
            setType("income");
            setModalVisible(true);
          }}
          style={{
            flex: 1,
            marginRight: Spacing.s,
            backgroundColor: colors.success,
          }}
        />
        <Button
          title="Gasto"
          variant="secondary"
          onPress={() => {
            setType("expense");
            setModalVisible(true);
          }}
          style={{
            flex: 1,
            marginLeft: Spacing.s,
            backgroundColor: colors.error,
          }}
        />
      </View>

      {/* Transactions List */}
      <TransactionList transactions={transactions} />

      {/* Add Transaction Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View
            style={[
              styles.modalContent,
              { backgroundColor: colors.background },
            ]}
          >
            <Typography
              variant="h3"
              weight="bold"
              style={{ marginBottom: Spacing.l }}
            >
              {type === "income" ? "Nuevo Ingreso" : "Nuevo Gasto"}
            </Typography>

            <Input
              label="Descripción"
              placeholder="Ej: Comida, Salario..."
              value={description}
              onChangeText={setDescription}
            />

            <Input
              label="Monto"
              placeholder="0.00"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />

            <View style={styles.modalButtons}>
              <Button
                title="Cancelar"
                variant="ghost"
                onPress={() => setModalVisible(false)}
                style={{ flex: 1, marginRight: Spacing.s }}
              />
              <Button
                title="Guardar"
                onPress={handleAddTransaction}
                style={{
                  flex: 1,
                  marginLeft: Spacing.s,
                  backgroundColor:
                    type === "income" ? colors.success : colors.error,
                }}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.m,
    paddingTop: 60,
  },
  balanceCard: {
    alignItems: "center",
    padding: Spacing.l,
    marginBottom: Spacing.l,
    borderRadius: BorderRadius.xl,
  },
  chartContainer: {
    marginTop: Spacing.m,
  },
  actions: {
    flexDirection: "row",
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    marginBottom: Spacing.m,
  },
  listContent: {
    paddingBottom: Spacing.xl,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.l,
    paddingBottom: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  modalButtons: {
    flexDirection: "row",
    marginTop: Spacing.m,
  },
});
