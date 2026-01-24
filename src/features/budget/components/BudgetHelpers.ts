import STRINGS from "@/i18n/es.json";

export const CATEGORIES = STRINGS.wallet.categories;

// Helper to format amount input with commas
export const formatAmountInput = (text: string) => {
  // Remove existing commas to get raw input
  let rawText = text.replace(/,/g, "");

  // Allow empty string
  if (rawText === "") return "";

  // Remove non-numeric chars except dot
  rawText = rawText.replace(/[^0-9.]/g, "");

  // Handle multiple dots: keep only the first one
  const dots = rawText.match(/\./g) || [];
  if (dots.length > 1) {
    const firstDotIndex = rawText.indexOf(".");
    rawText =
      rawText.slice(0, firstDotIndex + 1) +
      rawText.slice(firstDotIndex + 1).replace(/\./g, "");
  }

  // Split into integer and decimal parts
  const parts = rawText.split(".");
  // Format integer part with commas
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  // Limit decimal places to 2
  if (parts.length > 1) {
    parts[1] = parts[1].slice(0, 2);
  }

  return parts.join(".");
};

// Helper to get raw number from formatted string
export const getRawAmount = (formattedText: string) => {
  return parseFloat(formattedText.replace(/,/g, ""));
};
