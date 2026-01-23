import { Typography } from "@/components/atoms/Typography";
import { ThemedView } from "@/components/themed-view";
import { BorderRadius, Spacing } from "@/constants/theme";
import STRINGS from "@/i18n/es.json";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet } from "react-native";

export default function BudgetScreen() {
  return (
    <ThemedView style={styles.container}>
      <LinearGradient
        colors={["#8E2DE2", "#4A00E0"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          padding: Spacing.xl,
          borderRadius: BorderRadius.xl,
          alignItems: "center",
          marginBottom: Spacing.l,
          width: "100%",
          elevation: 5,
          shadowColor: "#8E2DE2",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
        }}
      >
        <Typography variant="h1" weight="bold" style={{ color: "#FFF" }}>
          {STRINGS.budget.title}
        </Typography>
      </LinearGradient>
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
