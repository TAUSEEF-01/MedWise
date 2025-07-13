import React, { useState } from "react";
import {
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Text,
  View,
  Animated,
  StatusBar,
  Vibration,
  Dimensions,
  Modal,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { useManualEntry } from "@/app/manual-entry/ManualEntryContext";
import { MedicalRecord } from "@/types/medical";
import { storageUtils } from "@/utils/storage";
import { PDFExportService } from "@/utils/pdfExport";
import { useFocusEffect } from "@react-navigation/native";

const { width, height } = Dimensions.get("window");

interface VitalSignsData {
  bloodPressure: string;
  heartRate: string;
  temperature: string;
  weight: string;
  height: string;
  medications: string;
  diagnosis: string;
}

export default function VitalSignsScreen() {
  const router = useRouter();
  const { formData, updateFormData, resetFormData, exportToPDF, isExporting } =
    useManualEntry();
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [recordSaved, setRecordSaved] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [savedRecord, setSavedRecord] = useState<MedicalRecord | null>(null);
  const [exportingPDF, setExportingPDF] = useState(false);
  const scrollViewRef = React.useRef<ScrollView>(null);

  // Helper functions
  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return dateObj.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getTypeColor = (type: MedicalRecord["type"]) => {
    const colors = {
      lab_report: "bg-blue-100 text-blue-800",
      prescription: "bg-green-100 text-green-800",
      scan: "bg-purple-100 text-purple-800",
      consultation: "bg-orange-100 text-orange-800",
      vaccination: "bg-red-100 text-red-800",
      allergy: "bg-yellow-100 text-yellow-800",
      insurance: "bg-indigo-100 text-indigo-800",
      other: "bg-gray-100 text-gray-800",
    };
    return colors[type] || colors.other;
  };

  const openPreview = () => {
    setShowPreview(true);
  };

  const closePreview = () => {
    setShowPreview(false);
  };

  const handleExportPDF = async () => {
    if (!savedRecord) return;

    setExportingPDF(true);
    try {
      const pdfData = {
        title: savedRecord.title,
        type: savedRecord.type,
        description: savedRecord.description || "",
        doctorName: savedRecord.doctorName || "",
        hospitalName: savedRecord.hospitalName || "",
        bloodPressure: savedRecord.extractedData?.bloodPressure || "",
        heartRate: savedRecord.extractedData?.heartRate?.toString() || "",
        temperature: savedRecord.extractedData?.temperature?.toString() || "",
        weight: savedRecord.extractedData?.weight?.toString() || "",
        height: savedRecord.extractedData?.height?.toString() || "",
        medications:
          savedRecord.extractedData?.medications
            ?.map((m) => `${m.name} - ${m.dosage} - ${m.frequency}`)
            .join(", ") || "",
        diagnosis: savedRecord.extractedData?.diagnosis?.join(", ") || "",
        date: savedRecord.date,
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

  // Animation values
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(30)).current;
  const progressAnim = React.useRef(new Animated.Value(0)).current;
  const cardScaleAnim = React.useRef(new Animated.Value(0.96)).current;
  const saveButtonAnim = React.useRef(new Animated.Value(1)).current;

  const { control, handleSubmit, watch } = useForm<VitalSignsData>({
    defaultValues: {
      bloodPressure: formData.bloodPressure,
      heartRate: formData.heartRate,
      temperature: formData.temperature,
      weight: formData.weight,
      height: formData.height,
      medications: formData.medications,
      diagnosis: formData.diagnosis,
    },
    mode: "onChange",
  });

  const watchedValues = watch();
  const hasVitalSigns =
    watchedValues.bloodPressure ||
    watchedValues.heartRate ||
    watchedValues.temperature ||
    watchedValues.weight ||
    watchedValues.height;

  React.useEffect(() => {
    // Entry animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(cardScaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Progress bar animation to 100%
    Animated.timing(progressAnim, {
      toValue: 100,
      duration: 2500,
      useNativeDriver: false,
    }).start();
  }, []);

  // Scroll to top when the screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }, [])
  );

  const handleFocus = (fieldName: string) => {
    setFocusedField(fieldName);
    Vibration.vibrate(15);
  };

  const handleBlur = () => {
    setFocusedField(null);
  };

  const onBack = () => {
    Vibration.vibrate(30);
    router.back();
  };

  const onSubmit = async (data: VitalSignsData) => {
    setLoading(true);
    Vibration.vibrate(50);

    // Animate save button
    Animated.sequence([
      Animated.timing(saveButtonAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(saveButtonAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    updateFormData(data);
    const completeFormData = { ...formData, ...data };

    try {
      const newRecord: MedicalRecord = {
        id: Date.now().toString(),
        date: new Date(),
        title:
          completeFormData.title ||
          `New ${completeFormData.type.replace("_", " ")}`,
        type: completeFormData.type,
        description: completeFormData.description,
        doctorName: completeFormData.doctorName,
        hospitalName: completeFormData.hospitalName,
        extractedData: {
          bloodPressure: completeFormData.bloodPressure || undefined,
          heartRate: completeFormData.heartRate
            ? parseInt(completeFormData.heartRate)
            : undefined,
          temperature: completeFormData.temperature
            ? parseFloat(completeFormData.temperature)
            : undefined,
          weight: completeFormData.weight
            ? parseFloat(completeFormData.weight)
            : undefined,
          height: completeFormData.height
            ? parseFloat(completeFormData.height)
            : undefined,
          medications: completeFormData.medications
            ? completeFormData.medications.split(",").map((med) => ({
                name: med.trim(),
                dosage: "",
                frequency: "",
              }))
            : undefined,
          diagnosis: completeFormData.diagnosis
            ? [completeFormData.diagnosis]
            : undefined,
        },
      };

      await storageUtils.saveMedicalRecord(newRecord);

      // --- API Integration: Send to backend ---
      try {
        // Prepare payload for backend
        const payload = {
          basicInfo: {
            title: completeFormData.title,
            type: completeFormData.type,
            description: completeFormData.description,
          },
          healthcareInfo: {
            doctorName: completeFormData.doctorName,
            hospitalName: completeFormData.hospitalName,
          },
          vitalSigns: {
            bloodPressure: completeFormData.bloodPressure,
            heartRate: completeFormData.heartRate,
            GlucoseLevel: "", // Not present in form, leave empty
            weight: completeFormData.weight,
          },
          additionalInfo: {
            medications: completeFormData.medications,
            diagnosis: completeFormData.diagnosis,
          },
        };

        await fetch("https://medwise-9nv0.onrender.com/lab-reports/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
        // Ignore response, just store
      } catch (apiError) {
        console.error("Failed to save lab report to backend:", apiError);
        // Optionally show a warning, but do not block local save
      }
      // --- End API Integration ---

      setSavedRecord(newRecord);
      setRecordSaved(true);
      Alert.alert("Success", "Medical record saved successfully!", [
        {
          text: "OK",
          onPress: () => {
            // Don't navigate away immediately, let user preview or export if they want
          },
        },
      ]);
    } catch (error) {
      console.error("Error saving record:", error);
      Alert.alert("Error", "Failed to save medical record. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <StatusBar barStyle="dark-content" translucent={false} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1, backgroundColor: "#f0f3fa" }}
      >
        <ScrollView
          ref={scrollViewRef}
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          {/* Premium Header Card */}
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }, { scale: cardScaleAnim }],
            }}
            className="mx-4 mt-14"
          >
            <View
              className="rounded-2xl p-5"
              style={{
                backgroundColor: "#d5deef",
                borderWidth: 1,
                borderColor: "#b1c9ef",
                shadowColor: "#1E293B",
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.08,
                shadowRadius: 16,
                elevation: 8,
              }}
            >
              {/* Header Row */}
              <View className="flex-row items-center justify-between mb-4">
                <TouchableOpacity
                  onPress={onBack}
                  className="w-10 h-10 rounded-xl items-center justify-center"
                  activeOpacity={0.7}
                  style={{
                    backgroundColor: "#b1c9ef",
                    shadowColor: "#64748B",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.08,
                    shadowRadius: 4,
                    elevation: 2,
                  }}
                >
                  <MaterialIcons name="arrow-back" size={20} color="#395886" />
                </TouchableOpacity>

                <View className="flex-1 ml-4">
                  <Text
                    className="text-xl font-bold tracking-tight"
                    style={{ color: "#1e293b" }}
                  >
                    Vital Signs & Data
                  </Text>
                  <View className="flex-row items-center mt-1">
                    <View
                      className="w-1.5 h-1.5 rounded-full mr-2"
                      style={{ backgroundColor: "#395886" }}
                    />
                    <Text
                      className="font-medium text-sm"
                      style={{ color: "#475569" }}
                    >
                      Final Step
                    </Text>
                  </View>
                </View>
              </View>

              {/* Progress Section */}
              <View className="mb-1">
                <View className="flex-row justify-between items-center mb-2">
                  <Text
                    className="text-xs font-semibold tracking-wide"
                    style={{ color: "#395886" }}
                  >
                    COMPLETING MEDICAL RECORD
                  </Text>
                  <Text
                    className="text-xs font-medium"
                    style={{ color: "#64748b" }}
                  >
                    100% Complete
                  </Text>
                </View>

                {/* Animated Progress Bar */}
                <View
                  className="h-1.5 rounded-full overflow-hidden"
                  style={{ backgroundColor: "#b1c9ef" }}
                >
                  <Animated.View
                    style={{
                      height: "100%",
                      borderRadius: 4,
                      backgroundColor: "#395886",
                      width: progressAnim.interpolate({
                        inputRange: [0, 100],
                        outputRange: ["0%", "100%"],
                      }),
                      shadowColor: "#395886",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.3,
                      shadowRadius: 4,
                      elevation: 3,
                    }}
                  />
                </View>

                {/* Progress Dots */}
                <View className="flex-row justify-between mt-1.5">
                  <View
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: "#395886" }}
                  />
                  <View
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: "#395886" }}
                  />
                  <View
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: "#395886" }}
                  />
                </View>
              </View>
            </View>
          </Animated.View>

          {/* Vital Signs Card */}
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }, { scale: cardScaleAnim }],
            }}
            className="mx-4 mt-6"
          >
            <View
              className="rounded-2xl overflow-hidden"
              style={{
                backgroundColor: "#d5deef",
                borderWidth: 1,
                borderColor: "#b1c9ef",
                shadowColor: "#1E293B",
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.12,
                shadowRadius: 20,
                elevation: 10,
              }}
            >
              {/* Refined Header Section */}
              <View
                className="p-5"
                style={{
                  backgroundColor: "#395886",
                }}
              >
                <View className="flex-row items-center">
                  <View
                    className="w-11 h-11 rounded-xl items-center justify-center mr-3"
                    style={{ backgroundColor: "rgba(255, 255, 255, 0.2)" }}
                  >
                    <MaterialIcons name="favorite" size={22} color="white" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-lg font-bold text-white tracking-tight">
                      Vital Signs
                    </Text>
                    <Text
                      className="font-medium text-sm"
                      style={{ color: "#b1c9ef" }}
                    >
                      Optional measurements
                    </Text>
                  </View>
                </View>
              </View>

              {/* Refined Form Content */}
              <View className="p-5 space-y-6">
                {/* Row 1: Blood Pressure & Heart Rate */}
                <View className="flex-row gap-4">
                  <View className="flex-1">
                    <Text
                      className="text-sm font-bold mt-1 mb-1 tracking-wider uppercase pl-1"
                      style={{ color: "#1e293b" }}
                    >
                      Blood Pressure
                    </Text>
                    <Controller
                      control={control}
                      render={({ field: { onChange, onBlur, value } }) => (
                        <View>
                          <TextInput
                            className="border rounded-xl px-4 py-3 text-sm font-medium"
                            placeholder="120/80"
                            placeholderTextColor="#64748b"
                            onFocus={() => handleFocus("bloodPressure")}
                            onBlur={() => {
                              handleBlur();
                              onBlur();
                            }}
                            onChangeText={onChange}
                            value={value}
                            style={{
                              backgroundColor:
                                focusedField === "bloodPressure"
                                  ? "#FEF2F2"
                                  : "#b1c9ef",
                              borderColor:
                                focusedField === "bloodPressure"
                                  ? "#DC2626"
                                  : "#95a7d1",
                              color: "#1e293b",
                              shadowColor:
                                focusedField === "bloodPressure"
                                  ? "#DC2626"
                                  : "#395886",
                              shadowOffset: { width: 0, height: 1 },
                              shadowOpacity: 0.08,
                              shadowRadius: 4,
                              elevation: 1,
                            }}
                          />
                          {value && (
                            <View className="absolute right-3 top-3">
                              <MaterialIcons
                                name="check-circle"
                                size={18}
                                color="#DC2626"
                              />
                            </View>
                          )}
                        </View>
                      )}
                      name="bloodPressure"
                    />
                  </View>

                  <View className="flex-1">
                    <Text
                      className="text-sm font-bold mt-1 mb-1 tracking-wider uppercase pl-1"
                      style={{ color: "#1e293b" }}
                    >
                      Heart Rate (BPM)
                    </Text>
                    <Controller
                      control={control}
                      render={({ field: { onChange, onBlur, value } }) => (
                        <View>
                          <TextInput
                            className="border rounded-xl px-4 py-3 text-sm font-medium"
                            placeholder="72"
                            placeholderTextColor="#64748b"
                            keyboardType="numeric"
                            onFocus={() => handleFocus("heartRate")}
                            onBlur={() => {
                              handleBlur();
                              onBlur();
                            }}
                            onChangeText={onChange}
                            value={value}
                            style={{
                              backgroundColor:
                                focusedField === "heartRate"
                                  ? "#FDF2F8"
                                  : "#b1c9ef",
                              borderColor:
                                focusedField === "heartRate"
                                  ? "#EC4899"
                                  : "#95a7d1",
                              color: "#1e293b",
                              shadowColor:
                                focusedField === "heartRate"
                                  ? "#EC4899"
                                  : "#395886",
                              shadowOffset: { width: 0, height: 1 },
                              shadowOpacity: 0.08,
                              shadowRadius: 4,
                              elevation: 1,
                            }}
                          />
                          {value && (
                            <View className="absolute right-3 top-3">
                              <MaterialIcons
                                name="check-circle"
                                size={18}
                                color="#EC4899"
                              />
                            </View>
                          )}
                        </View>
                      )}
                      name="heartRate"
                    />
                  </View>
                </View>

                {/* Row 2: Temperature & Weight */}
                <View className="flex-row gap-4">
                  <View className="flex-1">
                    <Text
                      className="text-sm font-bold mt-1 mb-1 tracking-wider uppercase pl-1"
                      style={{ color: "#1e293b" }}
                    >
                      Temperature (°F)
                    </Text>
                    <Controller
                      control={control}
                      render={({ field: { onChange, onBlur, value } }) => (
                        <View>
                          <TextInput
                            className="border rounded-xl px-4 py-3 text-sm font-medium"
                            placeholder="98.6"
                            placeholderTextColor="#64748b"
                            keyboardType="decimal-pad"
                            onFocus={() => handleFocus("temperature")}
                            onBlur={() => {
                              handleBlur();
                              onBlur();
                            }}
                            onChangeText={onChange}
                            value={value}
                            style={{
                              backgroundColor:
                                focusedField === "temperature"
                                  ? "#FEF3C7"
                                  : "#b1c9ef",
                              borderColor:
                                focusedField === "temperature"
                                  ? "#F97316"
                                  : "#95a7d1",
                              color: "#1e293b",
                              shadowColor:
                                focusedField === "temperature"
                                  ? "#F97316"
                                  : "#395886",
                              shadowOffset: { width: 0, height: 1 },
                              shadowOpacity: 0.08,
                              shadowRadius: 4,
                              elevation: 1,
                            }}
                          />
                          {value && (
                            <View className="absolute right-3 top-3">
                              <MaterialIcons
                                name="check-circle"
                                size={18}
                                color="#F97316"
                              />
                            </View>
                          )}
                        </View>
                      )}
                      name="temperature"
                    />
                  </View>

                  <View className="flex-1">
                    <Text
                      className="text-sm font-bold mt-1 mb-1 tracking-wider uppercase pl-1"
                      style={{ color: "#1e293b" }}
                    >
                      Weight (Kg)
                    </Text>
                    <Controller
                      control={control}
                      render={({ field: { onChange, onBlur, value } }) => (
                        <View>
                          <TextInput
                            className="border rounded-xl px-4 py-3 text-sm font-medium"
                            placeholder="150"
                            placeholderTextColor="#64748b"
                            keyboardType="decimal-pad"
                            onFocus={() => handleFocus("weight")}
                            onBlur={() => {
                              handleBlur();
                              onBlur();
                            }}
                            onChangeText={onChange}
                            value={value}
                            style={{
                              backgroundColor:
                                focusedField === "weight"
                                  ? "#E0F7FA"
                                  : "#b1c9ef",
                              borderColor:
                                focusedField === "weight"
                                  ? "#3B82F6"
                                  : "#95a7d1",
                              color: "#1e293b",
                              shadowColor:
                                focusedField === "weight"
                                  ? "#3B82F6"
                                  : "#395886",
                              shadowOffset: { width: 0, height: 1 },
                              shadowOpacity: 0.08,
                              shadowRadius: 4,
                              elevation: 1,
                            }}
                          />
                          {value && (
                            <View className="absolute right-3 top-3">
                              <MaterialIcons
                                name="check-circle"
                                size={18}
                                color="#3B82F6"
                              />
                            </View>
                          )}
                        </View>
                      )}
                      name="weight"
                    />
                  </View>
                </View>

                {/* Row 3: Height */}
                {/* <View>
                <Text className="text-sm font-bold mt-1 mb-1 tracking-wider uppercase pl-1" style={{ color: "#1e293b" }}>
                  Height (Inches)
                </Text>
                <Controller
                  control={control}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View>
                      <TextInput
                        className="border rounded-xl px-4 py-3 text-sm font-medium"
                        placeholder="70"
                        placeholderTextColor="#64748b"
                        keyboardType="decimal-pad"
                        onFocus={() => handleFocus('height')}
                        onBlur={() => {
                          handleBlur();
                          onBlur();
                        }}
                        onChangeText={onChange}
                        value={value}
                        style={{
                          backgroundColor: focusedField === 'height' ? "#D1FAE5" : "#b1c9ef",
                          borderColor: focusedField === 'height' ? "#22C55E" : "#95a7d1",
                          color: "#1e293b",
                          shadowColor: focusedField === 'height' ? "#22C55E" : "#395886",
                          shadowOffset: { width: 0, height: 1 },
                          shadowOpacity: 0.08,
                          shadowRadius: 4,
                          elevation: 1,
                        }}
                      />
                      {value && (
                        <View className="absolute right-3 top-3">
                          <MaterialIcons name="check-circle" size={18} color="#22C55E" />
                        </View>
                      )}
                    </View>
                  )}
                  name="height"
                />
              </View> */}

                {/* Medications Field */}
                <View>
                  <Text
                    className="text-sm font-bold mt-1 mb-1 tracking-wider uppercase pl-1"
                    style={{ color: "#1e293b" }}
                  >
                    Medications
                  </Text>
                  <Controller
                    control={control}
                    render={({ field: { onChange, onBlur, value } }) => (
                      <View>
                        <TextInput
                          className="border rounded-xl px-4 py-3 text-sm font-medium"
                          placeholder="Separate multiple medications with commas"
                          placeholderTextColor="#64748b"
                          onFocus={() => handleFocus("medications")}
                          onBlur={() => {
                            handleBlur();
                            onBlur();
                          }}
                          onChangeText={onChange}
                          value={value}
                          style={{
                            backgroundColor:
                              focusedField === "medications"
                                ? "#FEF9E7"
                                : "#b1c9ef",
                            borderColor:
                              focusedField === "medications"
                                ? "#F59E0B"
                                : "#95a7d1",
                            color: "#1e293b",
                            shadowColor:
                              focusedField === "medications"
                                ? "#F59E0B"
                                : "#395886",
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: 0.08,
                            shadowRadius: 4,
                            elevation: 1,
                          }}
                        />
                        {value && (
                          <View className="absolute right-3 top-3">
                            <MaterialIcons
                              name="check-circle"
                              size={18}
                              color="#F59E0B"
                            />
                          </View>
                        )}
                      </View>
                    )}
                    name="medications"
                  />
                </View>

                {/* Diagnosis Field */}
                <View>
                  <Text
                    className="text-sm font-bold mt-1 mb-1 tracking-wider uppercase pl-1"
                    style={{ color: "#1e293b" }}
                  >
                    Diagnosis & Notes
                  </Text>
                  <Controller
                    control={control}
                    render={({ field: { onChange, onBlur, value } }) => (
                      <View>
                        <TextInput
                          className="border rounded-xl px-4 py-3 text-sm h-24 font-medium"
                          placeholder="Medical diagnosis, findings, or additional notes..."
                          placeholderTextColor="#64748b"
                          multiline
                          textAlignVertical="top"
                          onFocus={() => handleFocus("diagnosis")}
                          onBlur={() => {
                            handleBlur();
                            onBlur();
                          }}
                          onChangeText={onChange}
                          value={value}
                          style={{
                            backgroundColor:
                              focusedField === "diagnosis"
                                ? "#EEF2FF"
                                : "#b1c9ef",
                            borderColor:
                              focusedField === "diagnosis"
                                ? "#6366F1"
                                : "#95a7d1",
                            color: "#1e293b",
                            shadowColor:
                              focusedField === "diagnosis"
                                ? "#6366F1"
                                : "#395886",
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: 0.08,
                            shadowRadius: 4,
                            elevation: 1,
                          }}
                        />
                        {value && (
                          <View className="absolute right-3 top-3">
                            <MaterialIcons
                              name="check-circle"
                              size={18}
                              color="#6366F1"
                            />
                          </View>
                        )}
                      </View>
                    )}
                    name="diagnosis"
                  />
                </View>
              </View>
            </View>

            {/* Save/Export Buttons */}
            {!recordSaved ? (
              <TouchableOpacity
                onPress={handleSubmit(onSubmit)}
                disabled={loading}
                activeOpacity={0.9}
                className="rounded-xl p-4 items-center mt-6 mx-1"
                style={{
                  backgroundColor: "#395886",
                  shadowColor: "#395886",
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.3,
                  shadowRadius: 16,
                  elevation: 8,
                  opacity: loading ? 0.5 : 1,
                }}
              >
                <View className="flex-row items-center">
                  {loading ? (
                    <>
                      <MaterialIcons
                        name="hourglass-empty"
                        size={16}
                        color="white"
                      />
                      <Text className="text-white text-base font-semibold ml-2 tracking-wide">
                        Saving Record...
                      </Text>
                    </>
                  ) : (
                    <>
                      <Text className="text-white text-base font-semibold mr-2 tracking-wide">
                        Complete & Save
                      </Text>
                      <View
                        className="w-7 h-7 rounded-lg items-center justify-center"
                        style={{ backgroundColor: "rgba(255, 255, 255, 0.2)" }}
                      >
                        <MaterialIcons name="check" size={16} color="white" />
                      </View>
                    </>
                  )}
                </View>
              </TouchableOpacity>
            ) : (
              <>
                {/* Preview Button */}
                <TouchableOpacity
                  onPress={openPreview}
                  activeOpacity={0.9}
                  className="rounded-xl p-4 items-center mt-6 mx-1"
                  style={{
                    backgroundColor: "#3B82F6",
                    shadowColor: "#3B82F6",
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.3,
                    shadowRadius: 16,
                    elevation: 8,
                  }}
                >
                  <View className="flex-row items-center">
                    <Text className="text-white text-base font-semibold mr-2 tracking-wide">
                      Preview Record
                    </Text>
                    <View
                      className="w-7 h-7 rounded-lg items-center justify-center"
                      style={{ backgroundColor: "rgba(255, 255, 255, 0.2)" }}
                    >
                      <MaterialIcons
                        name="visibility"
                        size={16}
                        color="white"
                      />
                    </View>
                  </View>
                </TouchableOpacity>

                {/* Export to PDF Button */}
                <TouchableOpacity
                  onPress={handleExportPDF}
                  disabled={exportingPDF}
                  activeOpacity={0.9}
                  className="rounded-xl p-4 items-center mt-3 mx-1"
                  style={{
                    backgroundColor: "#DC2626",
                    shadowColor: "#DC2626",
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.3,
                    shadowRadius: 16,
                    elevation: 8,
                    opacity: exportingPDF ? 0.5 : 1,
                  }}
                >
                  <View className="flex-row items-center">
                    {exportingPDF ? (
                      <>
                        <MaterialIcons
                          name="hourglass-empty"
                          size={16}
                          color="white"
                        />
                        <Text className="text-white text-base font-semibold ml-2 tracking-wide">
                          Exporting...
                        </Text>
                      </>
                    ) : (
                      <>
                        <Text className="text-white text-base font-semibold mr-2 tracking-wide">
                          Export as PDF
                        </Text>
                        <View
                          className="w-7 h-7 rounded-lg items-center justify-center"
                          style={{
                            backgroundColor: "rgba(255, 255, 255, 0.2)",
                          }}
                        >
                          <MaterialIcons
                            name="picture-as-pdf"
                            size={16}
                            color="white"
                          />
                        </View>
                      </>
                    )}
                  </View>
                </TouchableOpacity>

                {/* Done Button */}
                <TouchableOpacity
                  onPress={() => {
                    resetFormData();
                    router.back();
                    router.back();
                    router.back();
                  }}
                  activeOpacity={0.9}
                  className="rounded-xl p-4 items-center mt-3 mx-1"
                  style={{
                    backgroundColor: "#22C55E",
                    shadowColor: "#22C55E",
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.3,
                    shadowRadius: 16,
                    elevation: 8,
                  }}
                >
                  <View className="flex-row items-center">
                    <Text className="text-white text-base font-semibold mr-2 tracking-wide">
                      Done
                    </Text>
                    <View
                      className="w-7 h-7 rounded-lg items-center justify-center"
                      style={{ backgroundColor: "rgba(255, 255, 255, 0.2)" }}
                    >
                      <MaterialIcons
                        name="check-circle"
                        size={16}
                        color="white"
                      />
                    </View>
                  </View>
                </TouchableOpacity>
              </>
            )}
          </Animated.View>

          {/* Completion Summary Card */}
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }, { scale: cardScaleAnim }],
            }}
            className="mx-5 mt-6"
          >
            <View
              className="rounded-3xl p-6"
              style={{
                backgroundColor: recordSaved ? "#F0FDF4" : "#FEF3C7",
                borderWidth: 1,
                borderColor: recordSaved ? "#BBF7D0" : "#FDE68A",
                shadowColor: recordSaved ? "#059669" : "#D97706",
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.1,
                shadowRadius: 20,
                elevation: 10,
              }}
            >
              <View className="flex-row items-center justify-between mb-4">
                <View className="flex-row items-center">
                  <View
                    className="w-12 h-12 rounded-2xl items-center justify-center mr-4"
                    style={{
                      backgroundColor: recordSaved ? "#22C55E" : "#F59E0B",
                    }}
                  >
                    <MaterialIcons
                      name={recordSaved ? "check-circle" : "save"}
                      size={24}
                      color="white"
                    />
                  </View>
                  <View>
                    <Text
                      className="text-lg font-bold"
                      style={{
                        color: recordSaved ? "#14532D" : "#92400E",
                      }}
                    >
                      {recordSaved ? "Record Saved!" : "Ready to Save!"}
                    </Text>
                    <Text
                      className="text-sm"
                      style={{
                        color: recordSaved ? "#16A34A" : "#D97706",
                      }}
                    >
                      {recordSaved
                        ? "Preview and export as PDF"
                        : "Your medical record is complete"}
                    </Text>
                  </View>
                </View>
                <MaterialIcons
                  name={recordSaved ? "download" : "celebration"}
                  size={28}
                  color={recordSaved ? "#16A34A" : "#D97706"}
                />
              </View>

              <View className="bg-white/60 rounded-2xl p-4">
                <Text
                  className="text-sm font-medium text-center"
                  style={{
                    color: recordSaved ? "#15803D" : "#A16207",
                  }}
                >
                  {recordSaved
                    ? "Your medical record has been saved successfully. You can now export it as a PDF or go back to the main screen."
                    : "This record will be stored securely on your device and can be accessed anytime from your medical records dashboard."}
                </Text>
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

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
              {savedRecord && (
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
                            {savedRecord.doctorName || "Dr. [Doctor Name]"}
                          </Text>
                          <Text className="text-blue-200 text-xs">
                            {savedRecord.type.replace("_", " ")} Specialist
                          </Text>
                          <Text className="text-blue-200 text-xs">
                            MBBS, MD | Medicine, MCPS
                          </Text>
                          <Text className="text-blue-200 text-xs">
                            {savedRecord.hospitalName ||
                              "Hospital or Department Name Here"}
                          </Text>
                        </View>
                      </View>
                      <View className="items-end">
                        <Text className="text-blue-200 text-xs">Date:</Text>
                        <Text className="text-white text-sm font-bold">
                          {formatDate(savedRecord.date)}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Main Content Area */}
                  <View className="flex-row p-6">
                    {/* Rx Symbol */}
                    <View className="w-16 mr-6">
                      <Text
                        className="text-blue-700 text-5xl font-bold"
                        style={{ fontFamily: "serif" }}
                      >
                        ℞
                      </Text>
                    </View>

                    {/* Patient Info and Content */}
                    <View className="flex-1">
                      {/* Patient Information Fields */}
                      <View className="mb-6">
                        <View className="flex-row mb-3">
                          <View className="flex-1 mr-4">
                            <Text className="text-gray-700 text-sm font-bold mb-1">
                              Name:
                            </Text>
                            <Text className="text-blue-700 text-base font-medium border-b border-gray-300 pb-1">
                              John Doe
                            </Text>
                          </View>
                          <View className="flex-1">
                            <Text className="text-gray-700 text-sm font-bold mb-1">
                              Age:
                            </Text>
                            <Text className="text-blue-700 text-base font-medium border-b border-gray-300 pb-1">
                              35 years
                            </Text>
                          </View>
                        </View>

                        <View className="flex-row mb-3">
                          <View className="flex-1 mr-4">
                            <Text className="text-gray-700 text-sm font-bold mb-1">
                              Sex:
                            </Text>
                            <Text className="text-blue-700 text-base font-medium border-b border-gray-300 pb-1">
                              Male
                            </Text>
                          </View>
                          <View className="flex-1">
                            <Text className="text-gray-700 text-sm font-bold mb-1">
                              Address:
                            </Text>
                            <Text className="text-blue-700 text-base font-medium border-b border-gray-300 pb-1">
                              123 Main Street, City, State 12345
                            </Text>
                          </View>
                        </View>
                      </View>

                      {/* Chief Complaint */}
                      <View className="mb-4 pt-4 border-t-2 border-gray-200">
                        <Text className="text-blue-700 text-lg font-bold mb-3 uppercase tracking-wide">
                          Chief Complaint
                        </Text>
                        <View className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-700">
                          <Text className="text-gray-800 text-base">
                            <Text className="font-bold">Disease Detected:</Text>{" "}
                            {PDFExportService.formatDiseaseTitle(
                              savedRecord.title
                            )}
                            {savedRecord.description && (
                              <Text>
                                {"\n\n"}
                                <Text className="font-bold">
                                  Additional Notes:
                                </Text>{" "}
                                {savedRecord.description}
                              </Text>
                            )}
                          </Text>
                        </View>
                      </View>

                      {/* Vital Signs */}
                      {savedRecord.extractedData &&
                        (savedRecord.extractedData.bloodPressure ||
                          savedRecord.extractedData.heartRate ||
                          savedRecord.extractedData.temperature ||
                          savedRecord.extractedData.weight ||
                          savedRecord.extractedData.height) && (
                          <View className="mb-4">
                            <Text className="text-blue-700 text-lg font-bold mb-3 uppercase tracking-wide">
                              Vital Signs
                            </Text>
                            <View className="flex-row flex-wrap">
                              {savedRecord.extractedData.bloodPressure && (
                                <View
                                  className="bg-white border border-blue-700 rounded-lg p-3 m-1 items-center"
                                  style={{ minWidth: 100 }}
                                >
                                  <Text className="text-gray-700 text-xs font-bold mb-1 uppercase">
                                    Blood Pressure
                                  </Text>
                                  <Text className="text-blue-700 text-lg font-bold">
                                    {savedRecord.extractedData.bloodPressure}
                                  </Text>
                                </View>
                              )}
                              {savedRecord.extractedData.heartRate && (
                                <View
                                  className="bg-white border border-blue-700 rounded-lg p-3 m-1 items-center"
                                  style={{ minWidth: 100 }}
                                >
                                  <Text className="text-gray-700 text-xs font-bold mb-1 uppercase">
                                    Heart Rate
                                  </Text>
                                  <Text className="text-blue-700 text-lg font-bold">
                                    {savedRecord.extractedData.heartRate} bpm
                                  </Text>
                                </View>
                              )}
                              {savedRecord.extractedData.temperature && (
                                <View
                                  className="bg-white border border-blue-700 rounded-lg p-3 m-1 items-center"
                                  style={{ minWidth: 100 }}
                                >
                                  <Text className="text-gray-700 text-xs font-bold mb-1 uppercase">
                                    Temperature
                                  </Text>
                                  <Text className="text-blue-700 text-lg font-bold">
                                    {savedRecord.extractedData.temperature}°F
                                  </Text>
                                </View>
                              )}
                              {savedRecord.extractedData.weight && (
                                <View
                                  className="bg-white border border-blue-700 rounded-lg p-3 m-1 items-center"
                                  style={{ minWidth: 100 }}
                                >
                                  <Text className="text-gray-700 text-xs font-bold mb-1 uppercase">
                                    Weight
                                  </Text>
                                  <Text className="text-blue-700 text-lg font-bold">
                                    {savedRecord.extractedData.weight} lbs
                                  </Text>
                                </View>
                              )}
                              {savedRecord.extractedData.height && (
                                <View
                                  className="bg-white border border-blue-700 rounded-lg p-3 m-1 items-center"
                                  style={{ minWidth: 100 }}
                                >
                                  <Text className="text-gray-700 text-xs font-bold mb-1 uppercase">
                                    Height
                                  </Text>
                                  <Text className="text-blue-700 text-lg font-bold">
                                    {savedRecord.extractedData.height} ft
                                  </Text>
                                </View>
                              )}
                            </View>
                          </View>
                        )}

                      {/* Medications */}
                      {savedRecord.extractedData?.medications &&
                        savedRecord.extractedData.medications.length > 0 && (
                          <View className="mb-4">
                            <Text className="text-blue-700 text-lg font-bold mb-3 uppercase tracking-wide">
                              ℞ Medications Prescribed
                            </Text>
                            <View className="bg-purple-50 border border-purple-300 rounded-lg p-4">
                              {savedRecord.extractedData.medications.map(
                                (medication, index) => (
                                  <View
                                    key={index}
                                    className="flex-row items-start mb-2"
                                  >
                                    <Text className="text-purple-800 text-base">
                                      • {medication.name}
                                      {medication.dosage &&
                                        ` - ${medication.dosage}`}
                                      {medication.frequency &&
                                        ` - ${medication.frequency}`}
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
                      {savedRecord.extractedData?.diagnosis &&
                        savedRecord.extractedData.diagnosis.length > 0 && (
                          <View className="mb-4">
                            <Text className="text-blue-700 text-lg font-bold mb-3 uppercase tracking-wide">
                              Diagnosis
                            </Text>
                            <View className="bg-blue-50 border border-blue-300 rounded-lg p-4">
                              {savedRecord.extractedData.diagnosis.map(
                                (diag, index) => (
                                  <Text
                                    key={index}
                                    className="text-gray-800 text-base leading-6"
                                  >
                                    {diag}
                                  </Text>
                                )
                              )}
                            </View>
                          </View>
                        )}
                    </View>
                  </View>

                  {/* Footer - Matching PDF Design */}
                  <View
                    className="p-4 flex-row items-center justify-between"
                    style={{ backgroundColor: "#1e40af" }}
                  >
                    <View>
                      <Text className="text-white text-xs">
                        📞 123-456-7890, 444-666-8899
                      </Text>
                      <Text className="text-white text-xs">
                        ✉️ contact@medwise.com | 🌐 www.medwise.com
                      </Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-white text-xs">
                        Days: Mon, Tue, Wed, Thu, Fri
                      </Text>
                      <Text className="text-white text-xs">
                        Timings: 05:00 PM - 08:30 PM
                      </Text>
                    </View>
                    <View className="w-8 h-8 bg-white rounded items-center justify-center">
                      <Text className="text-blue-700 font-bold text-xs">
                        QR
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}
