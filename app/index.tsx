import { RootState } from "@/store/store";
import { Redirect } from "expo-router";
import { Platform } from "react-native";
import { useSelector } from "react-redux";

export default function Index() {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  if (isAuthenticated) {
    return <Redirect href="/(drawer)/(tabs)" />;
  }

  if (Platform.OS === "web") {
    return <Redirect href="/landing" />;
  }

  return <Redirect href="/login" />;
}
