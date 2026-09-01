import { Typography } from "@/components/atoms/Typography";
import { Colors } from "@/constants/theme";
import { ThemeProvider, useTheme } from "@/contexts/ThemeContext";
import { act, render, screen } from "@testing-library/react-native";
import React from "react";
import { StyleSheet } from "react-native";

let switchToDark: (() => void) | null = null;

function ThemeSwitcher() {
  const { setTheme } = useTheme();
  switchToDark = () => setTheme("dark");
  return null;
}

function flatten(el: { props: { style: unknown } }) {
  return StyleSheet.flatten(el.props.style) as Record<string, unknown>;
}

describe("Typography smoke", () => {
  it("applies the scale for every variant, including legacy aliases", () => {
    render(
      <ThemeProvider>
        <Typography variant="display">display</Typography>
        <Typography variant="h1">h1</Typography>
        <Typography variant="h2">h2</Typography>
        <Typography variant="h3">h3</Typography>
        <Typography variant="overline">overline</Typography>
        <Typography variant="number">1.234</Typography>
        <Typography variant="button">button</Typography>
      </ThemeProvider>,
    );

    expect(flatten(screen.getByText("display"))).toMatchObject({
      fontSize: 34,
      lineHeight: 40,
      fontWeight: "700",
    });
    // legacy aliases map onto title / heading / subheading
    expect(flatten(screen.getByText("h1"))).toMatchObject({ fontSize: 28 });
    expect(flatten(screen.getByText("h2"))).toMatchObject({ fontSize: 22 });
    expect(flatten(screen.getByText("h3"))).toMatchObject({ fontSize: 18 });
    expect(flatten(screen.getByText("overline"))).toMatchObject({
      textTransform: "uppercase",
    });
    expect(flatten(screen.getByText("1.234"))).toMatchObject({
      fontVariant: ["tabular-nums"],
      textAlign: "right",
    });
    // button is no longer uppercase
    expect(flatten(screen.getByText("button")).textTransform).toBeUndefined();
  });

  it("honours the weight override and muted color", () => {
    render(
      <ThemeProvider>
        <Typography variant="body" weight="bold">
          fuerte
        </Typography>
        <Typography variant="caption" muted>
          apagado
        </Typography>
      </ThemeProvider>,
    );
    expect(flatten(screen.getByText("fuerte"))).toMatchObject({
      fontWeight: "700",
    });
    expect(flatten(screen.getByText("apagado")).color).toBe(
      Colors.light.textSecondary,
    );
  });

  it("resolves color from the active theme in both modes", async () => {
    render(
      <ThemeProvider>
        <Typography>hola</Typography>
      </ThemeProvider>,
    );
    expect(flatten(screen.getByText("hola")).color).toBe(Colors.light.text);

    render(
      <ThemeProvider>
        <ThemeSwitcher />
        <Typography>adios</Typography>
      </ThemeProvider>,
    );
    expect(flatten(screen.getByText("adios")).color).toBe(Colors.light.text);

    await act(async () => {
      switchToDark?.();
    });
    expect(flatten(screen.getByText("adios")).color).toBe(Colors.dark.text);
  });
});
