import { Card } from "@/components/atoms/Card";
import { Typography } from "@/components/atoms/Typography";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { BorderRadius, Spacing } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";
import { VisionEntity } from "@/features/vision/data/visionSlice";
import { Transaction } from "@/features/wallet/data/walletSlice";
import { RootState } from "@/store/store";
import { formatCurrency } from "@/utils/format";
import { useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
import { FlatList, TouchableOpacity, View } from "react-native";
import { useSelector } from "react-redux";

type MonthPayment = {
  monthIndex: number;
  monthLabel: string;
  amountPaid: number;
  isPaid: boolean;
  meetsMinimum: boolean | null;
};

const getMonthLabel = (year: number, monthIndex: number) => {
  const date = new Date(year, monthIndex, 1);
  const label = date.toLocaleDateString("es-ES", { month: "long" });
  return `${label.charAt(0).toUpperCase()}${label.slice(1)}`;
};

const getMonthStart = (year: number, monthIndex: number) =>
  new Date(year, monthIndex, 1, 0, 0, 0, 0).getTime();

const getMonthEnd = (year: number, monthIndex: number) =>
  new Date(year, monthIndex + 1, 0, 23, 59, 59, 999).getTime();

export default function LiabilityPaymentsScreen() {
  const { colors } = useTheme();
  const params = useLocalSearchParams();
  const id = params.id as string | undefined;

  const entities = useSelector((state: RootState) => state.vision.entities);
  const transactions = useSelector(
    (state: RootState) => state.wallet.transactions,
  );

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

  const yearTotalPaid = useMemo(() => {
    return months.reduce((sum, m) => sum + m.amountPaid, 0);
  }, [months]);

  const currentMonthIndex = new Date().getMonth();
  const thisMonth = useMemo(() => {
    return months.find((m) => m.monthIndex === currentMonthIndex) ?? null;
  }, [months, currentMonthIndex]);

  if (!entity) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          padding: Spacing.m,
        }}
      >
        <Typography variant="body" style={{ color: colors.text }}>
          No se encontró el pasivo.
        </Typography>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ padding: Spacing.m }}>
        <Typography variant="h2" weight="bold" style={{ color: colors.text }}>
          {entity.name}
        </Typography>
        <View style={{ marginTop: Spacing.s }}>
          <Typography variant="caption" style={{ color: colors.textSecondary }}>
            Pagos recibidos (transferencias hacia este pasivo)
          </Typography>
          <Typography
            variant="body"
            weight="bold"
            style={{ color: colors.text }}
          >
            {formatCurrency(yearTotalPaid)} en {year}
          </Typography>
          {thisMonth && (
            <Typography
              variant="caption"
              style={{ color: colors.textSecondary }}
            >
              {thisMonth.monthLabel}: {formatCurrency(thisMonth.amountPaid)}{" "}
              {thisMonth.isPaid ? "✓" : ""}
            </Typography>
          )}
        </View>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: Spacing.m,
            backgroundColor: colors.background,
          }}
        >
          <TouchableOpacity
            onPress={() => setYear((y) => y - 1)}
            style={{
              paddingVertical: Spacing.s,
              paddingHorizontal: Spacing.m,
              borderRadius: BorderRadius.m,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.surface,
              flexDirection: "row",
              alignItems: "center",
              gap: Spacing.xs,
            }}
          >
            <IconSymbol name="chevron.left" size={14} color={colors.text} />
            <Typography variant="caption" style={{ color: colors.text }}>
              {year - 1}
            </Typography>
          </TouchableOpacity>

          <Typography variant="h3" weight="bold" style={{ color: colors.text }}>
            {year}
          </Typography>

          <TouchableOpacity
            onPress={() => setYear((y) => y + 1)}
            style={{
              paddingVertical: Spacing.s,
              paddingHorizontal: Spacing.m,
              borderRadius: BorderRadius.m,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.surface,
              flexDirection: "row",
              alignItems: "center",
              gap: Spacing.xs,
            }}
          >
            <Typography variant="caption" style={{ color: colors.text }}>
              {year + 1}
            </Typography>
            <IconSymbol name="chevron.right" size={14} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={months}
        keyExtractor={(m) => `${year}-${m.monthIndex}`}
        contentContainerStyle={{
          paddingHorizontal: Spacing.m,
          paddingBottom: 40,
          backgroundColor: colors.background,
        }}
        renderItem={({ item }) => {
          const showCheck =
            item.meetsMinimum === null ? item.isPaid : item.meetsMinimum;
          const statusLabel =
            item.meetsMinimum === null
              ? item.isPaid
                ? "Pagado"
                : "Sin pago"
              : item.meetsMinimum
                ? "Pagado"
                : item.isPaid
                  ? "Pago parcial"
                  : "Sin pago";

          return (
            <Card style={{ marginBottom: Spacing.s }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <View style={{ flex: 1 }}>
                  <Typography
                    variant="body"
                    weight="bold"
                    style={{ color: colors.text }}
                  >
                    {item.monthLabel}
                  </Typography>
                  <Typography
                    variant="caption"
                    style={{ color: colors.textSecondary }}
                  >
                    {statusLabel}
                  </Typography>
                </View>

                <View style={{ alignItems: "flex-end", marginLeft: Spacing.m }}>
                  <Typography
                    variant="body"
                    weight="bold"
                    style={{ color: colors.text }}
                  >
                    {formatCurrency(item.amountPaid)}
                  </Typography>
                  {showCheck && (
                    <IconSymbol
                      name="checkmark.circle.fill"
                      size={18}
                      color={colors.success}
                    />
                  )}
                </View>
              </View>

              {entity.minimumPayment ? (
                <View style={{ marginTop: Spacing.s }}>
                  <Typography
                    variant="caption"
                    style={{ color: colors.textSecondary }}
                  >
                    Mínimo: {formatCurrency(entity.minimumPayment)}
                  </Typography>
                </View>
              ) : null}
            </Card>
          );
        }}
      />
    </View>
  );
}
