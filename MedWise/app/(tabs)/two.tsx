import React from "react";
import { View, Text } from "react-native";

// This file can be removed as we're using profile.tsx instead
// Keeping it for now to avoid routing errors

export default function TabTwoScreen() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Text>This tab is deprecated. Use Profile tab instead.</Text>
    </View>
  );
}
