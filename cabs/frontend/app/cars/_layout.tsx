import { Stack } from "expo-router";

export default function CarsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#F9FAFB" },
      }}
    />
  );
}
