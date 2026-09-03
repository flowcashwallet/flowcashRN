import { GlassSurface } from "@/components/atoms/GlassSurface";
import { Typography } from "@/components/atoms/Typography";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { BorderRadius, Spacing } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";
import STRINGS from "@/i18n/es.json";
import { formatCurrency } from "@/utils/format";
import React, { useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
} from "react-native-reanimated";

interface VisionHeaderProps {
  netWorth: number;
  totalAssets: number;
  totalLiabilities: number;
}

/**
 * Card de patrimonio de Vision.
 *
 * Es una superficie propia sobre el canvas, así que en iOS 26+ lleva Liquid
 * Glass nativo vía `GlassSurface` (regla por defecto desde el 2026-09-02, ver
 * `docs/refactor-plan.md`); sin cristal cae a `surface` + hairline, igual que
 * las cards de Dashboard. Antes pintaba `colors.glass.cardBg` —el vidrio falso
 * deprecado— más una sombra con `#000` a mano.
 *
 * Los importes van en `variant="number"` para que la columna cuadre, y el signo
 * se codifica con `success`/`expense`: los pasivos son dinero que sale del
 * patrimonio, nunca `error`.
 */
export const VisionHeader: React.FC<VisionHeaderProps> = ({
  netWorth,
  totalAssets,
  totalLiabilities,
}) => {
  const [isExpanded, setIsExpanded] = useState(false); // Default collapsed
  const { colors } = useTheme();

  const netWorthColor = netWorth >= 0 ? colors.success : colors.expense;

  return (
    <GlassSurface
      style={styles.card}
      fallbackStyle={[
        styles.flatCard,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <TouchableOpacity
        onPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityState={{ expanded: isExpanded }}
        style={[styles.titleRow, isExpanded && styles.titleRowExpanded]}
      >
        <Typography variant="subheading">{STRINGS.vision.netWorth}</Typography>
        <IconSymbol
          name={isExpanded ? "chevron.up" : "chevron.down"}
          size={16}
          color={colors.icon}
        />
      </TouchableOpacity>

      {isExpanded ? (
        <Animated.View
          entering={FadeIn.duration(300)}
          exiting={FadeOut.duration(200)}
          layout={LinearTransition}
        >
          <View style={styles.row}>
            <Typography variant="body" muted>
              {STRINGS.vision.assets}
            </Typography>
            <View style={styles.amountGroup}>
              <Typography variant="number" style={{ color: colors.success }}>
                {formatCurrency(totalAssets)}
              </Typography>
              <View style={[styles.dot, { backgroundColor: colors.success }]} />
            </View>
          </View>

          <View style={styles.row}>
            <Typography variant="body" muted>
              {STRINGS.vision.liabilities}
            </Typography>
            <View style={styles.amountGroup}>
              <Typography variant="number" style={{ color: colors.expense }}>
                −{formatCurrency(totalLiabilities)}
              </Typography>
              <View style={[styles.dot, { backgroundColor: colors.expense }]} />
            </View>
          </View>

          <View
            style={[styles.divider, { backgroundColor: colors.border }]}
            pointerEvents="none"
          />

          <View style={[styles.row, styles.rowFlush]}>
            <Typography variant="body">
              {STRINGS.wallet.balanceTotal}
            </Typography>
            <View style={styles.amountGroup}>
              <Typography variant="number" style={{ color: netWorthColor }}>
                {formatCurrency(netWorth)}
              </Typography>
              <View style={[styles.dot, { backgroundColor: netWorthColor }]} />
            </View>
          </View>
        </Animated.View>
      ) : (
        <Animated.View
          entering={FadeIn.duration(300)}
          exiting={FadeOut.duration(200)}
          layout={LinearTransition}
          style={styles.collapsed}
        >
          {/*
            Colapsado, el patrimonio es la cifra protagonista de la pantalla:
            va en `display` con su etiqueta en `overline`, no comprimida en una
            fila de label + importe.
          */}
          <Typography variant="overline" muted>
            {STRINGS.wallet.balanceTotal}
          </Typography>
          <Typography variant="display" style={{ color: netWorthColor }}>
            {formatCurrency(netWorth)}
          </Typography>
        </Animated.View>
      )}
    </GlassSurface>
  );
};

const styles = StyleSheet.create({
  /** Layout de la card, común a la variante con cristal y a la plana. */
  card: {
    padding: Spacing.m,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.l,
    overflow: "hidden",
  },
  /** Fondo opaco + hairline: solo cuando no hay cristal. */
  flatCard: {
    borderWidth: StyleSheet.hairlineWidth,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  titleRowExpanded: {
    marginBottom: Spacing.m,
  },
  collapsed: {
    marginTop: Spacing.xs,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.s,
  },
  /** Última fila del bloque: sin el paso de separación que trae `row`. */
  rowFlush: {
    marginBottom: 0,
  },
  amountGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.s,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: Spacing.s,
  },
  dot: {
    width: Spacing.s,
    height: Spacing.s,
    borderRadius: BorderRadius.round,
  },
});
