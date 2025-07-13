import React, { useState, useEffect } from "react";
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

export default function ReadingGraphScreen() {
  const [readings, setReadings] = useState<ReadingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBPModal, setShowBPModal] = useState(false);
  const [showGlucoseModal, setShowGlucoseModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [systolic, setSystolic] = useState("");
  const [diastolic, setDiastolic] = useState("");
  const [glucose, setGlucose] = useState("");

  useEffect(() => {
    fetchReadings();
  }, []);

  const fetchReadings = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${BASE_URL}/api/readings/?user_id=${USER_ID}&limit=20&skip=0`
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
        fetchReadings(); // Refresh data
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
        fetchReadings(); // Refresh data
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

  const getLatestReading = (data: any[], type: "bp" | "glucose") => {
    if (!data || data.length === 0) return null;

    const latest = data.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )[0];

    return latest;
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

  if (loading) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: "#f0f3fa" }}
      >
        <ActivityIndicator size="large" color="#395886" />
        <Text className="text-gray-600 mt-4">Loading health data...</Text>
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
            Recent Readings
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
    </View>
  );
}
