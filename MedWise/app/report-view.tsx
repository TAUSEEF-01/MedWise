import React, { useState } from "react";
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from "react-native";
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
    if (value.length === 0)
      return <Text className="text-gray-500 italic">None</Text>;
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
  const { report, imageId } = useLocalSearchParams();
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingSection, setEditingSection] = useState<string>("");
  const [editValue, setEditValue] = useState("");
  const [originalValue, setOriginalValue] = useState<any>(null);
  const [objectFields, setObjectFields] = useState<Record<string, string>>({});
  const [reportData, setReportData] = useState<any>(null);

  try {
    // console.log("Parsed Report Data:", report);
    const parsedData = typeof report === "string" ? JSON.parse(report) : report;

    if (!reportData) setReportData(parsedData);
  } catch {
    // ...existing code...
  }

  const formatValueForDisplay = (value: any): string => {
    if (Array.isArray(value)) {
      if (value.length === 0) return "None";
      return value
        .map((item, index) => {
          if (typeof item === "object" && item !== null) {
            return `${index + 1}. ${Object.entries(item)
              .map(([k, v]) => `${k}: ${v}`)
              .join(", ")}`;
          }
          return `${index + 1}. ${String(item)}`;
        })
        .join("\n");
    }

    if (typeof value === "object" && value !== null) {
      return Object.entries(value)
        .map(([k, v]) => `${k}: ${v}`)
        .join("\n");
    }

    return String(value || "None");
  };

  const formatValueForEditing = (value: any): string => {
    if (Array.isArray(value)) {
      if (value.length === 0) return "";
      return value
        .map((item) => {
          if (typeof item === "object" && item !== null) {
            return Object.values(item).join(", ");
          }
          return String(item);
        })
        .join("\n");
    }

    if (typeof value === "object" && value !== null) {
      return Object.values(value).join(", ");
    }

    return String(value || "");
  };

  const parseEditedValue = (
    editedText: string,
    originalValue: any,
    objectFieldValues?: Record<string, string>
  ): any => {
    // If we have object field values, use those instead
    if (objectFieldValues && Object.keys(objectFieldValues).length > 0) {
      const result: any = {};
      Object.keys(originalValue).forEach((key) => {
        result[key] = objectFieldValues[key] || null;
      });
      return result;
    }

    if (!editedText.trim()) return "";

    if (Array.isArray(originalValue)) {
      return editedText
        .split("\n")
        .filter((line) => line.trim())
        .map((line) => {
          const trimmed = line.trim();
          if (
            originalValue.length > 0 &&
            typeof originalValue[0] === "object"
          ) {
            const keys = Object.keys(originalValue[0]);
            if (keys.length === 1) {
              return { [keys[0]]: trimmed };
            }
            const values = trimmed.split(",").map((v) => v.trim());
            const obj: any = {};
            keys.forEach((key, idx) => {
              obj[key] = values[idx] || "";
            });
            return obj;
          }
          return trimmed;
        });
    }

    if (typeof originalValue === "object" && originalValue !== null) {
      const keys = Object.keys(originalValue);
      if (keys.length === 1) {
        return { [keys[0]]: editedText.trim() };
      }
      const values = editedText.split(",").map((v) => v.trim());
      const obj: any = {};
      keys.forEach((key, idx) => {
        obj[key] = values[idx] || "";
      });
      return obj;
    }

    return editedText;
  };

  const handleEditPress = (sectionKey: string, currentValue: any) => {
    setEditingSection(sectionKey);
    setOriginalValue(currentValue);

    // If it's an object, initialize object fields
    if (
      typeof currentValue === "object" &&
      currentValue !== null &&
      !Array.isArray(currentValue)
    ) {
      const fields: Record<string, string> = {};
      Object.entries(currentValue).forEach(([key, value]) => {
        fields[key] = value ? String(value) : "";
      });
      setObjectFields(fields);
      setEditValue(""); // Clear regular edit value for objects
    } else {
      setObjectFields({});
      setEditValue(formatValueForEditing(currentValue));
    }

    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    console.log("Using imageId (_id) for update:", imageId);

    try {
      const parsedValue = parseEditedValue(
        editValue,
        originalValue,
        objectFields
      );

      const updateData = {
        [`analysis_result.${editingSection}`]: parsedValue,
      };

      const response = await fetch(
        `https://medwise-9nv0.onrender.com/api/update-images-details/${imageId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updateData),
        }
      );

      if (response.ok) {
        const updatedData = { ...reportData };
        updatedData[editingSection] = parsedValue;
        setReportData(updatedData);
        setEditModalVisible(false);
        setObjectFields({});
        Alert.alert("Success", "Section updated successfully!");
      } else {
        throw new Error("Failed to update");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to update the section. Please try again.");
    }
  };

  const handleObjectFieldChange = (fieldKey: string, value: string) => {
    setObjectFields((prev) => ({
      ...prev,
      [fieldKey]: value,
    }));
  };

  const isObjectType = (value: any): boolean => {
    return typeof value === "object" && value !== null && !Array.isArray(value);
  };

  const getEditPlaceholder = (value: any): string => {
    if (Array.isArray(value)) {
      return "Enter items, one per line.\nFor multiple values per item, separate with commas.";
    }
    if (typeof value === "object" && value !== null) {
      const keys = Object.keys(value);
      if (keys.length === 1) {
        return "Enter the new value...";
      }
      return `Enter values separated by commas.\nOrder: ${keys.join(", ")}`;
    }
    return "Enter the new value...";
  };

  if (!reportData) {
    return (
      <View className="flex-1 items-center justify-center bg-[#f0f3fa]">
        <View
          className="rounded-full p-6 mb-4"
          style={{ backgroundColor: "#f3f4f6" }}
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
        <Text className="text-2xl font-bold text-black">Report Details</Text>
      </View>

      <ScrollView className="flex-1 p-5">
        {Object.entries(reportData || {}).map(([key, value]) => {
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
                    backgroundColor: iconColor + "20", // 20% opacity background
                    borderWidth: 2,
                    borderColor: iconColor + "40", // 40% opacity border
                  }}
                >
                  <MaterialIcons name={iconName} size={28} color={iconColor} />
                </View>

                <Text className="text-xl font-semibold capitalize flex-1 text-black">
                  {key.replace(/_/g, " ")}
                </Text>

                {/* Edit Button */}
                <TouchableOpacity
                  onPress={() => handleEditPress(key, value)}
                  className="ml-2 p-2 rounded-full"
                  style={{ backgroundColor: iconColor + "20" }}
                >
                  <MaterialIcons name="edit" size={20} color={iconColor} />
                </TouchableOpacity>
              </View>

              <View className="ml-3">{renderValue(key, value)}</View>
            </View>
          );
        })}
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black bg-opacity-50">
          <View className="bg-white rounded-2xl p-6 m-4 w-11/12 max-h-5/6">
            {/* Header */}
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-1">
                <Text className="text-xl font-bold text-black">
                  Edit {editingSection.replace(/_/g, " ")}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setEditModalVisible(false)}
                className="p-2"
              >
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Current Value Box */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Current Value:
              </Text>
              <View className="bg-gray-50 border border-gray-200 rounded-lg p-3 max-h-32">
                <ScrollView>
                  <Text className="text-sm text-gray-800">
                    {formatValueForDisplay(originalValue)}
                  </Text>
                </ScrollView>
              </View>
            </View>

            {/* Edit Input Section */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                New Value:
              </Text>

              {isObjectType(originalValue) ? (
                // Multiple input boxes for object fields
                <ScrollView className="max-h-64">
                  {Object.entries(originalValue).map(
                    ([fieldKey, fieldValue]) => (
                      <View key={fieldKey} className="mb-3">
                        <Text className="text-xs font-medium text-gray-600 mb-1 capitalize">
                          {fieldKey.replace(/_/g, " ")}:
                        </Text>
                        <View className="border border-blue-300 rounded-lg bg-blue-50">
                          <TextInput
                            value={objectFields[fieldKey] || ""}
                            onChangeText={(value) =>
                              handleObjectFieldChange(fieldKey, value)
                            }
                            className="p-3 text-base"
                            placeholder={`Enter ${fieldKey.replace(
                              /_/g,
                              " "
                            )}...`}
                            placeholderTextColor="#9CA3AF"
                          />
                        </View>
                      </View>
                    )
                  )}
                </ScrollView>
              ) : (
                // Single input box for non-object fields
                <View className="border border-blue-300 rounded-lg bg-blue-50">
                  <TextInput
                    value={editValue}
                    onChangeText={setEditValue}
                    multiline
                    numberOfLines={6}
                    className="p-3 text-base min-h-32"
                    style={{ textAlignVertical: "top" }}
                    placeholder={getEditPlaceholder(originalValue)}
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              )}
            </View>

            {/* Preview Box */}
            {/* {((editValue.trim() && !isObjectType(originalValue)) ||
              (isObjectType(originalValue) &&
                Object.values(objectFields).some((v) => v.trim()))) && (
              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  Preview:
                </Text>
                <View className="bg-green-50 border border-green-200 rounded-lg p-3 max-h-32">
                  <ScrollView>
                    <Text className="text-sm text-green-800">
                      {formatValueForDisplay(
                        parseEditedValue(editValue, originalValue, objectFields)
                      )}
                    </Text>
                  </ScrollView>
                </View>
              </View>
            )} */}

            {/* Action Buttons */}
            <View className="flex-row justify-end space-x-3">
              <TouchableOpacity
                onPress={() => {
                  if (isObjectType(originalValue)) {
                    const resetFields: Record<string, string> = {};
                    Object.entries(originalValue).forEach(([key, value]) => {
                      resetFields[key] = value ? String(value) : "";
                    });
                    setObjectFields(resetFields);
                  } else {
                    setEditValue(formatValueForEditing(originalValue));
                  }
                }}
                className="px-4 py-3 rounded-lg bg-gray-100 border border-gray-300"
              >
                <Text className="text-gray-700 font-medium">Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setEditModalVisible(false)}
                className="px-4 py-3 rounded-lg bg-gray-200"
              >
                <Text className="text-gray-700 font-medium">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveEdit}
                className="px-6 py-3 rounded-lg"
                style={{
                  backgroundColor: sectionColors[editingSection] || "#1e3a8a",
                }}
              >
                <Text className="text-white font-medium">Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
