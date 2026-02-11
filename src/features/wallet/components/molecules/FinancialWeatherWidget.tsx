import { Typography } from "@/components/atoms/Typography";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, View } from "react-native";
import { Spacing } from "../../../../constants/theme";
import { useColorScheme } from "../../../../hooks/use-color-scheme";
import { Forecast } from "../../data/walletSlice";

interface FinancialWeatherWidgetProps {
  forecast: Forecast | null;
}

export const FinancialWeatherWidget = ({
  forecast,
}: FinancialWeatherWidgetProps) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  if (!forecast || !forecast.weather_status) {
    return null;
  }

  const getWeatherConfig = (status: string) => {
    switch (status) {
      case "sunny":
        return {
          icon: "sunny" as const,
          color: "#F59E0B", // Amber-500
          bgColor: isDark ? "#451a03" : "#FFFBEB", // Amber-900 / Amber-50
          borderColor: "#FCD34D", // Amber-300
          textColor: isDark ? "#FEF3C7" : "#92400E", // Amber-100 / Amber-800
        };
      case "cloudy":
        return {
          icon: "cloud" as const,
          color: "#64748B", // Slate-500
          bgColor: isDark ? "#1e293b" : "#F1F5F9", // Slate-800 / Slate-100
          borderColor: "#CBD5E1", // Slate-300
          textColor: isDark ? "#E2E8F0" : "#475569", // Slate-200 / Slate-600
        };
      case "stormy":
        return {
          icon: "thunderstorm" as const,
          color: "#EF4444", // Red-500
          bgColor: isDark ? "#450a0a" : "#FEF2F2", // Red-950 / Red-50
          borderColor: "#FCA5A5", // Red-300
          textColor: isDark ? "#FEE2E2" : "#991B1B", // Red-100 / Red-800
        };
      default:
        return {
          icon: "sunny" as const,
          color: "#F59E0B",
          bgColor: isDark ? "#451a03" : "#FFFBEB",
          borderColor: "#FCD34D",
          textColor: isDark ? "#FEF3C7" : "#92400E",
        };
    }
  };

  const config = getWeatherConfig(forecast.weather_status);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: config.bgColor,
          borderColor: config.borderColor,
        },
      ]}
    >
      <View style={styles.iconContainer}>
        <Ionicons name={config.icon} size={32} color={config.color} />
      </View>
      <View style={styles.textContainer}>
        <Typography
          variant="h3"
          style={{
            color: config.textColor,
            fontWeight: "700",
            marginBottom: 2,
          }}
        >
          {forecast.weather_status === "sunny"
            ? "Día Soleado"
            : forecast.weather_status === "cloudy"
              ? "Nublado"
              : "Tormenta"}
        </Typography>
        <Typography
          variant="caption"
          style={{ color: config.textColor, opacity: 0.9 }}
        >
          {forecast.weather_message}
        </Typography>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.m,
    borderRadius: 16,
    borderWidth: 1,
    marginHorizontal: Spacing.m,
    marginBottom: Spacing.m,
    // Shadow for iOS
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    // Shadow for Android
    elevation: 2,
  },
  iconContainer: {
    marginRight: Spacing.m,
  },
  textContainer: {
    flex: 1,
  },
});
