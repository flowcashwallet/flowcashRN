import { BorderRadius, Spacing } from "@/constants/theme";
import { StyleSheet } from "react-native";

/**
 * Shared dropdown-field styles reused across the transaction form's
 * dropdown-shaped selectors (payment type, category, entity).
 */
export const dropdownStyles = StyleSheet.create({
  dropdown: {
    borderRadius: BorderRadius.m,
    borderWidth: StyleSheet.hairlineWidth,
  },
  dropdownHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.s,
    padding: Spacing.m,
  },
  dropdownList: {
    borderBottomLeftRadius: BorderRadius.m,
    borderBottomRightRadius: BorderRadius.m,
    borderWidth: StyleSheet.hairlineWidth,
    borderTopWidth: 0,
    overflow: "hidden",
  },
  /** Etiqueta de campo del formulario. */
  fieldLabel: {
    marginBottom: Spacing.xs,
  },
});

/**
 * Chips de acceso rápido (categorías frecuentes, entidades frecuentes). Mismo
 * ritmo en ambos campos para que las dos tiras de chips se lean como una sola.
 */
export const chipStyles = StyleSheet.create({
  scroll: {
    marginBottom: Spacing.s,
  },
  content: {
    gap: Spacing.s,
  },
  chip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.s,
    borderRadius: BorderRadius.round,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
