// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  "house.fill": "home",
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right": "chevron-right",
  "chevron.left": "chevron-left",
  "chevron.down": "keyboard-arrow-down",
  "creditcard.fill": "account-balance-wallet",
  creditcard: "credit-card",
  "chart.pie.fill": "pie-chart",
  "chart.pie": "pie-chart-outline", // Corrected to standard suffix
  "eye.fill": "visibility",
  "eye.slash.fill": "visibility-off",
  "trash.fill": "delete",
  "arrow.down.left": "call-received",
  "arrow.up.right": "call-made",
  "line.3.horizontal": "menu",
  "bell.fill": "notifications",
  xmark: "close",
  plus: "add",
  "plus.circle.fill": "add-circle",
  "minus.circle.fill": "remove-circle",
  "g.circle.fill": "public",
  pencil: "edit",
  "building.columns.fill": "account-balance",
  "building.columns": "account-balance", // No outlined version easily available in standard material
  magnifyingglass: "search",
  "xmark.circle.fill": "cancel",
  "chart.bar.fill": "bar-chart",
  "chart.bar": "bar-chart", // No outlined version easily available
  "lightbulb.fill": "lightbulb",
  "arrow.right.arrow.left": "swap-horiz",
  "questionmark.circle.fill": "help",
  "list.bullet": "list",
  "arrow.triangle.2.circlepath": "autorenew",
  "chart.bar.xaxis": "insert-chart",
  "calendar": "calendar-today",
  "list.bullet.rectangle.portrait": "list",
  "wallet.pass": "account-balance-wallet",
  // Añadidos en el pase visual de Wallet: se usaban en la feature sin estar
  // mapeados, por lo que en Android/web no pintaban nada. Ver la sección
  // "Iconografía" de `docs/refactor-plan.md`: si falta un símbolo se añade aquí,
  // no se importa otra familia de iconos.
  "arrow.left": "arrow-back",
  "chevron.up": "keyboard-arrow-up",
  checkmark: "check",
  trash: "delete-outline",
  camera: "photo-camera",
  "square.and.pencil": "note-add",
  "line.3.horizontal.decrease.circle": "filter-list",
  "line.3.horizontal.decrease.circle.fill": "filter-alt",
  "flame.fill": "local-fire-department",
  snowflake: "ac-unit",
  "lock.open": "lock-open",
  "info.circle": "info-outline",
  "square.and.arrow.up": "ios-share",
  // Añadidos en el pase visual de Vision (2026-09-02), misma razón: la feature
  // ya los usaba sin estar mapeados, así que en Android/web no pintaban nada.
  "bitcoinsign.circle": "currency-bitcoin",
  "arrow.up.circle": "arrow-circle-up",
  "arrow.down.circle": "arrow-circle-down",
  "checkmark.circle.fill": "check-circle",
  "calendar.badge.checkmark": "event-available",
  "dollarsign.circle": "monetization-on",
  textformat: "sort-by-alpha",
  "arrow.up.arrow.down": "swap-vert",
  // Añadidos en el pase de consistencia de forma de Analytics (2026-09-03):
  // `categoryIcon()` en `CategoryCard`/`StatisticsCategoryCard` y el disco de
  // icono de `RecurringExpensesSection`/`StatisticsRecurringList`/
  // `FinancialTipsSection` los usaban sin estar mapeados.
  "fork.knife": "restaurant",
  "car.fill": "directions-car",
  "cross.case.fill": "medical-services",
  sparkles: "auto-awesome",
  "book.fill": "menu-book",
  "bolt.fill": "bolt",
  "bag.fill": "shopping-bag",
  "tag.fill": "label",
} as Record<string, ComponentProps<typeof MaterialIcons>["name"]>;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return (
    <MaterialIcons
      color={color}
      size={size}
      name={MAPPING[name]}
      style={style}
    />
  );
}
