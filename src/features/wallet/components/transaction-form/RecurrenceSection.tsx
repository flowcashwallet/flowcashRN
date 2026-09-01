import { Typography } from "@/components/atoms/Typography";
import { BorderRadius, Spacing, ThemeColors } from "@/constants/theme";
import * as Haptics from "expo-haptics";
import React from "react";
import { StyleSheet, Switch, TouchableOpacity, View } from "react-native";

export type RecurrenceFrequency = "weekly" | "monthly" | "yearly";

interface RecurrenceSectionProps {
  isRecurring: boolean;
  onChangeIsRecurring: (value: boolean) => void;
  recurrenceFrequency: RecurrenceFrequency;
  onChangeRecurrenceFrequency: (frequency: RecurrenceFrequency) => void;
  recurrenceMonths: number | null;
  onChangeRecurrenceMonths: (months: number | null) => void;
  colors: ThemeColors;
}

const FREQUENCY_OPTIONS = ["weekly", "monthly", "yearly"] as const;

const FREQUENCY_LABELS: Record<RecurrenceFrequency, string> = {
  weekly: "Semanal",
  monthly: "Mensual",
  yearly: "Anual",
};

const MIN_MONTHS = 1;
const MAX_MONTHS = 36;

export function RecurrenceSection({
  isRecurring,
  onChangeIsRecurring,
  recurrenceFrequency,
  onChangeRecurrenceFrequency,
  recurrenceMonths,
  onChangeRecurrenceMonths,
  colors,
}: RecurrenceSectionProps) {
  const trackColor = { false: colors.border, true: colors.primary };

  return (
    <>
      <View style={[styles.toggleRow, { backgroundColor: colors.surface }]}>
        <View style={styles.toggleCopy}>
          <Typography variant="subheading">¿Es recurrente?</Typography>
          <Typography variant="caption" muted>
            Se repetirá automáticamente
          </Typography>
        </View>
        <Switch
          value={isRecurring}
          onValueChange={onChangeIsRecurring}
          trackColor={trackColor}
          thumbColor={colors.onPrimary}
        />
      </View>

      {isRecurring && (
        <View style={styles.recurrenceContainer}>
          <View style={styles.frequencyRow}>
            {FREQUENCY_OPTIONS.map((freq) => {
              const selected = recurrenceFrequency === freq;
              return (
                <TouchableOpacity
                  key={freq}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => onChangeRecurrenceFrequency(freq)}
                  style={[
                    styles.frequencyOption,
                    {
                      backgroundColor: selected
                        ? colors.primary
                        : colors.surface,
                      borderColor: selected ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Typography
                    variant="button"
                    muted={!selected}
                    // `onPrimary` respeta el aviso de contraste sobre `primary`.
                    style={selected ? { color: colors.onPrimary } : undefined}
                  >
                    {FREQUENCY_LABELS[freq]}
                  </Typography>
                </TouchableOpacity>
              );
            })}
          </View>

          <View
            style={[styles.durationCard, { backgroundColor: colors.surface }]}
          >
            <View style={styles.durationHeaderRow}>
              <View style={styles.durationTitle}>
                <Typography variant="subheading">Duración</Typography>
                <Typography variant="caption" muted>
                  De {MIN_MONTHS} a {MAX_MONTHS} meses o indefinido
                </Typography>
              </View>
              <View style={styles.indefiniteToggle}>
                <Typography variant="caption" muted>
                  Indefinido
                </Typography>
                <Switch
                  value={recurrenceMonths === null}
                  onValueChange={(value) => {
                    if (value) {
                      onChangeRecurrenceMonths(null);
                      return;
                    }
                    onChangeRecurrenceMonths(12);
                  }}
                  trackColor={trackColor}
                  thumbColor={colors.onPrimary}
                />
              </View>
            </View>

            {recurrenceMonths !== null && (
              <View style={styles.stepperRow}>
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Quitar un mes"
                  onPress={() => {
                    Haptics.selectionAsync();
                    onChangeRecurrenceMonths(
                      Math.max(MIN_MONTHS, recurrenceMonths - 1),
                    );
                  }}
                  disabled={recurrenceMonths <= MIN_MONTHS}
                  style={
                    recurrenceMonths <= MIN_MONTHS ? styles.disabled : undefined
                  }
                >
                  <View
                    style={[
                      styles.stepperButton,
                      {
                        backgroundColor: colors.surfaceHighlight,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Typography variant="subheading">−</Typography>
                  </View>
                </TouchableOpacity>

                <View style={styles.stepperValue}>
                  <Typography variant="heading">{recurrenceMonths}</Typography>
                  <Typography variant="caption" muted>
                    {recurrenceMonths === 1 ? "mes" : "meses"}
                  </Typography>
                </View>

                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Añadir un mes"
                  onPress={() => {
                    Haptics.selectionAsync();
                    onChangeRecurrenceMonths(
                      Math.min(MAX_MONTHS, recurrenceMonths + 1),
                    );
                  }}
                  disabled={recurrenceMonths >= MAX_MONTHS}
                  style={
                    recurrenceMonths >= MAX_MONTHS ? styles.disabled : undefined
                  }
                >
                  <View
                    style={[
                      styles.stepperButton,
                      {
                        backgroundColor: colors.surfaceHighlight,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Typography variant="subheading">+</Typography>
                  </View>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.m,
    marginBottom: Spacing.m,
    padding: Spacing.m,
    borderRadius: BorderRadius.l,
  },
  toggleCopy: {
    flex: 1,
  },
  recurrenceContainer: {
    marginBottom: Spacing.l,
  },
  frequencyRow: {
    flexDirection: "row",
    gap: Spacing.s,
    marginBottom: Spacing.m,
  },
  frequencyOption: {
    flex: 1,
    paddingVertical: Spacing.s,
    paddingHorizontal: Spacing.xs,
    borderRadius: BorderRadius.m,
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
  durationCard: {
    padding: Spacing.m,
    borderRadius: BorderRadius.l,
  },
  durationHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.s,
  },
  durationTitle: {
    flex: 1,
  },
  indefiniteToggle: {
    alignItems: "flex-end",
    gap: Spacing.xs,
  },
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: Spacing.m,
  },
  stepperButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.round,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
  stepperValue: {
    alignItems: "center",
  },
  disabled: {
    opacity: 0.5,
  },
});
