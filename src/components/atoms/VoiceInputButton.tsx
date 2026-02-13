import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
  View,
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

// Safely import Voice module to avoid crashes in Expo Go
let Voice: any = null;
try {
  Voice = require("@react-native-voice/voice").default;
} catch (e) {
  console.log("Voice module not available (likely running in Expo Go)");
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
  const [hasPermission, setHasPermission] = useState(false);

  // Use ref to hold the latest callback to avoid stale closures in listeners
  const onCommandDetectedRef = useRef(onCommandDetected);
  const processedResult = useRef(false);

  // Track continuous input state
  const isUserHolding = useRef(false);
  const accumulatedText = useRef("");
  const lastPartialText = useRef("");

  useEffect(() => {
    onCommandDetectedRef.current = onCommandDetected;
  }, [onCommandDetected]);

  // Animation values
  const scale = useSharedValue(1);
  const rippleScale = useSharedValue(1);
  const rippleOpacity = useSharedValue(0);

  useEffect(() => {
    // Check if Voice is available before attaching listeners
    if (!Voice) return;

    // Setup voice listeners
    Voice.onSpeechStart = onSpeechStart;
    Voice.onSpeechEnd = onSpeechEnd;
    Voice.onSpeechResults = onSpeechResults;
    Voice.onSpeechPartialResults = onSpeechPartialResults;
    Voice.onSpeechError = onSpeechError;

    return () => {
      if (Voice) {
        Voice.destroy().then(Voice.removeAllListeners);
      }
    };
  }, []);

  const onSpeechStart = (e: any) => {
    setIsListening(true);
    // Start ripple animation
    rippleScale.value = 1;
    rippleOpacity.value = 0.5;
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

  const onSpeechEnd = (e: any) => {
    setIsListening(false);
    stopRipple();
  };

  const onSpeechError = (e: any) => {
    console.error("Speech Error:", e);
    setIsListening(false);
    stopRipple();
    // Only show alert if it's not a "no match" error which happens frequently
    if (e.error?.message && !e.error.message.includes("7")) {
      Alert.alert("Error", "No pude escucharte bien. Intenta de nuevo.");
    }
  };

  const onSpeechResults = (e: any) => {
    console.log("Speech Results:", e);
    if (e.value && e.value[0]) {
      const text = e.value[0];

      // If user is still holding, accumulate and restart
      if (isUserHolding.current) {
        accumulatedText.current += (accumulatedText.current ? " " : "") + text;
        lastPartialText.current = ""; // Clear partial as we have a result

        // Restart listening immediately
        startListening(true); // Pass true to indicate restart
      } else {
        // Final result after release
        const finalText =
          (accumulatedText.current ? accumulatedText.current + " " : "") + text;

        if (processedResult.current) return;
        processedResult.current = true;
        onCommandDetectedRef.current(finalText);
        stopListening();
      }
    }
  };

  const onSpeechPartialResults = (e: any) => {
    if (e.value && e.value[0]) {
      lastPartialText.current = e.value[0];
    }
  };

  const stopRipple = () => {
    rippleScale.value = withTiming(1);
    rippleOpacity.value = withTiming(0);
  };

  const startListening = async (isRestart = false) => {
    try {
      if (!Voice) {
        Alert.alert(
          "Función no disponible",
          "Esta versión de la app no soporta comandos de voz. Por favor, actualiza la app desde la tienda o espera una nueva versión.",
        );
        return;
      }

      if (!isRestart) {
        processedResult.current = false;
        accumulatedText.current = "";
        lastPartialText.current = "";
      }

      if (Platform.OS === "android" || Platform.OS === "ios") {
        await Voice.start("es-MX");
      } else {
        Alert.alert(
          "No soportado",
          "El reconocimiento de voz no está soportado en web por ahora.",
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  const stopListening = async () => {
    try {
      if (Platform.OS !== "web") {
        await Voice.stop();

        // If we are stopping manually (release), check if we have any pending text
        // Note: Voice.stop() usually triggers onSpeechResults, but sometimes we want to be sure
        // However, onSpeechResults logic handles the submission.
        // We just need to ensure isUserHolding is false BEFORE onSpeechResults fires if possible.
        // But stopListening is async.
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Gestures
  const longPress = Gesture.LongPress()
    .onStart(() => {
      isUserHolding.current = true;
      scale.value = withSpring(1.2);
      runOnJS(startListening)(false);
    })
    .onFinalize(() => {
      isUserHolding.current = false;
      scale.value = withSpring(1);

      // Check if we have any accumulated text or partial text to submit if onSpeechResults doesn't fire
      // But typically Voice.stop() DOES trigger onSpeechResults.
      // To be safe, we can wait a bit or handle it in onSpeechResults.
      // If we rely on onSpeechResults, we are good.
      // But if user released during a silence (no result yet), we might have partial text.

      runOnJS(stopListening)();

      // Fallback: If no result comes back after a timeout, we might want to submit what we have?
      // For now, let's trust Voice.stop() triggers onSpeechResults with the final phrase.
    })
    .minDuration(200);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const rippleStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: rippleScale.value }],
      opacity: rippleOpacity.value,
    };
  });

  return (
    <View style={styles.container}>
      {/* Ripple Effect Background */}
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
              padding: 4,
              borderRadius: 4,
            }}
          >
            Soltar para enviar
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
  },
  button: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 10,
  },
  ripple: {
    position: "absolute",
    width: 60,
    height: 60,
    borderRadius: 30,
    zIndex: 5,
  },
  hintContainer: {
    position: "absolute",
    top: -30,
    alignItems: "center",
    width: 120,
  },
});
