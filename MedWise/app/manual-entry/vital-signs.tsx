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
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { useManualEntry } from "@/app/manual-entry/ManualEntryContext";
import { MedicalRecord } from "@/types/medical";
import { storageUtils } from "@/utils/storage";
import { useFocusEffect } from "@react-navigation/native";

const { width, height } = Dimensions.get('window');

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
  const { formData, updateFormData, resetFormData } = useManualEntry();
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const scrollViewRef = React.useRef<ScrollView>(null);

  // Animation values
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(30)).current;
  const progressAnim = React.useRef(new Animated.Value(0)).current;
  const cardScaleAnim = React.useRef(new Animated.Value(0.96)).current;
  const saveButtonAnim = React.useRef(new Animated.Value(1)).current;

  const {
    control,
    handleSubmit,
    watch,
  } = useForm<VitalSignsData>({
    defaultValues: {
      bloodPressure: formData.bloodPressure,
      heartRate: formData.heartRate,
      temperature: formData.temperature,
      weight: formData.weight,
      height: formData.height,
      medications: formData.medications,
      diagnosis: formData.diagnosis,
    },
    mode: 'onChange'
  });

  const watchedValues = watch();
  const hasVitalSigns = watchedValues.bloodPressure || watchedValues.heartRate || 
                      watchedValues.temperature || watchedValues.weight || watchedValues.height;

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
        title: completeFormData.title || `New ${completeFormData.type.replace("_", " ")}`,
        type: completeFormData.type,
        description: completeFormData.description,
        doctorName: completeFormData.doctorName,
        hospitalName: completeFormData.hospitalName,
        extractedData: {
          bloodPressure: completeFormData.bloodPressure || undefined,
          heartRate: completeFormData.heartRate ? parseInt(completeFormData.heartRate) : undefined,
          temperature: completeFormData.temperature
            ? parseFloat(completeFormData.temperature)
            : undefined,
          weight: completeFormData.weight ? parseFloat(completeFormData.weight) : undefined,
          height: completeFormData.height ? parseFloat(completeFormData.height) : undefined,
          medications: completeFormData.medications
            ? completeFormData.medications.split(",").map((med) => ({
                name: med.trim(),
                dosage: "",
                frequency: "",
              }))
            : undefined,
          diagnosis: completeFormData.diagnosis ? [completeFormData.diagnosis] : undefined,
        },
      };

      await storageUtils.saveMedicalRecord(newRecord);

      Alert.alert("Success", "Medical record saved successfully!", [
        { 
          text: "OK", 
          onPress: () => {
            resetFormData();
            router.back();
            router.back();
            router.back();
          }
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
    <StatusBar barStyle="dark-content" backgroundColor="#f0f3fa" translucent={false} />
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
            transform: [
              { translateY: slideAnim },
              { scale: cardScaleAnim }
            ],
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
                <Text className="text-xl font-bold tracking-tight" style={{ color: "#1e293b" }}>
                  Vital Signs & Data
                </Text>
                <View className="flex-row items-center mt-1">
                  <View className="w-1.5 h-1.5 rounded-full mr-2" style={{ backgroundColor: "#395886" }} />
                  <Text className="font-medium text-sm" style={{ color: "#475569" }}>Final Step</Text>
                </View>
              </View>
            </View>

            {/* Progress Section */}
            <View className="mb-1">
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-xs font-semibold tracking-wide" style={{ color: "#395886" }}>
                  COMPLETING MEDICAL RECORD
                </Text>
                <Text className="text-xs font-medium" style={{ color: "#64748b" }}>
                  100% Complete
                </Text>
              </View>
              
              {/* Animated Progress Bar */}
              <View className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "#b1c9ef" }}>
                <Animated.View
                  style={{
                    height: '100%',
                    borderRadius: 4,
                    backgroundColor: '#395886',
                    width: progressAnim.interpolate({
                      inputRange: [0, 100],
                      outputRange: ['0%', '100%'],
                    }),
                    shadowColor: '#395886',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.3,
                    shadowRadius: 4,
                    elevation: 3,
                  }}
                />
              </View>
              
              {/* Progress Dots */}
              <View className="flex-row justify-between mt-1.5">
                <View className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#395886" }} />
                <View className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#395886" }} />
                <View className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#395886" }} />
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
                  <Text className="font-medium text-sm" style={{ color: "#b1c9ef" }}>
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
                  <Text className="text-sm font-bold mt-1 mb-1 tracking-wider uppercase pl-1" style={{ color: "#1e293b" }}>
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
                          onFocus={() => handleFocus('bloodPressure')}
                          onBlur={() => {
                            handleBlur();
                            onBlur();
                          }}
                          onChangeText={onChange}
                          value={value}
                          style={{
                            backgroundColor: focusedField === 'bloodPressure' ? "#FEF2F2" : "#b1c9ef",
                            borderColor: focusedField === 'bloodPressure' ? "#DC2626" : "#95a7d1",
                            color: "#1e293b",
                            shadowColor: focusedField === 'bloodPressure' ? "#DC2626" : "#395886",
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: 0.08,
                            shadowRadius: 4,
                            elevation: 1,
                          }}
                        />
                        {value && (
                          <View className="absolute right-3 top-3">
                            <MaterialIcons name="check-circle" size={18} color="#DC2626" />
                          </View>
                        )}
                      </View>
                    )}
                    name="bloodPressure"
                  />
                </View>

                <View className="flex-1">
                  <Text className="text-sm font-bold mt-1 mb-1 tracking-wider uppercase pl-1" style={{ color: "#1e293b" }}>
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
                          onFocus={() => handleFocus('heartRate')}
                          onBlur={() => {
                            handleBlur();
                            onBlur();
                          }}
                          onChangeText={onChange}
                          value={value}
                          style={{
                            backgroundColor: focusedField === 'heartRate' ? "#FDF2F8" : "#b1c9ef",
                            borderColor: focusedField === 'heartRate' ? "#EC4899" : "#95a7d1",
                            color: "#1e293b",
                            shadowColor: focusedField === 'heartRate' ? "#EC4899" : "#395886",
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: 0.08,
                            shadowRadius: 4,
                            elevation: 1,
                          }}
                        />
                        {value && (
                          <View className="absolute right-3 top-3">
                            <MaterialIcons name="check-circle" size={18} color="#EC4899" />
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
                  <Text className="text-sm font-bold mt-1 mb-1 tracking-wider uppercase pl-1" style={{ color: "#1e293b" }}>
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
                          onFocus={() => handleFocus('temperature')}
                          onBlur={() => {
                            handleBlur();
                            onBlur();
                          }}
                          onChangeText={onChange}
                          value={value}
                          style={{
                            backgroundColor: focusedField === 'temperature' ? "#FEF3C7" : "#b1c9ef",
                            borderColor: focusedField === 'temperature' ? "#F97316" : "#95a7d1",
                            color: "#1e293b",
                            shadowColor: focusedField === 'temperature' ? "#F97316" : "#395886",
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: 0.08,
                            shadowRadius: 4,
                            elevation: 1,
                          }}
                        />
                        {value && (
                          <View className="absolute right-3 top-3">
                            <MaterialIcons name="check-circle" size={18} color="#F97316" />
                          </View>
                        )}
                      </View>
                    )}
                    name="temperature"
                  />
                </View>

                <View className="flex-1">
                  <Text className="text-sm font-bold mt-1 mb-1 tracking-wider uppercase pl-1" style={{ color: "#1e293b" }}>
                    Weight (LBS)
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
                          onFocus={() => handleFocus('weight')}
                          onBlur={() => {
                            handleBlur();
                            onBlur();
                          }}
                          onChangeText={onChange}
                          value={value}
                          style={{
                            backgroundColor: focusedField === 'weight' ? "#E0F7FA" : "#b1c9ef",
                            borderColor: focusedField === 'weight' ? "#3B82F6" : "#95a7d1",
                            color: "#1e293b",
                            shadowColor: focusedField === 'weight' ? "#3B82F6" : "#395886",
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: 0.08,
                            shadowRadius: 4,
                            elevation: 1,
                          }}
                        />
                        {value && (
                          <View className="absolute right-3 top-3">
                            <MaterialIcons name="check-circle" size={18} color="#3B82F6" />
                          </View>
                        )}
                      </View>
                    )}
                    name="weight"
                  />
                </View>
              </View>

              {/* Row 3: Height */}
              <View>
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
              </View>

              {/* Medications Field */}
              <View>
                <Text className="text-sm font-bold mt-1 mb-1 tracking-wider uppercase pl-1" style={{ color: "#1e293b" }}>
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
                        onFocus={() => handleFocus('medications')}
                        onBlur={() => {
                          handleBlur();
                          onBlur();
                        }}
                        onChangeText={onChange}
                        value={value}
                        style={{
                          backgroundColor: focusedField === 'medications' ? "#FEF9E7" : "#b1c9ef",
                          borderColor: focusedField === 'medications' ? "#F59E0B" : "#95a7d1",
                          color: "#1e293b",
                          shadowColor: focusedField === 'medications' ? "#F59E0B" : "#395886",
                          shadowOffset: { width: 0, height: 1 },
                          shadowOpacity: 0.08,
                          shadowRadius: 4,
                          elevation: 1,
                        }}
                      />
                      {value && (
                        <View className="absolute right-3 top-3">
                          <MaterialIcons name="check-circle" size={18} color="#F59E0B" />
                        </View>
                      )}
                    </View>
                  )}
                  name="medications"
                />
              </View>

              {/* Diagnosis Field */}
              <View>
                <Text className="text-sm font-bold mt-1 mb-1 tracking-wider uppercase pl-1" style={{ color: "#1e293b" }}>
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
                        onFocus={() => handleFocus('diagnosis')}
                        onBlur={() => {
                          handleBlur();
                          onBlur();
                        }}
                        onChangeText={onChange}
                        value={value}
                        style={{
                          backgroundColor: focusedField === 'diagnosis' ? "#EEF2FF" : "#b1c9ef",
                          borderColor: focusedField === 'diagnosis' ? "#6366F1" : "#95a7d1",
                          color: "#1e293b",
                          shadowColor: focusedField === 'diagnosis' ? "#6366F1" : "#395886",
                          shadowOffset: { width: 0, height: 1 },
                          shadowOpacity: 0.08,
                          shadowRadius: 4,
                          elevation: 1,
                        }}
                      />
                      {value && (
                        <View className="absolute right-3 top-3">
                          <MaterialIcons name="check-circle" size={18} color="#6366F1" />
                        </View>
                      )}
                    </View>
                  )}
                  name="diagnosis"
                />
              </View>
            </View>
          </View>

          {/* Refined Next Button */}
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
                  <MaterialIcons name="hourglass-empty" size={16} color="white" />
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
              backgroundColor: "#F0FDF4",
              borderWidth: 1,
              borderColor: "#BBF7D0",
              shadowColor: "#059669",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.1,
              shadowRadius: 20,
              elevation: 10,
            }}
          >
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center">
                <View className="w-12 h-12 bg-green-500 rounded-2xl items-center justify-center mr-4">
                  <MaterialIcons name="check-circle" size={24} color="white" />
                </View>
                <View>
                  <Text className="text-lg font-bold text-green-800">
                    Ready to Save!
                  </Text>
                  <Text className="text-green-600 text-sm">
                    Your medical record is complete
                  </Text>
                </View>
              </View>
              <MaterialIcons name="celebration" size={28} color="#059669" />
            </View>

            <View className="bg-white/60 rounded-2xl p-4">
              <Text className="text-green-700 text-sm font-medium text-center">
                This record will be stored securely on your device and can be accessed anytime from your medical records dashboard.
              </Text>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  </>
);
}