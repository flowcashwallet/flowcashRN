import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";
import { StatisticsScreenStackHeader } from "@/features/analytics/components/StatisticsScreenStackHeader";
import { SettingsRow } from "@/features/settings/components/SettingsRow";
import STRINGS from "@/i18n/es.json";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet } from "react-native";

/**
 * Ruta stack de nivel superior (`app/settings/index.tsx`), no un tab ni un
 * modal — mismo patrón que `AiChatScreen`/`NotificationsScreen`. Se llega
 * aquí desde el panel lateral (`SideMenuPanel`).
 */
export default function SettingsScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <>
      <StatisticsScreenStackHeader
        title={STRINGS.settings.title}
        colors={colors}
        onBack={() => router.back()}
      />
      <ThemedView style={styles.container}>
        <SettingsRow
          icon="link"
          label={STRINGS.settings.connectionsRow}
          subtitle={STRINGS.settings.connectionsRowSubtitle}
          onPress={() => router.push("/settings/connections")}
        />
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.m,
  },
});
