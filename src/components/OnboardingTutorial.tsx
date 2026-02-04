import { Button } from "@/components/atoms/Button";
import { Typography } from "@/components/atoms/Typography";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { BorderRadius, Colors, Spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import {
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    View
} from "react-native";

interface OnboardingTutorialProps {
  visible: boolean;
  onClose: () => void;
}

const TUTORIAL_STEPS = [
  {
    id: "welcome",
    title: "Bienvenido a tu Wallet",
    description:
      "Toma el control total de tus finanzas personales de una manera simple y poderosa.",
    icon: "house.fill",
    color: "#4A90E2",
  },
  {
    id: "assets_liabilities",
    title: "Activos y Pasivos",
    description:
      "• Activos: Todo el dinero que tienes (Cuentas, efectivo, inversiones).\n• Pasivos: Todo el dinero que debes (Tarjetas de crédito, préstamos).\n\nTu Patrimonio Neto es la diferencia entre ambos.",
    icon: "building.columns.fill",
    color: "#50E3C2",
  },
  {
    id: "income_expenses",
    title: "Ingresos y Gastos",
    description:
      "Registra tus movimientos diarios.\n\n• Ingresos: Dinero que entra (Nómina, ventas).\n• Gastos: Dinero que gastas (Comida, servicios).",
    icon: "chart.bar.fill",
    color: "#F5A623",
  },
  {
    id: "transfers",
    title: "Transferencias",
    description:
      "Mueve dinero entre tus cuentas sin afectar tu balance mensual de gastos.\n\nEjemplo: Pagar tu tarjeta de crédito desde tu cuenta de nómina.\n\nEsto ajusta tus saldos de Activo y Pasivo automáticamente.",
    icon: "arrow.right.arrow.left",
    color: "#9013FE",
  },
  {
    id: "budget",
    title: "Presupuestos",
    description:
      "Crea presupuestos mensuales por categoría para controlar tus gastos.\n\nDefine un límite y visualiza cuánto has gastado y cuánto te queda disponible en tiempo real.",
    icon: "chart.pie.fill",
    color: "#E91E63",
  },
];

export const OnboardingTutorial: React.FC<OnboardingTutorialProps> = ({
  visible,
  onClose,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const [currentStep, setCurrentStep] = useState(0);

  // Reset step when opening
  useEffect(() => {
    if (visible) {
      setCurrentStep(0);
    }
  }, [visible]);

  const handleNext = async () => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      await completeTutorial();
    }
  };

  const completeTutorial = async () => {
    try {
      await AsyncStorage.setItem("has_seen_onboarding_v1", "true");
    } catch (error) {
      console.error("Error saving onboarding status:", error);
    }
    onClose();
  };

  const stepData = TUTORIAL_STEPS[currentStep];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View
        style={[
          styles.container,
          { backgroundColor: "rgba(0,0,0,0.5)" }, // Dimmed background
        ]}
      >
        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          {/* Icon Header */}
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: stepData.color + "20" }, // 20% opacity
            ]}
          >
            <IconSymbol
              name={stepData.icon as any}
              size={64}
              color={stepData.color}
            />
          </View>

          {/* Content */}
          <View style={styles.content}>
            <Typography
              variant="h2"
              weight="bold"
              style={{
                textAlign: "center",
                marginBottom: Spacing.m,
                color: colors.text,
              }}
            >
              {stepData.title}
            </Typography>
            <ScrollView style={{ maxHeight: 200 }}>
              <Typography
                variant="body"
                style={{
                  textAlign: "center",
                  color: colors.textSecondary,
                  lineHeight: 24,
                }}
              >
                {stepData.description}
              </Typography>
            </ScrollView>
          </View>

          {/* Dots Indicator */}
          <View style={styles.dotsContainer}>
            {TUTORIAL_STEPS.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  {
                    backgroundColor:
                      index === currentStep ? colors.primary : colors.border,
                    width: index === currentStep ? 20 : 8,
                  },
                ]}
              />
            ))}
          </View>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <Button
              title={
                currentStep === TUTORIAL_STEPS.length - 1
                  ? "Entendido"
                  : "Siguiente"
              }
              onPress={handleNext}
              variant="primary"
            />
            {currentStep < TUTORIAL_STEPS.length - 1 && (
              <View style={{ marginTop: Spacing.s }}>
                <Button
                  title="Omitir"
                  onPress={completeTutorial}
                  variant="ghost"
                />
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.m,
  },
  card: {
    width: "100%",
    maxWidth: 400,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: "center",
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
      },
      android: { elevation: 10 },
    }),
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.l,
  },
  content: {
    marginBottom: Spacing.xl,
    width: "100%",
  },
  dotsContainer: {
    flexDirection: "row",
    marginBottom: Spacing.l,
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  buttonContainer: {
    width: "100%",
  },
});
