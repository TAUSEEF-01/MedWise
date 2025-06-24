import React from "react";
import {
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Animated,
  StatusBar,
  Text,
  View,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useForm, Controller } from "react-hook-form";
// import { Text, View } from "@/components/Themed";
import { useManualEntry } from "@/app/manual-entry/ManualEntryContext";
import { useFocusEffect } from "@react-navigation/native";

interface HealthcareInfoData {
  doctorName: string;
  hospitalName: string;
}

export default function HealthcareInfoScreen() {
  const router = useRouter();
  const { formData, updateFormData } = useManualEntry();
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;
  const scrollViewRef = React.useRef<ScrollView>(null);

  const {
    control,
    handleSubmit,
  } = useForm<HealthcareInfoData>({
    defaultValues: {
      doctorName: formData.doctorName,
      hospitalName: formData.hospitalName,
    },
  });

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

  const onNext = (data: HealthcareInfoData) => {
    updateFormData(data);
    router.push("/manual-entry/vital-signs");
  };

  const onBack = () => {
    router.back();
  };

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
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
            }}
            className="mx-4 mt-14 rounded-2xl p-5"
            style={{
              backgroundColor: "#d5deef",
              borderWidth: 1,
              borderColor: "#b1c9ef",
            }}
          >
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
                  Healthcare Provider
                </Text>
                <View className="flex-row items-center mt-1">
                  <View 
                    className="w-1.5 h-1.5 rounded-full mr-2"
                    style={{ backgroundColor: "#395886" }}
                  />
                  <Text className="font-medium text-sm" style={{ color: "#475569" }}>Step 2 of 3</Text>
                </View>
              </View>
            </View>

            {/* Refined Progress Bar */}
            <View className="mb-1">
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-xs font-semibold tracking-wide" style={{ color: "#395886" }}>HEALTHCARE INFO</Text>
                <Text className="text-xs font-medium" style={{ color: "#64748b" }}>Provider • Details</Text>
              </View>
              <View className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "#b1c9ef" }}>
                <Animated.View
                  className="h-full rounded-full"
                  style={{
                    width: "66.66%",
                    backgroundColor: "#395886",
                  }}
                />
              </View>
              <View className="flex-row justify-between mt-1.5">
                <View className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#395886" }} />
                <View className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#395886" }} />
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
                    <MaterialIcons name="local-hospital" size={22} color="white" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-lg font-bold text-white tracking-tight">
                      Healthcare Provider
                    </Text>
                    <Text className="font-medium text-sm" style={{ color: "#b1c9ef" }}>
                      Doctor and facility information
                    </Text>
                  </View>
                </View>
              </View>

              {/* Refined Form Content */}
              <View className="p-5 space-y-6">
                {/* Doctor's Name Field */}
                <View>
                  <Text className="text-sm font-bold mt-1 mb-1 tracking-wider uppercase pl-1" style={{ color: "#1e293b" }}>
                    Doctor's Name
                  </Text>
                  <Controller
                    control={control}
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        className="border rounded-xl px-4 py-3 text-sm font-medium"
                        placeholder="Dr. John Smith"
                        placeholderTextColor="#64748b"
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                        style={{
                          backgroundColor: "#b1c9ef",
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
                    name="doctorName"
                  />
                </View>

                {/* Hospital/Clinic Field */}
                <View>
                  <Text className="text-sm font-bold mt-1 mb-1 tracking-wider uppercase pl-1" style={{ color: "#1e293b" }}>
                    Hospital/Clinic
                  </Text>
                  <Controller
                    control={control}
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        className="border rounded-xl px-4 py-3 text-sm font-medium"
                        placeholder="City General Hospital"
                        placeholderTextColor="#64748b"
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                        style={{
                          backgroundColor: "#b1c9ef",
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
                    name="hospitalName"
                  />
                </View>
              </View>
            </View>

            {/* Refined Navigation Buttons */}
            <View className="flex-row gap-3 mt-6">
              <TouchableOpacity
                onPress={onBack}
                className="flex-1 rounded-xl p-4 items-center"
                activeOpacity={0.8}
                style={{
                  backgroundColor: "#d5deef",
                  borderWidth: 1,
                  borderColor: "#b1c9ef",
                  shadowColor: "#64748B",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.1,
                  shadowRadius: 8,
                  elevation: 4,
                }}
              >
                <View className="flex-row items-center">
                  <MaterialIcons name="arrow-back" size={18} color="#395886" />
                  <Text className="text-base font-semibold ml-2" style={{ color: "#1e293b" }}>
                    Back
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSubmit(onNext)}
                className="flex-1 rounded-xl p-4 items-center"
                activeOpacity={0.9}
                style={{
                  backgroundColor: "#395886",
                  shadowColor: "#395886",
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.3,
                  shadowRadius: 12,
                  elevation: 6,
                }}
              >
                <View className="flex-row items-center">
                  <Text className="text-white text-base font-semibold mr-2">
                    Continue
                  </Text>
                  <MaterialIcons name="arrow-forward" size={18} color="white" />
                </View>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}