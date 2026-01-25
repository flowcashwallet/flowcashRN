import { Button } from "@/components/atoms/Button";
import { Typography } from "@/components/atoms/Typography";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { BorderRadius, Colors, Spacing } from "@/constants/theme";
import { consumeStreakFreeze } from "@/features/wallet/data/gamificationSlice";
import { Transaction } from "@/features/wallet/data/walletSlice";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { AppDispatch, RootState } from "@/store/store";
import React, { useMemo } from "react";
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  View
} from "react-native";
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
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

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
    if (!user?.uid) return;

    if (streakFreezes <= 0) {
      Alert.alert(
        "Sin congelaciones",
        "No te quedan oportunidades para restaurar la racha.",
      );
      return;
    }

    Alert.alert(
      "Restaurar Racha",
      `¿Usar una congelación para recuperar el día ${dateStr}? Te quedan ${streakFreezes}.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Restaurar",
          onPress: async () => {
            try {
              await dispatch(
                consumeStreakFreeze({ userId: user.uid, date: dateStr }),
              ).unwrap();
            } catch (error) {
              Alert.alert("Error", "No se pudo restaurar la racha.");
            }
          },
        },
      ],
    );
  };

  const statusColor = streakFreezes > 0 ? "#FF9500" : "#8E8E93";

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[styles.content, { backgroundColor: colors.surface }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.header}>
            <Typography
              variant="h3"
              weight="bold"
              style={{ color: colors.text }}
            >
              Tu Racha
            </Typography>
            <Pressable onPress={onClose}>
              <IconSymbol name="xmark" size={24} color={colors.textSecondary} />
            </Pressable>
          </View>

          <View
            style={[
              styles.statsContainer,
              { backgroundColor: statusColor + "20" },
            ]}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <IconSymbol name="flame.fill" size={32} color={statusColor} />
              <View style={{ marginLeft: Spacing.m }}>
                <Typography
                  variant="caption"
                  style={{ color: colors.textSecondary }}
                >
                  Congelaciones disponibles
                </Typography>
                <Typography
                  variant="h2"
                  weight="bold"
                  style={{ color: colors.text }}
                >
                  {streakFreezes}
                </Typography>
              </View>
            </View>
          </View>

          <Typography
            variant="body"
            weight="bold"
            style={{ marginBottom: Spacing.m, color: colors.text }}
          >
            Últimos 30 días
          </Typography>

          <View style={styles.calendarGrid}>
            {calendarDays.map((day) => (
              <Pressable
                key={day.date}
                onPress={() =>
                  !day.isActive && !day.isToday ? handleRepair(day.date) : null
                }
                style={[
                  styles.dayCell,
                  {
                    backgroundColor: day.isActive
                      ? day.isRepaired
                        ? "#5AC8FA20" // Light blue for repaired
                        : "#34C75920" // Light green for active
                      : colors.surfaceHighlight,
                    borderColor: day.isToday ? colors.primary : "transparent",
                    borderWidth: day.isToday ? 2 : 0,
                  },
                ]}
              >
                <Typography
                  variant="caption"
                  style={{
                    color: day.isActive
                      ? day.isRepaired
                        ? "#5AC8FA"
                        : "#34C759"
                      : colors.textSecondary,
                  }}
                >
                  {day.dayOfMonth}
                </Typography>
                {day.isActive ? (
                  <IconSymbol
                    name={day.isRepaired ? "snowflake" : "flame.fill"}
                    size={16}
                    color={day.isRepaired ? "#5AC8FA" : "#34C759"}
                  />
                ) : (
                  !day.isToday && (
                    <IconSymbol
                      name="lock.open" // Or something indicating clickable to repair
                      size={12}
                      color={colors.textSecondary + "40"}
                    />
                  )
                )}
              </Pressable>
            ))}
          </View>

          <Button
            title="Cerrar"
            onPress={onClose}
            style={{ marginTop: Spacing.xl }}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  content: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.l,
    paddingBottom: 40,
    maxHeight: "80%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.l,
  },
  statsContainer: {
    flexDirection: "row",
    marginBottom: Spacing.l,
    padding: Spacing.m,
    borderRadius: BorderRadius.m,
    backgroundColor: "rgba(255, 149, 0, 0.1)", // Light orange bg
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
  },
  dayCell: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
});
