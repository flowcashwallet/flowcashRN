import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { setUser } from "@/features/auth/authSlice";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { auth } from "@/services/firebaseConfig";
import { RootState } from "@/store/store";
import {
    DrawerContentScrollView,
    DrawerItem,
    DrawerItemList,
} from "@react-navigation/drawer";
import { LinearGradient } from "expo-linear-gradient";
import { Drawer } from "expo-router/drawer";
import { signOut } from "firebase/auth";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";

function CustomDrawerContent(props: any) {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const handleLogout = async () => {
    try {
      await signOut(auth);
      dispatch(setUser(null));
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
        <LinearGradient
          colors={["#8E2DE2", "#4A00E0"]}
          style={[styles.userInfoSection, { paddingTop: insets.top + 20 }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.userIcon}>
            <IconSymbol name="person.circle.fill" size={60} color="#FFF" />
          </View>
          <Text style={[styles.userName, { color: "#FFF" }]}>
            {user?.email || "Usuario"}
          </Text>
          <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>
            Bienvenido de nuevo
          </Text>
        </LinearGradient>

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
        drawerActiveTintColor: "#4A00E0",
        drawerActiveBackgroundColor: "#F0E6FF",
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
