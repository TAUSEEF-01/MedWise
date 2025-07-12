import React from "react";
import { ScrollView, View, Text } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";

const sectionIcons: Record<string, string> = {
  report_type: "description",
  date: "calendar-today",
  doctor: "person",
  patient: "person-outline",
  diagnosis: "medical-services",
  prescriptions: "medication",
  advice: "lightbulb",
  next_appointment: "schedule",
  contact: "call",
  allergies: "warning",
  past_medical_history: "history",
  lab_results: "science",
  complaints: "report-problem",
  examination: "fact-check",
  plan: "assignment",
};

function renderValue(key: string, value: any) {
  if (Array.isArray(value)) {
    if (value.length === 0) return <Text className="text-gray-400">None</Text>;
    return value.map((item, idx) =>
      typeof item === "object" ? (
        <View key={idx} className="mb-2">
          {Object.entries(item).map(([k, v]) => (
            <Text key={k} className="text-gray-700 text-sm">
              <Text className="font-semibold">{k}: </Text>
              {String(v)}
            </Text>
          ))}
        </View>
      ) : (
        <Text key={idx} className="text-gray-700 text-sm">
          • {String(item)}
        </Text>
      )
    );
  }
  if (typeof value === "object" && value !== null) {
    return Object.entries(value).map(([k, v]) => (
      <Text key={k} className="text-gray-700 text-sm">
        <Text className="font-semibold">{k}: </Text>
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
      <View className="flex-1 items-center justify-center bg-gray-50">
        <MaterialIcons name="report" size={48} color="#9ca3af" />
        <Text className="text-gray-600 mt-4">No report data found.</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50 p-4">
      <Text className="text-2xl font-bold mb-6 text-blue-700 text-center">
        Report Details
      </Text>
      {Object.entries(reportData).map(([key, value]) => (
        <View
          key={key}
          className="mb-4 rounded-2xl bg-white shadow-sm border border-blue-100 p-4"
          style={{
            elevation: 2,
            shadowColor: "#395886",
            shadowOpacity: 0.08,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 2 },
          }}
        >
          <View className="flex-row items-center mb-2">
            <MaterialIcons
              name={sectionIcons[key] || "info"}
              size={22}
              color="#395886"
              style={{ marginRight: 8 }}
            />
            <Text className="text-lg font-bold text-blue-700 capitalize">
              {key.replace(/_/g, " ")}
            </Text>
          </View>
          <View className="ml-2">{renderValue(key, value)}</View>
        </View>
      ))}
    </ScrollView>
  );
}
