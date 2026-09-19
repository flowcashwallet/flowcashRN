import { GlassSurface } from "@/components/atoms/GlassSurface";
import { Typography } from "@/components/atoms/Typography";
import { IconSymbol, type IconSymbolName } from "@/components/ui/icon-symbol";
import { BorderRadius, Spacing } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

interface SettingsRowProps {
  icon: IconSymbolName;
  label: string;
  subtitle?: string;
  onPress: () => void;
}

/**
 * Fila tocable de una pantalla de lista simple (Ajustes, Conexiones) —
 * ícono + texto + chevron, mismo patrón fila-con-ícono-y-chevron que
 * `VisionEntityList.tsx`. Es una superficie propia y ES el touch target
 * completo (el `TouchableOpacity` envuelve el `GlassSurface`, que solo
 * marca `isInteractive` para su propio feedback visual — `GlassSurface` no
 * acepta `onPress` directamente, regla ya usada en el resto de la app).
 */
export function SettingsRow({ icon, label, subtitle, onPress }: SettingsRowProps) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <GlassSurface
        style={styles.row}
        isInteractive
        fallbackStyle={[styles.flatRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
      >
        <View style={[styles.iconDisc, { backgroundColor: colors.surfaceHighlight }]}>
          <IconSymbol name={icon} size={20} color={colors.text} />
        </View>
        <View style={styles.copy}>
          <Typography variant="body">{label}</Typography>
          {subtitle ? (
            <Typography variant="caption" muted>
              {subtitle}
            </Typography>
          ) : null}
        </View>
        <IconSymbol name="chevron.right" size={18} color={colors.icon} />
      </GlassSurface>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.m,
    padding: Spacing.m,
    borderRadius: BorderRadius.l,
    marginBottom: Spacing.s,
  },
  flatRow: {
    borderWidth: StyleSheet.hairlineWidth,
  },
  iconDisc: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.round,
    alignItems: "center",
    justifyContent: "center",
  },
  copy: {
    flex: 1,
    gap: 2,
  },
});
