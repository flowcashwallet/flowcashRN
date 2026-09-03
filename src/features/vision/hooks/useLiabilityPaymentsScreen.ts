import { useTheme } from "@/contexts/ThemeContext";
import { VisionEntity } from "@/features/vision/data/visionSlice";
import { Transaction } from "@/features/wallet/data/walletSlice";
import { RootState } from "@/store/store";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import {
  getMonthEnd,
  getMonthLabel,
  getMonthStart,
  toMonthKey,
} from "../utils/liabilityPayments";
import { useManualPaymentOverrides } from "./useManualPaymentOverrides";

type MonthPayment = {
  monthIndex: number;
  monthLabel: string;
  amountPaid: number;
  isPaid: boolean;
  meetsMinimum: boolean | null;
};

export type MonthPaymentDisplay = {
  monthIndex: number;
  monthLabel: string;
  amountPaid: number;
  showCheck: boolean;
  statusLabel: string;
};

export type CurrentMonthSummary = {
  monthLabel: string;
  amountPaid: number;
  showCheck: boolean;
};

export const useLiabilityPaymentsScreen = () => {
  const { colors } = useTheme();
  const params = useLocalSearchParams();
  const id = params.id as string | undefined;

  const entities = useSelector((state: RootState) => state.vision.entities);
  const transactions = useSelector(
    (state: RootState) => state.wallet.transactions,
  );

  const { manualOverrides } = useManualPaymentOverrides();

  const entity = useMemo<VisionEntity | null>(() => {
    if (!id) return null;
    return entities.find((e) => e.id === id) ?? null;
  }, [entities, id]);

  const [year, setYear] = useState(() => new Date().getFullYear());

  const relevantTransfers = useMemo<Transaction[]>(() => {
    if (!entity) return [];
    return transactions.filter(
      (t) => t.type === "transfer" && t.transferRelatedEntityId === entity.id,
    );
  }, [entity, transactions]);

  const months = useMemo<MonthPayment[]>(() => {
    if (!entity) return [];
    const minimum = entity.minimumPayment ?? null;

    return Array.from({ length: 12 }, (_, monthIndex) => {
      const start = getMonthStart(year, monthIndex);
      const end = getMonthEnd(year, monthIndex);
      const amountPaid = relevantTransfers
        .filter((t) => t.date >= start && t.date <= end)
        .reduce((sum, t) => sum + t.amount, 0);

      const isPaid = amountPaid > 0;
      const meetsMinimum = minimum === null ? null : amountPaid >= minimum;

      return {
        monthIndex,
        monthLabel: getMonthLabel(year, monthIndex),
        amountPaid,
        isPaid,
        meetsMinimum,
      };
    });
  }, [entity, relevantTransfers, year]);

  const monthStatuses = useMemo(() => {
    if (!entity) return {};
    const noPaymentRequired =
      entity.amount === 0 || entity.minimumPayment === 0;
    const map: Record<number, { showCheck: boolean; statusLabel: string }> =
      {};

    for (const m of months) {
      const manual =
        manualOverrides[entity.id]?.[toMonthKey(year, m.monthIndex)];
      const showCheck = noPaymentRequired
        ? true
        : manual !== undefined
          ? manual
          : m.meetsMinimum === null
            ? m.isPaid
            : m.meetsMinimum;

      const statusLabel = noPaymentRequired
        ? "Sin pago requerido"
        : manual !== undefined
          ? manual
            ? "Pagado (manual)"
            : "No pagado (manual)"
          : m.meetsMinimum === null
            ? m.isPaid
              ? "Pagado"
              : "Sin pago"
            : m.meetsMinimum
              ? "Pagado"
              : m.isPaid
                ? "Pago parcial"
                : "Sin pago";

      map[m.monthIndex] = { showCheck, statusLabel };
    }

    return map;
  }, [entity, manualOverrides, months, year]);

  const displayMonths = useMemo<MonthPaymentDisplay[]>(() => {
    return months.map((m) => {
      const status = monthStatuses[m.monthIndex];
      return {
        monthIndex: m.monthIndex,
        monthLabel: m.monthLabel,
        amountPaid: m.amountPaid,
        showCheck: status?.showCheck ?? false,
        statusLabel: status?.statusLabel ?? "Sin pago",
      };
    });
  }, [months, monthStatuses]);

  const yearTotalPaid = useMemo(() => {
    return months.reduce((sum, m) => sum + m.amountPaid, 0);
  }, [months]);

  const currentMonthIndex = new Date().getMonth();

  const thisMonth = useMemo(() => {
    return months.find((m) => m.monthIndex === currentMonthIndex) ?? null;
  }, [months, currentMonthIndex]);

  const thisMonthStatus = useMemo(() => {
    return monthStatuses[currentMonthIndex] ?? null;
  }, [currentMonthIndex, monthStatuses]);

  const currentMonthSummary = useMemo<CurrentMonthSummary | null>(() => {
    if (!thisMonth) return null;
    return {
      monthLabel: thisMonth.monthLabel,
      amountPaid: thisMonth.amountPaid,
      showCheck: thisMonthStatus?.showCheck ?? false,
    };
  }, [thisMonth, thisMonthStatus]);

  const goPrevYear = useCallback(() => setYear((y) => y - 1), []);
  const goNextYear = useCallback(() => setYear((y) => y + 1), []);

  return {
    colors,
    entity,
    year,
    goPrevYear,
    goNextYear,
    displayMonths,
    yearTotalPaid,
    currentMonthSummary,
  };
};
