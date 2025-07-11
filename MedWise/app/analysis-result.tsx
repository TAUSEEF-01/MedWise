import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
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

  const renderAnalysisData = (data: AnalysisData) => {
    return (
      <View className="space-y-4 mb-8">
        {/* Basic Information */}
        <View className="bg-white rounded-lg p-4 shadow-sm mb-4">
          <Text className="text-lg font-semibold text-gray-900 mb-3">
            Document Information
          </Text>

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
          <View className="bg-white rounded-lg p-4 shadow-sm">
            <Text className="text-lg font-semibold text-gray-900 mb-3">
              Patient Information
            </Text>

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
          <View className="bg-white rounded-lg p-4 shadow-sm">
            <Text className="text-lg font-semibold text-gray-900 mb-3">
              Diagnosis
            </Text>
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
          <View className="bg-white rounded-lg p-4 shadow-sm">
            <Text className="text-lg font-semibold text-gray-900 mb-3">
              Prescriptions
            </Text>
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
          <View className="bg-white rounded-lg p-4 shadow-sm">
            <Text className="text-lg font-semibold text-gray-900 mb-3">
              Medical Advice
            </Text>
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
          <View className="bg-white rounded-lg p-4 shadow-sm">
            <Text className="text-lg font-semibold text-gray-900 mb-3">
              Next Appointment
            </Text>
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
    <ScrollView className="flex-1 p-4 bg-gray-50 mb-4">
        {!result ? (
          <View className="flex-1 items-center justify-center py-20">
            <ActivityIndicator size="large" color="#2563eb" />
            <Text className="text-gray-600 mt-4 text-center">
              No analysis result found.
            </Text>
          </View>
        ) : result.success && result.data ? (
          <>
            <View className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <View className="flex-row items-center">
                <MaterialIcons name="check-circle" size={24} color="#059669" />
                <Text className="text-green-800 font-semibold ml-2">
                  Analysis Completed Successfully
                </Text>
              </View>
            </View>

            {renderAnalysisData(result.data)}

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
  );
}
