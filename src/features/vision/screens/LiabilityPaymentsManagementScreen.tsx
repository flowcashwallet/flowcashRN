import { Typography } from "@/components/atoms/Typography";
import { Spacing } from "@/constants/theme";
import { LiabilityPaymentRow } from "@/features/vision/components/liability-payments/LiabilityPaymentRow";
import { LiabilityPaymentsManagementHeader } from "@/features/vision/components/liability-payments/LiabilityPaymentsManagementHeader";
import { useLiabilityPaymentsManagementScreen } from "@/features/vision/hooks/useLiabilityPaymentsManagementScreen";
import React from "react";
import { FlatList, StyleSheet, View } from "react-native";

/**
 * `FlatList`, no `ScrollView` — confirmado por el usuario probando en
 * dispositivo (2026-09-02): dentro de este `formSheet`, `ScrollView` no
 * renderiza su contenido (sin lanzar ningún error — se confirmó con un
 * `ErrorBoundary` temporal que no atrapó nada), mientras que `FlatList` sí. La
 * causa raíz exacta en el motor nativo queda sin confirmar; el fix es el que
 * funciona, verificado en dispositivo.
 *
 * El header va como hermano directo, no como `ListHeaderComponent`: ponerlo
 * ahí (con su `GlassSurface`) tampoco renderizaba de forma fiable — ver "Bug —
 * Gestión de pagos en blanco" en `docs/refactor-plan.md` para el historial
 * completo de las rondas de este fix.
 */
export default function LiabilityPaymentsManagementScreen() {
  const {
    colors,
    monthLabel,
    displayRows,
    summary,
    goPrevMonth,
    goNextMonth,
    onRowPress,
    onTogglePress,
  } = useLiabilityPaymentsManagementScreen();

  return (
    <View style={[styles.outer, { backgroundColor: colors.background }]}>
      <FlatList
        data={displayRows}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContent]}
        style={{
          backgroundColor: colors.background,
          flex: 1,
        }}
        ListHeaderComponent={
          <LiabilityPaymentsManagementHeader
            monthLabel={monthLabel}
            summary={summary}
            onPrevMonth={goPrevMonth}
            onNextMonth={goNextMonth}
          />
        }
        renderItem={({ item }) => (
          <LiabilityPaymentRow
            item={item}
            onPress={onRowPress}
            onTogglePress={onTogglePress}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Typography variant="body" muted>
              No hay pasivos.
            </Typography>
          </View>
        }
      />
    </View>
  );
}

/** Aire bajo la lista para que la tab bar no tape la última fila. */
const LIST_BOTTOM_INSET = 90;

const styles = StyleSheet.create({
  outer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: Spacing.m,
    paddingBottom: LIST_BOTTOM_INSET,
    gap: Spacing.s,
  },
  empty: {
    alignItems: "center",
    paddingVertical: Spacing.xxl,
  },
});
