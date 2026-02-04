// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolViewProps, SymbolWeight } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconMapping = Record<
  SymbolViewProps["name"],
  ComponentProps<typeof MaterialIcons>["name"]
>;
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
  "chart.pie.fill": "pie-chart",
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
  magnifyingglass: "search",
  "xmark.circle.fill": "cancel",
  "chart.bar.fill": "bar-chart",
  "lightbulb.fill": "lightbulb",
  "arrow.right.arrow.left": "swap-horiz",
} as IconMapping;

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
