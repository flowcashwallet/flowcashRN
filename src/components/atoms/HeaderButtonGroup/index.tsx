import { Platform } from "react-native";
import { HeaderButtonGroup as AndroidGroup } from "./HeaderButtonGroup.android";
import { HeaderButtonGroup as IOSGroup } from "./HeaderButtonGroup.ios";
import { HeaderButtonGroupProps } from "./types";

export const HeaderButtonGroup = Platform.select({
  ios: IOSGroup,
  android: AndroidGroup,
  default: AndroidGroup,
}) as React.FC<HeaderButtonGroupProps>;

export type { HeaderButtonGroupProps };
