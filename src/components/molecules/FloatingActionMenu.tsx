import { Typography } from "@/components/atoms/Typography";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { BorderRadius, Spacing } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

interface ActionItem {
  id: string;
  label: string;
  icon: string;
  onPress: () => void;
  color?: string;
}

interface FloatingActionMenuProps {
  actions: ActionItem[];
}

export function FloatingActionMenu({ actions }: FloatingActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { colors, theme } = useTheme();

  const toggleMenu = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsOpen(!isOpen);
  };

  const handlePress = (action: ActionItem) => {
    Haptics.selectionAsync();
    setIsOpen(false);
    // Small delay to allow close animation to start/finish smoothly
    setTimeout(() => {
      action.onPress();
    }, 100);
  };

  return (
    <>
      <Modal visible={isOpen} transparent animationType="none">
        <Pressable style={styles.overlay} onPress={toggleMenu}>
          <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(200)}
            style={[
              styles.backdrop,
              { backgroundColor: "rgba(0,0,0,0.2)" }, // Dimmed background
            ]}
          />
        </Pressable>

        {/* Menu Container positioned above the FAB */}
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          style={[
            styles.menuContainer,
            {
              bottom: 90, // Position above the FAB
              right: 20,
              backgroundColor:
                Platform.OS === "ios" ? "transparent" : colors.surface,
              shadowColor: "#000",
              shadowOpacity: 0.15,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: 4 },
            },
          ]}
        >
          <BlurView
            intensity={Platform.OS === "ios" ? 80 : 0}
            tint={theme === "dark" ? "dark" : "light"}
            style={styles.blurContainer}
          >
            {actions.map((action, index) => (
              <TouchableOpacity
                key={action.id}
                onPress={() => handlePress(action)}
                style={[
                  styles.actionItem,
                  {
                    borderBottomWidth: index < actions.length - 1 ? 0.5 : 0,
                    borderBottomColor: colors.border,
                  },
                ]}
              >
                <Typography variant="body" weight="medium">
                  {action.label}
                </Typography>
                <IconSymbol
                  name={action.icon as any}
                  size={20}
                  color={action.color || colors.text}
                />
              </TouchableOpacity>
            ))}
          </BlurView>
        </Animated.View>
      </Modal>

      <Pressable
        onPress={toggleMenu}
        style={[
          styles.fab,
          {
            backgroundColor: colors.primary,
            shadowColor: colors.primary,
          },
        ]}
      >
        <Animated.View
          style={{
            justifyContent: "center",
            alignItems: "center",
            transform: [{ rotate: isOpen ? "45deg" : "0deg" }],
          }}
        >
          <IconSymbol name="plus" size={30} color="#FFFFFF" />
        </Animated.View>
      </Pressable>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    alignItems: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  menuContainer: {
    position: "absolute",
    width: 220,
    borderRadius: BorderRadius.l,
    overflow: "hidden",
  },
  blurContainer: {
    paddingVertical: Spacing.xs,
  },
  actionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between", // Text left, Icon right (iOS style)
    paddingVertical: 12,
    paddingHorizontal: Spacing.m,
  },
  fab: {
    position: "absolute",
    bottom: 100,
    right: 25,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 1000,
  },
});
