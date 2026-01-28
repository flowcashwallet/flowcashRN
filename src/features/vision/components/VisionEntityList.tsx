import { Typography } from "@/components/atoms/Typography";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { BorderRadius, Colors, Spacing } from "@/constants/theme";
import { VisionEntity } from "@/features/vision/data/visionSlice";
import { useColorScheme } from "@/hooks/use-color-scheme";
import STRINGS from "@/i18n/es.json";
import { formatCurrency } from "@/utils/format";
import React, { useState } from "react";
import {
    LayoutAnimation,
    Platform,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";
import Swipeable from "react-native-gesture-handler/Swipeable";

interface VisionEntityListProps {
  activeTab: "asset" | "liability";
  setActiveTab: (tab: "asset" | "liability") => void;
  assets: VisionEntity[];
  liabilities: VisionEntity[];
  onAddPress: () => void;
  onEntityPress: (entity: VisionEntity) => void;
  onDeleteEntity: (id: string) => void;
  onFilterPress: () => void;
  activeFilterCategory: string | null;
}

const CollapsibleGroup = ({
  title,
  items,
  renderItem,
  colors,
}: {
  title: string;
  items: VisionEntity[];
  renderItem: (item: VisionEntity) => React.ReactNode;
  colors: any;
}) => {
  const [collapsed, setCollapsed] = useState(false);

  const toggleCollapse = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCollapsed(!collapsed);
  };

  if (items.length === 0) return null;

  return (
    <View style={{ marginBottom: Spacing.m }}>
      <TouchableOpacity
        onPress={toggleCollapse}
        activeOpacity={0.7}
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingVertical: Spacing.m,
          paddingHorizontal: Spacing.m,
          backgroundColor: colors.surfaceHighlight,
          borderRadius: BorderRadius.m,
          marginBottom: collapsed ? 0 : Spacing.s,
        }}
      >
        <View
          style={{ flexDirection: "row", alignItems: "center", gap: Spacing.s }}
        >
          <IconSymbol
            name={collapsed ? "chevron.right" : "chevron.down"}
            size={20}
            color={colors.primary}
          />
          <Typography
            variant="body"
            weight="bold"
            style={{
              color: colors.text,
            }}
          >
            {title} ({items.length})
          </Typography>
        </View>
      </TouchableOpacity>
      {!collapsed && (
        <View style={{ marginTop: Spacing.xs }}>
          {items.map((item) => (
            <View key={item.id}>{renderItem(item)}</View>
          ))}
        </View>
      )}
    </View>
  );
};

export const VisionEntityList: React.FC<VisionEntityListProps> = ({
  activeTab,
  setActiveTab,
  assets,
  liabilities,
  onAddPress,
  onEntityPress,
  onDeleteEntity,
  onFilterPress,
  activeFilterCategory,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const renderEntityItem = ({ item }: { item: VisionEntity }) => {
    const isAsset = item.type === "asset";
    const indicatorColor = isAsset ? colors.success : colors.error;

    const renderRightActions = () => (
      <TouchableOpacity
        onPress={() => onDeleteEntity(item.id)}
        style={{
          backgroundColor: colors.error,
          justifyContent: "center",
          alignItems: "center",
          width: 80,
          height: "100%",
          borderTopRightRadius: BorderRadius.l,
          borderBottomRightRadius: BorderRadius.l,
        }}
      >
        <IconSymbol name="trash.fill" size={24} color="#FFF" />
      </TouchableOpacity>
    );

    return (
      <Swipeable
        renderRightActions={renderRightActions}
        containerStyle={{ marginBottom: Spacing.m }}
      >
        <TouchableOpacity
          onPress={() => onEntityPress(item)}
          activeOpacity={0.7}
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              ...Platform.select({
                ios: {
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                },
                android: { elevation: 4 },
              }),
            },
          ]}
        >
          <View style={styles.cardContent}>
            {/* Icon */}
            <View
              style={[
                styles.iconContainer,
                {
                  backgroundColor: isAsset
                    ? "rgba(0, 242, 96, 0.1)"
                    : "rgba(255, 65, 108, 0.1)",
                },
              ]}
            >
              <IconSymbol
                name={isAsset ? "building.columns.fill" : "creditcard.fill"}
                size={20}
                color={indicatorColor}
              />
            </View>

            {/* Content */}
            <View style={{ flex: 1 }}>
              <Typography
                variant="body"
                weight="bold"
                style={{ color: colors.text }}
              >
                {item.name}
              </Typography>
              {item.category && (
                <Typography
                  variant="caption"
                  style={{ color: colors.textSecondary, marginTop: 2 }}
                >
                  {item.category}
                </Typography>
              )}
            </View>

            {/* Amount */}
            <View style={{ alignItems: "flex-end", marginRight: Spacing.s }}>
              <Typography
                variant="body"
                weight="bold"
                style={{ color: colors.text }}
              >
                {formatCurrency(item.amount)}
              </Typography>
              {item.description ? (
                <Typography
                  variant="caption"
                  style={{ color: colors.textSecondary, maxWidth: 100 }}
                  numberOfLines={1}
                >
                  {item.description}
                </Typography>
              ) : null}
            </View>

            {/* Right Edge Indicator */}
            <View
              style={{
                width: 4,
                height: 24,
                backgroundColor: indicatorColor,
                borderRadius: 2,
              }}
            />
          </View>
        </TouchableOpacity>
      </Swipeable>
    );
  };

  const renderSection = (type: "asset" | "liability", data: VisionEntity[]) => {
    // Grouping logic
    let group1: VisionEntity[] = [];
    let group2: VisionEntity[] = [];
    let title1 = "";
    let title2 = "";

    if (type === "asset") {
      group1 = data.filter((item) => !item.isCrypto);
      title1 = "Dinero Fiat";
      group2 = data.filter((item) => item.isCrypto);
      title2 = "Criptomonedas";
    } else {
      group1 = data.filter((item) => item.isCreditCard);
      title1 = "Tarjetas de Crédito";
      group2 = data.filter((item) => !item.isCreditCard);
      title2 = "Deuda General";
    }

    const renderGroup = (title: string, items: VisionEntity[]) => {
      return (
        <CollapsibleGroup
          title={title}
          items={items}
          renderItem={(item) => renderEntityItem({ item })}
          colors={colors}
        />
      );
    };

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Typography variant="h3" weight="bold" style={{ color: colors.text }}>
            {type === "asset"
              ? STRINGS.vision.assets
              : STRINGS.vision.liabilities}
          </Typography>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <TouchableOpacity
              onPress={onFilterPress}
              style={{ marginRight: 12 }}
            >
              <View
                style={[
                  styles.addButton,
                  {
                    backgroundColor: activeFilterCategory
                      ? colors.primary
                      : colors.surfaceHighlight,
                  },
                ]}
              >
                <IconSymbol
                  name={
                    activeFilterCategory
                      ? "line.3.horizontal.decrease.circle.fill"
                      : "line.3.horizontal.decrease.circle"
                  }
                  size={20}
                  color={activeFilterCategory ? "#FFF" : colors.textSecondary}
                />
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={onAddPress}>
              <View
                style={[
                  styles.addButton,
                  {
                    backgroundColor:
                      type === "asset" ? colors.success : colors.error,
                  },
                ]}
              >
                <IconSymbol name="plus" size={20} color="#FFF" />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {data.length === 0 ? (
          <Typography
            variant="caption"
            style={{ fontStyle: "italic", color: colors.textSecondary }}
          >
            {type === "asset"
              ? STRINGS.vision.noAssets
              : STRINGS.vision.noLiabilities}
          </Typography>
        ) : (
          <>
            {renderGroup(title1, group1)}
            {renderGroup(title2, group2)}
          </>
        )}
      </View>
    );
  };

  return (
    <View>
      {/* Tabs Selector */}
      <View style={[styles.tabContainer, { backgroundColor: colors.surface }]}>
        <TouchableOpacity
          style={[
            styles.tab,
            {
              backgroundColor:
                activeTab === "asset" ? colors.surfaceActive : "transparent",
            },
          ]}
          onPress={() => setActiveTab("asset")}
        >
          <Typography
            variant="body"
            weight="bold"
            style={{
              color: activeTab === "asset" ? colors.text : colors.textSecondary,
            }}
          >
            {STRINGS.vision.assets}
          </Typography>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            {
              backgroundColor:
                activeTab === "liability"
                  ? colors.surfaceActive
                  : "transparent",
            },
          ]}
          onPress={() => setActiveTab("liability")}
        >
          <Typography
            variant="body"
            weight="bold"
            style={{
              color:
                activeTab === "liability" ? colors.text : colors.textSecondary,
            }}
          >
            {STRINGS.vision.liabilities}
          </Typography>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === "asset"
        ? renderSection("asset", assets)
        : renderSection("liability", liabilities)}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: Spacing.l,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.s,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  card: {
    borderRadius: BorderRadius.l,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.m,
    overflow: "hidden",
    borderRadius: BorderRadius.l,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.m,
  },
  tabContainer: {
    flexDirection: "row",
    marginBottom: Spacing.m,
    marginHorizontal: Spacing.m,
    borderRadius: BorderRadius.l,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.s,
    alignItems: "center",
    borderRadius: BorderRadius.m,
  },
});
