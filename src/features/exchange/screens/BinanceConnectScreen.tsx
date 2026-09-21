import { Button } from "@/components/atoms/Button";
import { GlassSurface } from "@/components/atoms/GlassSurface";
import { Input } from "@/components/atoms/Input";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { BorderRadius, Spacing } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";
import { Typography } from "@/components/atoms/Typography";
import { StatisticsScreenStackHeader } from "@/features/analytics/components/StatisticsScreenStackHeader";
import {
  DisplayBalance,
  formatCryptoAmount,
  useBinanceConnectScreen,
} from "@/features/exchange/hooks/useBinanceConnectScreen";
import STRINGS from "@/i18n/es.json";
import { formatCurrency } from "@/utils/format";
import { useRouter } from "expo-router";
import React from "react";
import { ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";

/** Disco de iniciales por moneda — no hay logos reales, así que cada símbolo cae siempre en el mismo color (ver `hashString` en el hook). */
function AssetBadge({ asset, color }: { asset: string; color: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: color }]}>
      <Typography variant="caption" weight="bold" style={styles.badgeText}>
        {asset.slice(0, 3)}
      </Typography>
    </View>
  );
}

function BalanceRow({ balance }: { balance: DisplayBalance }) {
  const { colors } = useTheme();
  return (
    <View style={styles.balanceRow}>
      <AssetBadge asset={balance.asset} color={balance.color} />
      <View style={styles.balanceInfo}>
        <Typography variant="body" weight="semibold">
          {balance.asset}
        </Typography>
        <Typography variant="caption" muted>
          {formatCryptoAmount(balance.amount)}
        </Typography>
      </View>
      <View style={styles.balanceValue}>
        {balance.valueUsd != null ? (
          <>
            <Typography variant="number">{formatCurrency(balance.valueUsd)}</Typography>
            {balance.percentOfTotal != null ? (
              <Typography variant="caption" muted>
                {(balance.percentOfTotal * 100).toFixed(1)}%
              </Typography>
            ) : null}
          </>
        ) : (
          <Typography variant="caption" muted style={{ color: colors.textSecondary }}>
            {STRINGS.binance.noPriceAvailable}
          </Typography>
        )}
      </View>
    </View>
  );
}

/**
 * Ruta stack de nivel superior (`app/settings/connections/binance.tsx`),
 * llegada desde Ajustes → Conexión con cuentas externas → Binance (o el
 * atajo directo del menú lateral). El secreto que teclea el usuario vive
 * solo en el estado local del hook hasta el POST de conectar — ver
 * `binanceSlice.ts`/`useBinanceConnectScreen.ts`.
 */
export default function BinanceConnectScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const {
    connected,
    maskedApiKey,
    lastSyncedAt,
    balances,
    totalValueUsd,
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
                style={styles.heroCard}
                fallbackStyle={[styles.flatCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <View style={styles.heroTop}>
                  <View style={styles.heroCopy}>
                    <Typography variant="overline" muted>
                      {STRINGS.binance.totalLabel}
                    </Typography>
                    <Typography variant="title">{formatCurrency(totalValueUsd)}</Typography>
                  </View>
                  <TouchableOpacity
                    onPress={handleSync}
                    disabled={isSyncing}
                    accessibilityRole="button"
                    accessibilityLabel={STRINGS.binance.syncNow}
                    style={[styles.syncIconButton, { backgroundColor: colors.surfaceHighlight }]}
                  >
                    {isSyncing ? (
                      <ActivityIndicator size="small" color={colors.text} />
                    ) : (
                      <IconSymbol name="arrow.triangle.2.circlepath" size={18} color={colors.text} />
                    )}
                  </TouchableOpacity>
                </View>
                <View style={[styles.heroFooter, { borderTopColor: colors.border }]}>
                  <Typography variant="caption" muted>
                    {maskedApiKey} · {balances.length} {STRINGS.binance.assetsCountLabel}
                  </Typography>
                  <Typography variant="caption" muted>
                    {lastSyncedAt ? new Date(lastSyncedAt).toLocaleString() : STRINGS.binance.neverSynced}
                  </Typography>
                </View>
              </GlassSurface>

              {balances.length === 0 ? (
                <Typography variant="body" muted style={styles.emptyText}>
                  {STRINGS.binance.emptyPortfolio}
                </Typography>
              ) : (
                <GlassSurface
                  style={styles.card}
                  fallbackStyle={[styles.flatCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                  {balances.map((balance, index) => (
                    <View key={balance.asset}>
                      {index > 0 ? (
                        <View style={[styles.rowSeparator, { backgroundColor: colors.border }]} />
                      ) : null}
                      <BalanceRow balance={balance} />
                    </View>
                  ))}
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
    borderRadius: BorderRadius.l,
    overflow: "hidden",
    marginBottom: Spacing.m,
  },
  heroCard: {
    borderRadius: BorderRadius.l,
    overflow: "hidden",
    marginBottom: Spacing.m,
  },
  flatCard: {
    borderWidth: StyleSheet.hairlineWidth,
  },
  warningCard: {
    padding: Spacing.m,
    gap: Spacing.s,
  },
  warningBody: {
    marginTop: Spacing.xs,
  },
  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: Spacing.m,
  },
  heroCopy: {
    gap: Spacing.xs,
  },
  syncIconButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.round,
    alignItems: "center",
    justifyContent: "center",
  },
  heroFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  emptyText: {
    marginBottom: Spacing.m,
  },
  balanceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.s,
    padding: Spacing.m,
  },
  rowSeparator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: Spacing.m + 36 + Spacing.s,
  },
  badge: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.round,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: "#fff",
  },
  balanceInfo: {
    flex: 1,
  },
  balanceValue: {
    alignItems: "flex-end",
  },
  connectButton: {
    marginTop: Spacing.m,
  },
  disconnectButton: {
    marginTop: Spacing.m,
  },
});
