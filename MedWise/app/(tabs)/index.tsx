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

      // Validate file
      if (!selectedFile.uri) {
        Alert.alert("Error", "Invalid file selected");
        return;
      }

      // Check file size (limit to 10MB)
      if (selectedFile.size && selectedFile.size > 10 * 1024 * 1024) {
        Alert.alert(
          "Error",
          "File too large. Please select a file smaller than 10MB."
        );
        return;
      }

      // Correct file object for FormData
      const fileObj = {
        uri: selectedFile.uri,
        type: selectedFile.mimeType || "image/jpeg",
        name: selectedFile.name || "image.jpg",
      };

      const formData = new FormData();
      formData.append("file", fileObj as any);

      try {
        // Show loading state
        Alert.alert("Processing", "Uploading and analyzing your document...");

        // IMPORTANT: Update these URLs based on your setup
        // For Android emulator: use 10.0.2.2:8000
        // For physical device: use your computer's actual IP address
        // To find your IP: Windows (ipconfig), Mac/Linux (ifconfig)

        const possibleUrls = [
          "https://medwise-9nv0.onrender.com/gemini/upload-image/",
          "https://medwise-9nv0.onrender.com/gemini/upload-image/", // Android emulator
          "https://medwise-9nv0.onrender.com/gemini/upload-image/", // iOS simulator
        ];

        let uploadResponse;
        let lastError;

        // Try multiple URLs
        for (const backendUrl of possibleUrls) {
          try {
            console.log(`Trying URL: ${backendUrl}`);

            // Test connectivity first
            const testResponse = await fetch(
              backendUrl.replace("/upload-image/", "/docs"),
              {
                method: "GET",
                timeout: 5000,
              }
            );

            console.log(
              `Connectivity test for ${backendUrl}: ${testResponse.status}`
            );

            // If connectivity test passes, try the actual upload
            uploadResponse = await fetch(backendUrl, {
              method: "POST",
              headers: {
                // Let fetch set Content-Type for FormData
              },
              body: formData,
              timeout: 30000, // 30 second timeout
            });

            if (uploadResponse.ok) {
              console.log(`Successfully connected to: ${backendUrl}`);
              break;
            } else {
              console.log(
                `HTTP error ${uploadResponse.status} for ${backendUrl}`
              );
              lastError = new Error(
                `HTTP ${uploadResponse.status}: ${uploadResponse.statusText}`
              );
            }
          } catch (error) {
            console.log(`Failed to connect to ${backendUrl}:`, error);
            lastError = error;
            continue;
          }
        }

        if (!uploadResponse || !uploadResponse.ok) {
          throw lastError || new Error("All backend URLs failed");
        }

        const uploadResult = await uploadResponse.json();
        console.log("Upload successful, uploadResult:", uploadResult);

        // Pass the full uploadResult to the analysis-result page
        router.push({
          pathname: "/analysis-result",
          params: { analysisResult: JSON.stringify(uploadResult) },
        });
      } catch (error) {
        console.error("Upload error:", error);

        let errorMessage = "Failed to upload and process the document.";

        if (error.message.includes("Network request failed")) {
          errorMessage =
            "Cannot connect to server. Please check:\n" +
            "1. Your backend server is running\n" +
            "2. You're connected to the same network\n" +
            "3. Firewall is not blocking the connection\n" +
            "4. The IP address in the app matches your computer's IP";
        } else if (error.message.includes("timeout")) {
          errorMessage =
            "Connection timed out. Please check your network connection and try again.";
        }

        Alert.alert("Connection Error", errorMessage);
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
      <View
        style={{
          backgroundColor: "#ffffff",
          paddingVertical: 20,
          paddingHorizontal: 16,
          borderBottomLeftRadius: 24,
          borderBottomRightRadius: 24,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
          elevation: 8,
        }}
      >
        {/* Header */}
        <View style={{ marginBottom: 20 }}>
          <Text style={styles.dashboardTitle}>Health Dashboard</Text>
          <Text style={styles.dashboardSubtitle}>
            Manage your medical records
          </Text>
        </View>

        {/* Main Cards Grid */}
        <View style={styles.cardsContainer}>
          <TouchableOpacity
            style={[styles.card, styles.cardPrimary]}
            onPress={() => router.push("/image-uploads")}
            activeOpacity={0.8}
          >
            <View style={styles.cardIconContainer}>
              <MaterialIcons name="folder-special" size={28} color="#ffffff" />
            </View>
            <Text style={styles.cardLabel}>Medical Records</Text>
            <View style={styles.cardBadge}>
              <Text style={styles.cardBadgeText}>{records.length}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.card, styles.cardSuccess]}
            activeOpacity={0.8}
          >
            <View style={styles.cardIconContainer}>
              <MaterialIcons name="description" size={28} color="#ffffff" />
            </View>
            <Text style={styles.cardLabel}>Lab Reports</Text>
            <View style={styles.cardBadge}>
              <Text style={styles.cardBadgeText}>
                {records.filter((r) => r.type === "lab_report").length}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.card, styles.cardPurple]}
            activeOpacity={0.8}
          >
            <View style={styles.cardIconContainer}>
              <MaterialIcons
                name="medical-services"
                size={28}
                color="#ffffff"
              />
            </View>
            <Text style={styles.cardLabel}>Prescriptions</Text>
            <View style={styles.cardBadge}>
              <Text style={styles.cardBadgeText}>
                {records.filter((r) => r.type === "prescription").length}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.card, styles.cardTeal]}
            activeOpacity={0.8}
          >
            <View style={styles.cardIconContainer}>
              <MaterialIcons name="healing" size={28} color="#ffffff" />
            </View>
            <Text style={styles.cardLabel}>Current Medicines</Text>
            <View style={styles.cardBadge}>
              <Text style={styles.cardBadgeText}>{currentMeds}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Featured Card - Health Graphs */}
        <TouchableOpacity
          style={[styles.featuredCard]}
          onPress={() => router.push("/reading_graph")}
          activeOpacity={0.8}
        >
          <View style={styles.featuredCardContent}>
            <View style={styles.featuredCardLeft}>
              <View style={styles.featuredIconContainer}>
                <MaterialIcons name="show-chart" size={32} color="#ffffff" />
              </View>
              <View style={styles.featuredTextContainer}>
                <Text style={styles.featuredCardTitle}>Health Analytics</Text>
                <Text style={styles.featuredCardSubtitle}>
                  View your health trends and insights
                </Text>
              </View>
            </View>
            <View style={styles.featuredCardRight}>
              <Text style={styles.featuredCardEmoji}>📊</Text>
              <MaterialIcons name="arrow-forward" size={24} color="#ffffff" />
            </View>
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
        {records.length === 0 ? (
          <View className="flex-1 items-center justify-center py-20">
            <View className="w-24 h-24 bg-blue-100 rounded-full items-center justify-center mb-6">
              <MaterialIcons name="folder-open" size={48} color="#395886" />
            </View>
            <Text className="text-xl font-semibold text-gray-900 mb-2">
              No medical records yet
            </Text>
            <Text className="text-gray-600 text-center mb-8 px-8">
              Add your first medical record to start tracking your health
              journey
            </Text>
            {/* <TouchableOpacity
              onPress={addNewRecord}
              className="bg-blue-600 px-6 py-3 rounded-xl flex-row items-center"
            >
              <MaterialIcons name="add" size={20} color="white" />
              <Text className="text-white font-semibold ml-2">
                Add First Record
              </Text>
            </TouchableOpacity> */}
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
        className="absolute bottom-6 right-6 w-14 h-14 rounded-full items-center justify-center shadow-lg"
        style={{
          backgroundColor: "#395886", // ✅ changed from "#2563eb" or "#blue-600"
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
  dashboardTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 4,
  },
  dashboardSubtitle: {
    fontSize: 16,
    color: "#64748b",
  },
  cardsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  card: {
    width: "48%",
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    position: "relative",
    overflow: "hidden",
  },
  cardPrimary: {
    backgroundColor: "#3b82f6",
  },
  cardSuccess: {
    backgroundColor: "#10b981",
  },
  cardPurple: {
    backgroundColor: "#8b5cf6",
  },
  cardTeal: {
    backgroundColor: "#06b6d4",
  },
  cardIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff",
    textAlign: "left",
    lineHeight: 18,
  },
  cardBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: "center",
  },
  cardBadgeText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#ffffff",
  },
  featuredCard: {
    backgroundColor: "#1e293b",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  featuredCardContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  featuredCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  featuredIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#dc2626",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  featuredTextContainer: {
    flex: 1,
  },
  featuredCardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 4,
  },
  featuredCardSubtitle: {
    fontSize: 14,
    color: "#94a3b8",
    lineHeight: 18,
  },
  featuredCardRight: {
    alignItems: "center",
    justifyContent: "center",
  },
  featuredCardEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  cardNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 2,
  },
});
