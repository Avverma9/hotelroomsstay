import { Platform } from "react-native";
import Constants from "expo-constants";

const PROD_API_URL = "https://hotelroomsstay.com/api";
const LOCAL_LAN_API_URL = "http://192.168.29.183:5000";
const LOCAL_API_PORT = 5000;

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function getExpoHost() {
  const expoConfig = Constants.expoConfig as any;
  const hostUri =
    expoConfig?.hostUri ||
    (Constants as any).manifest2?.debuggerHost ||
    (Constants as any).manifest?.debuggerHost;

  if (!hostUri || typeof hostUri !== "string") return null;

  return hostUri.split(":")[0];
}

const envApiUrl = (globalThis as any)?.process?.env?.EXPO_PUBLIC_API_URL?.trim?.();
const expoHost = getExpoHost();

export const baseUrl = trimTrailingSlash(
  envApiUrl ||
    LOCAL_LAN_API_URL ||
    (expoHost ? `http://${expoHost}:${LOCAL_API_PORT}` : "") ||
    (Platform.OS === "android"
      ? `http://10.0.2.2:${LOCAL_API_PORT}`
      : Platform.OS === "ios"
        ? `http://localhost:${LOCAL_API_PORT}`
        : PROD_API_URL),
);

