import React, { useState, useEffect } from "react";
import { ScrollView, TouchableOpacity, Alert } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";

import { Text, View } from "@/components/Themed";
import { MedicalRecord } from "@/types/medical";
import { storageUtils } from "@/utils/storage";
import "../../global.css";

export default function MedicalRecordsScreen() {
  const router = useRouter();
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    try {
      const savedRecords = await storageUtils.getMedicalRecords();
      setRecords(savedRecords);
    } catch (error) {
      console.error("Error loading records:", error);
    } finally {
      setLoading(false);
    }
  };

  const addNewRecord = () => {
    Alert.alert("Add Medical Record", "Choose how to add your medical record", [
      { text: "Take Photo", onPress: openCamera },
      { text: "Choose File", onPress: openDocumentPicker },
      { text: "Manual Entry", onPress: () => router.push("/manual-entry") },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const openCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (permission.granted) {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        createRecord("scan", result.assets[0].uri);
      }
    }
  };

  const openDocumentPicker = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["image/*", "application/pdf"],
      copyToCacheDirectory: true,
    });

    if (!result.canceled) {
      createRecord("lab_report", result.assets[0].uri);
    }
  };

  const createRecord = async (
    type: MedicalRecord["type"],
    fileUri?: string
  ) => {
    const newRecord: MedicalRecord = {
      id: Date.now().toString(),
      date: new Date(),
      title: `New ${type.replace("_", " ")}`,
      type,
      fileUri,
      description: "Click to add description",
    };

    try {
      await storageUtils.saveMedicalRecord(newRecord);
      setRecords((prev) => [newRecord, ...prev]);
    } catch (error) {
      console.error("Error saving record:", error);
      Alert.alert("Error", "Failed to save medical record");
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getRecordIcon = (type: MedicalRecord["type"]) => {
    switch (type) {
      case "lab_report":
        return "assignment";
      case "prescription":
        return "local-pharmacy";
      case "scan":
        return "scanner";
      case "consultation":
        return "person";
      default:
        return "description";
    }
  };

  const getTypeColor = (type: MedicalRecord["type"]) => {
    switch (type) {
      case "lab_report":
        return "bg-blue-100 text-blue-800";
      case "prescription":
        return "bg-green-100 text-green-800";
      case "scan":
        return "bg-purple-100 text-purple-800";
      case "consultation":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <MaterialIcons name="hourglass-empty" size={48} color="#9ca3af" />
        <Text className="text-gray-600 mt-4">Loading records...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Stats Header */}
      <View className="bg-white p-4 border-b border-gray-200">
        <View className="flex-row justify-between">
          <View className="items-center">
            <Text className="text-2xl font-bold text-blue-600">
              {records.length}
            </Text>
            <Text className="text-sm text-gray-600">Total Records</Text>
          </View>
          <View className="items-center">
            <Text className="text-2xl font-bold text-green-600">
              {records.filter((r) => r.type === "lab_report").length}
            </Text>
            <Text className="text-sm text-gray-600">Lab Reports</Text>
          </View>
          <View className="items-center">
            <Text className="text-2xl font-bold text-purple-600">
              {records.filter((r) => r.type === "prescription").length}
            </Text>
            <Text className="text-sm text-gray-600">Prescriptions</Text>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
        {records.length === 0 ? (
          <View className="flex-1 items-center justify-center py-20">
            <View className="w-24 h-24 bg-blue-100 rounded-full items-center justify-center mb-6">
              <MaterialIcons name="folder-open" size={48} color="#2563eb" />
            </View>
            <Text className="text-xl font-semibold text-gray-900 mb-2">
              No medical records yet
            </Text>
            <Text className="text-gray-600 text-center mb-8 px-8">
              Add your first medical record to start tracking your health
              journey
            </Text>
            <TouchableOpacity
              onPress={addNewRecord}
              className="bg-blue-600 px-6 py-3 rounded-xl flex-row items-center"
            >
              <MaterialIcons name="add" size={20} color="white" />
              <Text className="text-white font-semibold ml-2">
                Add First Record
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="space-y-3">
            {records.map((record) => (
              <TouchableOpacity
                key={record.id}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
              >
                <View className="flex-row items-start justify-between mb-3">
                  <View className="flex-row items-center flex-1">
                    <View className="w-12 h-12 bg-blue-100 rounded-lg items-center justify-center mr-3">
                      <MaterialIcons
                        name={getRecordIcon(record.type)}
                        size={24}
                        color="#2563eb"
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-lg font-semibold text-gray-900 mb-1">
                        {record.title}
                      </Text>
                      <Text className="text-sm text-gray-500">
                        {formatDate(record.date)}
                      </Text>
                    </View>
                  </View>
                  <View
                    className={`px-2 py-1 rounded-full ${getTypeColor(
                      record.type
                    )}`}
                  >
                    <Text className="text-xs font-medium capitalize">
                      {record.type.replace("_", " ")}
                    </Text>
                  </View>
                </View>

                {record.description && (
                  <Text
                    className="text-gray-700 text-sm leading-5"
                    numberOfLines={2}
                  >
                    {record.description}
                  </Text>
                )}

                {record.doctorName && (
                  <View className="flex-row items-center mt-2">
                    <MaterialIcons name="person" size={16} color="#6b7280" />
                    <Text className="text-sm text-gray-600 ml-1">
                      {record.doctorName}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        onPress={addNewRecord}
        className="absolute bottom-6 right-6 w-14 h-14 bg-blue-600 rounded-full items-center justify-center shadow-lg"
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        <MaterialIcons name="add" size={28} color="white" />
      </TouchableOpacity>
    </View>
  );
}
