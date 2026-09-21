import {
  BinanceBalance,
  connectBinance,
  disconnectBinance,
  fetchBinanceStatus,
  syncBinancePortfolio,
} from "@/features/exchange/data/binanceSlice";
import STRINGS from "@/i18n/es.json";
import { AppDispatch, RootState } from "@/store/store";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";
import { useDispatch, useSelector } from "react-redux";

/** Mismo tipo de paleta+hash que ya usa `useDashboardScreen.ts` para colorear categorías — cada moneda cae siempre en el mismo color mientras no cambie su símbolo. */
const PORTFOLIO_PALETTE = [
  "#8fb1ff",
  "#ff6b6b",
  "#4ade80",
  "#FFD166",
  "#C084FC",
  "#60A5FA",
  "#F97316",
  "#34D399",
];

function hashString(value: string): number {
  let h = 0;
  for (let i = 0; i < value.length; i++) {
    h = (h * 31 + value.charCodeAt(i)) >>> 0;
  }
  return h;
}

export interface DisplayBalance extends BinanceBalance {
  /** 0-1, o `null` si no tiene valor en USD — no cuenta para el porcentaje. */
  percentOfTotal: number | null;
  color: string;
}

const AMOUNT_FORMATTER = new Intl.NumberFormat("en-US", { maximumFractionDigits: 8 });

/** "0.50000000" → "0.5", con separador de miles para cantidades grandes. */
export function formatCryptoAmount(amount: number): string {
  return AMOUNT_FORMATTER.format(amount);
}

/** Traduce el código de error del backend a un mensaje que el usuario entienda. */
function mapBinanceError(code: string | null | undefined): string {
  if (!code) return STRINGS.binance.errorGeneric;
  if (code === "api_key_and_secret_required") return STRINGS.binance.errorApiKeyAndSecretRequired;
  if (code.startsWith("key_not_read_only")) return STRINGS.binance.errorKeyNotReadOnly;
  // Binance rechazó la petición firmada en sí (código -2015 típicamente) —
  // casi siempre key/secret mal copiados, o la key tiene restricción de IP
  // activada en Binance (nuestro servidor no tiene una IP que puedas fijar
  // ahí). Distinto de "key_not_read_only": aquí Binance ni siquiera llegó a
  // evaluar los permisos.
  if (code.startsWith("invalid_binance_credentials")) return STRINGS.binance.errorInvalidCredentials;
  if (code === "binance_service_unavailable") return STRINGS.binance.errorServiceUnavailable;
  if (code === "not_connected") return STRINGS.binance.errorNotConnected;
  return STRINGS.binance.errorGeneric;
}

/**
 * El valor en USD por activo (y el total) ya viene calculado por el backend
 * — vía el ticker público de Binance, no CoinGecko — así que este hook ya
 * no hace ninguna llamada de precios propia, solo lee `state.binance`.
 */
export const useBinanceConnectScreen = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { connected, maskedApiKey, lastSyncedAt, balances, totalValueUsd, status, error } = useSelector(
    (state: RootState) => state.binance,
  );

  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [isSecretVisible, setIsSecretVisible] = useState(false);

  useEffect(() => {
    dispatch(fetchBinanceStatus());
  }, [dispatch]);

  // Ordenado por valor (los que sí tienen precio primero, de mayor a menor);
  // lo demás queda al final, en el orden en que llegó del backend.
  const displayBalances = useMemo<DisplayBalance[]>(() => {
    const priced = balances.filter((b) => b.valueUsd != null);
    const unpriced = balances.filter((b) => b.valueUsd == null);
    priced.sort((a, b) => b.valueUsd! - a.valueUsd!);
    return [...priced, ...unpriced].map((balance) => ({
      ...balance,
      percentOfTotal:
        totalValueUsd > 0 && balance.valueUsd != null ? balance.valueUsd / totalValueUsd : null,
      color: PORTFOLIO_PALETTE[hashString(balance.asset) % PORTFOLIO_PALETTE.length],
    }));
  }, [balances, totalValueUsd]);

  const handleConnect = useCallback(async () => {
    const result = await dispatch(connectBinance({ apiKey: apiKey.trim(), apiSecret: apiSecret.trim() }));
    if (connectBinance.fulfilled.match(result)) {
      setApiKey("");
      setApiSecret("");
      dispatch(syncBinancePortfolio());
    } else {
      Alert.alert(STRINGS.common.error, mapBinanceError(result.payload));
    }
  }, [dispatch, apiKey, apiSecret]);

  const handleSync = useCallback(() => {
    dispatch(syncBinancePortfolio()).then((result) => {
      if (syncBinancePortfolio.rejected.match(result)) {
        Alert.alert(STRINGS.common.error, mapBinanceError(result.payload?.message));
      }
    });
  }, [dispatch]);

  const handleDisconnect = useCallback(() => {
    Alert.alert(
      STRINGS.binance.disconnectConfirmTitle,
      STRINGS.binance.disconnectConfirmMessage,
      [
        { text: STRINGS.common.cancel, style: "cancel" },
        {
          text: STRINGS.binance.disconnect,
          style: "destructive",
          onPress: () => dispatch(disconnectBinance()),
        },
      ],
    );
  }, [dispatch]);

  return {
    connected,
    maskedApiKey,
    lastSyncedAt,
    balances: displayBalances,
    totalValueUsd,
    isConnecting: status === "connecting",
    isSyncing: status === "syncing",
    error: error ? mapBinanceError(error) : null,
    apiKey,
    setApiKey,
    apiSecret,
    setApiSecret,
    isSecretVisible,
    toggleSecretVisibility: () => setIsSecretVisible((prev) => !prev),
    handleConnect,
    handleSync,
    handleDisconnect,
  };
};
