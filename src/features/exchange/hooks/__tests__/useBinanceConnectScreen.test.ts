import { formatCryptoAmount } from "@/features/exchange/hooks/useBinanceConnectScreen";

describe("formatCryptoAmount", () => {
  it("recorta ceros de más pero conserva la precisión necesaria", () => {
    expect(formatCryptoAmount(0.5)).toBe("0.5");
    expect(formatCryptoAmount(21.82228648)).toBe("21.82228648");
  });

  it("agrega separador de miles en cantidades grandes", () => {
    expect(formatCryptoAmount(4160.84653639)).toBe("4,160.84653639");
  });

  it("no muestra más de 8 decimales", () => {
    expect(formatCryptoAmount(0.123456789)).toBe("0.12345679");
  });

  it("maneja cantidades enteras sin agregar decimales", () => {
    expect(formatCryptoAmount(100)).toBe("100");
  });
});
