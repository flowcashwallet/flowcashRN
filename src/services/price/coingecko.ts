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
