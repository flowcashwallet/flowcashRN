/* eslint-disable @typescript-eslint/no-require-imports */
import type React from "react";
import { Platform } from "react-native";
import type { HeaderButtonProps } from "./types";

const isTest = process.env.NODE_ENV === "test";

const HeaderButtonImpl: React.FC<HeaderButtonProps> =
  Platform.OS === "ios" && !isTest
    ? require("./HeaderButton.ios").HeaderButton
    : require("./HeaderButton.android").HeaderButton;

export const HeaderButton = HeaderButtonImpl;

export type { HeaderButtonProps };
