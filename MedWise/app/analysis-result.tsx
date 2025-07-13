import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
} from "react-native";
import { MaterialIcons, Feather } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

interface AnalysisData {
  report_type?: string;
  date?: string;
  doctor?: {
    name?: string;
  };
  patient?: {
    name?: string;
    age?: string;
    sex?: string;
    weight?: string;
  };
  diagnosis?: string;
  prescriptions?: Array<{
    drug_name?: string;
    dosage?: string;
    instructions?: string;
    duration?: string;
  }>;
  advice?: string[];
  next_appointment?: string;
  [key: string]: any;
}

interface AnalysisResult {
  status: string;
  imageId: string;
  uploadedAt: string;
  completedAt?: string;
  error?: string;
  data?: {
    success: boolean;
    data: AnalysisData;
    raw_text: string;
    error?: string;
  };
}

export default function AnalysisResultScreen() {
  const router = useRouter();
  const { analysisResult } = useLocalSearchParams();

  // Parse the analysisResult param (stringified JSON)
  let result: any = null;
  try {
    console.log("Parsing analysisResult:", analysisResult);
    if (analysisResult) {
      result =
        typeof analysisResult === "string"
          ? JSON.parse(analysisResult)
          : analysisResult;
    }
  } catch (err) {
    result = null;
  }

  // Local state for editing
  const [editSection, setEditSection] = useState<string | null>(null);
  const [editFields, setEditFields] = useState<any>(null);
  const [localData, setLocalData] = useState(result?.data || null);

  // Helper to open edit modal for each section/subfield
  const handleEdit = (section: string, value: any) => {
    setEditSection(section);
    // Deep copy to avoid direct mutation
    setEditFields(JSON.parse(JSON.stringify(value)));
  };

  // Helper to save edits
  const handleSaveEdit = () => {
    if (!editSection) return;
    setLocalData((prev: any) => {
      const updated = { ...prev };
      if (editSection === "document") {
        updated.report_type = editFields.report_type;
        updated.date = editFields.date;
        updated.doctor = { ...editFields.doctor };
      } else if (editSection === "patient") {
        updated.patient = { ...editFields };
      } else if (editSection === "diagnosis") {
        updated.diagnosis = editFields.diagnosis;
      } else if (editSection === "prescriptions") {
        updated.prescriptions = [...editFields];
      } else if (editSection === "advice") {
        updated.advice = [...editFields];
      } else if (editSection === "next_appointment") {
        updated.next_appointment = editFields.next_appointment;
      }
      return updated;
    });
    setEditSection(null);
    setEditFields(null);
  };

  // Helper to render edit modal with field-wise editing
  const renderEditModal = () => {
    if (!editSection) return null;

    let fields = [];
    if (editSection === "document") {
      fields = [
        {
          label: "Report Type",
          value: editFields.report_type,
          onChange: (v: string) =>
            setEditFields((f: any) => ({ ...f, report_type: v })),
        },
        {
          label: "Date",
          value: editFields.date,
          onChange: (v: string) =>
            setEditFields((f: any) => ({ ...f, date: v })),
        },
        {
          label: "Doctor Name",
          value: editFields.doctor?.name || "",
          onChange: (v: string) =>
            setEditFields((f: any) => ({
              ...f,
              doctor: { ...f.doctor, name: v },
            })),
        },
      ];
    } else if (editSection === "patient") {
      fields = [
        {
          label: "Name",
          value: editFields.name,
          onChange: (v: string) =>
            setEditFields((f: any) => ({ ...f, name: v })),
        },
        {
          label: "Age",
          value: editFields.age,
          onChange: (v: string) =>
            setEditFields((f: any) => ({ ...f, age: v })),
        },
        {
          label: "Sex",
          value: editFields.sex,
          onChange: (v: string) =>
            setEditFields((f: any) => ({ ...f, sex: v })),
        },
        {
          label: "Weight",
          value: editFields.weight,
          onChange: (v: string) =>
            setEditFields((f: any) => ({ ...f, weight: v })),
        },
      ];
    } else if (editSection === "diagnosis") {
      fields = [
        {
          label: "Diagnosis",
          value: editFields,
          onChange: (v: string) => setEditFields(v),
        },
      ];
    } else if (editSection === "prescriptions") {
      fields = editFields.map((presc: any, idx: number) => ({
        label: `Prescription ${idx + 1}`,
        custom: (
          <View key={idx} style={{ marginBottom: 16 }}>
            <Text style={{ fontWeight: "bold", marginBottom: 4 }}>
              Prescription {idx + 1}
            </Text>
            <TextInput
              value={presc.drug_name}
              onChangeText={(v) => {
                const arr = [...editFields];
                arr[idx].drug_name = v;
                setEditFields(arr);
              }}
              style={{
                borderWidth: 1,
                borderColor: "#e5e7eb",
                borderRadius: 8,
                padding: 8,
                marginBottom: 6,
              }}
              placeholder="Drug Name"
            />
            <TextInput
              value={presc.dosage}
              onChangeText={(v) => {
                const arr = [...editFields];
                arr[idx].dosage = v;
                setEditFields(arr);
              }}
              style={{
                borderWidth: 1,
                borderColor: "#e5e7eb",
                borderRadius: 8,
                padding: 8,
                marginBottom: 6,
              }}
              placeholder="Dosage"
            />
            <TextInput
              value={presc.instructions}
              onChangeText={(v) => {
                const arr = [...editFields];
                arr[idx].instructions = v;
                setEditFields(arr);
              }}
              style={{
                borderWidth: 1,
                borderColor: "#e5e7eb",
                borderRadius: 8,
                padding: 8,
                marginBottom: 6,
              }}
              placeholder="Instructions"
            />
            <TextInput
              value={presc.duration}
              onChangeText={(v) => {
                const arr = [...editFields];
                arr[idx].duration = v;
                setEditFields(arr);
              }}
              style={{
                borderWidth: 1,
                borderColor: "#e5e7eb",
                borderRadius: 8,
                padding: 8,
              }}
              placeholder="Duration"
            />
          </View>
        ),
      }));
    } else if (editSection === "advice") {
      fields = editFields.map((ad: string, idx: number) => ({
        label: `Advice ${idx + 1}`,
        value: ad,
        onChange: (v: string) => {
          const arr = [...editFields];
          arr[idx] = v;
          setEditFields(arr);
        },
      }));
    } else if (editSection === "next_appointment") {
      fields = [
        {
          label: "Next Appointment",
          value: editFields,
          onChange: (v: string) => setEditFields(v),
        },
      ];
    }

    return (
      <Modal
        visible={!!editSection}
        transparent
        animationType="slide"
        onRequestClose={() => setEditSection(null)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.3)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <View
            style={{
              backgroundColor: "#fff",
              borderRadius: 16,
              padding: 24,
              width: "90%",
              shadowColor: "#000",
              shadowOpacity: 0.2,
              shadowRadius: 8,
              elevation: 8,
            }}
          >
            <Text
              style={{ fontWeight: "bold", fontSize: 18, marginBottom: 12 }}
            >
              Edit {editSection.replace("_", " ")}
            </Text>
            <ScrollView style={{ maxHeight: 350 }}>
              {fields.map((f, idx) =>
                f.custom ? (
                  f.custom
                ) : (
                  <View key={idx} style={{ marginBottom: 16 }}>
                    <Text style={{ marginBottom: 4 }}>{f.label}</Text>
                    <TextInput
                      value={f.value}
                      onChangeText={f.onChange}
                      style={{
                        borderWidth: 1,
                        borderColor: "#e5e7eb",
                        borderRadius: 8,
                        padding: 10,
                        fontSize: 16,
                      }}
                    />
                  </View>
                )
              )}
            </ScrollView>
            <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
              <TouchableOpacity
                onPress={() => setEditSection(null)}
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 16,
                  borderRadius: 8,
                  backgroundColor: "#e5e7eb",
                  marginRight: 8,
                }}
              >
                <Text style={{ color: "#374151" }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveEdit}
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 16,
                  borderRadius: 8,
                  backgroundColor: "#2563eb",
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "bold" }}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const renderAnalysisData = (data: AnalysisData) => {
    return (
      <View className="space-y-6 mb-8">
        {/* Document Information */}
        <View className="bg-white rounded-2xl p-5 shadow-lg mb-4 border border-gray-100">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-xl font-bold text-gray-900">
              Document Information
            </Text>
            <TouchableOpacity
              onPress={() =>
                handleEdit("document", {
                  report_type: data.report_type,
                  date: data.date,
                  doctor: data.doctor,
                })
              }
              style={{ padding: 4 }}
            >
              <Feather name="edit-2" size={20} color="#2563eb" />
            </TouchableOpacity>
          </View>

          {data.report_type && (
            <View className="flex-row items-center mb-4">
              <MaterialIcons name="description" size={18} color="#6b7280" />
              <Text className="text-gray-700 ml-2">
                Type: {data.report_type}
              </Text>
            </View>
          )}

          {data.date && (
            <View className="flex-row items-center mb-2">
              <MaterialIcons name="calendar-today" size={18} color="#6b7280" />
              <Text className="text-gray-700 ml-2">Date: {data.date}</Text>
            </View>
          )}

          {data.doctor?.name && (
            <View className="flex-row items-center mb-2">
              <MaterialIcons name="person" size={18} color="#6b7280" />
              <Text className="text-gray-700 ml-2">
                Doctor: {data.doctor.name}
              </Text>
            </View>
          )}
        </View>

        {/* Patient Information */}
        {data.patient && (
          <View className="bg-white rounded-2xl p-5 shadow-lg mb-4 border border-gray-100">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-xl font-bold text-gray-900">
                Patient Information
              </Text>
              <TouchableOpacity
                onPress={() => handleEdit("patient", data.patient)}
                style={{ padding: 4 }}
              >
                <Feather name="edit-2" size={20} color="#2563eb" />
              </TouchableOpacity>
            </View>

            {data.patient.name && (
              <View className="flex-row items-center mb-2">
                <MaterialIcons
                  name="person-outline"
                  size={18}
                  color="#6b7280"
                />
                <Text className="text-gray-700 ml-2">
                  Name: {data.patient.name}
                </Text>
              </View>
            )}

            <View className="flex-row justify-between">
              {data.patient.age && (
                <Text className="text-gray-700">Age: {data.patient.age}</Text>
              )}
              {data.patient.sex && (
                <Text className="text-gray-700">Sex: {data.patient.sex}</Text>
              )}
              {data.patient.weight && (
                <Text className="text-gray-700">
                  Weight: {data.patient.weight}
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Diagnosis */}
        {data.diagnosis && (
          <View className="bg-white rounded-2xl p-5 shadow-lg mb-4 border border-gray-100">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-xl font-bold text-gray-900">Diagnosis</Text>
              <TouchableOpacity
                onPress={() => handleEdit("diagnosis", data.diagnosis)}
                style={{ padding: 4 }}
              >
                <Feather name="edit-2" size={20} color="#2563eb" />
              </TouchableOpacity>
            </View>
            <View className="flex-row items-start">
              <MaterialIcons
                name="medical-services"
                size={18}
                color="#dc2626"
              />
              <Text className="text-gray-700 ml-2 flex-1">
                {data.diagnosis}
              </Text>
            </View>
          </View>
        )}

        {/* Prescriptions */}
        {data.prescriptions && data.prescriptions.length > 0 && (
          <View className="bg-white rounded-2xl p-5 shadow-lg mb-4 border border-gray-100">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-xl font-bold text-gray-900">
                Prescriptions
              </Text>
              <TouchableOpacity
                onPress={() => handleEdit("prescriptions", data.prescriptions)}
                style={{ padding: 4 }}
              >
                <Feather name="edit-2" size={20} color="#2563eb" />
              </TouchableOpacity>
            </View>
            {data.prescriptions.map((prescription, index) => (
              <View key={index} className="mb-3 p-3 bg-green-50 rounded-lg">
                <View className="flex-row items-start">
                  <MaterialIcons name="medication" size={18} color="#059669" />
                  <View className="ml-2 flex-1">
                    <Text className="text-gray-900 font-medium">
                      {prescription.drug_name}
                    </Text>
                    {prescription.dosage && (
                      <Text className="text-gray-600 text-sm">
                        Dosage: {prescription.dosage}
                      </Text>
                    )}
                    {prescription.instructions && (
                      <Text className="text-gray-600 text-sm">
                        Instructions: {prescription.instructions}
                      </Text>
                    )}
                    {prescription.duration && (
                      <Text className="text-gray-600 text-sm">
                        Duration: {prescription.duration}
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Advice */}
        {data.advice && data.advice.length > 0 && (
          <View className="bg-white rounded-2xl p-5 shadow-lg mb-4 border border-gray-100">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-xl font-bold text-gray-900">
                Medical Advice
              </Text>
              <TouchableOpacity
                onPress={() => handleEdit("advice", data.advice)}
                style={{ padding: 4 }}
              >
                <Feather name="edit-2" size={20} color="#2563eb" />
              </TouchableOpacity>
            </View>
            {data.advice.map((advice, index) => (
              <View key={index} className="flex-row items-start mb-2">
                <MaterialIcons name="lightbulb" size={18} color="#f59e0b" />
                <Text className="text-gray-700 ml-2 flex-1">{advice}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Next Appointment */}
        {data.next_appointment && (
          <View className="bg-white rounded-2xl p-5 shadow-lg mb-4 border border-gray-100">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-xl font-bold text-gray-900">
                Next Appointment
              </Text>
              <TouchableOpacity
                onPress={() =>
                  handleEdit("next_appointment", data.next_appointment)
                }
                style={{ padding: 4 }}
              >
                <Feather name="edit-2" size={20} color="#2563eb" />
              </TouchableOpacity>
            </View>
            <View className="flex-row items-center">
              <MaterialIcons name="schedule" size={18} color="#8b5cf6" />
              <Text className="text-gray-700 ml-2">
                {data.next_appointment}
              </Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f3f4f6" }}>
      {/* Top Bar */}
      <View
        style={{
          width: "100%",
          paddingVertical: 18,
          paddingHorizontal: 16,
          backgroundColor: "#2563eb",
          alignItems: "center",
          justifyContent: "center",
          borderBottomWidth: 1,
          borderBottomColor: "#e5e7eb",
          marginBottom: 4,
        }}
      >
        <Text
          style={{
            color: "#fff",
            fontSize: 22,
            fontWeight: "bold",
            letterSpacing: 1,
          }}
        >
          Analysis Report
        </Text>
      </View>
      {/* Main Content */}
      <ScrollView className="flex-1 p-4 mb-4">
        {!result ? (
          <View className="flex-1 items-center justify-center py-20">
            <ActivityIndicator size="large" color="#2563eb" />
            <Text className="text-gray-600 mt-4 text-center">
              No analysis result found.
            </Text>
          </View>
        ) : result.success && (localData || result.data) ? (
          <>
            <View className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4 shadow">
              <View className="flex-row items-center">
                <MaterialIcons name="check-circle" size={24} color="#059669" />
                <Text className="text-green-800 font-semibold ml-2 text-lg">
                  Analysis Completed Successfully
                </Text>
              </View>
            </View>
            {renderAnalysisData(localData || result.data)}

            {/* Show raw text if available */}
            {/* {result.raw_text && (
              <View className="bg-gray-100 rounded-lg p-4 mt-4">
                <Text className="text-gray-700 text-xs font-mono">
                  Raw Text: {result.raw_text.substring(0, 400)}...
                </Text>
              </View>
            )} */}

            {/* Show error if available */}
            {result.error && (
              <View className="bg-red-100 rounded-lg p-4 mt-4">
                <Text className="text-red-700 text-xs font-mono">
                  Error: {result.error}
                </Text>
              </View>
            )}
          </>
        ) : (
          <View className="flex-1 items-center justify-center py-20">
            <MaterialIcons name="warning" size={48} color="#f59e0b" />
            <Text className="text-yellow-600 mt-4 text-center font-semibold">
              No Data Available
            </Text>
            <Text className="text-gray-600 mt-2 text-center px-4">
              The analysis completed but no structured data could be extracted
              from the document.
            </Text>
            {/* {result?.raw_text && (
              <View className="bg-gray-100 rounded-lg p-4 mt-4 max-w-xs">
                <Text className="text-gray-700 text-sm">
                  Raw Text: {result.raw_text.substring(0, 200)}...
                </Text>
              </View>
            )} */}
            {/* <TouchableOpacity
              onPress={() => router.back()}
              className="bg-blue-600 px-6 py-3 rounded-lg mt-6"
            >
              <Text className="text-white font-semibold">Go Back</Text>
            </TouchableOpacity> */}
          </View>
        )}
      </ScrollView>
      {renderEditModal()}
    </SafeAreaView>
  );
}
