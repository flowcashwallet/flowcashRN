import { Transaction } from "@/features/wallet/data/walletSlice";

/**
 * Determines the default payment type based on the last 10 transactions.
 * Algorithm:
 * 1. Sort transactions by date descending (latest first).
 * 2. Take the last 10 transactions.
 * 3. Count the frequency of each payment type in these 10 transactions.
 * 4. If no payment types are found (all are null/undefined), return null.
 * 5. Otherwise, return the most frequent payment type.
 *
 * @param transactions List of all transactions
 * @returns The suggested payment type ("credit_card" | "debit_card" | "cash") or null
 */
export const determineDefaultPaymentType = (
  transactions: Transaction[],
): "credit_card" | "debit_card" | "cash" | null => {
  if (!transactions || transactions.length === 0) {
    return null;
  }

  // Ensure we are looking at the latest transactions
  // Assuming the input array might not be sorted, we sort it.
  // Creating a copy to avoid mutating the original array
  const sortedTransactions = [...transactions].sort((a, b) => b.date - a.date);

  // Analyze the last 10 transactions
  const last10 = sortedTransactions.slice(0, 10);

  const paymentTypeCounts: Record<string, number> = {};
  let hasAnyPaymentType = false;

  for (const transaction of last10) {
    if (transaction.paymentType) {
      hasAnyPaymentType = true;
      paymentTypeCounts[transaction.paymentType] =
        (paymentTypeCounts[transaction.paymentType] || 0) + 1;
    }
  }

  // "si en las ultimas 10 transacciones no tiene tipo de pago ponerlo vacio"
  if (!hasAnyPaymentType) {
    return null;
  }

  // Find the most frequent payment type
  let mostFrequentType: string | null = null;
  let maxCount = 0;

  for (const [type, count] of Object.entries(paymentTypeCounts)) {
    if (count > maxCount) {
      maxCount = count;
      mostFrequentType = type;
    }
  }

  return mostFrequentType as "credit_card" | "debit_card" | "cash" | null;
};
