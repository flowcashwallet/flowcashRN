import { ViewStyle } from "react-native";

export interface HeaderButtonProps {
  systemNameIOS?: string;
  nameAndroid?: string;
  imageProps?: Record<string, any>;
  buttonProps?: Record<string, any>;
  style?: ViewStyle;
}
