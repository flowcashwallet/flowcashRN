import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { logout } from "@/features/auth/authSlice";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { AppDispatch, RootState } from "@/store/store";
import {
  DrawerContentScrollView,
  DrawerItem,
  DrawerItemList,
} from "@react-navigation/drawer";
import { Drawer } from "expo-router/drawer";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";

function CustomDrawerContent(props: any) {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const handleLogout = async () => {
    try {
      await dispatch(logout());
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={{ paddingTop: 0 }}
      >
        <View
          style={[
            styles.userInfoSection,
            {
              paddingTop: insets.top + 20,
              backgroundColor: colors.surfaceHighlight, // Solid dark header
            },
          ]}
        >
          <View style={styles.userIcon}>
            <IconSymbol
              name="person.circle.fill"
              size={60}
              color={colors.primary}
            />
          </View>
          <Text style={[styles.userName, { color: colors.text }]}>
            {user?.username || user?.email || "Usuario"}
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
            {user?.email || "Bienvenido de nuevo"}
          </Text>
        </View>

        <View style={{ paddingVertical: 10 }}>
          <DrawerItemList {...props} />
        </View>
      </DrawerContentScrollView>

      <View
        style={{
          paddingBottom: insets.bottom + 20,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingTop: 10,
        }}
      >
        <DrawerItem
          label="Cerrar Sesión"
          onPress={handleLogout}
          labelStyle={{ color: colors.error, fontWeight: "bold" }}
          icon={({ size }) => (
            <IconSymbol
              name="arrow.right.circle.fill"
              size={size}
              color={colors.error}
            />
          )}
        />
      </View>
    </View>
  );
}

export default function DrawerLayout() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  return (
    <Drawer
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerActiveTintColor: colors.primary,
        drawerActiveBackgroundColor: colors.surfaceActive, // Dark active state
        drawerInactiveTintColor: colors.text,
        drawerLabelStyle: {
          fontWeight: "600",
        },
        drawerItemStyle: {
          borderRadius: 12,
          marginHorizontal: 16,
          marginVertical: 4,
        },
      }}
    >
      <Drawer.Screen
        name="(tabs)"
        options={{
          drawerLabel: "Inicio",
          drawerIcon: ({ color, size }) => (
            <IconSymbol name="house.fill" size={size} color={color} />
          ),
          headerShown: false,
        }}
      />
    </Drawer>
  );
}

const styles = StyleSheet.create({
  userInfoSection: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    marginBottom: 10,
    justifyContent: "center",
  },
  userIcon: {
    marginBottom: 10,
  },
  userName: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
});
