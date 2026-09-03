import { GlassSurface } from "@/components/atoms/GlassSurface";
import { Typography } from "@/components/atoms/Typography";
import { BorderRadius, Spacing } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";

type SegmentedOption<T extends string> = {
  value: T;
  label: string;
};

type SegmentedControlProps<T extends string> = {
  value: T;
  options: readonly [SegmentedOption<T>, SegmentedOption<T>];
  onChange: (value: T) => void;
  width?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * Control segmentado de dos opciones.
 *
 * Se llamaba `GlassSegmentedControl`. Renombrado en el pase visual de Dashboard
 * (2026-09-02): el material no es asunto del componente. En iOS 26+ su fondo es
 * Liquid Glass **nativo** vía `GlassSurface` y en Android/web es
 * `surfaceHighlight` + hairline — quien decide eso es el primitivo, no este
 * nombre, y si mañana se monta dentro de otra superficie de cristal el guard de
 * anidamiento lo aplana solo. Ver "Liquid Glass nativo en iOS" en
 * `docs/refactor-plan.md`.
 *
 * El indicador del segmento activo se queda opaco (`primary`) a propósito: es un
 * control **dentro** de una superficie de cristal, y no se apila cristal sobre
 * cristal. Su texto va en `onPrimary` por el aviso de contraste.
 */
export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  width = 140,
  style,
}: SegmentedControlProps<T>) {
  const { colors } = useTheme();
  const [containerWidth, setContainerWidth] = useState(0);
  const translateX = useRef(new Animated.Value(0)).current;

  const segmentWidth = useMemo(() => {
    if (!containerWidth) return 0;
    return (containerWidth - 4) / 2;
  }, [containerWidth]);

  const selectedIndex = useMemo(() => {
    return value === options[0].value ? 0 : 1;
  }, [options, value]);

  useEffect(() => {
    if (!segmentWidth) return;
    Animated.spring(translateX, {
      toValue: selectedIndex * segmentWidth,
      useNativeDriver: true,
      damping: 18,
      stiffness: 220,
      mass: 0.9,
    }).start();
  }, [segmentWidth, selectedIndex, translateX]);

  return (
    <GlassSurface
      style={[styles.container, { width }, style]}
      fallbackStyle={[
        styles.flatContainer,
        {
          backgroundColor: colors.surfaceHighlight,
          borderColor: colors.border,
        },
      ]}
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
    >
      {segmentWidth ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.indicator,
            {
              width: segmentWidth,
              backgroundColor: colors.primary,
              transform: [{ translateX }],
            },
          ]}
        />
      ) : null}

      <View style={styles.row}>
        {options.map((option, index) => {
          const selected = selectedIndex === index;
          return (
            <TouchableOpacity
              key={option.value}
              onPress={() => onChange(option.value)}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              style={styles.segment}
            >
              <Typography
                variant="overline"
                muted={!selected}
                // `onPrimary` respeta el aviso de contraste sobre `primary`.
                style={selected ? { color: colors.onPrimary } : undefined}
              >
                {option.label}
              </Typography>
            </TouchableOpacity>
          );
        })}
      </View>
    </GlassSurface>
  );
}

const styles = StyleSheet.create({
  /** Layout del control, común a la variante con cristal y a la plana. */
  container: {
    borderRadius: BorderRadius.round,
    overflow: "hidden",
    padding: 2,
  },
  /**
   * Tratamiento de fondo **sin** cristal: relleno suave + hairline, que es lo
   * que ve Android/web y lo que había antes de recuperar el vidrio nativo. Con
   * `GlassView` activo el material del sistema los sustituye a los dos.
   */
  flatContainer: {
    borderWidth: StyleSheet.hairlineWidth,
  },
  indicator: {
    position: "absolute",
    top: 2,
    bottom: 2,
    left: 2,
    borderRadius: BorderRadius.round,
  },
  row: {
    flexDirection: "row",
  },
  segment: {
    flex: 1,
    paddingVertical: Spacing.s,
    alignItems: "center",
  },
});
