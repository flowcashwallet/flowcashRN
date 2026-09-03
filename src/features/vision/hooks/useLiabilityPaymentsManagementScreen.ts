import { useTheme } from "@/contexts/ThemeContext";
import { VisionEntity } from "@/features/vision/data/visionSlice";
import { Transaction } from "@/features/wallet/data/walletSlice";
import { RootState } from "@/store/store";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Alert } from "react-native";
import { useSelector } from "react-redux";
import {
  getDueDateLabel,
  getMonthEnd,
  getMonthStart,
  getMonthYearLabel,
  toMonthKey,
} from "../utils/liabilityPayments";
import { useManualPaymentOverrides } from "./useManualPaymentOverrides";

type LiabilityRow = {
  id: string;
  name: string;
  entityAmount: number;
  dueDay: number | null;
  minimumPayment: number | null;
  amountPaid: number;
  isPaid: boolean;
  meetsMinimum: boolean | null;
};

export type LiabilityPaymentDisplayRow = {
  id: string;
  name: string;
  amountPaid: number;
  minimumPayment: number | null;
  dueDateLabel: string | null;
  noPaymentRequired: boolean;
  showPaid: boolean;
  statusIcon: "checkmark.circle.fill" | "xmark.circle.fill";
  statusColor: string;
  statusText: string;
};

export const useLiabilityPaymentsManagementScreen = () => {
  const router = useRouter();
  const { colors } = useTheme();

  const entities = useSelector((state: RootState) => state.vision.entities);
  const transactions = useSelector(
    (state: RootState) => state.wallet.transactions,
  );

  const { manualOverrides, setManualOverrides, persistOverrides } =
    useManualPaymentOverrides();

  const liabilities = useMemo<VisionEntity[]>(() => {
    return entities.filter((e) => e.type === "liability");
  }, [entities]);

  const [monthCursor, setMonthCursor] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), monthIndex: now.getMonth() };
  });

  const { monthStart, monthEnd, monthLabel } = useMemo(() => {
    const monthStart = getMonthStart(monthCursor.year, monthCursor.monthIndex);
    const monthEnd = getMonthEnd(monthCursor.year, monthCursor.monthIndex);
    const monthLabel = getMonthYearLabel(
      monthCursor.year,
      monthCursor.monthIndex,
    );
    return { monthStart, monthEnd, monthLabel };
  }, [monthCursor.monthIndex, monthCursor.year]);

  const monthKey = useMemo(
    () => toMonthKey(monthCursor.year, monthCursor.monthIndex),
    [monthCursor.monthIndex, monthCursor.year],
  );

  const transfersToLiabilities = useMemo<Transaction[]>(() => {
    const liabilityIds = new Set(liabilities.map((l) => l.id));
    return transactions.filter(
      (t) =>
        t.type === "transfer" &&
        !!t.transferRelatedEntityId &&
        liabilityIds.has(t.transferRelatedEntityId) &&
        t.date >= monthStart &&
        t.date <= monthEnd,
    );
  }, [liabilities, monthEnd, monthStart, transactions]);

  const paidByLiabilityId = useMemo(() => {
    const map: Record<string, number> = {};
    for (const t of transfersToLiabilities) {
      const id = t.transferRelatedEntityId as string;
      map[id] = (map[id] ?? 0) + t.amount;
    }
    return map;
  }, [transfersToLiabilities]);

  const rows = useMemo<LiabilityRow[]>(() => {
    return liabilities
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((l) => {
        const amountPaid = paidByLiabilityId[l.id] ?? 0;
        const isPaid = amountPaid > 0;
        const dueDay =
          typeof l.paymentDate === "number"
            ? l.paymentDate
            : typeof l.cutoffDate === "number"
              ? l.cutoffDate
              : null;
        const minimum = l.minimumPayment ?? null;
        const meetsMinimum = minimum === null ? null : amountPaid >= minimum;
        return {
          id: l.id,
          name: l.name,
          entityAmount: l.amount,
          dueDay,
          minimumPayment: minimum,
          amountPaid,
          isPaid,
          meetsMinimum,
        };
      });
  }, [liabilities, paidByLiabilityId]);

  const summary = useMemo(() => {
    const paidCount = rows.filter((r) => {
      const noPaymentRequired = r.entityAmount === 0 || r.minimumPayment === 0;
      if (noPaymentRequired) return true;
      const manual = manualOverrides[r.id]?.[monthKey];
      if (manual !== undefined) return manual;
      return r.meetsMinimum === null ? r.isPaid : r.meetsMinimum;
    }).length;
    const total = rows.length;
    const totalPaid = rows.reduce((sum, r) => sum + r.amountPaid, 0);
    return { paidCount, total, totalPaid };
  }, [manualOverrides, monthKey, rows]);

  const displayRows = useMemo<LiabilityPaymentDisplayRow[]>(() => {
    return rows.map((item) => {
      const noPaymentRequired =
        item.entityAmount === 0 || item.minimumPayment === 0;
      const manual = manualOverrides[item.id]?.[monthKey];

      const showPaid = noPaymentRequired
        ? true
        : manual !== undefined
          ? manual
          : item.meetsMinimum === null
            ? item.isPaid
            : item.meetsMinimum;

      const statusIcon = showPaid
        ? "checkmark.circle.fill"
        : "xmark.circle.fill";
      const statusColor = showPaid ? colors.success : colors.error;

      const statusText = noPaymentRequired
        ? "Sin pago requerido"
        : manual !== undefined
          ? manual
            ? "Pagado (manual)"
            : "No pagado (manual)"
          : item.meetsMinimum === null
            ? item.isPaid
              ? "Pagado"
              : "No pagado"
            : item.meetsMinimum
              ? "Pagado"
              : item.isPaid
                ? "Pago parcial"
                : "No pagado";

      const dueDateLabel =
        item.dueDay !== null
          ? getDueDateLabel(
              monthCursor.year,
              monthCursor.monthIndex,
              item.dueDay,
            )
          : null;

      return {
        id: item.id,
        name: item.name,
        amountPaid: item.amountPaid,
        minimumPayment: item.minimumPayment,
        dueDateLabel,
        noPaymentRequired,
        showPaid,
        statusIcon,
        statusColor,
        statusText,
      };
    });
  }, [
    colors.error,
    colors.success,
    manualOverrides,
    monthCursor.monthIndex,
    monthCursor.year,
    monthKey,
    rows,
  ]);

  const toggleManual = useCallback(
    (liabilityId: string) => {
      setManualOverrides((prev) => {
        const current = prev[liabilityId]?.[monthKey];
        const nextValue =
          current === undefined ? true : current === true ? false : undefined;

        const next = { ...prev };
        const perLiability = { ...(next[liabilityId] || {}) };

        if (nextValue === undefined) {
          delete perLiability[monthKey];
        } else {
          perLiability[monthKey] = nextValue;
        }

        if (Object.keys(perLiability).length === 0) {
          delete next[liabilityId];
        } else {
          next[liabilityId] = perLiability;
        }

        persistOverrides(next);
        return next;
      });
    },
    [monthKey, persistOverrides, setManualOverrides],
  );

  const goPrevMonth = useCallback(() => {
    setMonthCursor((c) => {
      const date = new Date(c.year, c.monthIndex, 1);
      date.setMonth(date.getMonth() - 1);
      return { year: date.getFullYear(), monthIndex: date.getMonth() };
    });
  }, []);

  const goNextMonth = useCallback(() => {
    setMonthCursor((c) => {
      const date = new Date(c.year, c.monthIndex, 1);
      date.setMonth(date.getMonth() + 1);
      return { year: date.getFullYear(), monthIndex: date.getMonth() };
    });
  }, []);

  const onRowPress = useCallback(
    (id: string) => {
      router.push({
        pathname: "/balance/liability-payments",
        params: { id },
      });
    },
    [router],
  );

  const onTogglePress = useCallback(
    (row: LiabilityPaymentDisplayRow) => {
      if (row.noPaymentRequired) return;
      const manual = manualOverrides[row.id]?.[monthKey];
      const action =
        manual === undefined
          ? "marcarlo como pagado"
          : manual === true
            ? "marcarlo como no pagado"
            : "quitar la marca manual (usar transferencias)";
      Alert.alert(
        "Confirmar cambio",
        `¿Seguro que quieres ${action} para ${row.name} (${monthLabel})?`,
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Confirmar",
            style: "default",
            onPress: () => toggleManual(row.id),
          },
        ],
      );
    },
    [manualOverrides, monthKey, monthLabel, toggleManual],
  );

  return {
    colors,
    monthLabel,
    displayRows,
    summary,
    goPrevMonth,
    goNextMonth,
    onRowPress,
    onTogglePress,
  };
};
