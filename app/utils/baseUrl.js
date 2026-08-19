import Constants from "expo-constants";

export const baseURL =
	Constants.expoConfig?.extra?.apiUrl ?? "http://localhost:5000";