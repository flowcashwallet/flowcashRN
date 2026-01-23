import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { setUser } from "@/features/auth/authSlice";
import { auth } from "@/services/firebaseConfig";
import { RootState } from "@/store/store";
import {
  DrawerContentScrollView,
  DrawerItem,
  DrawerItemList,
} from "@react-navigation/drawer";
import { Drawer } from "expo-router/drawer";
import { signOut } from "firebase/auth";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function CustomDrawerContent(props: any) {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      dispatch(setUser(null));
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  return (
    <View style={{ flex: 1 }}>
        <DrawerContentScrollView {...props} contentContainerStyle={{ paddingTop: 0 }}>
             <View style={[styles.userInfoSection, { paddingTop: insets.top + 20 }]}>
                <Text style={[styles.userName, { color: Colors[colorScheme ?? "light"].text }]}>
                    {user?.email || "Usuario"}
                </Text>
            </View>
            <DrawerItemList {...props} />
        </DrawerContentScrollView>
        <View style={{ paddingBottom: insets.bottom + 20, borderTopWidth: 1, borderTopColor: Colors[colorScheme ?? "light"].icon }}>
             <DrawerItem
                label="Cerrar Sesión"
                onPress={handleLogout}
                labelStyle={{ color: '#ff4444' }}
             />
        </View>
    </View>
  );
}

export default function DrawerLayout() {
  const colorScheme = useColorScheme();

  return (
    <Drawer
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerActiveTintColor: Colors[colorScheme ?? "light"].tint,
        drawerType: 'front',
      }}
    >
      <Drawer.Screen
        name="(tabs)"
        options={{
          drawerLabel: "Inicio",
          headerShown: false,
        }}
      />
    </Drawer>
  );
}

const styles = StyleSheet.create({
    userInfoSection: {
        paddingHorizontal: 20,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
        marginBottom: 10,
        justifyContent: 'center',
    },
    userName: {
        fontSize: 18,
        fontWeight: 'bold',
    },
});
