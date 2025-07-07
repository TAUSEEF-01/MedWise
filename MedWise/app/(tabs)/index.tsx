import React, { useState, useEffect } from "react";
import { ScrollView, TouchableOpacity, Alert, Modal } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";

//import { Text, View } from "@/components/Themed";
import { Text, View } from "react-native";

import { MedicalRecord } from "@/types/medical";
import { storageUtils } from "@/utils/storage";
import { PDFExportService } from "@/utils/pdfExport";
import "../../global.css";
import { StyleSheet } from "react-native";
export default function MedicalRecordsScreen() {
  const router = useRouter();
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);

 // Add these states at the top of your component
const [currentMeds, setCurrentMeds] = useState(2); // Example value
const [missedCount, setMissedCount] = useState(1); // Example value
const [nextMedTime, setNextMedTime] = useState("");

// Medication times (24h format)
const medTimes = ["08:00", "14:00", "22:00"];


// Timer logic
useEffect(() => {
  const updateTimer = () => {
    const now = new Date();
    const todayTimes = medTimes.map(t => {
      const [h, m] = t.split(":").map(Number);
      const d = new Date(now);
      d.setHours(h, m, 0, 0);
      return d;
    });
    let next = todayTimes.find(t => t > now);
    if (!next) {
      next = new Date(now);
      next.setDate(now.getDate() + 1);
      const [h, m] = medTimes[0].split(":").map(Number);
      next.setHours(h, m, 0, 0);
    }
    const diff = next.getTime() - now.getTime();
    const hours = Math.floor(diff / 1000 / 60 / 60);
    const mins = Math.floor((diff / 1000 / 60) % 60);
    const secs = Math.floor((diff / 1000) % 60);
    setNextMedTime(
      `${hours.toString().padStart(2, "0")}:${mins
        .toString()
        .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
    );
  };
  updateTimer();
  const interval = setInterval(updateTimer, 1000);
  return () => clearInterval(interval);
}, []);

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
    setShowAddModal(true);
  };

  const closeAddModal = () => {
    setShowAddModal(false);
  };

  const openCamera = async () => {
    closeAddModal();
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
    closeAddModal();
    const result = await DocumentPicker.getDocumentAsync({
      type: ["image/*", "application/pdf"],
      copyToCacheDirectory: true,
    });

    if (!result.canceled) {
      createRecord("lab_report", result.assets[0].uri);
    }
  };

  const openManualEntry = () => {
    closeAddModal();
    router.push("/manual-entry/basic-info");
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

  const handleRecordPress = (record: MedicalRecord) => {
    setSelectedRecord(record);
    setShowPreview(true);
  };

  const closePreview = () => {
    setShowPreview(false);
    setSelectedRecord(null);
  };

  const handleExportPDF = async () => {
    if (!selectedRecord) return;
    
    setExportingPDF(true);
    try {
      const pdfData = {
        title: selectedRecord.title,
        type: selectedRecord.type,
        description: selectedRecord.description || "",
        doctorName: selectedRecord.doctorName || "",
        hospitalName: selectedRecord.hospitalName || "",
        bloodPressure: selectedRecord.extractedData?.bloodPressure || "",
        heartRate: selectedRecord.extractedData?.heartRate?.toString() || "",
        temperature: selectedRecord.extractedData?.temperature?.toString() || "",
        weight: selectedRecord.extractedData?.weight?.toString() || "",
        height: selectedRecord.extractedData?.height?.toString() || "",
        medications: selectedRecord.extractedData?.medications?.map(m => 
          `${m.name} - ${m.dosage} - ${m.frequency}`
        ).join(", ") || "",
        diagnosis: selectedRecord.extractedData?.diagnosis?.join(", ") || "",
        date: selectedRecord.date
      };
      
      await PDFExportService.exportAndShare(pdfData);
      Alert.alert("Success", "PDF exported successfully!");
    } catch (error) {
      console.error("Error exporting PDF:", error);
      Alert.alert("Error", "Failed to export PDF. Please try again.");
    } finally {
      setExportingPDF(false);
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
      {/* <View className="bg-white p-4 border-b border-gray-200">
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
      </View> */}
<View style={{ backgroundColor: "#f0f3fa", paddingVertical: 12, paddingHorizontal: 8 }}>
  {/* First row */}
  <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
    <View style={styles.card}>
      <MaterialIcons name="folder" size={32} color="#2563eb" style={{ marginBottom: 6 }} />
      <Text style={styles.cardNumber}>{records.length}</Text>
      <Text style={styles.cardLabel}>Medical Records</Text>
    </View>
    <View style={styles.card}>
      <MaterialIcons name="assignment" size={32} color="#059669" style={{ marginBottom: 6 }} />
      <Text style={styles.cardNumber}>
        {records.filter((r) => r.type === "lab_report").length}
      </Text>
      <Text style={styles.cardLabel}>Lab Reports</Text>
    </View>
    <View style={styles.card}>
      <MaterialIcons name="local-pharmacy" size={32} color="#a21caf" style={{ marginBottom: 6 }} />
      <Text style={styles.cardNumber}>
        {records.filter((r) => r.type === "prescription").length}
      </Text>
      <Text style={styles.cardLabel}>Prescriptions</Text>
    </View>
  </View>
       {/* Second row */}
  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
    <View style={styles.card}>
      <MaterialIcons name="medication" size={32} color="#395886" style={{ marginBottom: 6 }} />
      <Text style={styles.cardNumber}>{currentMeds}</Text>
      <Text style={styles.cardLabel}>Current Medicines</Text>
    </View>
    <View style={styles.card}>
      <MaterialIcons name="error-outline" size={32} color="#eab308" style={{ marginBottom: 6 }} />
      <Text style={styles.cardNumber}>{missedCount}</Text>
      <Text style={styles.cardLabel}>Missed Doses</Text>
    </View>
    <View style={styles.card}>
      <MaterialIcons name="timer" size={32} color="#395886" style={{ marginBottom: 6 }} />
      <Text style={styles.cardNumber}>{nextMedTime}</Text>
      <Text style={styles.cardLabel}>Next Medication</Text>
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
                onPress={() => handleRecordPress(record)}
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

      {/* Record Preview Modal */}
      <Modal
        visible={showPreview}
        transparent={true}
        animationType="slide"
        onRequestClose={closePreview}
      >
        <View className="flex-1 bg-black/50">
          <View className="flex-1 bg-white mt-12 rounded-t-3xl">
            {/* Header */}
            <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
              <TouchableOpacity
                onPress={closePreview}
                className="w-8 h-8 items-center justify-center"
              >
                <MaterialIcons name="close" size={24} color="#374151" />
              </TouchableOpacity>
              <Text className="text-lg font-semibold text-gray-900">
                Medical Record Preview
              </Text>
              <TouchableOpacity
                onPress={handleExportPDF}
                disabled={exportingPDF}
                className="bg-blue-600 px-4 py-2 rounded-lg"
              >
                {exportingPDF ? (
                  <MaterialIcons name="hourglass-empty" size={20} color="white" />
                ) : (
                  <MaterialIcons name="file-download" size={20} color="white" />
                )}
              </TouchableOpacity>
            </View>

            {/* Preview Content */}
            <ScrollView className="flex-1 p-4">
              {selectedRecord && (
                <View className="bg-white border border-gray-200 rounded-lg p-6">
                  {/* Header Section */}
                  <View className="border-b border-gray-200 pb-4 mb-4">
                    <Text className="text-2xl font-bold text-gray-900 mb-2">
                      {selectedRecord.title}
                    </Text>
                    <View className="flex-row items-center justify-between">
                      <Text className="text-gray-600">
                        Date: {formatDate(selectedRecord.date)}
                      </Text>
                      <View className={`px-3 py-1 rounded-full ${getTypeColor(selectedRecord.type)}`}>
                        <Text className="text-sm font-medium capitalize">
                          {selectedRecord.type.replace("_", " ")}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Basic Information */}
                  <View className="mb-4">
                    <Text className="text-lg font-semibold text-gray-900 mb-2">
                      Basic Information
                    </Text>
                    {selectedRecord.doctorName && (
                      <View className="flex-row items-center mb-2">
                        <MaterialIcons name="person" size={18} color="#6b7280" />
                        <Text className="text-gray-700 ml-2">
                          Doctor: {selectedRecord.doctorName}
                        </Text>
                      </View>
                    )}
                    {selectedRecord.hospitalName && (
                      <View className="flex-row items-center mb-2">
                        <MaterialIcons name="local-hospital" size={18} color="#6b7280" />
                        <Text className="text-gray-700 ml-2">
                          Hospital: {selectedRecord.hospitalName}
                        </Text>
                      </View>
                    )}
                    {selectedRecord.description && (
                      <View className="mt-2">
                        <Text className="text-gray-700 leading-6">
                          {selectedRecord.description}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Vital Signs */}
                  {selectedRecord.extractedData && (
                    selectedRecord.extractedData.bloodPressure || 
                    selectedRecord.extractedData.heartRate || 
                    selectedRecord.extractedData.temperature || 
                    selectedRecord.extractedData.weight || 
                    selectedRecord.extractedData.height
                  ) && (
                    <View className="mb-4 border-t border-gray-200 pt-4">
                      <Text className="text-lg font-semibold text-gray-900 mb-2">
                        Vital Signs
                      </Text>
                      <View className="space-y-2">
                        {selectedRecord.extractedData.bloodPressure && (
                          <View className="flex-row items-center">
                            <MaterialIcons name="favorite" size={18} color="#ef4444" />
                            <Text className="text-gray-700 ml-2">
                              Blood Pressure: {selectedRecord.extractedData.bloodPressure}
                            </Text>
                          </View>
                        )}
                        {selectedRecord.extractedData.heartRate && (
                          <View className="flex-row items-center">
                            <MaterialIcons name="monitor-heart" size={18} color="#f59e0b" />
                            <Text className="text-gray-700 ml-2">
                              Heart Rate: {selectedRecord.extractedData.heartRate} bpm
                            </Text>
                          </View>
                        )}
                        {selectedRecord.extractedData.temperature && (
                          <View className="flex-row items-center">
                            <MaterialIcons name="device-thermostat" size={18} color="#10b981" />
                            <Text className="text-gray-700 ml-2">
                              Temperature: {selectedRecord.extractedData.temperature}°F
                            </Text>
                          </View>
                        )}
                        {selectedRecord.extractedData.weight && (
                          <View className="flex-row items-center">
                            <MaterialIcons name="monitor-weight" size={18} color="#8b5cf6" />
                            <Text className="text-gray-700 ml-2">
                              Weight: {selectedRecord.extractedData.weight} lbs
                            </Text>
                          </View>
                        )}
                        {selectedRecord.extractedData.height && (
                          <View className="flex-row items-center">
                            <MaterialIcons name="height" size={18} color="#06b6d4" />
                            <Text className="text-gray-700 ml-2">
                              Height: {selectedRecord.extractedData.height} ft
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  )}

                  {/* Medications */}
                  {selectedRecord.extractedData?.medications && selectedRecord.extractedData.medications.length > 0 && (
                    <View className="mb-4 border-t border-gray-200 pt-4">
                      <Text className="text-lg font-semibold text-gray-900 mb-2">
                        Medications
                      </Text>
                      <View className="space-y-2">
                        {selectedRecord.extractedData.medications.map((medication, index) => (
                          <View key={index} className="flex-row items-start">
                            <MaterialIcons name="medication" size={18} color="#059669" />
                            <View className="ml-2 flex-1">
                              <Text className="text-gray-900 font-medium">
                                {medication.name}
                              </Text>
                              <Text className="text-gray-600 text-sm">
                                {medication.dosage} - {medication.frequency}
                                {medication.duration && ` for ${medication.duration}`}
                              </Text>
                            </View>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Diagnosis */}
                  {selectedRecord.extractedData?.diagnosis && selectedRecord.extractedData.diagnosis.length > 0 && (
                    <View className="mb-4 border-t border-gray-200 pt-4">
                      <Text className="text-lg font-semibold text-gray-900 mb-2">
                        Diagnosis
                      </Text>
                      <View className="space-y-2">
                        {selectedRecord.extractedData.diagnosis.map((diagnosis, index) => (
                          <View key={index} className="flex-row items-start">
                            <MaterialIcons name="medical-services" size={18} color="#dc2626" />
                            <Text className="text-gray-700 ml-2 flex-1">
                              {diagnosis}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Footer */}
                  <View className="border-t border-gray-200 pt-4 mt-4">
                    <Text className="text-sm text-gray-500 text-center">
                      This document was generated by MedWise App
                    </Text>
                    <Text className="text-sm text-gray-500 text-center mt-1">
                      Record ID: {selectedRecord.id}
                    </Text>
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Custom Add Record Modal */}
      <Modal
        visible={showAddModal}
        transparent={true}
        animationType="slide"
        onRequestClose={closeAddModal}
      >
        <TouchableOpacity
          className="flex-1 bg-black/50 justify-end"
          activeOpacity={1}
          onPress={closeAddModal}
        >
          <TouchableOpacity
            activeOpacity={1}
            className="bg-white rounded-t-3xl p-6"
            onPress={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <View className="w-12 h-1 bg-gray-300 rounded-full self-center mb-4" />

            <Text className="text-xl font-bold text-gray-900 text-center mb-2">
              Add Medical Record
            </Text>
            <Text className="text-gray-600 text-center mb-6">
              Choose how to add your medical record
            </Text>

            <View className="space-y-4">
              <TouchableOpacity
                onPress={openCamera}
                className="flex-row items-center bg-blue-50 p-4 rounded-2xl border border-blue-200 active:bg-blue-100"
              >
                <View className="w-12 h-12 bg-blue-500 rounded-full items-center justify-center">
                  <MaterialIcons name="camera-alt" size={24} color="white" />
                </View>
                <View className="ml-4 flex-1">
                  <Text className="text-gray-900 font-semibold text-lg">
                    Take Photo
                  </Text>
                  <Text className="text-gray-600 text-sm">
                    Capture document with camera
                  </Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color="#9ca3af" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={openDocumentPicker}
                className="flex-row items-center bg-green-50 p-4 rounded-2xl border border-green-200 active:bg-green-100"
              >
                <View className="w-12 h-12 bg-green-500 rounded-full items-center justify-center">
                  <MaterialIcons name="upload-file" size={24} color="white" />
                </View>
                <View className="ml-4 flex-1">
                  <Text className="text-gray-900 font-semibold text-lg">
                    Choose File
                  </Text>
                  <Text className="text-gray-600 text-sm">
                    Select from device storage
                  </Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color="#9ca3af" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={openManualEntry}
                className="flex-row items-center bg-purple-50 p-4 rounded-2xl border border-purple-200 active:bg-purple-100"
              >
                <View className="w-12 h-12 bg-purple-500 rounded-full items-center justify-center">
                  <MaterialIcons name="edit" size={24} color="white" />
                </View>
                <View className="ml-4 flex-1">
                  <Text className="text-gray-900 font-semibold text-lg">
                    Manual Entry
                  </Text>
                  <Text className="text-gray-600 text-sm">
                    Fill in details manually
                  </Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={closeAddModal}
              className="mt-6 bg-gray-100 py-4 rounded-2xl active:bg-gray-200"
            >
              <Text className="text-gray-700 font-semibold text-center text-lg">
                Cancel
              </Text>
            </TouchableOpacity>

            {/* Safe area for bottom */}
            <View className="h-6" />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

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


// Add these styles at the bottom of your file (outside your component)
const styles =StyleSheet.create( {
  card: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 6,
    paddingVertical: 18,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  cardNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 2,
  },
  cardLabel: {
    fontSize: 14,
    color: "#334155",
    textAlign: "center",
  },
});