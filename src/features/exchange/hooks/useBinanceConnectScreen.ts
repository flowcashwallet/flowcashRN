import {
  connectBinance,
  disconnectBinance,
  fetchBinanceStatus,
  syncBinancePortfolio,
} from "@/features/exchange/data/binanceSlice";
import STRINGS from "@/i18n/es.json";
import { AppDispatch, RootState } from "@/store/store";
import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";
import { useDispatch, useSelector } from "react-redux";

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
    balances,
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
