import { Button } from "@/components/atoms/Button";
import { Typography } from "@/components/atoms/Typography";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { BorderRadius, Colors, Spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";

export default function LandingScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const isDark = colorScheme === "dark";

  const handleLogin = () => {
    router.push("/login");
  };

  const handleRegister = () => {
    router.push("/register");
  };

  return (
    <ThemedView style={styles.container}>
      {/* Navbar */}
      <View style={[styles.navbar, { borderBottomColor: colors.border }]}>
        <View style={styles.logoContainer}>
          <IconSymbol name="chart.pie.fill" size={32} color={colors.primary} />
          <Typography
            variant="h3"
            weight="bold"
            style={{ marginLeft: Spacing.s, color: colors.text }}
          >
            FlowCash
          </Typography>
        </View>
        <View style={styles.navActions}>
          <Button
            title="Iniciar Sesión"
            variant="ghost"
            onPress={handleLogin}
            style={styles.navButton}
          />
          <Button
            title="Registrarse"
            variant="primary"
            onPress={handleRegister}
            style={styles.navButton}
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.heroContent}>
            <Typography variant="h1" weight="bold" style={styles.heroTitle}>
              Gestiona tus finanzas de forma inteligente
            </Typography>
            <Typography variant="body" style={styles.heroSubtitle}>
              Toma el control de tu dinero con predicciones inteligentes,
              seguimiento de gastos y planificación de deudas. Todo en un solo
              lugar.
            </Typography>
            <View style={styles.heroButtons}>
              <Button
                title="Comenzar Ahora"
                variant="primary"
                onPress={handleRegister}
                style={styles.heroButton}
                textStyle={{ fontSize: 18, fontWeight: "bold" }}
              />
              <Button
                title="Ya tengo cuenta"
                variant="outline"
                onPress={handleLogin}
                style={styles.heroButton}
              />
            </View>
          </View>
          {/* Illustration placeholder */}
          <View
            style={[
              styles.heroImageContainer,
              { backgroundColor: isDark ? "#1e293b" : "#f1f5f9" },
            ]}
          >
            <IconSymbol
              name="chart.bar.xaxis"
              size={120}
              color={colors.primary}
            />
          </View>
        </View>

        {/* Features Section */}
        <View style={styles.featuresSection}>
          <Typography
            variant="h2"
            weight="bold"
            style={{ textAlign: "center", marginBottom: Spacing.xl }}
          >
            ¿Por qué usar FlowCash?
          </Typography>

          <View style={styles.featuresGrid}>
            <FeatureCard
              icon="calendar"
              title="Predicciones Inteligentes"
              description="Anticípate a tus gastos con nuestro algoritmo de predicción de flujo de caja."
              colors={colors}
              isDark={isDark}
            />
            <FeatureCard
              icon="list.bullet.rectangle.portrait"
              title="Planificación de Deudas"
              description="Estrategias Bola de Nieve y Avalancha para salir de deudas más rápido."
              colors={colors}
              isDark={isDark}
            />
            <FeatureCard
              icon="chart.pie"
              title="Análisis Detallado"
              description="Visualiza tus gastos por categorías y descubre patrones de consumo."
              colors={colors}
              isDark={isDark}
            />
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const FeatureCard = ({ icon, title, description, colors, isDark }: any) => (
  <View
    style={[
      styles.featureCard,
      {
        backgroundColor: isDark ? "#1e293b" : "#fff",
        borderColor: colors.border,
      },
    ]}
  >
    <View
      style={[
        styles.featureIcon,
        { backgroundColor: isDark ? "#0f172a" : "#e0f2fe" },
      ]}
    >
      <IconSymbol name={icon} size={32} color={colors.primary} />
    </View>
    <Typography variant="h3" weight="bold" style={{ marginBottom: Spacing.s }}>
      {title}
    </Typography>
    <Typography
      variant="caption"
      style={{ color: colors.gray, textAlign: "center" }}
    >
      {description}
    </Typography>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  navbar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.m,
    borderBottomWidth: 1,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  navActions: {
    flexDirection: "row",
    gap: Spacing.m,
  },
  navButton: {
    minWidth: 100,
  },
  scrollContent: {
    flexGrow: 1,
  },
  heroSection: {
    flexDirection: "row",
    padding: Spacing.xl * 2,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xl * 2,
    flexWrap: "wrap",
    minHeight: 600,
  },
  heroContent: {
    flex: 1,
    maxWidth: 600,
    minWidth: 300,
  },
  heroTitle: {
    fontSize: 48,
    lineHeight: 56,
    marginBottom: Spacing.l,
  },
  heroSubtitle: {
    fontSize: 20,
    opacity: 0.8,
    marginBottom: Spacing.xl,
    lineHeight: 30,
  },
  heroButtons: {
    flexDirection: "row",
    gap: Spacing.m,
    flexWrap: "wrap",
  },
  heroButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.m,
    minWidth: 160,
  },
  heroImageContainer: {
    width: 400,
    height: 400,
    borderRadius: BorderRadius.xl,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  featuresSection: {
    padding: Spacing.xl * 2,
    alignItems: "center",
  },
  featuresGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xl,
    justifyContent: "center",
    maxWidth: 1200,
  },
  featureCard: {
    width: 300,
    padding: Spacing.xl,
    borderRadius: BorderRadius.l,
    alignItems: "center",
    borderWidth: 1,
  },
  featureIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.m,
  },
});
