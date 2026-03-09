import { RootState } from "@/store/store";
import { Redirect } from "expo-router";
import { Platform } from "react-native";
import { useSelector } from "react-redux";

export default function Index() {
  console.log("Rendering index screen");
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  if (isAuthenticated) {
    // Redirect to the main app (wallet) if authenticated
    return <Redirect href="/(tabs)/wallet" />;
  }

  if (Platform.OS === "web") {
    return <Redirect href="/landing" />;
  }

  return <Redirect href="/login" />;
}
