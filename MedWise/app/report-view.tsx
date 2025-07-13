import React from "react";
import { ScrollView, View, Text } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";

// Enhanced section icons with better visual mapping
const sectionIcons: Record<string, string> = {
  report_type: "article",
  date: "event",
  doctor: "local-hospital",
  patient: "person",
  diagnosis: "health-and-safety",
  prescriptions: "local-pharmacy",
  advice: "tips-and-updates",
  next_appointment: "event-available",
  contact: "contact-phone",
  allergies: "warning-amber",
  past_medical_history: "history-edu",
  lab_results: "biotech",
  complaints: "report",
  examination: "search",
  plan: "assignment-turned-in",
};

// Color scheme for different sections
const sectionColors: Record<string, string> = {
  report_type: "#6366f1", // Indigo
  date: "#8b5cf6", // Purple
  doctor: "#06b6d4", // Cyan
  patient: "#10b981", // Emerald
  diagnosis: "#f59e0b", // Amber
  prescriptions: "#ef4444", // Red
  advice: "#84cc16", // Lime
  next_appointment: "#3b82f6", // Blue
  contact: "#6b7280", // Gray
  allergies: "#f97316", // Orange
  past_medical_history: "#8b5cf6", // Purple
  lab_results: "#14b8a6", // Teal
  complaints: "#dc2626", // Red
  examination: "#059669", // Emerald
  plan: "#7c3aed", // Violet
};

function renderValue(key: string, value: any) {
  if (Array.isArray(value)) {
    if (value.length === 0) return <Text className="text-gray-500 italic">None</Text>;
    return value.map((item, idx) => (
      <View key={idx} className="mb-2">
        {typeof item === "object" ? (
          Object.entries(item).map(([k, v]) => (
            <Text key={k} className="text-gray-700 text-sm leading-6">
        <Text style={{ fontWeight: "600", color: "#395886" }}>{k}: </Text>
        {String(v)}
            </Text>
          ))
        ) : (
          <Text className="text-gray-700 text-sm leading-6">
            <Text className="text-blue-500">• </Text>
            {String(item)}
          </Text>
        )}
      </View>
    ));
  }

  if (typeof value === "object" && value !== null) {
    return Object.entries(value).map(([k, v]) => (
      <Text key={k} className="text-gray-700 text-sm leading-6">
        <Text style={{ fontWeight: "600", color: "#395886" }}>{k}: </Text>
        {String(v)}
      </Text>

    ));
  }

  return (
    <Text className="text-gray-700 text-base">
      {value === null || value === "" ? "None" : String(value)}
    </Text>
  );
}

export default function ReportViewScreen() {
  const { report } = useLocalSearchParams();
  let reportData: any = null;

  try {
    reportData = typeof report === "string" ? JSON.parse(report) : report;
  } catch {
    reportData = null;
  }

  if (!reportData) {
    return (
      <View className="flex-1 items-center justify-center bg-[#f0f3fa]">
        <View
          className="rounded-full p-6 mb-4"
          style={{ backgroundColor: '#f3f4f6' }}
        >
          <MaterialIcons name="report" size={60} color="#9ca3af" />
        </View>
        <Text className="text-gray-600 mt-4 text-lg font-medium">
          No report data found.
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#f0f3fa]">
      <View className="px-5 pt-8 pb-6 bg-white border-b border-gray-200">
        <Text className="text-2xl font-bold text-black">
          Report Details
        </Text>
      </View>

      <ScrollView className="flex-1 p-5">
        {Object.entries(reportData).map(([key, value]) => {
          const iconName = sectionIcons[key] || "info";
          const iconColor = sectionColors[key] || "#1e3a8a";

          return (
            <View
              key={key}
              className="mb-5 rounded-2xl bg-white shadow-md border border-[#395886] p-5"
              style={{
                shadowColor: "#1e3a8a",
                shadowOpacity: 0.15,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 4 },
                elevation: 5,
              }}
            >
              <View className="flex-row items-center mb-3">
                {/* Enhanced icon container with background and better styling */}
                <View
                  className="rounded-full p-2 mr-3"
                  style={{
                    backgroundColor: iconColor + '20', // 20% opacity background
                    borderWidth: 2,
                    borderColor: iconColor + '40', // 40% opacity border
                  }}
                >
                  <MaterialIcons
                    name={iconName}
                    size={28}
                    color={iconColor}
                  />
                </View>

                <Text
                  className="text-xl font-semibold capitalize flex-1 text-black"
                >
                  {key.replace(/_/g, " ")}
                </Text>
              </View>

              <View className="ml-3">
                {renderValue(key, value)}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}