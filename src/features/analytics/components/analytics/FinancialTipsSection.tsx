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
 *
 * Ajuste 2026-09-03 (pedido explícito del usuario, misma píldora que
 * `TransactionItem`/`VisionEntityList`): cada consejo pasa a fila-píldora
 * (`BorderRadius.round`) con el bombillo en un disco de icono en
 * `surfaceHighlight`, en vez del icono suelto de tamaño 24. Sin amount a la
 * derecha — es un consejo, no una transacción —, así que el bloque de copy
 * ocupa el espacio que dejaba el icono suelto. Fallback plano en
 * `colors.background`, igual convención que las filas del libro contable.
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
            style={styles.tipRow}
            fallbackStyle={[
              styles.flatRow,
              {
                backgroundColor: colors.background,
                borderBottomColor: colors.border,
              },
            ]}
          >
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: colors.surfaceHighlight },
              ]}
            >
              <IconSymbol
                name="lightbulb.fill"
                size={20}
                color={colors.primary}
              />
            </View>
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
  /** La separación entre filas la da el `gap`, no un `marginBottom` por fila. */
  list: {
    gap: Spacing.s,
  },
  /** Layout de la fila, común a la variante con cristal y a la plana. */
  tipRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.s,
    borderRadius: BorderRadius.round,
    overflow: "hidden",
  },
  /**
   * Fondo de la fila **sin** cristal: opaco y del color del lienzo, igual
   * convención que `TransactionItem`/`VisionEntityList`.
   */
  flatRow: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.round,
    justifyContent: "center",
    alignItems: "center",
  },
  tipText: {
    flex: 1,
  },
});
