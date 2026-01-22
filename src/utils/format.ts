export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatAmountInput = (value: string): string => {
  // Remove all non-numeric characters except dot
  const cleanValue = value.replace(/[^0-9.]/g, "");

  // Split into integer and decimal parts
  const parts = cleanValue.split(".");

  // If more than 2 parts (multiple dots), return previous valid value or just ignore the last dot
  // For simplicity, we'll just take the first two parts
  if (parts.length > 2) {
    parts.pop();
  }

  // Format integer part with commas
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  // Join back
  return parts.join(".");
};

export const parseAmount = (value: string): number => {
  // Remove commas and parse
  return parseFloat(value.replace(/,/g, ""));
};
