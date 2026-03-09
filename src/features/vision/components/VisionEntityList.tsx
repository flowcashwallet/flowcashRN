import { Typography } from "@/components/atoms/Typography";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";
import { VisionEntity } from "@/features/vision/data/visionSlice";
import { formatCurrency } from "@/utils/format";
import React from "react";
import { TouchableOpacity, View } from "react-native";
import Swipeable from "react-native-gesture-handler/Swipeable";

interface VisionEntityListProps {
  data: VisionEntity[];
  type: "asset" | "liability";
  onPress: (entity: VisionEntity) => void;
  onDelete: (id: string) => Promise<unknown>;
}

export const VisionEntityList: React.FC<VisionEntityListProps> = ({
  data,
  type,
  onPress,
  onDelete,
}) => {
  const { colors } = useTheme();

  if (data.length === 0) {
    return (
      <View
        style={{
          alignItems: "center",
          justifyContent: "center",
          padding: Spacing.xl,
          marginTop: Spacing.l,
        }}
      >
        <Typography
          variant="h3"
          style={{ color: colors.textSecondary, marginBottom: Spacing.s }}
        >
          No hay {type === "asset" ? "activos" : "pasivos"}
        </Typography>
        <Typography
          variant="body"
          style={{ color: colors.textSecondary, textAlign: "center" }}
        >
          Agrega tus {type === "asset" ? "activos" : "deudas"} para visualizar
          tu patrimonio.
        </Typography>
      </View>
    );
  }

  return (
    <View>
      {data.map((item) => (
        <Swipeable
          key={item.id}
          renderRightActions={() => (
            <TouchableOpacity
              style={{
                backgroundColor: colors.error,
                justifyContent: "center",
                alignItems: "center",
                width: 80,
                height: "100%",
                borderTopRightRadius: 12,
                borderBottomRightRadius: 12,
              }}
              onPress={() => onDelete(item.id.toString())}
            >
              <IconSymbol name="trash" size={24} color="#FFF" />
            </TouchableOpacity>
          )}
        >
          <TouchableOpacity
            style={{
              flexDirection: "row",
              alignItems: "center",
              padding: Spacing.m,
              backgroundColor: colors.surface,
              marginBottom: Spacing.s,
              borderRadius: 12,
            }}
            onPress={() => onPress(item)}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor:
                  type === "asset"
                    ? `${colors.primary}20`
                    : `${colors.error}20`,
                justifyContent: "center",
                alignItems: "center",
                marginRight: Spacing.m,
              }}
            >
              <IconSymbol
                name={
                  item.category?.toLowerCase().includes("banco")
                    ? "building.columns"
                    : item.isCrypto
                      ? "bitcoinsign.circle"
                      : type === "asset"
                        ? "arrow.up.circle"
                        : "arrow.down.circle"
                }
                size={24}
                color={type === "asset" ? colors.primary : colors.error}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Typography
                variant="body"
                weight="bold"
                style={{ color: colors.text }}
              >
                {item.name}
              </Typography>
              <Typography
                variant="caption"
                style={{ color: colors.textSecondary }}
              >
                {item.category || "General"}
              </Typography>
            </View>
            <Typography
              variant="body"
              weight="bold"
              style={{ color: colors.text }}
            >
              {formatCurrency(item.amount)}
            </Typography>
          </TouchableOpacity>
        </Swipeable>
      ))}
    </View>
  );
};
