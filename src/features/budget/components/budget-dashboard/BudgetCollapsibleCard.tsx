import { GlassSurface } from "@/components/atoms/GlassSurface";
import { Typography } from "@/components/atoms/Typography";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { BorderRadius, Spacing } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";
import React from "react";
import {
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
} from "react-native-reanimated";

interface BudgetCollapsibleCardProps {
  title: string;
  /** Solo lo pasan las cards que coloreaban el título explícitamente en el original (Resumen mensual, Detalles). */
  titleColor?: string;
  /** Ícono en disco a la izquierda del título — mismo lenguaje que `CategoryCard`/`TransactionItem`. */
  icon: React.ComponentProps<typeof IconSymbol>["name"];
  expanded: boolean;
  onToggle: () => void;
  chevronColor: string;
  /** Contenido opcional a la derecha del chevron cuando la card está colapsada (solo Distribución). */
  headerAccessory?: React.ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

/**
 * Chrome compartido de las tres cards colapsables de `BudgetDashboard`
 * (Distribución, Resumen mensual, Detalles): mismo header con título +
 * chevron, y el mismo `Animated.View` de entrada/salida para el contenido
 * expandido. Antes triplicado byte a byte en `BudgetDashboard.tsx`.
 *
 * La superficie de la card es `GlassSurface` — cristal nativo en iOS 26+;
 * `surface` + hairline sin él (era `colors.glass.cardBg`, el vidrio *falso*
 * deprecado, con sombra `#000`). `BudgetDashboard` era el último consumidor
 * de `glass.*`/`gradients.*` del repo.
 *
 * Ajuste 2026-09-03 (pedido explícito del usuario: mismo lenguaje visual que
 * "Top Categorías" de Analytics): el header gana un disco de icono en
 * `surfaceHighlight`, igual que `CategoryCard`/`TransactionItem`. Sigue
 * siendo una *card* de sección (`BorderRadius.xl`, no la píldora
 * `BorderRadius.round` de una fila de lista) — expande contenido compuesto
 * (gráficos, varias filas), no es un elemento repetido de una lista.
 */
export const BudgetCollapsibleCard: React.FC<BudgetCollapsibleCardProps> = ({
  title,
  titleColor,
  icon,
  expanded,
  onToggle,
  chevronColor,
  headerAccessory,
  contentStyle,
  children,
}) => {
  const { colors } = useTheme();

  return (
    <GlassSurface
      style={styles.card}
      isInteractive
      fallbackStyle={[
        styles.flatCard,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <TouchableOpacity
        onPress={onToggle}
        activeOpacity={0.8}
        style={styles.cardHeader}
      >
        <View style={styles.headerTitleRow}>
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: colors.surfaceHighlight },
            ]}
          >
            <IconSymbol name={icon} size={20} color={colors.icon} />
          </View>
          <Typography
            variant="subheading"
            style={titleColor ? { color: titleColor } : undefined}
          >
            {title}
          </Typography>
        </View>
        <View style={styles.headerRightRow}>
          {!expanded && headerAccessory}
          <IconSymbol
            name={expanded ? "chevron.up" : "chevron.down"}
            size={16}
            color={chevronColor}
          />
        </View>
      </TouchableOpacity>

      {expanded && (
        <Animated.View
          entering={FadeIn.duration(300)}
          exiting={FadeOut.duration(200)}
          layout={LinearTransition}
          style={[styles.defaultContent, contentStyle]}
        >
          {children}
        </Animated.View>
      )}
    </GlassSurface>
  );
};

const styles = StyleSheet.create({
  /** Layout de la card, común a la variante con cristal y a la plana. */
  card: {
    marginBottom: Spacing.l,
    borderRadius: BorderRadius.xl,
    padding: Spacing.m,
    overflow: "hidden",
  },
  /** Fondo opaco + hairline: solo cuando no hay cristal. */
  flatCard: {
    borderWidth: StyleSheet.hairlineWidth,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.round,
    justifyContent: "center",
    alignItems: "center",
  },
  headerRightRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.s,
  },
  defaultContent: {
    marginTop: Spacing.m,
  },
});
