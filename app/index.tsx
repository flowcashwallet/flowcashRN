import { Redirect } from "expo-router";
import { Platform } from "react-native";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";

export default function Index() {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  if (isAuthenticated) {
    return <Redirect href="/(drawer)/(tabs)/budget" />;
  }

  if (Platform.OS === "web") {
    return <Redirect href="/landing" />;
  }
  
  return <Redirect href="/login" />;
}
