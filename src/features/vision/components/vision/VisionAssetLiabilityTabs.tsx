import { GlassSurface } from "@/components/atoms/GlassSurface";
import { Typography } from "@/components/atoms/Typography";
import { BorderRadius, Spacing } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";
import STRINGS from "@/i18n/es.json";
import React from "react";
import { StyleSheet, TouchableOpacity } from "react-native";

interface VisionAssetLiabilityTabsProps {
  activeTab: "asset" | "liability";
  onChangeTab: (tab: "asset" | "liability") => void;
}

const TABS = [
  { value: "asset", label: STRINGS.vision.assets },
  { value: "liability", label: STRINGS.vision.liabilities },
] as const;

/**
 * Pestañas Activos / Pasivos.
 *
 * Control flotante con superficie propia → Liquid Glass nativo en iOS 26+ vía
 * `GlassSurface`, y `surfaceHighlight` + hairline sin cristal, exactamente el
 * mismo contrato que `SegmentedControl`. El segmento activo se queda opaco en
 * `primary` con su texto en `onPrimary`: es un control **dentro** de una
 * superficie de cristal y no se apila cristal sobre cristal.
 *
 * Antes el activo se pintaba `success` (activos) o `error` (pasivos). Eso es
 * categorización decorativa con tokens de estado, prohibido por la tabla de
 * paleta: `error` codifica un fallo real, no "esta pestaña está seleccionada".
 */
export const VisionAssetLiabilityTabs: React.FC<
  VisionAssetLiabilityTabsProps
> = ({ activeTab, onChangeTab }) => {
  const { colors } = useTheme();

  return (
    <GlassSurface
      style={styles.container}
      fallbackStyle={[
        styles.flatContainer,
        {
          backgroundColor: colors.surfaceHighlight,
          borderColor: colors.border,
        },
      ]}
    >
      {TABS.map((tab) => {
        const selected = activeTab === tab.value;
        return (
          <TouchableOpacity
            key={tab.value}
            style={[
              styles.tab,
              selected && { backgroundColor: colors.primary },
            ]}
            onPress={() => onChangeTab(tab.value)}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityState={{ selected }}
          >
            <Typography
              variant="overline"
              muted={!selected}
              style={selected ? { color: colors.onPrimary } : undefined}
            >
              {tab.label}
            </Typography>
          </TouchableOpacity>
        );
      })}
    </GlassSurface>
  );
};

const styles = StyleSheet.create({
  /** Layout del control, común a la variante con cristal y a la plana. */
  container: {
    flexDirection: "row",
    borderRadius: BorderRadius.round,
    padding: 2,
    marginBottom: Spacing.m,
    overflow: "hidden",
  },
  /** Relleno suave + hairline: solo cuando no hay cristal. */
  flatContainer: {
    borderWidth: StyleSheet.hairlineWidth,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.s,
    alignItems: "center",
    borderRadius: BorderRadius.round,
  },
});
