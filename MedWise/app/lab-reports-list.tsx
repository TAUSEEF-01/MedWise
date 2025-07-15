import React, { useEffect, useState } from "react";
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { PDFExportService } from "@/utils/pdfExport";

interface LabReport {
  _id: string;
  basicInfo: {
    title: string;
    type: string;
    description: string;
  };
  healthcareInfo: {
    doctorName: string;
    hospitalName: string;
  };
  vitalSigns: {
    bloodPressure: string;
    heartRate: string;
    GlucoseLevel: string;
    weight: string;
  };
  additionalInfo: {
    medications: string;
    diagnosis: string;
  };
}

interface ReportAnalysis {
  _id: string;
  user_id: string;
  image_id: string;
  data: any;
  created_at?: any;
}

export default function LabReportsListScreen() {
  const [reports, setReports] = useState<LabReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exportingPDF, setExportingPDF] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const res = await fetch("https://medwise-9nv0.onrender.com/lab-reports/");
      const data = await res.json();
      setReports(data);
    } catch (err) {
      Alert.alert("Error", "Failed to fetch lab reports");
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchReports();
    setRefreshing(false);
  };

  const handleExportPDF = async (report: LabReport) => {
    setExportingPDF(report._id);
    try {
      const pdfData = {
        title: report.basicInfo.title,
        type: report.basicInfo.type,
        description: report.basicInfo.description || "",
        doctorName: report.healthcareInfo.doctorName || "",
        hospitalName: report.healthcareInfo.hospitalName || "",
        bloodPressure: report.vitalSigns.bloodPressure || "",
        heartRate: report.vitalSigns.heartRate || "",
        glucoseLevel: report.vitalSigns.GlucoseLevel || "",
        temperature: "",
        weight: report.vitalSigns.weight || "",
        height: "",
        medications: report.additionalInfo.medications || "",
        diagnosis: report.additionalInfo.diagnosis || "",
        date: new Date().toISOString(),
      };

      await PDFExportService.exportAndShare(pdfData);
      Alert.alert("Success", "PDF exported successfully!");
    } catch (error) {
      console.error("Error exporting PDF:", error);
      Alert.alert("Error", "Failed to export PDF. Please try again.");
    } finally {
      setExportingPDF(null);
    }
  };

  const getReportTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "blood_test":
        return "#ef4444";
      case "urine_test":
        return "#f59e0b";
      case "x_ray":
        return "#3b82f6";
      case "mri":
        return "#8b5cf6";
      default:
        return "#10b981";
    }
  };

  const getReportTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "blood_test":
        return "opacity";
      case "urine_test":
        return "local-hospital";
      case "x_ray":
        return "camera";
      case "mri":
        return "scanner";
      default:
        return "description";
    }
  };

  return (
    <View className="flex-1" style={{ backgroundColor: "#f0f3fa" }}>
      {/* Simple White App Bar */}
      <View
        className="px-5 pt-10 pb-4 bg-white"
        style={{
          borderBottomWidth: 1,
          borderBottomColor: "#e2e8f0",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 3,
          elevation: 2,
        }}
      >
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full items-center justify-center mr-4"
            style={{ backgroundColor: "#f1f5f9" }}
          >
            <MaterialIcons name="arrow-back" size={22} color="#1e293b" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-2xl font-bold text-black">Lab Reports</Text>
            <Text className="text-gray-500 text-sm mt-1">
              {reports.length} {reports.length === 1 ? "report" : "reports"}{" "}
              found
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingTop: 24, paddingBottom: 24 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#395886"]}
            tintColor="#395886"
          />
        }
      >
        {loading ? (
          <View className="items-center justify-center py-20">
            <View
              className="w-20 h-20 rounded-full items-center justify-center mb-6"
              style={{
                backgroundColor: "#f0f3fa",
                borderWidth: 2,
                borderColor: "#395886",
              }}
            >
              <ActivityIndicator size="large" color="#395886" />
            </View>
            <Text className="text-gray-700 text-lg font-semibold">
              Loading reports...
            </Text>
            <Text className="text-gray-500 text-sm mt-1">
              Please wait while we fetch your data
            </Text>
          </View>
        ) : !Array.isArray(reports) || reports.length === 0 ? (
          <View className="items-center justify-center py-20">
            <View
              className="w-24 h-24 rounded-full items-center justify-center mb-6"
              style={{
                backgroundColor: "#f0f3fa",
                borderWidth: 2,
                borderColor: "#395886",
              }}
            >
              <MaterialIcons name="folder-open" size={48} color="#395886" />
            </View>
            <Text className="text-xl font-bold text-gray-900 mb-2">
              No Reports Yet
            </Text>
            <Text className="text-gray-500 text-center px-8 leading-5">
              Your lab reports will appear here once they are available
            </Text>
          </View>
        ) : (
          reports.map((report) => (
            <View
              key={report._id}
              className="mb-5 rounded-2xl overflow-hidden"
              style={{
                backgroundColor: "#d5deef",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 8,
                elevation: 3,
                borderWidth: 1,
                borderColor: "#395886",
              }}
            >
              {/* Enhanced Card Header */}
              <View
                className="px-5 py-4"
                style={{
                  backgroundColor: "#fafbfc",
                  borderBottomWidth: 1,
                  borderBottomColor: "#395886",
                }}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center flex-1">
                    <View
                      className="w-12 h-12 rounded-2xl items-center justify-center mr-4"
                      style={{
                        backgroundColor: "#f0f3fa",
                        borderWidth: 2,
                        borderColor: "#395886",
                      }}
                    >
                      <MaterialIcons
                        name={getReportTypeIcon(report.basicInfo.type)}
                        size={24}
                        color="#395886"
                      />
                    </View>
                    <View className="flex-1">
                      <Text
                        className="font-bold text-gray-900 mb-1"
                        numberOfLines={1}
                        style={{ fontSize: 16 }}
                      >
                        {report.basicInfo.title}
                      </Text>
                      <Text className="text-gray-500 text-xs">
                        Dr. {report.healthcareInfo.doctorName}
                      </Text>
                    </View>
                  </View>
                  <View
                    className="px-3 py-2 rounded-full flex-row items-center"
                    style={{
                      backgroundColor: `${getReportTypeColor(
                        report.basicInfo.type
                      )}20`,
                      borderWidth: 1,
                      borderColor: `${getReportTypeColor(
                        report.basicInfo.type
                      )}40`,
                    }}
                  >
                    <MaterialIcons
                      name={getReportTypeIcon(report.basicInfo.type)}
                      size={16}
                      color={getReportTypeColor(report.basicInfo.type)}
                    />
                    <Text
                      className="ml-2 font-semibold text-xs"
                      style={{
                        color: getReportTypeColor(report.basicInfo.type),
                      }}
                    >
                      {report.basicInfo.type.replace("_", " ").toUpperCase()}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Enhanced Card Content */}
              <View className="p-5">
                <View className="space-y-3">
                  <View className="flex-row items-center">
                    <View
                      className="w-8 h-8 rounded-lg items-center justify-center mr-3"
                      style={{ backgroundColor: "#f3f4f6" }}
                    >
                      <MaterialIcons
                        name="local-hospital"
                        size={18}
                        color="#6b7280"
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-gray-500 text-xs font-medium">
                        Hospital
                      </Text>
                      <Text className="text-gray-800 text-sm">
                        {report.healthcareInfo.hospitalName}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row items-start">
                    <View
                      className="w-8 h-8 rounded-lg items-center justify-center mr-3"
                      style={{ backgroundColor: "#f3f4f6" }}
                    >
                      <MaterialIcons
                        name="description"
                        size={18}
                        color="#6b7280"
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-gray-500 text-xs font-medium">
                        Description
                      </Text>
                      <Text className="text-gray-800 text-sm leading-5">
                        {report.basicInfo.description}
                      </Text>
                    </View>
                  </View>

                  {report.vitalSigns.bloodPressure && (
                    <View className="flex-row items-center">
                      <View
                        className="w-8 h-8 rounded-lg items-center justify-center mr-3"
                        style={{ backgroundColor: "#fee2e2" }}
                      >
                        <MaterialIcons
                          name="favorite"
                          size={18}
                          color="#ef4444"
                        />
                      </View>
                      <View className="flex-1">
                        <Text className="text-gray-500 text-xs font-medium">
                          Blood Pressure
                        </Text>
                        <Text className="text-gray-800 text-sm">
                          {report.vitalSigns.bloodPressure}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>

                <View className="mt-5 flex-row space-x-3">
                  <TouchableOpacity
                    className="flex-1 rounded-xl py-4 px-5 flex-row items-center justify-center"
                    style={{
                      backgroundColor: "#395886",
                      shadowColor: "#395886",
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.25,
                      shadowRadius: 8,
                      elevation: 4,
                    }}
                    onPress={() => {
                      Alert.alert(
                        report.basicInfo.title,
                        `Doctor: ${report.healthcareInfo.doctorName}\nHospital: ${report.healthcareInfo.hospitalName}\n\nDescription: ${report.basicInfo.description}\n\nBlood Pressure: ${report.vitalSigns.bloodPressure}\nHeart Rate: ${report.vitalSigns.heartRate}\nGlucose Level: ${report.vitalSigns.GlucoseLevel}\nWeight: ${report.vitalSigns.weight}\nMedications: ${report.additionalInfo.medications}\nDiagnosis: ${report.additionalInfo.diagnosis}`
                      );
                    }}
                  >
                    <View
                      className="w-8 h-8 rounded-lg items-center justify-center mr-3"
                      style={{ backgroundColor: "rgba(255, 255, 255, 0.2)" }}
                    >
                      <MaterialIcons
                        name="visibility"
                        size={20}
                        color="white"
                      />
                    </View>
                    <Text className="text-white font-semibold text-base flex-1">
                      View Details
                    </Text>
                    <MaterialIcons
                      name="arrow-forward"
                      size={18}
                      color="white"
                    />
                  </TouchableOpacity>
                </View>

                {/* PDF Export Button */}
                <TouchableOpacity
                  onPress={() => handleExportPDF(report)}
                  disabled={exportingPDF === report._id}
                  className="mt-3 rounded-xl py-4 px-5 flex-row items-center justify-center"
                  style={{
                    backgroundColor:
                      exportingPDF === report._id ? "#9ca3af" : "#10b981",
                    shadowColor: "#10b981",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: exportingPDF === report._id ? 0.1 : 0.25,
                    shadowRadius: 8,
                    elevation: 4,
                    opacity: exportingPDF === report._id ? 0.7 : 1,
                  }}
                >
                  <View
                    className="w-8 h-8 rounded-lg items-center justify-center mr-3"
                    style={{ backgroundColor: "rgba(255, 255, 255, 0.2)" }}
                  >
                    {exportingPDF === report._id ? (
                      <ActivityIndicator size={20} color="white" />
                    ) : (
                      <MaterialIcons
                        name="file-download"
                        size={20}
                        color="white"
                      />
                    )}
                  </View>
                  <Text className="text-white font-semibold text-base flex-1">
                    {exportingPDF === report._id
                      ? "Exporting PDF..."
                      : "Download PDF"}
                  </Text>
                  <MaterialIcons name="get-app" size={18} color="white" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
