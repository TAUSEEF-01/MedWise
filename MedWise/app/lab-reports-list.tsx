import React, { useEffect, useState } from "react";
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

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
  const [analysis, setAnalysis] = useState<ReportAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    Promise.all([
      fetch("https://medwise-9nv0.onrender.com/lab-reports/").then((res) =>
        res.json()
      ),
      fetch(
        "https://medwise-9nv0.onrender.com/report-analysis-responses/"
      ).then((res) => res.json()),
    ])
      .then(([labReports, reportAnalysis]) => {
        setReports(labReports);
        setAnalysis(reportAnalysis);
      })
      .catch((err) => {
        Alert.alert("Error", "Failed to fetch lab reports or analysis");
        setReports([]);
        setAnalysis([]);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: "#f0f3fa" }}>
      <View
        style={{
          padding: 20,
          backgroundColor: "#395886",
          borderBottomLeftRadius: 24,
          borderBottomRightRadius: 24,
        }}
      >
        <Text style={{ fontSize: 24, fontWeight: "bold", color: "#fff" }}>
          Lab Reports
        </Text>
        <Text style={{ color: "#cbd5e1", marginTop: 4 }}>
          All your lab reports from the cloud
        </Text>
      </View>
      {loading ? (
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <ActivityIndicator size="large" color="#395886" />
          <Text style={{ marginTop: 16, color: "#64748b" }}>
            Loading lab reports...
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          {/* Lab Reports Section */}
          {reports.length === 0 ? (
            <View style={{ alignItems: "center", marginTop: 40 }}>
              <MaterialIcons name="folder-open" size={48} color="#64748b" />
              <Text style={{ color: "#64748b", marginTop: 12 }}>
                No lab reports found.
              </Text>
            </View>
          ) : (
            <>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "bold",
                  color: "#395886",
                  marginBottom: 10,
                }}
              >
                Lab Reports
              </Text>
              {reports.map((report) => (
                <TouchableOpacity
                  key={report._id}
                  style={{
                    backgroundColor: "#fff",
                    borderRadius: 16,
                    padding: 16,
                    marginBottom: 14,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.07,
                    shadowRadius: 6,
                    elevation: 2,
                    borderWidth: 1,
                    borderColor: "#e5e7eb",
                  }}
                  activeOpacity={0.85}
                  onPress={() => {
                    Alert.alert(
                      report.basicInfo.title,
                      `Doctor: ${report.healthcareInfo.doctorName}\nHospital: ${report.healthcareInfo.hospitalName}\n\nDescription: ${report.basicInfo.description}\n\nBlood Pressure: ${report.vitalSigns.bloodPressure}\nHeart Rate: ${report.vitalSigns.heartRate}\nGlucose Level: ${report.vitalSigns.GlucoseLevel}\nWeight: ${report.vitalSigns.weight}\nMedications: ${report.additionalInfo.medications}\nDiagnosis: ${report.additionalInfo.diagnosis}`
                    );
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginBottom: 8,
                    }}
                  >
                    <MaterialIcons
                      name="description"
                      size={28}
                      color="#395886"
                    />
                    <Text
                      style={{
                        fontSize: 18,
                        fontWeight: "bold",
                        color: "#395886",
                        marginLeft: 10,
                      }}
                    >
                      {report.basicInfo.title}
                    </Text>
                  </View>
                  <Text style={{ color: "#64748b", marginBottom: 4 }}>
                    {report.basicInfo.type.replace("_", " ")}
                  </Text>
                  <Text style={{ color: "#1e293b", marginBottom: 2 }}>
                    Doctor: {report.healthcareInfo.doctorName}
                  </Text>
                  <Text style={{ color: "#1e293b", marginBottom: 2 }}>
                    Hospital: {report.healthcareInfo.hospitalName}
                  </Text>
                  <Text style={{ color: "#64748b", fontSize: 13 }}>
                    {report.basicInfo.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </>
          )}

          {/* Report Analysis Section */}
          {analysis.length > 0 && (
            <>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "bold",
                  color: "#395886",
                  marginVertical: 10,
                }}
              >
                Report Analysis
              </Text>
              {analysis.map((item) => (
                <TouchableOpacity
                  key={item._id}
                  style={{
                    backgroundColor: "#f9fafb",
                    borderRadius: 16,
                    padding: 16,
                    marginBottom: 14,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.04,
                    shadowRadius: 4,
                    elevation: 1,
                    borderWidth: 1,
                    borderColor: "#e5e7eb",
                  }}
                  activeOpacity={0.85}
                  onPress={() => {
                    Alert.alert(
                      item.data?.report_type || "Report Analysis",
                      `Doctor: ${item.data?.doctor?.name}\nPatient: ${
                        item.data?.patient?.name
                      }\nDate: ${
                        item.data?.date
                      }\nComplaints: ${item.data?.complaints?.join(
                        ", "
                      )}\nPrescriptions: ${item.data?.prescriptions
                        ?.map((p: any) => p.drug_name)
                        .join(", ")}\nAdvice: ${item.data?.advice?.join(", ")}`
                    );
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginBottom: 8,
                    }}
                  >
                    <MaterialIcons name="analytics" size={28} color="#059669" />
                    <Text
                      style={{
                        fontSize: 17,
                        fontWeight: "bold",
                        color: "#059669",
                        marginLeft: 10,
                      }}
                    >
                      {item.data?.report_type || "Report Analysis"}
                    </Text>
                  </View>
                  <Text style={{ color: "#64748b", marginBottom: 4 }}>
                    Doctor: {item.data?.doctor?.name}
                  </Text>
                  <Text style={{ color: "#64748b", marginBottom: 4 }}>
                    Patient: {item.data?.patient?.name}
                  </Text>
                  <Text style={{ color: "#64748b", fontSize: 13 }}>
                    {item.data?.complaints?.join(", ")}
                  </Text>
                </TouchableOpacity>
              ))}
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}
