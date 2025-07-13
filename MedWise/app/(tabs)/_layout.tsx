import React from "react";
import { MaterialIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/components/useColorScheme";
import { useClientOnlyValue } from "@/components/useClientOnlyValue";
import "../../global.css";
import {
  useSafeAreaInsets,
  SafeAreaView,
} from "react-native-safe-area-context";
import { StyleSheet } from "react-native";

function TabBarIcon(props: {
  name: React.ComponentProps<typeof MaterialIcons>["name"];
  color: string;
}) {
  return <MaterialIcons size={24} style={{ marginBottom: -3 }} {...props} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f3fa",
  },
});

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={styles.container}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: "#395886",
          tabBarActiveBackgroundColor: "#d5deef",
          tabBarInactiveTintColor: "#D3D3D3",
          headerShown: false,
          tabBarStyle: {
            backgroundColor: "#ffffff",
            borderTopColor: "#e5e7eb",
            paddingBottom: insets.bottom,
            paddingTop: 8,
            height: 65 + insets.bottom,
            borderTopWidth: 0,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: "600",
          },
          headerStyle: {
            backgroundColor: "#ffffff",
          },
          headerTitleStyle: {
            fontSize: 20,
            fontWeight: "700",
            color: "#1f2937",
            backgroundColor: "f0f3fa",
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Records",
            tabBarIcon: ({ color }) => (
              <TabBarIcon name="folder-open" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="chatbot"
          options={{
            title: "AI Assistant",
            tabBarIcon: ({ color }) => <TabBarIcon name="chat" color={color} />,
          }}
        />
        <Tabs.Screen
          name="diseases"
          options={{
            title: "Diseases",
            tabBarIcon: ({ color }) => (
              <TabBarIcon name="medical-services" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="hospitals"
          options={{
            title: "Hospitals",
            tabBarIcon: ({ color }) => (
              <TabBarIcon name="local-hospital" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color }) => <TabBarIcon name="person" color={color} />,
          }}
        />
        <Tabs.Screen
          name="two"
          options={{
            href: null,
          }}
        />
      </Tabs>
    </SafeAreaView>
  );
}
   