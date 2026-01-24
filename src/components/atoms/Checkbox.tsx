import { Colors, Spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { IconSymbol } from "../ui/icon-symbol";
import { Typography } from "./Typography";

interface CheckboxProps {
  label?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string;
}

export function Checkbox({ label, checked, onChange, error }: CheckboxProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  return (
    <View style={styles.container}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => onChange(!checked)}
        style={{ flexDirection: "row", alignItems: "center" }}
      >
        <View
          style={[
            styles.box,
            {
              borderColor: error
                ? colors.error
                : checked
                  ? colors.primary
                  : colors.icon,
              backgroundColor: checked ? colors.primary : "transparent",
            },
          ]}
        >
          {checked && <IconSymbol name="checkmark" size={14} color="#FFF" />}
        </View>
        {label && (
          <Typography
            variant="body"
            style={{ marginLeft: Spacing.s, color: colors.text }}
          >
            {label}
          </Typography>
        )}
      </TouchableOpacity>
      {error && (
        <Typography
          variant="caption"
          style={{ color: colors.error, marginTop: Spacing.xs, marginLeft: 28 }}
        >
          {error}
        </Typography>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // marginBottom: Spacing.m, // Removed default margin to allow better layout control
  },
  box: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
});
