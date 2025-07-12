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
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(
    null
  );
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
      const todayTimes = medTimes.map((t) => {
        const [h, m] = t.split(":").map(Number);
        const d = new Date(now);
        d.setHours(h, m, 0, 0);
        return d;
      });
      let next = todayTimes.find((t) => t > now);
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
      const selectedFile = result.assets[0];

      // Log file object for debugging
      console.log("Uploading file:", selectedFile);

      // Correct file object for FormData
      const fileObj = {
        uri: selectedFile.uri,
        type: selectedFile.mimeType || "image/jpeg",
        name: selectedFile.name || "image.jpg",
      };

      const formData = new FormData();
      formData.append("file", fileObj);

      try {
        // Show loading state
        Alert.alert("Processing", "Uploading and analyzing your document...");

        // IMPORTANT:
        // - Make sure your backend is running with: uvicorn main:app --host 0.0.0.0 --port 8000
        // - Replace the IP below with your computer's actual LAN IP (check with ipconfig/ifconfig)
        // - Confirm you can access http://192.168.50.242:8000/docs from your phone's browser
        // - If using Android emulator, use http://192.168.50.242:8000/gemini/upload-image/

        const backendUrl = "http://192.168.50.242:8000/gemini/upload-image/";

        // Check backend accessibility
        // You can uncomment this to test connectivity
        // const testResponse = await fetch(backendUrl.replace("/upload-image/", "/"));
        // console.log("Backend test response:", testResponse.status);

        // Use fetch with FormData, let fetch set the boundary
        const uploadResponse = await fetch(backendUrl, {
          method: "POST",
          headers: {
            // Do NOT manually set Content-Type, let fetch set it for FormData
            // "Content-Type": "multipart/form-data",
          },
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error(`Upload failed: ${uploadResponse.status}`);
        }

        const uploadResult = await uploadResponse.json();
        const imageId = uploadResult.imageId;

        console.log("Upload successful, uploadResult:", uploadResult);
        // Pass the full uploadResult to the analysis-result page
        router.push({
          pathname: "/analysis-result",
          params: { analysisResult: JSON.stringify(uploadResult) },
        });
        // If you want to keep imageId in the URL for reference:
        // router.push({
        //   pathname: "/analysis-result",
        //   params: { imageId, analysisResult: JSON.stringify(uploadResult) }
        // });
      } catch (error) {
        console.error("Upload error:", error);
        Alert.alert(
          "Error",
          "Failed to upload and process the document. Please check your network and try again."
        );
      }
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
        temperature:
          selectedRecord.extractedData?.temperature?.toString() || "",
        weight: selectedRecord.extractedData?.weight?.toString() || "",
        height: selectedRecord.extractedData?.height?.toString() || "",
        medications:
          selectedRecord.extractedData?.medications
            ?.map((m) => `${m.name} - ${m.dosage} - ${m.frequency}`)
            .join(", ") || "",
        diagnosis: selectedRecord.extractedData?.diagnosis?.join(", ") || "",
        date: selectedRecord.date,
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
      {/* Button to view previous image uploads */}
      {/* <TouchableOpacity
        onPress={() => router.push("/image-uploads")}
        className="mx-4 mt-4 mb-2 bg-blue-600 rounded-xl flex-row items-center justify-center py-3"
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.12,
          shadowRadius: 4,
          elevation: 2,
        }}
      >
        <MaterialIcons name="history" size={20} color="white" />
        <Text className="text-white font-semibold ml-2">
          Previous Image Uploads
        </Text>
      </TouchableOpacity> */}

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
      <View
        style={{
          backgroundColor: "#f0f3fa",
          paddingVertical: 12,
          paddingHorizontal: 8,
        }}
      >
        {/* First row */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push("/image-uploads")}
          >
            <MaterialIcons
              name="folder"
              size={32}
              color="#2563eb"
              style={{ marginBottom: 6 }}
            />
            <Text style={styles.cardNumber}>{records.length}</Text>
            <Text style={styles.cardLabel}>Medical Records</Text>
          </TouchableOpacity>
          <View style={styles.card}>
            <MaterialIcons
              name="assignment"
              size={32}
              color="#059669"
              style={{ marginBottom: 6 }}
            />
            <Text style={styles.cardNumber}>
              {records.filter((r) => r.type === "lab_report").length}
            </Text>
            <Text style={styles.cardLabel}>Lab Reports</Text>
          </View>
          <View style={styles.card}>
            <MaterialIcons
              name="local-pharmacy"
              size={32}
              color="#a21caf"
              style={{ marginBottom: 6 }}
            />
            <Text style={styles.cardNumber}>
              {records.filter((r) => r.type === "prescription").length}
            </Text>
            <Text style={styles.cardLabel}>Prescriptions</Text>
          </View>
        </View>
        {/* Second row */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
          <View style={styles.card}>
            <MaterialIcons
              name="medication"
              size={32}
              color="#395886"
              style={{ marginBottom: 6 }}
            />
            <Text style={styles.cardNumber}>{currentMeds}</Text>
            <Text style={styles.cardLabel}>Current Medicines</Text>
          </View>
          <View style={styles.card}>
            <MaterialIcons
              name="error-outline"
              size={32}
              color="#eab308"
              style={{ marginBottom: 6 }}
            />
            <Text style={styles.cardNumber}>{missedCount}</Text>
            <Text style={styles.cardLabel}>Missed Doses</Text>
          </View>
          <View style={styles.card}>
            <MaterialIcons
              name="timer"
              size={32}
              color="#395886"
              style={{ marginBottom: 6 }}
            />
            <Text style={styles.cardNumber}>{nextMedTime}</Text>
            <Text style={styles.cardLabel}>Next Medication</Text>
          </View>
        </View>



        
        {/* Third row - Graphs */}
        <View style={{ flexDirection: "row", justifyContent: "center" }}>
          <TouchableOpacity 
            style={[styles.card, { flex: 0.6 }]}
            onPress={() => router.push("/reading_graph")}
          >
            <MaterialIcons
              name="show-chart"
              size={32}
              color="#dc2626"
              style={{ marginBottom: 6 }}
            />
            <Text style={styles.cardNumber}>📊</Text>
            <Text style={styles.cardLabel}>Health Graphs</Text>
          </TouchableOpacity>
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
                  <MaterialIcons
                    name="hourglass-empty"
                    size={20}
                    color="white"
                  />
                ) : (
                  <MaterialIcons name="file-download" size={20} color="white" />
                )}
              </TouchableOpacity>
            </View>

            {/* Preview Content */}
            <ScrollView className="flex-1 p-4">
              {selectedRecord && (
                <View
                  className="bg-white border-2 border-blue-700 rounded-lg overflow-hidden"
                  style={{ minHeight: 600 }}
                >
                  {/* Header Section - Matching PDF Design */}
                  <View className="p-4" style={{ backgroundColor: "#1e40af" }}>
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center">
                        <View className="bg-white rounded-full px-3 py-1 mr-3">
                          <Text className="text-blue-700 font-bold text-xs">
                            MedWise
                          </Text>
                        </View>
                        <View className="flex-1">
                          <Text className="text-white text-lg font-bold">
                            {selectedRecord.doctorName || "Dr. [Doctor Name]"}
                          </Text>
                          <Text className="text-white/90 text-sm">
                            {selectedRecord.type.replace("_", " ")} Specialist
                          </Text>
                          <Text className="text-white/90 text-sm">
                            MBBS, MD | Medicine, MCPS
                          </Text>
                          <Text className="text-white/80 text-xs mt-1">
                            {selectedRecord.hospitalName ||
                              "Hospital or Department Name Here"}
                          </Text>
                        </View>
                      </View>
                      <View className="items-end">
                        <Text className="text-white/90 text-xs">Date:</Text>
                        <Text className="text-white font-bold text-sm">
                          {formatDate(selectedRecord.date)}
                        </Text>
                      </View>
                    </View>
                    <View className="absolute right-4 top-4">
                      <Text className="text-white/20 text-4xl">🩺</Text>
                    </View>
                  </View>

                  {/* Main Content */}
                  <View className="p-4">
                    <View className="flex-row mb-4">
                      {/* Rx Symbol */}
                      <View className="w-16 items-center mr-4">
                        <Text
                          className="text-blue-700 font-bold text-5xl"
                          style={{ fontFamily: "serif" }}
                        >
                          ℞
                        </Text>
                      </View>

                      {/* Patient Information */}
                      <View className="flex-1">
                        <View className="flex-row flex-wrap">
                          <View className="w-1/2 mb-3">
                            <Text className="text-gray-700 text-sm font-bold">
                              Name:
                            </Text>
                            <Text className="text-blue-700 text-base font-medium">
                              John Doe
                            </Text>
                          </View>
                          <View className="w-1/2 mb-3">
                            <Text className="text-gray-700 text-sm font-bold">
                              Age:
                            </Text>
                            <Text className="text-blue-700 text-base font-medium">
                              35 years
                            </Text>
                          </View>
                          <View className="w-1/2 mb-3">
                            <Text className="text-gray-700 text-sm font-bold">
                              Sex:
                            </Text>
                            <Text className="text-blue-700 text-base font-medium">
                              Male
                            </Text>
                          </View>
                          <View className="w-1/2 mb-3">
                            <Text className="text-gray-700 text-sm font-bold">
                              Address:
                            </Text>
                            <Text className="text-blue-700 text-base font-medium">
                              123 Main Street, City, State 12345
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>

                    {/* Chief Complaint */}
                    <View className="mb-4 border-t-2 border-gray-200 pt-4">
                      <Text className="text-blue-700 text-lg font-bold mb-3 uppercase tracking-wide">
                        Chief Complaint
                      </Text>
                      <View className="bg-blue-50 border border-blue-300 rounded-lg p-4">
                        <Text className="text-gray-800 text-base font-medium">
                          Disease Detected:{" "}
                          {PDFExportService.formatDiseaseTitle(
                            selectedRecord.title
                          )}
                        </Text>
                        {selectedRecord.description && (
                          <Text className="text-gray-700 text-sm mt-2">
                            Additional Notes: {selectedRecord.description}
                          </Text>
                        )}
                      </View>
                    </View>

                    {/* Vital Signs */}
                    {selectedRecord.extractedData &&
                      (selectedRecord.extractedData.bloodPressure ||
                        selectedRecord.extractedData.heartRate ||
                        selectedRecord.extractedData.temperature ||
                        selectedRecord.extractedData.weight ||
                        selectedRecord.extractedData.height) && (
                        <View className="mb-4">
                          <Text className="text-blue-700 text-lg font-bold mb-3 uppercase tracking-wide">
                            Vital Signs
                          </Text>
                          <View className="flex-row flex-wrap">
                            {selectedRecord.extractedData.bloodPressure && (
                              <View className="w-1/2 mb-3">
                                <View className="bg-red-50 border border-red-300 rounded-lg p-3">
                                  <Text className="text-red-700 text-sm font-bold">
                                    Blood Pressure
                                  </Text>
                                  <Text className="text-red-600 text-lg font-bold">
                                    {selectedRecord.extractedData.bloodPressure}
                                  </Text>
                                </View>
                              </View>
                            )}
                            {selectedRecord.extractedData.heartRate && (
                              <View className="w-1/2 mb-3">
                                <View className="bg-orange-50 border border-orange-300 rounded-lg p-3">
                                  <Text className="text-orange-700 text-sm font-bold">
                                    Heart Rate
                                  </Text>
                                  <Text className="text-orange-600 text-lg font-bold">
                                    {selectedRecord.extractedData.heartRate} bpm
                                  </Text>
                                </View>
                              </View>
                            )}
                            {selectedRecord.extractedData.temperature && (
                              <View className="w-1/2 mb-3">
                                <View className="bg-green-50 border border-green-300 rounded-lg p-3">
                                  <Text className="text-green-700 text-sm font-bold">
                                    Temperature
                                  </Text>
                                  <Text className="text-green-600 text-lg font-bold">
                                    {selectedRecord.extractedData.temperature}°F
                                  </Text>
                                </View>
                              </View>
                            )}
                            {selectedRecord.extractedData.weight && (
                              <View className="w-1/2 mb-3">
                                <View className="bg-purple-50 border border-purple-300 rounded-lg p-3">
                                  <Text className="text-purple-700 text-sm font-bold">
                                    Weight
                                  </Text>
                                  <Text className="text-purple-600 text-lg font-bold">
                                    {selectedRecord.extractedData.weight} lbs
                                  </Text>
                                </View>
                              </View>
                            )}
                            {selectedRecord.extractedData.height && (
                              <View className="w-1/2 mb-3">
                                <View className="bg-cyan-50 border border-cyan-300 rounded-lg p-3">
                                  <Text className="text-cyan-700 text-sm font-bold">
                                    Height
                                  </Text>
                                  <Text className="text-cyan-600 text-lg font-bold">
                                    {selectedRecord.extractedData.height} ft
                                  </Text>
                                </View>
                              </View>
                            )}
                          </View>
                        </View>
                      )}

                    {/* Medications */}
                    {selectedRecord.extractedData?.medications &&
                      selectedRecord.extractedData.medications.length > 0 && (
                        <View className="mb-4">
                          <Text className="text-blue-700 text-lg font-bold mb-3 uppercase tracking-wide">
                            ℞ Medications Prescribed
                          </Text>
                          <View className="bg-purple-50 border border-purple-300 rounded-lg p-4">
                            {selectedRecord.extractedData.medications.map(
                              (medication, index) => (
                                <View key={index} className="mb-2">
                                  <Text className="text-gray-800 text-base font-medium">
                                    • {medication.name}
                                  </Text>
                                  <Text className="text-gray-600 text-sm ml-3">
                                    {medication.dosage} - {medication.frequency}
                                    {medication.duration &&
                                      ` for ${medication.duration}`}
                                  </Text>
                                </View>
                              )
                            )}
                          </View>
                        </View>
                      )}

                    {/* Diagnosis */}
                    {selectedRecord.extractedData?.diagnosis &&
                      selectedRecord.extractedData.diagnosis.length > 0 && (
                        <View className="mb-4">
                          <Text className="text-blue-700 text-lg font-bold mb-3 uppercase tracking-wide">
                            Diagnosis
                          </Text>
                          <View className="bg-blue-50 border border-blue-300 rounded-lg p-4">
                            {selectedRecord.extractedData.diagnosis.map(
                              (diagnosis, index) => (
                                <Text
                                  key={index}
                                  className="text-gray-800 text-base leading-6"
                                >
                                  {diagnosis}
                                </Text>
                              )
                            )}
                          </View>
                        </View>
                      )}
                  </View>

                  {/* Footer - Matching PDF Design */}
                  <View
                    className="p-4 flex-row items-center justify-between"
                    style={{ backgroundColor: "#1e40af" }}
                  >
                    <View>
                      <Text className="text-white text-xs">
                        Generated by MedWise App
                      </Text>
                      <Text className="text-white/80 text-xs">
                        Professional Medical Records
                      </Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-white/80 text-xs">
                        Record ID: {selectedRecord.id}
                      </Text>
                      <Text className="text-white/80 text-xs">
                        Visit: medwise.com
                      </Text>
                    </View>
                    <View className="w-10 h-10 bg-white rounded items-center justify-center">
                      <Text className="text-blue-700 text-xs">QR</Text>
                    </View>
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
const styles = StyleSheet.create({
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
