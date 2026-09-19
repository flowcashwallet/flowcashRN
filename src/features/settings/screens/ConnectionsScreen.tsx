import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";
import { fetchBinanceStatus } from "@/features/exchange/data/binanceSlice";
import { StatisticsScreenStackHeader } from "@/features/analytics/components/StatisticsScreenStackHeader";
import { SettingsRow } from "@/features/settings/components/SettingsRow";
import STRINGS from "@/i18n/es.json";
import { AppDispatch, RootState } from "@/store/store";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { StyleSheet } from "react-native";
import { useDispatch, useSelector } from "react-redux";

/**
 * Lista de servicios externos conectables — v1 tiene un solo servicio
 * (Binance). Ruta stack de nivel superior (`app/settings/connections.tsx`).
 */
export default function ConnectionsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  const connected = useSelector((state: RootState) => state.binance.connected);

  useEffect(() => {
    dispatch(fetchBinanceStatus());
  }, [dispatch]);

  return (
    <>
      <StatisticsScreenStackHeader
        title={STRINGS.settings.connectionsTitle}
        colors={colors}
        onBack={() => router.back()}
      />
      <ThemedView style={styles.container}>
        <SettingsRow
          icon="link"
          label="Binance"
          subtitle={connected ? STRINGS.settings.connectedLabel : STRINGS.settings.notConnectedLabel}
          onPress={() => router.push("/settings/connections/binance")}
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
