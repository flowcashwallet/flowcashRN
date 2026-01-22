import { Typography } from "@/components/atoms/Typography";
import { ThemedView } from "@/components/themed-view";
import { StyleSheet } from "react-native";

export default function BudgetScreen() {
  return (
    <ThemedView style={styles.container}>
      <Typography variant="h1" weight="bold">
        Presupuesto
      </Typography>
      <Typography>Aquí podrás gestionar tus presupuestos.</Typography>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
});
