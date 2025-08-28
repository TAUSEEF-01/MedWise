import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { LineChart } from "react-native-chart-kit";
import { useAuth } from "@/contexts/AuthContext";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

const { width: screenWidth } = Dimensions.get("window");
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

export default function ReadingGraphScreen() {
  const { getCurrentUser, currentUser, isAuthenticated } = useAuth();
  const [userId, setUserId] = useState<string | null>(null);
  const [readings, setReadings] = useState<ReadingsData | null>(null);
  // NEW: keep full unfiltered data
  const [allReadings, setAllReadings] = useState<ReadingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBPModal, setShowBPModal] = useState(false);
  const [showGlucoseModal, setShowGlucoseModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false); // NEW

  // Form states
  const [systolic, setSystolic] = useState("");
  const [diastolic, setDiastolic] = useState("");
  const [glucose, setGlucose] = useState("");

  // NEW: filter states
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [systolicMin, setSystolicMin] = useState("");
  const [diastolicMin, setDiastolicMin] = useState("");
  const [glucoseMin, setGlucoseMin] = useState("");
  const [filtering, setFiltering] = useState(false);

  // Simplified function to get user_id from cached data
  const fetchUserId = useCallback(async () => {
    try {
      // First check if we already have user data in context
      if (currentUser?.user_id) {
        setUserId(currentUser.user_id);
        return;
      }

      // Only call API if we don't have cached user data
      const user = await getCurrentUser();
      if (user?.user_id) {
        setUserId(user.user_id);
      } else {
        Alert.alert("Error", "User not authenticated. Please log in.");
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      Alert.alert("Error", "Failed to get user information");
    }
  }, [getCurrentUser, currentUser]);

  useEffect(() => {
    fetchUserId();
  }, [fetchUserId]);

  useEffect(() => {
    if (userId) {
      fetchReadings();
    }
  }, [userId]);

  // UPDATED: fetch all data (pagination) then store
  const fetchReadings = async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const batchSize = 200;
      let skip = 0;
      let allBP: BloodPressureReading[] = [];
      let allGlucose: GlucoseReading[] = [];
      let baseDoc: Omit<
        ReadingsData,
        "blood_pressure_readings" | "glucose_readings"
      > | null = null;

      while (true) {
        const resp = await fetch(`${BASE_URL}/api/readings/?user_id=${userId}`);
        if (!resp.ok) break;
        const data: ReadingsData = await resp.json();
        if (!baseDoc) {
          const { _id, user_id } = data;
          baseDoc = { _id, user_id };
        }
        const bpLen = data.blood_pressure_readings?.length || 0;
        const glLen = data.glucose_readings?.length || 0;
        if (bpLen === 0 && glLen === 0) break;
        allBP = allBP.concat(data.blood_pressure_readings || []);
        allGlucose = allGlucose.concat(data.glucose_readings || []);
        if (bpLen < batchSize && glLen < batchSize) break;
        skip += batchSize;
        // safety cap
        if (skip > 5000) break;
      }

      const combined: ReadingsData | null = baseDoc
        ? {
            ...(baseDoc as any),
            blood_pressure_readings: allBP,
            glucose_readings: allGlucose,
          }
        : null;

      setAllReadings(combined);
      setReadings(combined); // initial (unfiltered)
    } catch (e) {
      console.error("Error fetching readings:", e);
      Alert.alert("Error", "Failed to fetch readings");
    } finally {
      setLoading(false);
    }
  };

  // NEW: apply filters locally
  const applyFilters = () => {
    if (!allReadings) return;
    setFiltering(true);
    try {
      const sd = startDate ? new Date(startDate) : null;
      const ed = endDate ? new Date(endDate) : null;
      if (sd && isNaN(sd.getTime())) {
        Alert.alert("Error", "Invalid start date (YYYY-MM-DD)");
        return;
      }
      if (ed && isNaN(ed.getTime())) {
        Alert.alert("Error", "Invalid end date (YYYY-MM-DD)");
        return;
      }
      const systolicNum = systolicMin ? parseInt(systolicMin) : null;
      const diastolicNum = diastolicMin ? parseInt(diastolicMin) : null;
      const glucoseNum = glucoseMin ? parseFloat(glucoseMin) : null;

      const inDateRange = (dStr: string) => {
        const d = new Date(dStr);
        if (sd && d < sd) return false;
        if (ed) {
          const endAdj = new Date(ed);
          endAdj.setHours(23, 59, 59, 999);
          if (d > endAdj) return false;
        }
        return true;
      };

      const filteredBP = (allReadings.blood_pressure_readings || []).filter(
        (r) =>
          inDateRange(r.date) &&
          (systolicNum == null || r.value.systolic >= systolicNum) &&
          (diastolicNum == null || r.value.diastolic >= diastolicNum)
      );

      const filteredGlucose = (allReadings.glucose_readings || []).filter(
        (r) =>
          inDateRange(r.date) && (glucoseNum == null || r.value >= glucoseNum)
      );

      setReadings({
        ...allReadings,
        blood_pressure_readings: filteredBP,
        glucose_readings: filteredGlucose,
      });
    } finally {
      setFiltering(false);
    }
  };

  // NEW: clear filters
  const clearFilters = () => {
    setStartDate("");
    setEndDate("");
    setSystolicMin("");
    setDiastolicMin("");
    setGlucoseMin("");
    setReadings(allReadings);
  };

  // RESTORED: helper to get latest reading
  const getLatestReading = (data: any[], type: "bp" | "glucose") => {
    if (!data || data.length === 0) return null;
    return [...data].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )[0];
  };

  // RESTORED: chart data formatter
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
    const labels = sortedData.map((item) => {
      const date = new Date(item.date);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    });
    if (type === "bp") {
      return {
        labels,
        datasets: [
          {
            data: sortedData.map((item) => item.value.systolic),
            color: (opacity = 1) => `rgba(255,99,132,${opacity})`,
            strokeWidth: 2,
          },
          {
            data: sortedData.map((item) => item.value.diastolic),
            color: (opacity = 1) => `rgba(54,162,235,${opacity})`,
            strokeWidth: 2,
          },
        ],
        legend: ["Systolic", "Diastolic"],
      };
    }
    return {
      labels,
      datasets: [
        {
          data: sortedData.map((item) => item.value),
          color: (opacity = 1) => `rgba(75,192,192,${opacity})`,
          strokeWidth: 2,
        },
      ],
      legend: ["Glucose (mmol/L)"],
    };
  };

  // RESTORED: submit blood pressure
  const submitBloodPressure = async () => {
    if (!userId) {
      Alert.alert("Error", "User not authenticated");
      return;
    }
    if (!systolic || !diastolic) {
      Alert.alert("Error", "Enter both systolic and diastolic");
      return;
    }
    const systolicNum = parseInt(systolic);
    const diastolicNum = parseInt(diastolic);
    if (
      isNaN(systolicNum) ||
      isNaN(diastolicNum) ||
      systolicNum < 70 ||
      systolicNum > 200 ||
      diastolicNum < 40 ||
      diastolicNum > 120
    ) {
      Alert.alert("Error", "Invalid BP values");
      return;
    }
    try {
      setSubmitting(true);
      const response = await fetch(
        `${BASE_URL}/api/readings/bp?user_id=${userId}`,
        {
          method: "POST",
          headers: {
            accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            value: { systolic: systolicNum, diastolic: diastolicNum },
          }),
        }
      );
      const result = await response.json();
      if (response.ok) {
        Alert.alert("Success", "Blood pressure added");
        setSystolic("");
        setDiastolic("");
        setShowBPModal(false);
        fetchReadings();
      } else {
        Alert.alert("Error", result.message || "Failed to add reading");
      }
    } catch (e) {
      console.error("BP submit error", e);
      Alert.alert("Error", "Network error");
    } finally {
      setSubmitting(false);
    }
  };

  // RESTORED: submit glucose
  const submitGlucose = async () => {
    if (!userId) {
      Alert.alert("Error", "User not authenticated");
      return;
    }
    if (!glucose) {
      Alert.alert("Error", "Enter glucose value");
      return;
    }
    const glucoseNum = parseFloat(glucose);
    if (isNaN(glucoseNum) || glucoseNum < 2 || glucoseNum > 30) {
      Alert.alert("Error", "Glucose must be 2-30 mmol/L");
      return;
    }
    try {
      setSubmitting(true);
      const response = await fetch(
        `${BASE_URL}/api/readings/glucose?user_id=${userId}`,
        {
          method: "POST",
          headers: {
            accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ value: glucoseNum }),
        }
      );
      const result = await response.json();
      if (response.ok) {
        Alert.alert("Success", "Glucose added");
        setGlucose("");
        setShowGlucoseModal(false);
        fetchReadings();
      } else {
        Alert.alert("Error", result.message || "Failed to add reading");
      }
    } catch (e) {
      console.error("Glucose submit error", e);
      Alert.alert("Error", "Network error");
    } finally {
      setSubmitting(false);
    }
  };

  // NEW: escape helper for HTML
  const esc = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  // NEW: build PDF HTML (shared by download & preview)
  const buildPdfHtml = () => {
    if (!readings) return "";
    const bp = readings.blood_pressure_readings || [];
    const gl = readings.glucose_readings || [];
    const filterSummary =
      [
        startDate && `Start Date: ${esc(startDate)}`,
        endDate && `End Date: ${esc(endDate)}`,
        systolicMin && `Min Systolic: ${esc(systolicMin)}`,
        diastolicMin && `Min Diastolic: ${esc(diastolicMin)}`,
        glucoseMin && `Min Glucose: ${esc(glucoseMin)}`,
      ]
        .filter(Boolean)
        .join(" | ") || "None (all data)";
    const bpRows = bp
      .map(
        (r) =>
          `<tr><td>${new Date(r.date).toLocaleString()}</td><td>${
            r.value.systolic
          }</td><td>${r.value.diastolic}</td></tr>`
      )
      .join("");
    const glRows = gl
      .map(
        (r) =>
          `<tr><td>${new Date(r.date).toLocaleString()}</td><td>${
            r.value
          }</td></tr>`
      )
      .join("");
    return `
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Health Readings Export</title>
          <style>
            body { font-family: Arial, sans-serif; padding:24px; }
            h1 { margin-top:0; color:#1e3a8a; }
            h2 { color:#1e40af; margin-top:32px; }
            table { width:100%; border-collapse:collapse; margin-top:12px; }
            th, td { border:1px solid #ccc; padding:6px 8px; font-size:12px; text-align:left; }
            th { background:#eef2ff; }
            .summary { background:#f1f5f9; padding:10px; border:1px solid #cbd5e1; font-size:12px; }
            .counts { font-size:12px; margin-top:4px; color:#334155; }
          </style>
        </head>
        <body>
          <h1>Health Readings Export</h1>
          <div class="summary"><strong>Applied Filters:</strong> ${esc(
            filterSummary
          )}</div>
          <div class="counts">
            Blood Pressure: ${bp.length} record(s) | Glucose: ${
      gl.length
    } record(s)
          </div>
          <h2>Blood Pressure Readings</h2>
          ${
            bp.length
              ? `<table><thead><tr><th>Date</th><th>Systolic</th><th>Diastolic</th></tr></thead><tbody>${bpRows}</tbody></table>`
              : "<p>No blood pressure readings in current filter.</p>"
          }
          <h2>Glucose Readings</h2>
          ${
            gl.length
              ? `<table><thead><tr><th>Date</th><th>Glucose (mmol/L)</th></tr></thead><tbody>${glRows}</tbody></table>`
              : "<p>No glucose readings in current filter.</p>"
          }
          <p style="margin-top:40px;font-size:10px;color:#64748b;">
            Generated on ${new Date().toLocaleString()}
          </p>
        </body>
      </html>
    `;
  };

  // UPDATED: download PDF uses buildPdfHtml
  const handleDownloadPDF = async () => {
    if (!readings) {
      Alert.alert("No Data", "Nothing to export.");
      return;
    }
    if (
      readings.blood_pressure_readings.length === 0 &&
      readings.glucose_readings.length === 0
    ) {
      Alert.alert("No Data", "No filtered readings to export.");
      return;
    }
    try {
      setPdfGenerating(true);
      const html = buildPdfHtml();
      const file = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, {
          mimeType: "application/pdf",
          dialogTitle: "Share Health Readings PDF",
        });
      } else {
        Alert.alert("PDF Created", `File saved at: ${file.uri}`);
      }
    } catch (e) {
      console.error("PDF export error", e);
      Alert.alert("Error", "Failed to generate PDF");
    } finally {
      setPdfGenerating(false);
    }
  };

  // NEW: summary helper reused by preview
  const getFilterSummary = () =>
    [
      startDate && `Start Date: ${startDate}`,
      endDate && `End Date: ${endDate}`,
      systolicMin && `Min Systolic: ${systolicMin}`,
      diastolicMin && `Min Diastolic: ${diastolicMin}`,
      glucoseMin && `Min Glucose: ${glucoseMin}`,
    ]
      .filter(Boolean)
      .join(" | ") || "None (all data)";

  // UPDATED: preview (no WebView, no PDF generation)
  const handlePreviewPDF = () => {
    if (!readings) {
      Alert.alert("No Data", "Nothing to preview.");
      return;
    }
    if (
      readings.blood_pressure_readings.length === 0 &&
      readings.glucose_readings.length === 0
    ) {
      Alert.alert("No Data", "No filtered readings to preview.");
      return;
    }
    setShowPreviewModal(true);
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

  if (loading || !userId) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: "#f0f3fa" }}
      >
        <ActivityIndicator size="large" color="#395886" />
        <Text className="text-gray-600 mt-4">
          {!userId ? "Authenticating..." : "Loading health data..."}
        </Text>
      </View>
    );
  }

  const latestBP = getLatestReading(
    readings?.blood_pressure_readings || [],
    "bp"
  );
  const latestGlucose = getLatestReading(
    readings?.glucose_readings || [],
    "glucose"
  );

  return (
    <View className="flex-1" style={{ backgroundColor: "#f0f3fa" }}>
      {/* Header */}
      <View className="px-4 py-4 pt-12" style={{ backgroundColor: "white" }}>
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 items-center justify-center mr-4"
          >
            <MaterialIcons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
          <Text className="text-xl font-semibold text-black">
            Health Graphs
          </Text>
          <View className="flex-1" />
          <TouchableOpacity
            onPress={fetchReadings}
            className="w-10 h-10 items-center justify-center"
          >
            <MaterialIcons name="refresh" size={24} color="black" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
        {/* NEW: Filter Panel */}
        <View
          className="bg-white rounded-xl p-4 mb-6"
          style={{ borderWidth: 1, borderColor: "#395886" }}
        >
          <Text className="text-lg font-semibold text-gray-900 mb-3">
            Filter Readings (Local)
          </Text>
          <View className="flex-row mb-3">
            <View className="flex-1 mr-2">
              <Text className="text-xs text-gray-600 mb-1">
                Start Date (YYYY-MM-DD)
              </Text>
              <TextInput
                value={startDate}
                onChangeText={setStartDate}
                placeholder="2025-01-01"
                className="border rounded-lg px-2 py-2 text-sm"
                style={{ borderColor: "#395886" }}
              />
            </View>
            <View className="flex-1 ml-2">
              <Text className="text-xs text-gray-600 mb-1">
                End Date (YYYY-MM-DD)
              </Text>
              <TextInput
                value={endDate}
                onChangeText={setEndDate}
                placeholder="2025-02-01"
                className="border rounded-lg px-2 py-2 text-sm"
                style={{ borderColor: "#395886" }}
              />
            </View>
          </View>

          <View className="flex-row mb-3">
            <View className="flex-1 mr-2">
              <Text className="text-xs text-gray-600 mb-1">Min Systolic</Text>
              <TextInput
                value={systolicMin}
                onChangeText={setSystolicMin}
                placeholder="130"
                keyboardType="numeric"
                className="border rounded-lg px-2 py-2 text-sm"
                style={{ borderColor: "#395886" }}
              />
            </View>
            <View className="flex-1 ml-2">
              <Text className="text-xs text-gray-600 mb-1">Min Diastolic</Text>
              <TextInput
                value={diastolicMin}
                onChangeText={setDiastolicMin}
                placeholder="85"
                keyboardType="numeric"
                className="border rounded-lg px-2 py-2 text-sm"
                style={{ borderColor: "#395886" }}
              />
            </View>
          </View>

          <View className="flex-row mb-4">
            <View className="flex-1">
              <Text className="text-xs text-gray-600 mb-1">
                Min Glucose (mmol/L)
              </Text>
              <TextInput
                value={glucoseMin}
                onChangeText={setGlucoseMin}
                placeholder="7.0"
                keyboardType="numeric"
                className="border rounded-lg px-2 py-2 text-sm"
                style={{ borderColor: "#395886" }}
              />
            </View>
          </View>

          <View className="flex-row">
            <TouchableOpacity
              onPress={applyFilters}
              disabled={filtering || !allReadings}
              className="flex-1 mr-2 rounded-lg py-3 items-center"
              style={{
                backgroundColor: "#395886",
                opacity: filtering ? 0.7 : 1,
              }}
            >
              <Text className="text-white font-semibold text-sm">
                {filtering ? "Filtering..." : "Apply Filters"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={clearFilters}
              disabled={!allReadings}
              className="flex-1 rounded-lg py-3 items-center"
              style={{ backgroundColor: "#e5e7eb" }}
            >
              <Text className="text-gray-800 font-semibold text-sm">Clear</Text>
            </TouchableOpacity>
          </View>
          {/* NEW: PDF Export Button */}
          <View className="flex-row mt-3 space-x-3">
            <TouchableOpacity
              onPress={handlePreviewPDF}
              disabled={pdfGenerating || !readings}
              className="flex-1 rounded-lg py-3 items-center"
              style={{
                backgroundColor: "#6d28d9",
                opacity: pdfGenerating || !readings ? 0.6 : 1,
              }}
            >
              <Text className="text-white font-semibold text-sm">
                {pdfGenerating ? "Preparing..." : "Preview PDF"}
              </Text>
            </TouchableOpacity>
            {/* <TouchableOpacity
              onPress={handleDownloadPDF}
              disabled={pdfGenerating || !readings}
              className="flex-1 rounded-lg py-3 items-center"
              style={{
                backgroundColor: "#2563eb",
                opacity: pdfGenerating || !readings ? 0.6 : 1,
              }}
            >
              <Text className="text-white font-semibold text-sm">
                {pdfGenerating ? "Generating..." : "Download PDF"}
              </Text>
            </TouchableOpacity> */}
          </View>
          {allReadings && readings && (
            <Text className="text-xs text-gray-500 mt-2">
              Showing BP {readings.blood_pressure_readings.length}/
              {allReadings.blood_pressure_readings.length} | Glucose{" "}
              {readings.glucose_readings.length}/
              {allReadings.glucose_readings.length}
            </Text>
          )}
        </View>

        {/* Summary Cards */}
        <View className="flex-row justify-between mb-6">
          <View
            className="bg-white rounded-xl p-4 flex-1 mr-2 shadow-sm"
            style={{
              borderWidth: 1,
              borderColor: "#395886",
            }}
          >
            <View className="flex-row items-center mb-2">
              <MaterialIcons name="favorite" size={20} color="#dc2626" />
              <Text className="text-gray-600 text-sm ml-1">Latest BP</Text>
            </View>
            {latestBP ? (
              <Text className="text-xl font-bold text-gray-900">
                {latestBP.value.systolic}/{latestBP.value.diastolic}
              </Text>
            ) : (
              <Text className="text-gray-500">No data</Text>
            )}
          </View>

          <View
            className="bg-white rounded-xl p-4 flex-1 ml-2 shadow-sm"
            style={{
              borderWidth: 1,
              borderColor: "#395886",
            }}
          >
            <View className="flex-row items-center mb-2">
              <MaterialIcons name="water-drop" size={20} color="#059669" />
              <Text className="text-gray-600 text-sm ml-1">Latest Glucose</Text>
            </View>
            {latestGlucose ? (
              <Text className="text-xl font-bold text-gray-900">
                {latestGlucose.value} mmol/L
              </Text>
            ) : (
              <Text className="text-gray-500">No data</Text>
            )}
          </View>
        </View>

        {/* Quick Add Buttons */}
        <View className="flex-row justify-between mb-6">
          <TouchableOpacity
            onPress={() => setShowBPModal(true)}
            className="rounded-xl p-4 flex-1 mr-2 flex-row items-center justify-center"
            style={{
              backgroundColor: "#395886",
              borderWidth: 1,
              borderColor: "#395886",
            }}
          >
            <MaterialIcons name="add" size={20} color="white" />
            <Text className="text-white font-semibold ml-2">
              Add BP Reading
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowGlucoseModal(true)}
            className="rounded-xl p-4 flex-1 ml-2 flex-row items-center justify-center"
            style={{
              backgroundColor: "#395886",
              borderWidth: 1,
              borderColor: "#395886",
            }}
          >
            <MaterialIcons name="add" size={20} color="white" />
            <Text className="text-white font-semibold ml-2">Add Glucose</Text>
          </TouchableOpacity>
        </View>

        {/* Blood Pressure Chart */}
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
              height={220}
              chartConfig={chartConfig}
              bezier
              style={{
                marginVertical: 8,
                borderRadius: 16,
              }}
            />
          ) : (
            <View className="h-52 items-center justify-center bg-gray-50 rounded-lg">
              <MaterialIcons name="show-chart" size={48} color="#9ca3af" />
              <Text className="text-gray-500 mt-2">No blood pressure data</Text>
            </View>
          )}
        </View>

        {/* Glucose Chart */}
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
              height={220}
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
            <View className="h-52 items-center justify-center bg-gray-50 rounded-lg">
              <MaterialIcons name="show-chart" size={48} color="#9ca3af" />
              <Text className="text-gray-500 mt-2">No glucose data</Text>
            </View>
          )}
        </View>

        {/* Recent Readings */}
        {/* Recent Readings */}
        <View
          className="bg-white rounded-xl p-4 shadow-sm"
          style={{
            borderWidth: 1,
            borderColor: "#395886",
          }}
        >
          <Text className="text-lg font-semibold text-gray-900 mb-4">
            All Readings
          </Text>

          {/* Blood Pressure Readings */}
          <View className="mb-4">
            <View className="flex-row items-center mb-3">
              <View
                className="w-8 h-8 rounded-full items-center justify-center mr-3"
                style={{ backgroundColor: "#dc2626" }}
              >
                <MaterialIcons name="favorite" size={18} color="white" />
              </View>
              <Text className="text-md font-semibold text-gray-800">
                Blood Pressure
              </Text>
            </View>
            {readings?.blood_pressure_readings &&
            readings.blood_pressure_readings.length > 0 ? (
              readings.blood_pressure_readings
                .slice(0, 5)
                .map((reading, index) => (
                  <View
                    key={index}
                    className="flex-row justify-between items-center py-3 px-3 mb-2 rounded-lg"
                    style={{ backgroundColor: "#d5deef" }}
                  >
                    <Text className="text-sm text-gray-600">
                      {new Date(reading.date).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </Text>
                    <Text className="font-semibold text-gray-800">
                      {reading.value.systolic}/{reading.value.diastolic} mmHg
                    </Text>
                  </View>
                ))
            ) : (
              <View className="py-4 px-3 bg-gray-50 rounded-lg">
                <Text className="text-gray-500 text-center">
                  No blood pressure readings yet
                </Text>
              </View>
            )}
          </View>

          {/* Glucose Readings */}
          <View>
            <View className="flex-row items-center mb-3">
              <View
                className="w-8 h-8 rounded-full items-center justify-center mr-3"
                style={{ backgroundColor: "#059669" }}
              >
                <MaterialIcons name="water-drop" size={18} color="white" />
              </View>
              <Text className="text-md font-semibold text-gray-800">
                Glucose
              </Text>
            </View>
            {readings?.glucose_readings &&
            readings.glucose_readings.length > 0 ? (
              readings.glucose_readings.slice(0, 5).map((reading, index) => (
                <View
                  key={index}
                  className="flex-row justify-between items-center py-3 px-3 mb-2 rounded-lg"
                  style={{ backgroundColor: "#d5deef" }}
                >
                  <Text className="text-sm text-gray-600">
                    {new Date(reading.date).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </Text>
                  <Text className="font-semibold text-gray-800">
                    {reading.value} mmol/L
                  </Text>
                </View>
              ))
            ) : (
              <View className="py-4 px-3 bg-gray-50 rounded-lg">
                <Text className="text-gray-500 text-center">
                  No glucose readings yet
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Blood Pressure Modal */}
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

      {/* Glucose Modal */}
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

      {/* NEW: PDF Preview Modal */}
      <Modal
        visible={showPreviewModal}
        animationType="slide"
        onRequestClose={() => setShowPreviewModal(false)}
      >
        <View className="flex-1" style={{ backgroundColor: "#0f172a" }}>
          <View className="flex-row items-center justify-between px-4 py-3">
            <Text className="text-white font-semibold">
              PDF Preview (Formatted Data)
            </Text>
            <TouchableOpacity
              onPress={() => setShowPreviewModal(false)}
              className="px-3 py-1 rounded"
              style={{ backgroundColor: "#334155" }}
            >
              <Text className="text-white text-sm">Close</Text>
            </TouchableOpacity>
          </View>
          <ScrollView className="flex-1 px-4 py-4">
            <View
              className="mb-4 p-3 rounded-lg"
              style={{ backgroundColor: "#1e293b" }}
            >
              <Text className="text-xs text-slate-300 mb-1 font-semibold">
                Applied Filters
              </Text>
              <Text className="text-xs text-slate-100">
                {getFilterSummary()}
              </Text>
              <Text className="text-[10px] text-slate-400 mt-2">
                Generated on {new Date().toLocaleString()}
              </Text>
            </View>

            {/* Blood Pressure Section */}
            <View className="mb-6">
              <Text className="text-base font-semibold text-white mb-2">
                Blood Pressure Readings (
                {readings?.blood_pressure_readings.length || 0})
              </Text>
              {readings?.blood_pressure_readings.length ? (
                readings!.blood_pressure_readings.map((r, i) => (
                  <View
                    key={i}
                    className="flex-row justify-between px-3 py-2 mb-1 rounded"
                    style={{ backgroundColor: "#334155" }}
                  >
                    <Text className="text-xs text-slate-200 w-1/2 pr-2">
                      {new Date(r.date).toLocaleString()}
                    </Text>
                    <Text className="text-xs text-slate-100 font-medium">
                      {r.value.systolic}/{r.value.diastolic} mmHg
                    </Text>
                  </View>
                ))
              ) : (
                <Text className="text-xs text-slate-400 italic">
                  No blood pressure readings.
                </Text>
              )}
            </View>

            {/* Glucose Section */}
            <View className="mb-6">
              <Text className="text-base font-semibold text-white mb-2">
                Glucose Readings ({readings?.glucose_readings.length || 0})
              </Text>
              {readings?.glucose_readings.length ? (
                readings!.glucose_readings.map((r, i) => (
                  <View
                    key={i}
                    className="flex-row justify-between px-3 py-2 mb-1 rounded"
                    style={{ backgroundColor: "#334155" }}
                  >
                    <Text className="text-xs text-slate-200 w-1/2 pr-2">
                      {new Date(r.date).toLocaleString()}
                    </Text>
                    <Text className="text-xs text-slate-100 font-medium">
                      {r.value} mmol/L
                    </Text>
                  </View>
                ))
              ) : (
                <Text className="text-xs text-slate-400 italic">
                  No glucose readings.
                </Text>
              )}
            </View>

            <TouchableOpacity
              onPress={handleDownloadPDF}
              disabled={pdfGenerating}
              className="rounded-lg py-3 items-center mb-8"
              style={{
                backgroundColor: "#2563eb",
                opacity: pdfGenerating ? 0.6 : 1,
              }}
            >
              <Text className="text-white font-semibold text-sm">
                {pdfGenerating ? "Generating PDF..." : "Download PDF"}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
