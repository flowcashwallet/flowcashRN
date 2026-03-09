import { moderateScale } from "@/utils/responsive";
import { Button, Host, Image } from "@expo/ui/swift-ui";
import { frame } from "@expo/ui/swift-ui/modifiers";
import React from "react";
import { HeaderButtonProps } from "./types";

const SIZE = moderateScale(35);

export function HeaderButton({
  systemNameIOS,
  imageProps,
  buttonProps,
  style,
}: HeaderButtonProps) {
  return (
    <Host matchContents style={[{ height: SIZE, width: SIZE }, style]}>
      <Button {...buttonProps}>
        <Image
          {...imageProps}
          systemName={systemNameIOS || imageProps?.systemName || "xmark"}
          color={imageProps?.color || "#000000"}
          size={imageProps?.size || moderateScale(20)}
          modifiers={[
            frame({ width: SIZE, height: SIZE }),
            ...(imageProps?.modifiers || []),
          ]}
        />
      </Button>
    </Host>
  );
}
