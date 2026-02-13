import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  PermissionsAndroid,
  Platform,
  StyleSheet,
  View
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Typography } from "../atoms/Typography";

// Safely import Voice module
let Voice: any = null;
try {
  Voice = require("@react-native-voice/voice").default;
} catch (e) {
  console.log("Voice module not available");
}

interface VoiceInputButtonProps {
  onCommandDetected: (text: string) => void;
  isLoading?: boolean;
}

export const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({
  onCommandDetected,
  isLoading = false,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const [isListening, setIsListening] = useState(false);
  const isUserHolding = useRef(false);
  const accumulatedText = useRef("");
  const lastPartialText = useRef("");
  const currentSentence = useRef(""); // Guardará lo que estás diciendo actualmente
  const processedResult = useRef(false);

  // Animation values
  const scale = useSharedValue(1);
  const rippleScale = useSharedValue(1);
  const rippleOpacity = useSharedValue(0);

  const combineText = (prev: string, next: string) => {
    if (!prev) return next;
    if (!next) return prev;

    // Si la nueva parte ya contiene la anterior (común en motores de voz),
    // nos quedamos solo con la nueva.
    if (next.toLowerCase().includes(prev.toLowerCase())) return next;

    return `${prev} ${next}`.trim();
  };

  useEffect(() => {
    if (!Voice) return;

    Voice.onSpeechStart = () => {
      runOnJS(setIsListening)(true);
      startRipple();
    };

    Voice.onSpeechEnd = () => {
      if (isUserHolding.current) {
        // Al terminar una ráfaga de voz, pasamos lo actual al acumulado
        if (currentSentence.current) {
          accumulatedText.current = combineText(
            accumulatedText.current,
            currentSentence.current,
          );
          currentSentence.current = "";
        }
        startVoiceEngine(true);
      } else {
        runOnJS(setIsListening)(false);
        stopRipple();
      }
    };

    Voice.onSpeechResults = (e: any) => {
      if (e.value && e.value[0]) {
        // Guardamos el resultado de esta ráfaga
        currentSentence.current = e.value[0];
      }
    };

    Voice.onSpeechPartialResults = (e: any) => {
      if (e.value && e.value[0]) {
        currentSentence.current = e.value[0];
      }
    };

    Voice.onSpeechError = () => {
      if (isUserHolding.current) startVoiceEngine(true);
    };

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  const requestPermissions = async () => {
    if (Platform.OS === "android") {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        return false;
      }
    }
    return true; // iOS maneja permisos vía Info.plist automáticamente al llamar a Voice
  };

  const startVoiceEngine = async (isRestart = false) => {
    try {
      if (!isRestart) {
        accumulatedText.current = "";
        currentSentence.current = "";
        processedResult.current = false;
      }
      await Voice.start("es-MX");
    } catch (e) {
      console.log("Voice Start Error:", e);
    }
  };

  const processFinalText = () => {
    if (processedResult.current) return;

    // Combinamos lo acumulado de ráfagas anteriores con lo último detectado
    const finalResult = combineText(
      accumulatedText.current,
      currentSentence.current,
    )
      .replace(/\s+/g, " ") // Limpiar espacios extra
      .trim();

    console.log("--- RESULTADO FINAL ---", finalResult);

    if (finalResult.length > 0) {
      processedResult.current = true;
      onCommandDetected(finalResult);
    }
  };

  const startRipple = () => {
    rippleScale.value = withRepeat(
      withTiming(2, { duration: 1000 }),
      -1,
      false,
    );
    rippleOpacity.value = withRepeat(
      withTiming(0, { duration: 1000 }),
      -1,
      false,
    );
  };

  const stopRipple = () => {
    rippleScale.value = withTiming(1);
    rippleOpacity.value = withTiming(0);
  };
  // 2. Crea esta función fuera del return (dentro del componente)

  // --- GESTOS ---
  const handlePressStart = async () => {
    const hasPerms = await requestPermissions();
    if (!hasPerms) return;

    isUserHolding.current = true;
    scale.value = withSpring(1.2);
    await startVoiceEngine(false);
  };

  const handlePressStop = async () => {
    isUserHolding.current = false;
    scale.value = withSpring(1);

    try {
      await Voice.stop();
    } catch (e) {}

    // Esperamos un momento a que llegue el último "SpeechResult"
    setTimeout(() => {
      processFinalText();
    }, 600);
  };

  const longPress = Gesture.LongPress()
    .onStart(() => {
      runOnJS(handlePressStart)();
    })
    .onFinalize(() => {
      runOnJS(handlePressStop)();
    })
    .minDuration(200);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const rippleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: rippleScale.value }],
    opacity: rippleOpacity.value,
  }));

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.ripple,
          { backgroundColor: colors.primary },
          rippleStyle,
        ]}
      />

      <GestureDetector gesture={longPress}>
        <Animated.View
          style={[
            styles.button,
            { backgroundColor: colors.primary },
            animatedStyle,
          ]}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <IconSymbol
              name={isListening ? "waveform" : "mic.fill"}
              size={28}
              color="#fff"
            />
          )}
        </Animated.View>
      </GestureDetector>

      {isListening && (
        <View style={styles.hintContainer}>
          <Typography
            variant="caption"
            style={{
              color: colors.textSecondary,
              backgroundColor: colors.background,
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 8,
              overflow: "hidden",
              elevation: 2,
            }}
          >
            Habla ahora...
          </Typography>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    height: 100,
    width: 100,
  },
  button: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
    zIndex: 10,
  },
  ripple: {
    position: "absolute",
    width: 64,
    height: 64,
    borderRadius: 32,
    zIndex: 5,
  },
  hintContainer: {
    position: "absolute",
    top: -20,
    alignItems: "center",
    width: 150,
  },
});
