import { Transaction } from "../data/walletSlice";

export type StreakStatus = "hot" | "pending" | "cold";

export interface StreakInfo {
  count: number;
  status: StreakStatus;
}

export const useStreak = (transactions: Transaction[]): StreakInfo => {
  if (!transactions || transactions.length === 0) {
    return { count: 0, status: "cold" };
  }

  // 1. Get unique dates in YYYY-MM-DD format
  const uniqueDates = Array.from(
    new Set(
      transactions.map((t) => {
        const date = new Date(t.date);
        return date.toISOString().split("T")[0];
      }),
    ),
  ).sort((a, b) => b.localeCompare(a)); // Descending order

  if (uniqueDates.length === 0) {
    return { count: 0, status: "cold" };
  }

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  // Create yesterday date correctly handling month/year boundaries
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  const lastTxDateStr = uniqueDates[0];

  // Helper to calculate days difference
  const getDaysDiff = (d1: string, d2: string) => {
    const date1 = new Date(d1);
    const date2 = new Date(d2);
    const diffTime = Math.abs(date2.getTime() - date1.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Case 1: Transaction today -> HOT
  if (lastTxDateStr === todayStr) {
    let streak = 1;
    let currentDateToCheck = new Date(today);

    // Check previous days
    for (let i = 1; i < uniqueDates.length; i++) {
      currentDateToCheck.setDate(currentDateToCheck.getDate() - 1);
      const expectedDateStr = currentDateToCheck.toISOString().split("T")[0];

      if (uniqueDates.includes(expectedDateStr)) {
        streak++;
      } else {
        break;
      }
    }

    return { count: streak, status: "hot" };
  }

  // Case 2: Transaction yesterday -> PENDING
  if (lastTxDateStr === yesterdayStr) {
    let streak = 1; // Count yesterday
    let currentDateToCheck = new Date(yesterday);

    // Check days before yesterday
    for (let i = 1; i < uniqueDates.length; i++) {
      currentDateToCheck.setDate(currentDateToCheck.getDate() - 1);
      const expectedDateStr = currentDateToCheck.toISOString().split("T")[0];

      if (uniqueDates.includes(expectedDateStr)) {
        streak++;
      } else {
        break;
      }
    }

    return { count: streak, status: "pending" };
  }

  // Case 3: No transaction today or yesterday -> COLD
  // Calculate days since last transaction
  const daysSinceLast = getDaysDiff(todayStr, lastTxDateStr);

  return { count: daysSinceLast, status: "cold" };
};
