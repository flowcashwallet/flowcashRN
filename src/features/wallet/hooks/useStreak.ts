import { Transaction } from "../data/walletSlice";

export type StreakStatus = "hot" | "pending" | "cold";

export interface StreakInfo {
  count: number;
  status: StreakStatus;
}

export const useStreak = (
  transactions: Transaction[],
  repairedDays: string[] = [],
): StreakInfo => {
  const transactionDates = transactions.map((t) => {
    const date = new Date(t.date);
    return date.toISOString().split("T")[0];
  });

  // Combine transaction dates with repaired days and remove duplicates
  const allActiveDays = Array.from(
    new Set([...transactionDates, ...repairedDays]),
  ).sort((a, b) => b.localeCompare(a)); // Descending order

  if (allActiveDays.length === 0) {
    return { count: 0, status: "cold" };
  }

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  const lastActiveDateStr = allActiveDays[0];

  // Helper to calculate days difference
  const getDaysDiff = (d1: string, d2: string) => {
    const date1 = new Date(d1);
    const date2 = new Date(d2);
    const diffTime = Math.abs(date2.getTime() - date1.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Case 1: Active today -> HOT
  if (lastActiveDateStr === todayStr) {
    let streak = 1;
    let currentDateToCheck = new Date(today);

    // Check previous days
    // Since allActiveDays is sorted desc, we can just walk back days
    // But gaps are not allowed for streak unless they are covered by repairedDays (which are already in allActiveDays)

    // We need to verify consecutiveness
    while (true) {
      currentDateToCheck.setDate(currentDateToCheck.getDate() - 1);
      const expectedDateStr = currentDateToCheck.toISOString().split("T")[0];

      if (allActiveDays.includes(expectedDateStr)) {
        streak++;
      } else {
        break;
      }
    }

    return { count: streak, status: "hot" };
  }

  // Case 2: Active yesterday -> PENDING
  if (lastActiveDateStr === yesterdayStr) {
    let streak = 1;
    let currentDateToCheck = new Date(yesterday);

    while (true) {
      currentDateToCheck.setDate(currentDateToCheck.getDate() - 1);
      const expectedDateStr = currentDateToCheck.toISOString().split("T")[0];

      if (allActiveDays.includes(expectedDateStr)) {
        streak++;
      } else {
        break;
      }
    }

    return { count: streak, status: "pending" };
  }

  // Case 3: No active today or yesterday -> COLD
  const daysSinceLast = getDaysDiff(todayStr, lastActiveDateStr);
  return { count: daysSinceLast, status: "cold" };
};
