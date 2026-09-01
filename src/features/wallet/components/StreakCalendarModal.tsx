import { Button } from "@/components/atoms/Button";
import { Typography } from "@/components/atoms/Typography";
import { BottomSheet } from "@/components/molecules/BottomSheet";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { BorderRadius, Spacing } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";
import { consumeStreakFreeze } from "@/features/wallet/data/gamificationSlice";
import { Transaction } from "@/features/wallet/data/walletSlice";
import STRINGS from "@/i18n/es.json";
import { AppDispatch, RootState } from "@/store/store";
import React, { useMemo } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useDispatch, useSelector } from "react-redux";

interface StreakCalendarModalProps {
  visible: boolean;
  onClose: () => void;
  transactions: Transaction[];
  repairedDays: string[];
}

export const StreakCalendarModal: React.FC<StreakCalendarModalProps> = ({
  visible,
  onClose,
  transactions,
  repairedDays,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { streakFreezes } = useSelector(
    (state: RootState) => state.gamification,
  );
  const { colors } = useTheme();

  const activeDates = useMemo(() => {
    const dates = new Set<string>();
    transactions.forEach((t) => {
      const date = new Date(t.date);
      dates.add(date.toISOString().split("T")[0]);
    });
    repairedDays.forEach((d) => dates.add(d));
    return dates;
  }, [transactions, repairedDays]);

  const calendarDays = useMemo(() => {
    const days = [];
    const today = new Date();
    // Show last 30 days
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      days.push({
        date: dateStr,
        dayOfMonth: date.getDate(),
        isActive: activeDates.has(dateStr),
        isRepaired: repairedDays.includes(dateStr),
        isToday: i === 0,
      });
    }
    return days.reverse(); // Show chronological order
  }, [activeDates, repairedDays]);

  const handleRepair = async (dateStr: string) => {
    if (!user?.id) return;

    if (streakFreezes <= 0) {
      Alert.alert(
        STRINGS.streak.noFreezesTitle,
        STRINGS.streak.noFreezesMessage,
      );
      return;
    }

    Alert.alert(
      STRINGS.streak.restoreTitle,
      STRINGS.streak.restoreMessage
        .replace("{date}", dateStr)
        .replace("{count}", streakFreezes.toString()),
      [
        { text: STRINGS.common.cancel, style: "cancel" },
        {
          text: STRINGS.streak.restoreConfirmButton,
          onPress: async () => {
            try {
              await dispatch(
                consumeStreakFreeze({ date: dateStr }),
              ).unwrap();
            } catch {
              Alert.alert(STRINGS.common.error, STRINGS.streak.restoreError);
            }
          },
        },
      ],
    );
  };

  /**
   * El fuego de la racha es el único acento de este sheet: `warning` cuando
   * quedan restauraciones (recurso limitado), apagado a `textSecondary` cuando
   * no quedan. No se usa `error`: quedarse sin restauraciones no es un fallo.
   */
  const statusColor = streakFreezes > 0 ? colors.warning : colors.textSecondary;

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  const dayBeforeYesterday = new Date(today);
  dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 2);
  const dayBeforeYesterdayStr = dayBeforeYesterday.toISOString().split("T")[0];

  // Logic to calculate streak ending at dayBeforeYesterday
  let previousStreak = 0;
  if (
    !activeDates.has(yesterdayStr) &&
    activeDates.has(dayBeforeYesterdayStr)
  ) {
    let current = new Date(dayBeforeYesterday);
    while (true) {
      const dateStr = current.toISOString().split("T")[0];
      if (activeDates.has(dateStr)) {
        previousStreak++;
        current.setDate(current.getDate() - 1);
      } else {
        break;
      }
    }
  }

  const canRestore =
    !activeDates.has(yesterdayStr) &&
    activeDates.has(dayBeforeYesterdayStr) &&
    previousStreak > 3;

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={STRINGS.streak.yourStreak}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <View
          style={[
            styles.statsContainer,
            { backgroundColor: colors.surfaceHighlight },
          ]}
        >
          <IconSymbol name="flame.fill" size={32} color={statusColor} />
          <View>
            <Typography variant="caption" muted>
              {STRINGS.streak.availableRestores}
            </Typography>
            <Typography variant="heading">{streakFreezes}</Typography>
          </View>
        </View>

        <Typography variant="overline" muted style={styles.sectionLabel}>
          {STRINGS.streak.last30Days}
        </Typography>

        <View style={styles.calendarGrid}>
          {calendarDays.map((day) => {
            // El estado del día se codifica en el color del dígito y del icono,
            // no en un relleno translúcido: la superficie es plana y única.
            const dayColor = day.isActive
              ? day.isRepaired
                ? colors.secondary
                : colors.success
              : colors.textSecondary;

            return (
              <Pressable
                key={day.date}
                accessibilityRole="button"
                accessibilityLabel={`Día ${day.dayOfMonth}`}
                onPress={() =>
                  !day.isActive && !day.isToday ? handleRepair(day.date) : null
                }
                style={[
                  styles.dayCell,
                  {
                    backgroundColor: colors.surfaceHighlight,
                    borderColor: day.isToday ? colors.primary : "transparent",
                  },
                ]}
              >
                <Typography variant="caption" style={{ color: dayColor }}>
                  {day.dayOfMonth}
                </Typography>
                {day.isActive ? (
                  <IconSymbol
                    name={day.isRepaired ? "snowflake" : "flame.fill"}
                    size={16}
                    color={dayColor}
                  />
                ) : (
                  !day.isToday && (
                    <IconSymbol name="lock.open" size={16} color={colors.border} />
                  )
                )}
              </Pressable>
            );
          })}
        </View>

        <View style={styles.footer}>
          {canRestore && (
            <Button
              title={STRINGS.streak.restoreAction}
              onPress={() => handleRepair(yesterdayStr)}
            />
          )}

          <Button
            title={STRINGS.common.close}
            onPress={onClose}
            variant={canRestore ? "outline" : "primary"}
          />
        </View>
      </ScrollView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  statsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.m,
    marginBottom: Spacing.l,
    padding: Spacing.m,
    borderRadius: BorderRadius.l,
  },
  sectionLabel: {
    marginBottom: Spacing.sm,
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.s,
    justifyContent: "center",
  },
  dayCell: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.round,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
  },
  footer: {
    marginTop: Spacing.xl,
    gap: Spacing.s,
  },
});
