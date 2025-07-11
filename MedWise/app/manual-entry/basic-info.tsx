import React from "react";
import {
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Animated,
  View,
  Text,
  StatusBar
} from "react-native";

import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useForm, Controller } from "react-hook-form";
// import { Text } from "@/components/Themed";
import { useManualEntry } from "@/app/manual-entry/ManualEntryContext";
import { MedicalRecord } from "@/types/medical";
import { useFocusEffect } from "@react-navigation/native";

interface BasicInfoData {
  title: string;
  type: MedicalRecord["type"];
  description: string;
}

export default function BasicInfoScreen() {
  const router = useRouter();
  const { formData, updateFormData } = useManualEntry();
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;
  const scrollViewRef = React.useRef<ScrollView>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<BasicInfoData>({
    defaultValues: {
      title: formData.title,
      type: formData.type,
      description: formData.description,
    },
  });

  const recordTypes = [
    { value: "lab_report", label: "Lab Report", icon: "assignment" },
    { value: "prescription", label: "Prescription", icon: "local-pharmacy" },
    { value: "scan", label: "Medical Scan", icon: "scanner" },
    { value: "consultation", label: "Consultation", icon: "person" },
    { value: "other", label: "Other", icon: "description" },
  ];

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Scroll to top when the screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }, [])
  );

  const onNext = (data: BasicInfoData) => {
    updateFormData(data);
    router.push("/manual-entry/healthcare-info");
  };

  return (
    <>
      <StatusBar barStyle="dark-content" translucent />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{
          backgroundColor: "#f0f3fa",
        }}
      >
        <ScrollView
          ref={scrollViewRef}
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {/* Refined Header */}
          <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
            shadowColor: "#1E293B",
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.08,
            shadowRadius: 16,
            elevation: 8,
            backgroundColor: "#d5deef",
            borderWidth: 1,
            borderColor: "#b1c9ef",
          }}
          className="mx-4 mt-14 rounded-2xl p-5"
        >
            <View className="flex-row items-center justify-between mb-4">
              <TouchableOpacity
                onPress={() => router.back()}
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
                  Basic Information
                </Text>
                <View className="flex-row items-center mt-1">
                  <View
                    className="w-1.5 h-1.5 rounded-full mr-2"
                    style={{ backgroundColor: "#395886" }}
                  />
                  <Text className="font-medium text-sm" style={{ color: "#475569" }}>Step 1 of 3</Text>
                </View>
              </View>
            </View>

            {/* Refined Progress Bar */}
            <View className="mb-1">
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-xs font-semibold tracking-wide" style={{ color: "#395886" }}>BASIC INFO</Text>
                <Text className="text-xs font-medium" style={{ color: "#64748b" }}>Healthcare - Upload</Text>
              </View>
              <View className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "#b1c9ef" }}>
                <Animated.View
                  className="h-full rounded-full"
                  style={{
                    width: "33.33%",
                    backgroundColor: "#395886",
                  }}
                />
              </View>
              <View className="flex-row justify-between mt-1.5">
                <View className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#395886" }} />
                <View className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#b1c9ef" }} />
                <View className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#b1c9ef" }} />
              </View>
            </View>
          </Animated.View>

          {/* Refined Main Content Card */}
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
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
                    <MaterialIcons name="medical-information" size={22} color="white" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-lg font-bold text-white tracking-tight">
                      Record Details
                    </Text>
                    <Text className="font-medium text-sm" style={{ color: "#b1c9ef" }}>
                      Tell us about your medical record
                    </Text>
                  </View>
                </View>
              </View>

              {/* Refined Form Content */}
              <View className="p-5 space-y-6">
                {/* Title Field */}
                <View>
                  <Text className="text-sm font-bold mt-1 mb-1 tracking-wider uppercase pl-1" style={{ color: "#1e293b" }}>
                    Record Title *
                  </Text>
                  <Controller
                    control={control}
                    rules={{ required: "Title is required" }}
                    render={({ field: { onChange, onBlur, value } }) => (
                      <View>
                        <TextInput
                          className={`border rounded-xl px-4 py-3 text-sm font-medium ${errors.title
                              ? "border-red-400"
                              : ""
                            }`}
                          placeholder="e.g., Annual Checkup, Blood Test Results"
                          placeholderTextColor="#64748b"
                          onBlur={onBlur}
                          onChangeText={onChange}
                          value={value}
                          style={{
                            backgroundColor: errors.title ? "#FEF2F2" : "#b1c9ef",
                            borderColor: errors.title ? "#EF4444" : "#95a7d1",
                            color: "#1e293b",
                            shadowColor: errors.title ? "#EF4444" : "#395886",
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: 0.08,
                            shadowRadius: 4,
                            elevation: 1,
                          }}
                        />
                        {errors.title && (
                          <View className="flex-row items-center mt-2">
                            <MaterialIcons name="error" size={14} color="#EF4444" />
                            <Text className="text-red-500 text-xs ml-1 font-medium">
                              {errors.title.message}
                            </Text>
                          </View>
                        )}
                      </View>
                    )}
                    name="title"
                  />
                </View>

                {/* Record Type */}
                <View>
                  <Text className="text-sm font-bold mt-1 mb-1 tracking-wider uppercase pl-1" style={{ color: "#1e293b" }}>
                    Record Type *
                  </Text>
                  <Controller
                    control={control}
                    render={({ field: { onChange, value } }) => (
                      <View className="space-y-4">
                        {recordTypes.map((type, index) => (
                          <TouchableOpacity
                            key={type.value}
                            onPress={() => onChange(type.value)}
                            activeOpacity={0.8}
                            className="flex-row items-center p-3 rounded-xl mb-3"
                            style={{
                              backgroundColor: value === type.value ? "#395886" : "#b1c9ef",
                              borderWidth: 1,
                              borderColor: value === type.value ? "#2c4468" : "#95a7d1",
                              shadowColor: value === type.value ? "#395886" : "#64748B",
                              shadowOffset: { width: 0, height: value === type.value ? 3 : 1 },
                              shadowOpacity: value === type.value ? 0.12 : 0.04,
                              shadowRadius: value === type.value ? 8 : 4,
                              elevation: value === type.value ? 4 : 1,
                            }}
                          >
                            <View
                              className="w-10 h-10 rounded-xl items-center justify-center mr-3"
                              style={{
                                backgroundColor: value === type.value ? "rgba(255, 255, 255, 0.2)" : "#FFFFFF",
                                shadowColor: "#395886",
                                shadowOffset: { width: 0, height: 1 },
                                shadowOpacity: 0.08,
                                shadowRadius: 4,
                                elevation: 2,
                              }}
                            >
                              <MaterialIcons
                                name={type.icon as any}
                                size={18}
                                color={value === type.value ? "white" : "#395886"}
                              />
                            </View>
                            <View className="flex-1">
                              <Text
                                className="text-sm font-semibold"
                                style={{
                                  color: value === type.value ? "white" : "#1e293b"
                                }}
                              >
                                {type.label}
                              </Text>
                            </View>
                            {value === type.value && (
                              <View
                                className="w-6 h-6 rounded-full items-center justify-center"
                                style={{ backgroundColor: "rgba(255, 255, 255, 0.2)" }}
                              >
                                <MaterialIcons name="check" size={14} color="white" />
                              </View>
                            )}
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                    name="type"
                  />
                </View>

                {/* Description Field */}
                <View>
                  <Text className="text-sm font-bold mt-1 mb-1 tracking-wider uppercase pl-1" style={{ color: "#1e293b" }}>
                    Description (Optional)
                  </Text>
                  <Controller
                    control={control}
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        className="rounded-xl px-4 py-3 text-sm h-24 font-medium"
                        placeholder="Brief description of the medical record..."
                        placeholderTextColor="#64748b"
                        multiline
                        textAlignVertical="top"
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                        style={{
                          backgroundColor: "#b1c9ef",
                          borderWidth: 1,
                          borderColor: "#95a7d1",
                          color: "#1e293b",
                          shadowColor: "#395886",
                          shadowOffset: { width: 0, height: 1 },
                          shadowOpacity: 0.08,
                          shadowRadius: 4,
                          elevation: 1,
                        }}
                      />
                    )}
                    name="description"
                  />
                </View>
              </View>
            </View>

            {/* Refined Next Button */}
            <TouchableOpacity
              onPress={handleSubmit(onNext)}
              activeOpacity={0.9}
              className="rounded-xl p-4 items-center mt-6 mx-1"
              style={{
                backgroundColor: "#395886",
                shadowColor: "#395886",
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.3,
                shadowRadius: 16,
                elevation: 8,
              }}
            >
              <View className="flex-row items-center">
                <Text className="text-white text-base font-semibold mr-2 tracking-wide">
                  Continue to Next Step
                </Text>
                <View
                  className="w-7 h-7 rounded-lg items-center justify-center"
                  style={{ backgroundColor: "rgba(255, 255, 255, 0.2)" }}
                >
                  <MaterialIcons name="arrow-forward" size={16} color="white" />
                </View>
              </View>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}