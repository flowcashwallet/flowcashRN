import { Typography } from "@/components/atoms/Typography";
import { ThemedView } from "@/components/themed-view";
import { StyleSheet } from "react-native";

export default function VisionScreen() {
  return (
    <ThemedView style={styles.container}>
      <Typography variant="h1" weight="bold">
        Visión
      </Typography>
      <Typography>Aquí podrás visualizar tus metas a largo plazo.</Typography>
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
