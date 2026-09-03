import { GlassSurface } from "@/components/atoms/GlassSurface";
import { Typography } from "@/components/atoms/Typography";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { BorderRadius, Spacing } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";
import { VisionEntity } from "@/features/vision/data/visionSlice";
import { formatCurrency } from "@/utils/format";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import Swipeable from "react-native-gesture-handler/Swipeable";

interface VisionEntityListProps {
  data: VisionEntity[];
  type: "asset" | "liability";
  onPress: (entity: VisionEntity) => void;
  onDelete: (id: string) => Promise<unknown>;
}

function entityIcon(item: VisionEntity, type: "asset" | "liability") {
  if (item.category?.toLowerCase().includes("banco")) return "building.columns";
  if (item.isCrypto) return "bitcoinsign.circle";
  return type === "asset" ? "arrow.up.circle" : "arrow.down.circle";
}

/**
 * Lista de activos/pasivos de Vision.
 *
 * Misma fila del libro contable que `TransactionItem` (ver "Dirección estética"
 * en `docs/refactor-plan.md`), por pedido explícito del usuario: los items de
 * Vision tienen que leerse igual que los de `WalletScreen`. De ahí vienen el
 * disco de icono en `surfaceHighlight`, el bloque de copy con
 * `body`/`caption muted`, el importe en `variant="number"` (dígitos tabulares,
 * alineado a la derecha) y la superficie de `GlassSurface`: Liquid Glass nativo
 * en iOS 26+, y la misma fila plana con hairline en Android/web o cuando alguno
 * de los dos gates no pasa.
 *
 * Signo: un pasivo es dinero que sale del patrimonio, así que va con `−` y en
 * `colors.expense` — el mismo criterio con el que `VisionHeader` ya imprimía el
 * total de pasivos en negativo. **Nunca `colors.error`**, que queda reservado
 * para un estado realmente malo. Un activo no lleva signo y se queda en
 * `colors.text`, igual que una transferencia en `TransactionItem`.
 */
export const VisionEntityList: React.FC<VisionEntityListProps> = ({
  data,
  type,
  onPress,
  onDelete,
}) => {
  const { colors } = useTheme();

  const isAsset = type === "asset";
  const amountColor = isAsset ? colors.text : colors.expense;
  const accentColor = isAsset ? colors.primary : colors.expense;

  if (data.length === 0) {
    return (
      <View style={styles.empty}>
        <Typography variant="subheading" muted>
          No hay {isAsset ? "activos" : "pasivos"}
        </Typography>
        <Typography variant="body" muted style={styles.emptyCopy}>
          Agrega tus {isAsset ? "activos" : "deudas"} para visualizar tu
          patrimonio.
        </Typography>
      </View>
    );
  }

  return (
    <View style={styles.list}>
      {data.map((item) => (
        <Swipeable
          key={item.id}
          renderRightActions={() => (
            <TouchableOpacity
              style={[styles.deleteAction, { backgroundColor: colors.error }]}
              onPress={() => onDelete(item.id.toString())}
              accessibilityRole="button"
              accessibilityLabel="Eliminar"
            >
              {/* `surface` es el token que contrasta contra `error` en ambos temas. */}
              <IconSymbol name="trash.fill" size={24} color={colors.surface} />
            </TouchableOpacity>
          )}
        >
          <TouchableOpacity onPress={() => onPress(item)} activeOpacity={0.7}>
            <GlassSurface
              style={styles.row}
              isInteractive
              fallbackStyle={[
                styles.flatRow,
                {
                  // Opaco y del color de la pantalla: la fila tapa la acción de
                  // borrado que hay debajo al deslizar.
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
                  name={entityIcon(item, type)}
                  size={20}
                  color={accentColor}
                />
              </View>

              <View style={styles.copy}>
                <Typography variant="body" weight="semibold" numberOfLines={1}>
                  {item.name}
                </Typography>
                <Typography variant="caption" muted numberOfLines={1}>
                  {item.category || "General"}
                </Typography>
              </View>

              <Typography variant="number" style={{ color: amountColor }}>
                {isAsset ? "" : "−"}
                {formatCurrency(item.amount)}
              </Typography>
            </GlassSurface>
          </TouchableOpacity>
        </Swipeable>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  list: {
    gap: Spacing.s,
  },
  /** Layout de la fila, común a la variante con cristal y a la plana. */
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.s,
    borderRadius: BorderRadius.round,
    overflow: "hidden",
  },
  /**
   * Fondo de la fila **sin** cristal. Con `GlassView` activo el material del
   * sistema ya separa una fila de la siguiente, así que el hairline sobra y el
   * fondo opaco taparía el propio efecto.
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
  copy: {
    flex: 1,
  },
  deleteAction: {
    justifyContent: "center",
    alignItems: "center",
    width: 80,
    height: "100%",
    borderTopRightRadius: BorderRadius.l,
    borderBottomRightRadius: BorderRadius.l,
  },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.m,
    gap: Spacing.s,
  },
  emptyCopy: {
    textAlign: "center",
  },
});
