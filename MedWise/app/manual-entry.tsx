import React, { useState } from "react";
import {
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useForm, Controller } from "react-hook-form";

import { Text, View } from "@/components/Themed";
import { MedicalRecord } from "@/types/medical";
import { storageUtils } from "@/utils/storage";
import "../global.css";

interface FormData {
  title: string;
  type: MedicalRecord["type"];
  description: string;
  doctorName: string;
  hospitalName: string;
  bloodPressure: string;
  heartRate: string;
  temperature: string;
  weight: string;
  height: string;
  medications: string;
  diagnosis: string;
}

export default function ManualEntryScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    defaultValues: {
      title: "",
      type: "consultation",
      description: "",
      doctorName: "",
      hospitalName: "",
      bloodPressure: "",
      heartRate: "",
      temperature: "",
      weight: "",
      height: "",
      medications: "",
      diagnosis: "",
    },
  });

  const recordTypes = [
    { value: "lab_report", label: "Lab Report", icon: "assignment" },
    { value: "prescription", label: "Prescription", icon: "local-pharmacy" },
    { value: "scan", label: "Medical Scan", icon: "scanner" },
    { value: "consultation", label: "Consultation", icon: "person" },
    { value: "other", label: "Other", icon: "description" },
  ];

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const newRecord: MedicalRecord = {
        id: Date.now().toString(),
        date: new Date(),
        title: data.title || `New ${data.type.replace("_", " ")}`,
        type: data.type,
        description: data.description,
        doctorName: data.doctorName,
        hospitalName: data.hospitalName,
        extractedData: {
          bloodPressure: data.bloodPressure || undefined,
          heartRate: data.heartRate ? parseInt(data.heartRate) : undefined,
          temperature: data.temperature
            ? parseFloat(data.temperature)
            : undefined,
          weight: data.weight ? parseFloat(data.weight) : undefined,
          height: data.height ? parseFloat(data.height) : undefined,
          medications: data.medications
            ? data.medications.split(",").map((med) => ({
                name: med.trim(),
                dosage: "",
                frequency: "",
              }))
            : undefined,
          diagnosis: data.diagnosis ? [data.diagnosis] : undefined,
        },
      };

      await storageUtils.saveMedicalRecord(newRecord);

      Alert.alert("Success", "Medical record saved successfully!", [
        { text: "OK", onPress: () => router.back() },
      ]);

      reset();
    } catch (error) {
      console.error("Error saving record:", error);
      Alert.alert("Error", "Failed to save medical record. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-gradient-to-br from-blue-50 to-indigo-100"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header Card */}
        <View className="bg-white mx-4 mt-4 rounded-2xl p-6 shadow-lg border border-blue-100">
          <View className="flex-row items-center mb-4">
            <TouchableOpacity
              onPress={() => router.back()}
              className="mr-4 p-2 bg-gray-100 rounded-full"
            >
              <MaterialIcons name="arrow-back" size={20} color="#374151" />
            </TouchableOpacity>
            <View className="flex-1">
              <Text className="text-2xl font-bold text-gray-900">
                Add Medical Record
              </Text>
              <Text className="text-gray-600 mt-1">
                Fill in the details below
              </Text>
            </View>
          </View>
        </View>

        <View className="p-4 space-y-6">
          {/* Basic Information */}
          <View className="bg-white rounded-2xl p-6 shadow-lg border border-blue-100">
            <View className="flex-row items-center mb-4">
              <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center mr-3">
                <MaterialIcons name="info" size={20} color="#2563eb" />
              </View>
              <Text className="text-xl font-bold text-gray-900">
                Basic Information
              </Text>
            </View>

            <View className="space-y-4">
              <View>
                <Text className="text-sm font-semibold text-gray-700 mb-2">
                  Title *
                </Text>
                <Controller
                  control={control}
                  rules={{ required: "Title is required" }}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      className="border-2 border-gray-200 rounded-xl px-4 py-3 text-base bg-white focus:border-blue-500"
                      placeholder="e.g., Annual Checkup, Blood Test Results"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                    />
                  )}
                  name="title"
                />
                {errors.title && (
                  <Text className="text-red-500 text-sm mt-1">
                    {errors.title.message}
                  </Text>
                )}
              </View>

              <View>
                <Text className="text-sm font-semibold text-gray-700 mb-3">
                  Record Type *
                </Text>
                <Controller
                  control={control}
                  render={({ field: { onChange, value } }) => (
                    <View className="flex-row flex-wrap gap-2">
                      {recordTypes.map((type) => (
                        <TouchableOpacity
                          key={type.value}
                          onPress={() => onChange(type.value)}
                          className={`flex-row items-center px-4 py-3 rounded-xl border-2 ${
                            value === type.value
                              ? "bg-blue-600 border-blue-600"
                              : "bg-white border-gray-200"
                          }`}
                        >
                          <MaterialIcons
                            name={type.icon as any}
                            size={18}
                            color={value === type.value ? "white" : "#6b7280"}
                          />
                          <Text
                            className={`text-sm font-medium ml-2 ${
                              value === type.value
                                ? "text-white"
                                : "text-gray-700"
                            }`}
                          >
                            {type.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                  name="type"
                />
              </View>

              <View>
                <Text className="text-sm font-semibold text-gray-700 mb-2">
                  Description
                </Text>
                <Controller
                  control={control}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      className="border-2 border-gray-200 rounded-xl px-4 py-3 text-base bg-white h-24 focus:border-blue-500"
                      placeholder="Brief description of the medical record..."
                      multiline
                      textAlignVertical="top"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                    />
                  )}
                  name="description"
                />
              </View>
            </View>
          </View>

          {/* Healthcare Provider */}
          <View className="bg-white rounded-2xl p-6 shadow-lg border border-green-100">
            <View className="flex-row items-center mb-4">
              <View className="w-10 h-10 bg-green-100 rounded-full items-center justify-center mr-3">
                <MaterialIcons
                  name="local-hospital"
                  size={20}
                  color="#059669"
                />
              </View>
              <Text className="text-xl font-bold text-gray-900">
                Healthcare Provider
              </Text>
            </View>

            <View className="space-y-4">
              <View>
                <Text className="text-sm font-semibold text-gray-700 mb-2">
                  Doctor's Name
                </Text>
                <Controller
                  control={control}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      className="border-2 border-gray-200 rounded-xl px-4 py-3 text-base bg-white focus:border-green-500"
                      placeholder="Dr. John Smith"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                    />
                  )}
                  name="doctorName"
                />
              </View>

              <View>
                <Text className="text-sm font-semibold text-gray-700 mb-2">
                  Hospital/Clinic
                </Text>
                <Controller
                  control={control}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      className="border-2 border-gray-200 rounded-xl px-4 py-3 text-base bg-white focus:border-green-500"
                      placeholder="City General Hospital"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                    />
                  )}
                  name="hospitalName"
                />
              </View>
            </View>
          </View>

          {/* Vital Signs */}
          <View className="bg-white rounded-2xl p-6 shadow-lg border border-purple-100">
            <View className="flex-row items-center mb-4">
              <View className="w-10 h-10 bg-purple-100 rounded-full items-center justify-center mr-3">
                <MaterialIcons name="favorite" size={20} color="#7c3aed" />
              </View>
              <Text className="text-xl font-bold text-gray-900">
                Vital Signs
              </Text>
              <Text className="text-sm text-gray-500 ml-2">(Optional)</Text>
            </View>

            <View className="grid grid-cols-2 gap-4">
              <View>
                <Text className="text-sm font-semibold text-gray-700 mb-2">
                  Blood Pressure
                </Text>
                <Controller
                  control={control}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      className="border-2 border-gray-200 rounded-xl px-4 py-3 text-base bg-white focus:border-purple-500"
                      placeholder="120/80"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                    />
                  )}
                  name="bloodPressure"
                />
              </View>

              <View>
                <Text className="text-sm font-semibold text-gray-700 mb-2">
                  Heart Rate (bpm)
                </Text>
                <Controller
                  control={control}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      className="border-2 border-gray-200 rounded-xl px-4 py-3 text-base bg-white focus:border-purple-500"
                      placeholder="72"
                      keyboardType="numeric"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                    />
                  )}
                  name="heartRate"
                />
              </View>

              <View>
                <Text className="text-sm font-semibold text-gray-700 mb-2">
                  Temperature (°F)
                </Text>
                <Controller
                  control={control}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      className="border-2 border-gray-200 rounded-xl px-4 py-3 text-base bg-white focus:border-purple-500"
                      placeholder="98.6"
                      keyboardType="decimal-pad"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                    />
                  )}
                  name="temperature"
                />
              </View>

              <View>
                <Text className="text-sm font-semibold text-gray-700 mb-2">
                  Weight (lbs)
                </Text>
                <Controller
                  control={control}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      className="border-2 border-gray-200 rounded-xl px-4 py-3 text-base bg-white focus:border-purple-500"
                      placeholder="150"
                      keyboardType="decimal-pad"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                    />
                  )}
                  name="weight"
                />
              </View>
            </View>
          </View>

          {/* Additional Information */}
          <View className="bg-white rounded-2xl p-6 shadow-lg border border-orange-100">
            <View className="flex-row items-center mb-4">
              <View className="w-10 h-10 bg-orange-100 rounded-full items-center justify-center mr-3">
                <MaterialIcons name="note-add" size={20} color="#f59e0b" />
              </View>
              <Text className="text-xl font-bold text-gray-900">
                Additional Information
              </Text>
            </View>

            <View className="space-y-4">
              <View>
                <Text className="text-sm font-semibold text-gray-700 mb-2">
                  Medications
                </Text>
                <Controller
                  control={control}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      className="border-2 border-gray-200 rounded-xl px-4 py-3 text-base bg-white focus:border-orange-500"
                      placeholder="Separate multiple medications with commas"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                    />
                  )}
                  name="medications"
                />
              </View>

              <View>
                <Text className="text-sm font-semibold text-gray-700 mb-2">
                  Diagnosis
                </Text>
                <Controller
                  control={control}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      className="border-2 border-gray-200 rounded-xl px-4 py-3 text-base bg-white h-24 focus:border-orange-500"
                      placeholder="Medical diagnosis or findings..."
                      multiline
                      textAlignVertical="top"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                    />
                  )}
                  name="diagnosis"
                />
              </View>
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleSubmit(onSubmit)}
            disabled={loading}
            className={`bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-4 items-center shadow-lg ${
              loading ? "opacity-50" : ""
            }`}
          >
            <View className="flex-row items-center">
              {loading ? (
                <MaterialIcons name="hourglass-empty" size={20} color="white" />
              ) : (
                <MaterialIcons name="save" size={20} color="white" />
              )}
              <Text className="text-white text-lg font-bold ml-2">
                {loading ? "Saving..." : "Save Medical Record"}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
