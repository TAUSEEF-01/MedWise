import React from "react";
import { MaterialIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

import Colors from "@/constants/Colors";
import { useColorScheme } from "@/components/useColorScheme";
import { useClientOnlyValue } from "@/components/useClientOnlyValue";
import "../../global.css";
import { useSafeAreaInsets, SafeAreaView } from "react-native-safe-area-context"; // Add this import

function TabBarIcon(props: {
  name: React.ComponentProps<typeof MaterialIcons>["name"];
  color: string;
}) {
  return <MaterialIcons size={24} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets(); // Get safe area insets


  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#395886",
        tabBarActiveBackgroundColor: "#d5deef",
        tabBarInactiveTintColor: "#D3D3D3",
        headerShown: useClientOnlyValue(false, true),
        tabBarStyle: {
          backgroundColor: "#ffffff",
          borderTopColor: "#e5e7eb",
          paddingBottom: insets.bottom, // Add this line

         // paddingBottom: 8,
          paddingTop: 8,
         // height: 65,
         height: 65 + insets.bottom,   // Adjust height
          borderTopWidth: 0,
          // shadowColor: "#000",
          // shadowOffset: { width: 0, height: -2 },
          // shadowOpacity: 0.1,
          // shadowRadius: 8,
          // elevation: 10,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
          //marginTop: 4,
        },
        headerStyle: {
          backgroundColor: "#ffffff",
          // borderBottomWidth: 1,
          // borderBottomColor: "#e5e7eb",
          // shadowColor: "#000",
          // shadowOffset: { width: 0, height: 2 },
          // shadowOpacity: 0.1,
          // shadowRadius: 8,
          //elevation: 5,
        },
        headerTitleStyle: {
          fontSize: 20,
          fontWeight: "700",
          color: "#1f2937",
          backgroundColor : "f0f3fa"
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
          headerTitle: "📋 Medical Records",
        }}
      />
      <Tabs.Screen
        name="chatbot"
        options={{
          title: "AI Assistant",
          tabBarIcon: ({ color }) => <TabBarIcon name="chat" color={color} />,
          headerTitle: "🤖 Medical AI Assistant",
        }}
      />
      <Tabs.Screen
        name="diseases"
        options={{
          title: "Diseases",
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="medical-services" color={color} />
          ),
          headerTitle: "🔬 Disease Database",
        }}
      />
      <Tabs.Screen
        name="hospitals"
        options={{
          title: "Hospitals",
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="local-hospital" color={color} />
          ),
          headerTitle: "🏥 Nearby Hospitals",
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => <TabBarIcon name="person" color={color} />,
          headerTitle: "👤 Health Profile",
        }}
      />
      <Tabs.Screen
        name="two"
        options={{
          href: null, // Hide this tab
        }}
      />
    </Tabs>
  );
}