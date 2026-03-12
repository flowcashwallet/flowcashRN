import { Card } from "@/components/atoms/Card";
import { Typography } from "@/components/atoms/Typography";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";
import { VisionEntity } from "@/features/vision/data/visionSlice";
import { Transaction } from "@/features/wallet/data/walletSlice";
import { RootState } from "@/store/store";
import { formatCurrency } from "@/utils/format";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { FlatList, TouchableOpacity, View } from "react-native";
import { useSelector } from "react-redux";

const getMonthStart = (year: number, monthIndex: number) =>
  new Date(year, monthIndex, 1, 0, 0, 0, 0).getTime();

const getMonthEnd = (year: number, monthIndex: number) =>
  new Date(year, monthIndex + 1, 0, 23, 59, 59, 999).getTime();

const getMonthLabel = (year: number, monthIndex: number) => {
  const date = new Date(year, monthIndex, 1);
  const label = date.toLocaleDateString("es-ES", { month: "long" });
  return `${label.charAt(0).toUpperCase()}${label.slice(1)} ${year}`;
};

const getDueDateLabel = (year: number, monthIndex: number, dueDay: number) => {
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const safeDay = Math.max(1, Math.min(dueDay, daysInMonth));
  const date = new Date(year, monthIndex, safeDay);
  const formatted = date.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
  });
  return formatted.replace(".", "");
};

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

export default function LiabilityPaymentsManagementScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const entities = useSelector((state: RootState) => state.vision.entities);
  const transactions = useSelector(
    (state: RootState) => state.wallet.transactions,
  );

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
    const monthLabel = getMonthLabel(monthCursor.year, monthCursor.monthIndex);
    return { monthStart, monthEnd, monthLabel };
  }, [monthCursor.monthIndex, monthCursor.year]);

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
      return r.meetsMinimum === null ? r.isPaid : r.meetsMinimum;
    }).length;
    const total = rows.length;
    const totalPaid = rows.reduce((sum, r) => sum + r.amountPaid, 0);
    return { paidCount, total, totalPaid };
  }, [rows]);

  const goPrevMonth = () => {
    setMonthCursor((c) => {
      const date = new Date(c.year, c.monthIndex, 1);
      date.setMonth(date.getMonth() - 1);
      return { year: date.getFullYear(), monthIndex: date.getMonth() };
    });
  };

  const goNextMonth = () => {
    setMonthCursor((c) => {
      const date = new Date(c.year, c.monthIndex, 1);
      date.setMonth(date.getMonth() + 1);
      return { year: date.getFullYear(), monthIndex: date.getMonth() };
    });
  };

  const ListHeader = (
    <View style={{ padding: Spacing.m }}>
      <Typography variant="h2" weight="bold" style={{ color: colors.text }}>
        Gestión de pagos
      </Typography>
      <Typography variant="caption" style={{ color: colors.textSecondary }}>
        {monthLabel}
      </Typography>

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: Spacing.s,
          backgroundColor: colors.background,
        }}
      >
        <TouchableOpacity
          onPress={goPrevMonth}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: Spacing.xs,
          }}
        >
          <IconSymbol name="chevron.left" size={16} color={colors.primary} />
          <Typography variant="body" style={{ color: colors.primary }}>
            Mes anterior
          </Typography>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={goNextMonth}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: Spacing.xs,
          }}
        >
          <Typography variant="body" style={{ color: colors.primary }}>
            Mes siguiente
          </Typography>
          <IconSymbol name="chevron.right" size={16} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={{ marginTop: Spacing.m }}>
        <Typography variant="body" weight="bold" style={{ color: colors.text }}>
          {summary.paidCount}/{summary.total} pagados
        </Typography>
        <Typography variant="caption" style={{ color: colors.textSecondary }}>
          Total pagado: {formatCurrency(summary.totalPaid)}
        </Typography>
      </View>
    </View>
  );
  return (
    <View style={{ backgroundColor: colors.background }}>
      <View style={{ flex: 1 }}>
        <FlatList
          contentInsetAdjustmentBehavior="automatic"
          ListHeaderComponent={ListHeader}
          data={rows}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            paddingHorizontal: Spacing.m,
            paddingBottom: 90,
            backgroundColor: colors.background,
          }}
          renderItem={({ item }) => {
            const noPaymentRequired =
              item.entityAmount === 0 || item.minimumPayment === 0;
            const showPaid = noPaymentRequired
              ? true
              : item.meetsMinimum === null
                ? item.isPaid
                : item.meetsMinimum;
            const statusIcon = showPaid
              ? "checkmark.circle.fill"
              : "xmark.circle.fill";
            const statusColor = showPaid ? colors.success : colors.error;
            const statusText = noPaymentRequired
              ? "Sin pago requerido"
              : item.meetsMinimum === null
                ? item.isPaid
                  ? "Pagado"
                  : "No pagado"
                : item.meetsMinimum
                  ? "Pagado"
                  : item.isPaid
                    ? "Pago parcial"
                    : "No pagado";

            return (
              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: "/balance/liability-payments",
                    params: { id: item.id },
                  })
                }
                style={{ marginBottom: Spacing.s }}
              >
                <Card>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: Spacing.m,
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Typography
                        variant="body"
                        weight="bold"
                        style={{ color: colors.text }}
                      >
                        {item.name}
                      </Typography>
                      <Typography
                        variant="caption"
                        style={{ color: colors.textSecondary }}
                      >
                        {statusText}
                      </Typography>
                      <Typography
                        variant="caption"
                        style={{ color: colors.textSecondary }}
                      >
                        Pagado: {formatCurrency(item.amountPaid)}
                        {item.minimumPayment !== null
                          ? ` · Límite: ${formatCurrency(item.minimumPayment)}`
                          : ""}
                      </Typography>
                      {item.dueDay !== null && (
                        <Typography
                          variant="caption"
                          style={{ color: colors.textSecondary }}
                        >
                          Vence:{" "}
                          {getDueDateLabel(
                            monthCursor.year,
                            monthCursor.monthIndex,
                            item.dueDay,
                          )}
                        </Typography>
                      )}
                    </View>
                    <IconSymbol
                      name={statusIcon}
                      size={20}
                      color={statusColor}
                    />
                  </View>
                </Card>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={{ padding: Spacing.m }}>
              <Typography variant="body" style={{ color: colors.text }}>
                No hay pasivos.
              </Typography>
            </View>
          }
        />
      </View>
    </View>
  );
}
