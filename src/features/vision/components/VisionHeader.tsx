import { Typography } from "@/components/atoms/Typography";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { BorderRadius, Spacing } from "@/constants/theme";
import STRINGS from "@/i18n/es.json";
import { formatCurrency } from "@/utils/format";
import React, { useState } from "react";
import { Platform, StyleSheet, TouchableOpacity, View } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
} from "react-native-reanimated";

interface VisionHeaderProps {
  netWorth: number;
  totalAssets: number;
  totalLiabilities: number;
}

export const VisionHeader: React.FC<VisionHeaderProps> = ({
  netWorth,
  totalAssets,
  totalLiabilities,
}) => {
  const [isExpanded, setIsExpanded] = useState(false); // Default collapsed

  return (
    <View
      style={[
        styles.balanceCard,
        {
          padding: Spacing.m,
          borderRadius: BorderRadius.xl,
          backgroundColor: "#2C2C2E", // Dark card background
          borderWidth: 0,
          ...Platform.select({
            ios: {
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 10,
            },
            android: { elevation: 6 },
          }),
        },
      ]}
    >
      {/* Header / Title Row */}
      <TouchableOpacity
        onPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={0.8}
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: isExpanded ? Spacing.m : 0,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Typography variant="h3" weight="bold" style={{ color: "#FFFFFF" }}>
            {STRINGS.vision.netWorth}
          </Typography>
        </View>
        <IconSymbol
          name={isExpanded ? "chevron.up" : "chevron.down"}
          size={16}
          color="#8E8E93"
        />
      </TouchableOpacity>

      {/* Expanded Content */}
      {isExpanded ? (
        <Animated.View
          entering={FadeIn.duration(300)}
          exiting={FadeOut.duration(200)}
          layout={LinearTransition}
        >
          {/* Assets */}
          <View style={styles.row}>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
            >
              <Typography style={{ color: "#D1D1D6", fontSize: 15 }}>
                {STRINGS.vision.assets}
              </Typography>
              <IconSymbol name="info.circle" size={14} color="#8E8E93" />
            </View>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              <Typography
                weight="bold"
                style={{ color: "#FFFFFF", fontSize: 16 }}
              >
                {formatCurrency(totalAssets)}
              </Typography>
              <View style={[styles.dot, { backgroundColor: "#30D158" }]} />
            </View>
          </View>

          {/* Liabilities */}
          <View style={styles.row}>
            <Typography style={{ color: "#D1D1D6", fontSize: 15 }}>
              {STRINGS.vision.liabilities}
            </Typography>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              <Typography
                weight="bold"
                style={{ color: "#FFFFFF", fontSize: 16 }}
              >
                -{formatCurrency(totalLiabilities)}
              </Typography>
              <View style={[styles.dot, { backgroundColor: "#FF453A" }]} />
            </View>
          </View>

          {/* Divider */}
          <View
            style={{
              height: 1,
              backgroundColor: "#3A3A3C",
              marginVertical: Spacing.s,
            }}
          />

          {/* Net Worth */}
          <View style={styles.row}>
            <Typography style={{ color: "#D1D1D6", fontSize: 15 }}>
              {STRINGS.wallet.balanceTotal}
            </Typography>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              <Typography
                weight="bold"
                style={{ color: "#FFFFFF", fontSize: 16 }}
              >
                {formatCurrency(netWorth)}
              </Typography>
              <View
                style={[
                  styles.dot,
                  { backgroundColor: netWorth >= 0 ? "#30D158" : "#FF453A" },
                ]}
              />
            </View>
          </View>
        </Animated.View>
      ) : (
        /* Collapsed View - Just Balance */
        <Animated.View
          entering={FadeIn.duration(300)}
          exiting={FadeOut.duration(200)}
          layout={LinearTransition}
          style={{ marginTop: 4 }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography style={{ color: "#D1D1D6", fontSize: 15 }}>
              {STRINGS.wallet.balanceTotal}
            </Typography>
            <Typography
              weight="bold"
              style={{ color: "#FFFFFF", fontSize: 16 }}
            >
              {formatCurrency(netWorth)}
            </Typography>
          </View>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  balanceCard: {
    marginBottom: Spacing.l,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
