import { Button } from "@/components/atoms/Button";
import { GlassSurface } from "@/components/atoms/GlassSurface";
import { Input } from "@/components/atoms/Input";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { BorderRadius, Spacing } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";
import { Typography } from "@/components/atoms/Typography";
import { StatisticsScreenStackHeader } from "@/features/analytics/components/StatisticsScreenStackHeader";
import { useBinanceConnectScreen } from "@/features/exchange/hooks/useBinanceConnectScreen";
import STRINGS from "@/i18n/es.json";
import { formatCurrency } from "@/utils/format";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";

/**
 * Ruta stack de nivel superior (`app/settings/connections/binance.tsx`),
 * llegada desde Ajustes → Conexión con cuentas externas → Binance. El
 * secreto que teclea el usuario vive solo en el estado local del hook
 * hasta el POST de conectar — ver `binanceSlice.ts`/`useBinanceConnectScreen.ts`.
 */
export default function BinanceConnectScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const {
    connected,
    maskedApiKey,
    lastSyncedAt,
    pricedBalances,
    totalFiatValue,
    isConnecting,
    isSyncing,
    apiKey,
    setApiKey,
    apiSecret,
    setApiSecret,
    isSecretVisible,
    toggleSecretVisibility,
    handleConnect,
    handleSync,
    handleDisconnect,
  } = useBinanceConnectScreen();

  return (
    <>
      <StatisticsScreenStackHeader
        title={STRINGS.binance.title}
        colors={colors}
        onBack={() => router.back()}
      />
      <ThemedView style={styles.container}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {connected ? (
            <>
              <GlassSurface
                style={styles.card}
                fallbackStyle={[styles.flatCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <View style={styles.row}>
                  <Typography variant="bodySmall" muted>
                    {STRINGS.binance.maskedKeyLabel}
                  </Typography>
                  <Typography variant="body">{maskedApiKey}</Typography>
                </View>
                <View style={styles.row}>
                  <Typography variant="bodySmall" muted>
                    {STRINGS.binance.lastSyncedLabel}
                  </Typography>
                  <Typography variant="body">
                    {lastSyncedAt ? new Date(lastSyncedAt).toLocaleString() : STRINGS.binance.neverSynced}
                  </Typography>
                </View>
                <Button
                  title={isSyncing ? STRINGS.binance.syncing : STRINGS.binance.syncNow}
                  loading={isSyncing}
                  onPress={handleSync}
                  style={styles.syncButton}
                />
              </GlassSurface>

              <Typography variant="subheading" style={styles.sectionTitle}>
                {STRINGS.binance.portfolioTitle}
              </Typography>

              {pricedBalances.length === 0 ? (
                <Typography variant="body" muted style={styles.emptyText}>
                  {STRINGS.binance.emptyPortfolio}
                </Typography>
              ) : (
                <GlassSurface
                  style={styles.card}
                  fallbackStyle={[styles.flatCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                  {pricedBalances.map((balance) => (
                    <View key={balance.asset} style={styles.balanceRow}>
                      <View>
                        <Typography variant="body" weight="semibold">
                          {balance.asset}
                        </Typography>
                        <Typography variant="caption" muted>
                          {balance.free + balance.locked}
                        </Typography>
                      </View>
                      <Typography variant="body">
                        {balance.fiatValue != null
                          ? formatCurrency(balance.fiatValue)
                          : STRINGS.binance.noPriceAvailable}
                      </Typography>
                    </View>
                  ))}
                  <View style={[styles.balanceRow, styles.totalRow, { borderTopColor: colors.border }]}>
                    <Typography variant="body" weight="semibold">
                      {STRINGS.binance.totalLabel}
                    </Typography>
                    <Typography variant="number">{formatCurrency(totalFiatValue)}</Typography>
                  </View>
                </GlassSurface>
              )}

              <Button
                title={STRINGS.binance.disconnect}
                variant="outline"
                onPress={handleDisconnect}
                style={[styles.disconnectButton, { borderColor: colors.error }]}
                textStyle={{ color: colors.error }}
              />
            </>
          ) : (
            <>
              <GlassSurface
                style={[styles.card, styles.warningCard, { borderColor: colors.error }]}
                fallbackStyle={[styles.flatCard, { backgroundColor: colors.surface, borderColor: colors.error }]}
              >
                <Typography variant="body" weight="semibold" style={{ color: colors.error }}>
                  {STRINGS.binance.readOnlyWarningTitle}
                </Typography>
                <Typography variant="bodySmall" muted style={styles.warningBody}>
                  {STRINGS.binance.readOnlyWarningBody}
                </Typography>
                <Typography variant="caption" muted style={styles.warningBody}>
                  {STRINGS.binance.noIpRestrictionNote}
                </Typography>
              </GlassSurface>

              <Input
                label={STRINGS.binance.apiKeyLabel}
                placeholder={STRINGS.binance.apiKeyPlaceholder}
                value={apiKey}
                onChangeText={setApiKey}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Input
                label={STRINGS.binance.apiSecretLabel}
                placeholder={STRINGS.binance.apiSecretPlaceholder}
                value={apiSecret}
                onChangeText={setApiSecret}
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry={!isSecretVisible}
                rightIcon={
                  <TouchableOpacity onPress={toggleSecretVisibility}>
                    <IconSymbol
                      name={isSecretVisible ? "eye.fill" : "eye.slash.fill"}
                      size={24}
                      color={colors.icon}
                    />
                  </TouchableOpacity>
                }
              />

              <Button
                title={isConnecting ? STRINGS.binance.connecting : STRINGS.binance.connect}
                loading={isConnecting}
                onPress={handleConnect}
                style={styles.connectButton}
              />
            </>
          )}
        </ScrollView>
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.m,
  },
  card: {
    padding: Spacing.m,
    borderRadius: BorderRadius.l,
    overflow: "hidden",
    gap: Spacing.s,
    marginBottom: Spacing.m,
  },
  flatCard: {
    borderWidth: StyleSheet.hairlineWidth,
  },
  warningCard: {
    borderWidth: StyleSheet.hairlineWidth,
  },
  warningBody: {
    marginTop: Spacing.xs,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  syncButton: {
    marginTop: Spacing.s,
  },
  sectionTitle: {
    marginBottom: Spacing.s,
  },
  emptyText: {
    marginBottom: Spacing.m,
  },
  balanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.xs,
  },
  totalRow: {
    marginTop: Spacing.s,
    paddingTop: Spacing.s,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  connectButton: {
    marginTop: Spacing.m,
  },
  disconnectButton: {
    marginTop: Spacing.m,
  },
});
