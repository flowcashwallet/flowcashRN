import { Typography } from "@/components/atoms/Typography";
import { ThemedView } from "@/components/themed-view";
import STRINGS from "@/i18n/es.json";
import { StyleSheet } from "react-native";

export default function BudgetScreen() {
  return (
    <ThemedView style={styles.container}>
      <Typography variant="h1" weight="bold">
        {STRINGS.budget.title}
      </Typography>
      <Typography>{STRINGS.budget.description}</Typography>
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
