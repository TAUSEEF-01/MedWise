import React, { useState, useEffect, useCallback } from "react";
import { ScrollView, TouchableOpacity, Alert, Modal, View, Text, ActivityIndicator, Dimensions, TextInput } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { useRouter, useFocusEffect } from "expo-router";
import { LineChart } from "react-native-chart-kit";
import { StyleSheet } from "react-native";
import { MedicalRecord } from "@/types/medical";
import { storageUtils } from "@/utils/storage";
import { PDFExportService } from "@/utils/pdfExport";
import "../../global.css";

const { width: screenWidth } = Dimensions.get("window");
const USER_ID = "647af1d2-ae6a-417a-9226-781d5d65d047";
const BASE_URL = "https://medwise-9nv0.onrender.com";

interface BloodPressureReading {
  value: {
    systolic: number;
    diastolic: number;
  };
  date: string;
}

interface GlucoseReading {
  value: number;
  date: string;
}

interface ReadingsData {
  _id: string;
  user_id: string;
  blood_pressure_readings: BloodPressureReading[];
  glucose_readings: GlucoseReading[];
}

export default function MedicalRecordsScreen() {
  const router = useRouter();
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [readings, setReadings] = useState<ReadingsData | null>(null);
  const [readingsLoading, setReadingsLoading] = useState(true);
  const [showBPModal, setShowBPModal] = useState(false);
  const [showGlucoseModal, setShowGlucoseModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [systolic, setSystolic] = useState("");
  const [diastolic, setDiastolic] = useState("");
  const [glucose, setGlucose] = useState("");
  const [currentMeds, setCurrentMeds] = useState(2);
  const [missedCount, setMissedCount] = useState(1);
  const [nextMedTime, setNextMedTime] = useState("");

  const medTimes = ["08:00", "14:00", "22:00"];

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

  const fetchReadings = useCallback(async () => {
    try {
      setReadingsLoading(true);
      const response = await fetch(
        `${BASE_URL}/api/readings/?user_id=${USER_ID}&limit=20&skip=0`,
        { cache: "no-store" } // Prevent caching to ensure fresh data
      );

      if (response.ok) {
        const data = await response.json();
        setReadings(data);
      } else {
        Alert.alert("Error", "Failed to fetch readings");
      }
    } catch (error) {
      console.error("Error fetching readings:", error);
      Alert.alert("Error", "Network error occurred");
    } finally {
      setReadingsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecords();
    fetchReadings();
  }, [fetchReadings]);

  useFocusEffect(
    useCallback(() => {
      fetchReadings(); // Refetch data when screen is focused
    }, [fetchReadings])
  );

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

  const submitBloodPressure = async () => {
    if (!systolic || !diastolic) {
      Alert.alert("Error", "Please enter both systolic and diastolic values");
      return;
    }

    const systolicNum = parseInt(systolic);
    const diastolicNum = parseInt(diastolic);

    if (
      systolicNum < 70 ||
      systolicNum > 200 ||
      diastolicNum < 40 ||
      diastolicNum > 120
    ) {
      Alert.alert("Error", "Please enter valid blood pressure values");
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch(
        `${BASE_URL}/api/readings/bp?user_id=${USER_ID}`,
        {
          method: "POST",
          headers: {
            accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            value: {
              systolic: systolicNum,
              diastolic: diastolicNum,
            },
          }),
        }
      );

      const result = await response.json();

      if (response.ok) {
        Alert.alert("Success", "Blood pressure reading added successfully");
        setSystolic("");
        setDiastolic("");
        setShowBPModal(false);
        await fetchReadings();
      } else {
        Alert.alert("Error", result.message || "Failed to add reading");
      }
    } catch (error) {
      console.error("Error submitting blood pressure:", error);
      Alert.alert("Error", "Network error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const submitGlucose = async () => {
    if (!glucose) {
      Alert.alert("Error", "Please enter glucose value");
      return;
    }

    const glucoseNum = parseFloat(glucose);

    if (glucoseNum < 2 || glucoseNum > 30) {
      Alert.alert("Error", "Please enter a valid glucose value (2-30 mmol/L)");
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch(
        `${BASE_URL}/api/readings/glucose?user_id=${USER_ID}`,
        {
          method: "POST",
          headers: {
            accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            value: glucoseNum,
          }),
        }
      );

      const result = await response.json();

      if (response.ok) {
        Alert.alert("Success", "Glucose reading added successfully");
        setGlucose("");
        setShowGlucoseModal(false);
        await fetchReadings();
      } else {
        Alert.alert("Error", result.message || "Failed to add reading");
      }
    } catch (error) {
      console.error("Error submitting glucose:", error);
      Alert.alert("Error", "Network error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const formatChartData = (data: any[], type: "bp" | "glucose") => {
    if (!data || data.length === 0) {
      return {
        labels: ["No Data"],
        datasets: [{ data: [0] }],
      };
    }

    const sortedData = [...data].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const labels = sortedData.map((item, index) => {
      const date = new Date(item.date);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    });

    if (type === "bp") {
      return {
        labels,
        datasets: [
          {
            data: sortedData.map((item) => item.value.systolic),
            color: (opacity = 1) => `rgba(255, 99, 132, ${opacity})`,
            strokeWidth: 2,
          },
          {
            data: sortedData.map((item) => item.value.diastolic),
            color: (opacity = 1) => `rgba(54, 162, 235, ${opacity})`,
            strokeWidth: 2,
          },
        ],
        legend: ["Systolic", "Diastolic"],
      };
    } else {
      return {
        labels,
        datasets: [
          {
            data: sortedData.map((item) => item.value),
            color: (opacity = 1) => `rgba(75, 192, 192, ${opacity})`,
            strokeWidth: 2,
          },
        ],
        legend: ["Glucose (mmol/L)"],
      };
    }
  };

  const chartConfig = {
    backgroundColor: "#ffffff",
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: "4",
      strokeWidth: "2",
      stroke: "#2563eb",
    },
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
      console.log("Uploading file:", selectedFile);

      if (!selectedFile.uri) {
        Alert.alert("Error", "Invalid file selected");
        return;
      }

      if (selectedFile.size && selectedFile.size > 10 * 1024 * 1024) {
        Alert.alert(
          "Error",
          "File too large. Please select a file smaller than 10MB."
        );
        return;
      }

      const fileObj = {
        uri: selectedFile.uri,
        type: selectedFile.mimeType || "image/jpeg",
        name: selectedFile.name || "image.jpg",
      };

      const formData = new FormData();
      formData.append("file", fileObj as any);

      try {
        Alert.alert("Processing", "Uploading and analyzing your document...");
        const possibleUrls = [
          "https://medwise-9nv0.onrender.com/gemini/upload-image/",
        ];

        let uploadResponse;
        let lastError;

        for (const backendUrl of possibleUrls) {
          try {
            console.log(`Trying URL: ${backendUrl}`);
            const testResponse = await fetch(
              backendUrl.replace("/upload-image/", "/docs"),
              { method: "GET", timeout: 5000 }
            );

            console.log(
              `Connectivity test for ${backendUrl}: ${testResponse.status}`
            );

            uploadResponse = await fetch(backendUrl, {
              method: "POST",
              body: formData,
              timeout: 30000,
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
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View
          style={{
            backgroundColor: "#ffffff",
            paddingVertical: 16,
            paddingHorizontal: 16,
            borderBottomLeftRadius: 20,
            borderBottomRightRadius: 20,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 12,
            elevation: 8,
            marginBottom: 16,
          }}
        >
          <View style={{ marginBottom: 16 }}>
            <Text style={styles.dashboardTitle}>Health Dashboard</Text>
            <Text style={styles.dashboardSubtitle}>
              Manage your medical records
            </Text>
          </View>

          <View style={styles.cardsContainer}>
            <TouchableOpacity
              style={[styles.card, styles.cardPrimary]}
              onPress={() => router.push("/image-uploads")}
              activeOpacity={0.8}
            >
              <View style={styles.cardIconContainer}>
                <MaterialIcons name="folder-special" size={24} color="#ffffff" />
              </View>
              <Text style={styles.cardLabel}>Medical Records</Text>
              <View style={styles.cardBadge}>
                <Text style={styles.cardBadgeText}>{records.length}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.card, styles.cardSuccess]}
              activeOpacity={0.8}
              onPress={() => router.push("/lab-reports-list")}
            >
              <View style={styles.cardIconContainer}>
                <MaterialIcons name="description" size={24} color="#ffffff" />
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
                  size={24}
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
                <MaterialIcons name="healing" size={24} color="#ffffff" />
              </View>
              <Text style={styles.cardLabel}>Current Medicines</Text>
              <View style={styles.cardBadge}>
                <Text style={styles.cardBadgeText}>{currentMeds}</Text>
              </View>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.featuredCard]}
            onPress={() => router.push("/reading_graph")}
            activeOpacity={0.8}
          >
            <View style={styles.featuredCardContent}>
              <View style={styles.featuredCardLeft}>
                <View style={styles.featuredIconContainer}>
                  <MaterialIcons name="show-chart" size={28} color="#ffffff" />
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
                <MaterialIcons name="arrow-forward" size={20} color="#ffffff" />
              </View>
            </View>
          </TouchableOpacity>
        </View>

        <View className="flex-row justify-between mb-6">
          

          
        </View>

        {readingsLoading ? (
          <View className="items-center justify-center py-8">
            <ActivityIndicator size="large" color="#395886" />
            <Text className="text-gray-600 mt-4">Loading health data...</Text>
          </View>
        ) : (
          <>
            <View
              className="bg-white rounded-xl p-4 mb-6 shadow-sm"
              style={{
                borderWidth: 1,
                borderColor: "#395886",
              }}
            >
              <Text className="text-lg font-semibold text-gray-900 mb-4">
                Blood Pressure Trends
              </Text>
              {readings?.blood_pressure_readings &&
              readings.blood_pressure_readings.length > 0 ? (
                <LineChart
                  data={formatChartData(readings.blood_pressure_readings, "bp")}
                  width={screenWidth - 64}
                  height={200}
                  chartConfig={chartConfig}
                  bezier
                  style={{
                    marginVertical: 8,
                    borderRadius: 16,
                  }}
                />
              ) : (
                <View className="h-48 items-center justify-center bg-gray-50 rounded-lg">
                  <MaterialIcons name="show-chart" size={48} color="#9ca3af" />
                  <Text className="text-gray-500 mt-2">No blood pressure data</Text>
                </View>
              )}
            </View>

            <View
              className="bg-white rounded-xl p-4 mb-6 shadow-sm"
              style={{
                borderWidth: 1,
                borderColor: "#395886",
              }}
            >
              <Text className="text-lg font-semibold text-gray-900 mb-4">
                Glucose Level Trends
              </Text>
              {readings?.glucose_readings &&
              readings.glucose_readings.length > 0 ? (
                <LineChart
                  data={formatChartData(readings.glucose_readings, "glucose")}
                  width={screenWidth - 64}
                  height={200}
                  chartConfig={{
                    ...chartConfig,
                    color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
                  }}
                  bezier
                  style={{
                    marginVertical: 8,
                    borderRadius: 16,
                  }}
                />
              ) : (
                <View className="h-48 items-center justify-center bg-gray-50 rounded-lg">
                  <MaterialIcons name="show-chart" size={48} color="#9ca3af" />
                  <Text className="text-gray-500 mt-2">No glucose data</Text>
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>

      <Modal
        visible={showBPModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowBPModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-center px-4">
          <View
            className="bg-white rounded-xl p-6"
            style={{
              borderWidth: 2,
              borderColor: "#395886",
            }}
          >
            <Text className="text-xl font-bold text-gray-900 mb-4 text-center">
              Add Blood Pressure Reading
            </Text>

            <View className="mb-4">
              <Text className="text-gray-700 font-medium mb-2">
                Systolic (mmHg)
              </Text>
              <TextInput
                value={systolic}
                onChangeText={setSystolic}
                placeholder="120"
                keyboardType="numeric"
                className="border rounded-lg p-3 text-lg"
                style={{ borderColor: "#395886" }}
              />
            </View>

            <View className="mb-6">
              <Text className="text-gray-700 font-medium mb-2">
                Diastolic (mmHg)
              </Text>
              <TextInput
                value={diastolic}
                onChangeText={setDiastolic}
                placeholder="80"
                keyboardType="numeric"
                className="border rounded-lg p-3 text-lg"
                style={{ borderColor: "#395886" }}
              />
            </View>

            <View className="flex-row space-x-3">
              <TouchableOpacity
                onPress={() => setShowBPModal(false)}
                className="flex-1 bg-gray-200 rounded-lg py-3"
                disabled={submitting}
              >
                <Text className="text-gray-700 font-semibold text-center">
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={submitBloodPressure}
                className="flex-1 rounded-lg py-3"
                style={{ backgroundColor: "#395886" }}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-semibold text-center">
                    Add Reading
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showGlucoseModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowGlucoseModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-center px-4">
          <View
            className="bg-white rounded-xl p-6"
            style={{
              borderWidth: 2,
              borderColor: "#395886",
            }}
          >
            <Text className="text-xl font-bold text-gray-900 mb-4 text-center">
              Add Glucose Reading
            </Text>

            <View className="mb-6">
              <Text className="text-gray-700 font-medium mb-2">
                Glucose (mmol/L)
              </Text>
              <TextInput
                value={glucose}
                onChangeText={setGlucose}
                placeholder="6.0"
                keyboardType="numeric"
                className="border rounded-lg p-3 text-lg"
                style={{ borderColor: "#395886" }}
              />
            </View>

            <View className="flex-row space-x-3">
              <TouchableOpacity
                onPress={() => setShowGlucoseModal(false)}
                className="flex-1 bg-gray-200 rounded-lg py-3"
                disabled={submitting}
              >
                <Text className="text-gray-700 font-semibold text-center">
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={submitGlucose}
                className="flex-1 rounded-lg py-3"
                style={{ backgroundColor: "#395886" }}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-semibold text-center">
                    Add Reading
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showPreview}
        transparent={true}
        animationType="slide"
        onRequestClose={closePreview}
      >
        <View className="flex-1 bg-black/50">
          <View className="flex-1 bg-white mt-12 rounded-t-3xl">
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

            <ScrollView className="flex-1 p-4">
              {selectedRecord && (
                <View
                  className="bg-white border-2 border-blue-700 rounded-lg overflow-hidden"
                  style={{ minHeight: 600 }}
                >
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

                  <View className="p-4">
                    <View className="flex-row mb-4">
                      <View className="w-16 items-center mr-4">
                        <Text
                          className="text-blue-700 font-bold text-5xl"
                          style={{ fontFamily: "serif" }}
                        >
                          ℞
                        </Text>
                      </View>
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
                          <Text className="text-gray-600 text-sm mt-2">
                            Additional Notes: {selectedRecord.description}
                          </Text>
                        )}
                      </View>
                    </View>

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

            <View className="h-6" />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <TouchableOpacity
        onPress={addNewRecord}
        className="absolute bottom-6 right-6 w-14 h-14 rounded-full items-center justify-center shadow-lg"
        style={{
          backgroundColor: "#395886",
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

const styles = StyleSheet.create({
  dashboardTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 4,
  },
  dashboardSubtitle: {
    fontSize: 14,
    color: "#64748b",
  },
  cardsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  card: {
    width: "48%",
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
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
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#ffffff",
    textAlign: "left",
    lineHeight: 16,
  },
  cardBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 3,
    minWidth: 20,
    alignItems: "center",
  },
  cardBadgeText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#ffffff",
  },
  featuredCard: {
    backgroundColor: "#1e293b",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
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
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#dc2626",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  featuredTextContainer: {
    flex: 1,
  },
  featuredCardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 4,
  },
  featuredCardSubtitle: {
    fontSize: 12,
    color: "#94a3b8",
    lineHeight: 16,
  },
  featuredCardRight: {
    alignItems: "center",
    justifyContent: "center",
  },
  featuredCardEmoji: {
    fontSize: 20,
    marginBottom: 6,
  },
});