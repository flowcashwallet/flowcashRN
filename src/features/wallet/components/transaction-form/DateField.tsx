import { Input } from "@/components/atoms/Input";
import { Typography } from "@/components/atoms/Typography";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { BorderRadius, Spacing, ThemeColors } from "@/constants/theme";
import React, { useState } from "react";
import { Platform, StyleSheet, TouchableOpacity, View } from "react-native";

const NativeDateTimePicker = ({
  value,
  themeVariant,
  onChange,
  maximumDate,
  backgroundColor,
}: {
  value: Date;
  themeVariant: "light" | "dark" | undefined;
  onChange: (selectedDate?: Date) => void;
  maximumDate?: Date;
  backgroundColor: string;
}) => {
  if (Platform.OS === "web") return null;
  const DateTimePicker =
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require("@react-native-community/datetimepicker").default;
  return (
    <DateTimePicker
      value={value}
      mode="date"
      display={Platform.OS === "ios" ? "inline" : "default"}
      themeVariant={themeVariant}
      onChange={(_: any, selectedDate?: Date) => onChange(selectedDate)}
      maximumDate={maximumDate}
      style={Platform.OS === "ios" ? { backgroundColor } : undefined}
    />
  );
};

interface DateFieldProps {
  date: Date;
  onChangeDate: (date: Date) => void;
  colors: ThemeColors;
  theme: "light" | "dark";
}

export function DateField({
  date,
  onChangeDate,
  colors,
  theme,
}: DateFieldProps) {
  const [showDatePicker, setShowDatePicker] = useState(false);

  const dateInputValue = `${date.getFullYear()}-${String(
    date.getMonth() + 1,
  ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

  return (
    <View style={styles.container}>
      <Typography variant="overline" muted style={styles.label}>
        Fecha
      </Typography>
      {Platform.OS === "web" ? (
        <Input
          label=""
          placeholder="YYYY-MM-DD"
          value={dateInputValue}
          onChangeText={(text) => {
            const trimmed = text.trim();
            const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
            if (!match) return;
            const y = Number(match[1]);
            const m = Number(match[2]);
            const d = Number(match[3]);
            if (m < 1 || m > 12) return;
            if (d < 1 || d > 31) return;
            const next = new Date(y, m - 1, d);
            if (Number.isNaN(next.getTime())) return;
            if (next > new Date()) return;
            onChangeDate(next);
          }}
        />
      ) : (
        <>
          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            style={[
              styles.dateButton,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <IconSymbol
              name="calendar"
              size={20}
              color={colors.icon}
              style={styles.dateIcon}
            />
            <Typography variant="body" style={styles.dateLabel}>
              {date.toLocaleDateString("es-ES", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </Typography>
          </TouchableOpacity>
          {showDatePicker ? (
            <NativeDateTimePicker
              value={date}
              themeVariant={theme}
              onChange={(selectedDate?: Date) => {
                const currentDate = selectedDate || date;
                setShowDatePicker(false);
                onChangeDate(currentDate);
              }}
              maximumDate={new Date()}
              backgroundColor={colors.surface}
            />
          ) : null}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.m,
    marginTop: Spacing.m,
  },
  label: {
    marginBottom: Spacing.xs,
  },
  dateButton: {
    padding: Spacing.m,
    borderRadius: BorderRadius.m,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
  },
  dateIcon: {
    marginRight: Spacing.s,
  },
  dateLabel: {
    textTransform: "capitalize",
  },
});
