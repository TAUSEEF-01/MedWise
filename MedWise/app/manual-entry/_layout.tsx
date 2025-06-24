import { Stack } from "expo-router";

export default function ManualEntryLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        presentation: "card",
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="basic-info" />
      <Stack.Screen name="healthcare-info" />
      <Stack.Screen name="vital-signs" />
    </Stack>
  );
}