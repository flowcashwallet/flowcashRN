// src/services/cryptoService.ts

// Tipado para la respuesta cruda de CoinGecko
interface CoinGeckoResponse {
  [coinId: string]: {
    mxn: number;
  };
}

// Tipado para lo que devuelve nuestra función (ej: { bitcoin: 1200000 })
export type PriceData = Record<string, number>;

const IS_PRO = false;
const API_KEY = "TU_API_KEY_AQUI";
const BASE_URL = IS_PRO
  ? "https://pro-api.coingecko.com/api/v3"
  : "https://api.coingecko.com/api/v3";

/**
 * Símbolos de Binance más comunes → id de CoinGecko. Deliberadamente una
 * lista explícita y acotada (no una búsqueda dinámica contra
 * `/coins/list`): cualquier activo fuera de este mapa se muestra igual
 * (cantidad visible) pero sin precio, en vez de romper la pantalla.
 */
const SYMBOL_TO_COINGECKO_ID: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  USDT: "tether",
  USDC: "usd-coin",
  BNB: "binancecoin",
  SOL: "solana",
  XRP: "ripple",
  ADA: "cardano",
  DOGE: "dogecoin",
  DOT: "polkadot",
  MATIC: "matic-network",
  POL: "polygon-ecosystem-token",
  LTC: "litecoin",
  LINK: "chainlink",
  AVAX: "avalanche-2",
  TRX: "tron",
  SHIB: "shiba-inu",
  ATOM: "cosmos",
  UNI: "uniswap",
  XLM: "stellar",
  ETC: "ethereum-classic",
  FIL: "filecoin",
  APT: "aptos",
  ARB: "arbitrum",
  OP: "optimism",
  NEAR: "near",
  ALGO: "algorand",
  VET: "vechain",
  ICP: "internet-computer",
  FTM: "fantom",
};

/**
 * Obtiene el precio en MXN de una lista de símbolos de Binance (p. ej.
 * `["BTC", "ETH", "XYZ"]`) — pensado para el portafolio de Binance
 * (`BinanceConnectScreen`), que trabaja con tickers, no con ids de
 * CoinGecko. Los símbolos sin mapeo quedan en `null`, nunca tiran el resto.
 */
export const fetchCryptoPricesBySymbol = async (
  symbols: string[],
): Promise<Record<string, number | null>> => {
  const uniqueSymbols = Array.from(new Set(symbols.map((s) => s.toUpperCase())));
  const mappedIds = uniqueSymbols
    .map((symbol) => SYMBOL_TO_COINGECKO_ID[symbol])
    .filter((id): id is string => Boolean(id));

  const prices = mappedIds.length > 0 ? await fetchCryptoPrices(mappedIds) : null;

  const result: Record<string, number | null> = {};
  for (const symbol of uniqueSymbols) {
    const coinId = SYMBOL_TO_COINGECKO_ID[symbol];
    result[symbol] = coinId && prices ? prices[coinId] ?? null : null;
  }
  return result;
};

/**
 * Obtiene el precio en MXN de las monedas especificadas.
 * @param coinIds Puede ser un string único 'bitcoin' o un array ['bitcoin', 'tether']
 */
export const fetchCryptoPrices = async (
  coinIds: string | string[],
): Promise<PriceData | null> => {
  try {
    // Convertimos el array a string separado por comas si es necesario
    const ids = Array.isArray(coinIds) ? coinIds.join(",") : coinIds;

    const url = `${BASE_URL}/simple/price?ids=${ids}&vs_currencies=mxn`;
    const headers: HeadersInit = IS_PRO ? { "x-cg-pro-api-key": API_KEY } : {};

    const response = await fetch(url, { headers });

    if (!response.ok) throw new Error(`Error API: ${response.status}`);

    const data: CoinGeckoResponse = await response.json();

    // Transformamos { bitcoin: { mxn: 500 } } -> { bitcoin: 500 }
    const normalizedData: PriceData = {};
    Object.keys(data).forEach((key) => {
      normalizedData[key] = data[key].mxn;
    });

    return normalizedData;
  } catch (error) {
    console.error("Error fetching prices:", error);
    return null;
  }
};
