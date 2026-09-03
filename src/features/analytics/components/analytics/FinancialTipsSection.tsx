import { GlassSurface } from "@/components/atoms/GlassSurface";
import { Typography } from "@/components/atoms/Typography";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { BorderRadius, Spacing, ThemeColors } from "@/constants/theme";
import React from "react";
import { StyleSheet, View } from "react-native";

interface FinancialTipsSectionProps {
  colors: ThemeColors;
  tips: string[];
}

/**
 * Cada consejo es una card hermana sobre el canvas, así que cada una es su
 * propia superficie de cristal en iOS 26+ (no hace falta `forceGlass`: no están
 * anidadas dentro de nada vidriado). Sin cristal caen a `surface` + hairline.
 *
 * Antes tenían `borderWidth: 1` **sin** `borderColor`, o sea el negro por
 * defecto de React Native sobre el fondo menta — el mismo bug que Dashboard
 * arrastraba en sus siete cards.
 */
export const FinancialTipsSection: React.FC<FinancialTipsSectionProps> = ({
  colors,
  tips,
}) => {
  return (
    <View style={styles.section}>
      <Typography variant="heading" style={styles.sectionTitle}>
        Consejos para ti
      </Typography>
      <View style={styles.list}>
        {tips.map((tip, index) => (
          <GlassSurface
            key={index}
            style={styles.tipCard}
            fallbackStyle={[
              styles.flatCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <IconSymbol
              name="lightbulb.fill"
              size={24}
              color={colors.primary}
            />
            <Typography variant="bodySmall" style={styles.tipText}>
              {tip}
            </Typography>
          </GlassSurface>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: Spacing.l,
  },
  sectionTitle: {
    marginBottom: Spacing.s,
  },
  /** La separación entre cards la da el `gap`, no un `marginBottom` por card. */
  list: {
    gap: Spacing.s,
  },
  /** Layout de la card, común a la variante con cristal y a la plana. */
  tipCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.m,
    padding: Spacing.m,
    borderRadius: BorderRadius.l,
    overflow: "hidden",
  },
  /** Fondo opaco + hairline: solo cuando no hay cristal. */
  flatCard: {
    borderWidth: StyleSheet.hairlineWidth,
  },
  tipText: {
    flex: 1,
  },
});
