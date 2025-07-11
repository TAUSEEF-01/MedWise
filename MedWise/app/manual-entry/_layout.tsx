import { Stack } from "expo-router";
import { ManualEntryProvider } from "./ManualEntryContext";

export default function ManualEntryLayout() {
  return (
    <ManualEntryProvider>
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
    </ManualEntryProvider>
  );
}