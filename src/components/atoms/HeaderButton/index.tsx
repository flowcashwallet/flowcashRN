import { Platform } from "react-native";
import { HeaderButton as AndroidButton } from "./HeaderButton.android";
import { HeaderButton as IOSButton } from "./HeaderButton.ios";
import { HeaderButtonProps } from "./types";

export const HeaderButton = Platform.select({
  ios: IOSButton,
  android: AndroidButton,
  default: AndroidButton,
}) as React.FC<HeaderButtonProps>;

export type { HeaderButtonProps };
