import { formatAmountInput, formatCurrency, parseAmount } from "../format";

describe("format utils", () => {
  describe("formatCurrency", () => {
    it("formats positive numbers correctly", () => {
      expect(formatCurrency(1234.56)).toBe("$1,234.56");
    });

    it("formats zero correctly", () => {
      expect(formatCurrency(0)).toBe("$0.00");
    });

    it("formats negative numbers correctly", () => {
      expect(formatCurrency(-1234.56)).toBe("-$1,234.56");
    });
  });

  describe("formatAmountInput", () => {
    it("removes non-numeric characters", () => {
      expect(formatAmountInput("abc123")).toBe("123");
    });

    it("adds commas to integer part", () => {
      expect(formatAmountInput("1000")).toBe("1,000");
    });

    it("handles decimal points", () => {
      expect(formatAmountInput("1000.50")).toBe("1,000.50");
    });
  });

  describe("parseAmount", () => {
    it("parses number string with commas", () => {
      expect(parseAmount("1,234.56")).toBe(1234.56);
    });

    it("parses plain number string", () => {
      expect(parseAmount("123")).toBe(123);
    });
  });
});
