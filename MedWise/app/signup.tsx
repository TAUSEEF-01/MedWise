import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { authService } from "@/utils/authService";

interface SignupForm {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  gender: string;
  bloodGroup: string;
}

const genderOptions = [
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
  { label: "Other", value: "other" },
];

const bloodGroupOptions = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function SignupScreen() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignupForm>();

  const password = watch("password");

  const onSignup = async (data: SignupForm) => {
    setLoading(true);
    try {
      await authService.signup({
        user_name: data.fullName,
        user_email: data.email,
        password: data.password,
        phone_no: "1234567890", // Default for now
        blood_group: data.bloodGroup,
        sex: data.gender,
      });

      Alert.alert("Success", "Account created successfully!", [
        {
          text: "OK",
          onPress: () => router.replace("/(tabs)"),
        },
      ]);
    } catch (error: any) {
      Alert.alert("Signup Failed", error.message || "Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ backgroundColor: "#f0f3fa" }}
    >
      <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1 }}>
        {/* Header */}
        <View
          className="pt-16 pb-8 px-6"
          style={{
            backgroundColor: "#395886",
            borderBottomLeftRadius: 32,
            borderBottomRightRadius: 32,
          }}
        >
          <View className="flex-row items-center justify-between mb-4">
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-10 h-10 rounded-xl items-center justify-center"
              style={{ backgroundColor: "rgba(255, 255, 255, 0.2)" }}
            >
              <MaterialIcons name="arrow-back" size={20} color="white" />
            </TouchableOpacity>
            <Text className="text-2xl font-bold text-white">
              Create Account
            </Text>
            <View className="w-10" />
          </View>
          <Text className="text-white/80 text-center">
            Join MedWise to manage your health records
          </Text>
        </View>

        {/* Signup Form */}
        <View className="flex-1 px-6 pt-8 pb-6">
          <View
            className="rounded-2xl p-6"
            style={{
              backgroundColor: "#ffffff",
              shadowColor: "#395886",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 12,
              elevation: 6,
            }}
          >
            {/* Full Name */}
            <View className="mb-4">
              <Text className="text-sm font-bold mb-2 text-gray-700 uppercase tracking-wider">
                Full Name
              </Text>
              <Controller
                control={control}
                rules={{ required: "Full name is required" }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <View>
                    <View
                      className="flex-row items-center rounded-xl px-4 py-3"
                      style={{
                        backgroundColor: errors.fullName
                          ? "#FEF2F2"
                          : "#f8fafc",
                        borderWidth: 1,
                        borderColor: errors.fullName ? "#ef4444" : "#e2e8f0",
                      }}
                    >
                      <MaterialIcons
                        name="person"
                        size={20}
                        color={errors.fullName ? "#ef4444" : "#6b7280"}
                      />
                      <TextInput
                        className="flex-1 ml-3 text-gray-900"
                        placeholder="Enter your full name"
                        placeholderTextColor="#9ca3af"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                      />
                    </View>
                    {errors.fullName && (
                      <Text className="text-red-500 text-xs mt-1 ml-1">
                        {errors.fullName.message}
                      </Text>
                    )}
                  </View>
                )}
                name="fullName"
              />
            </View>

            {/* Email */}
            <View className="mb-4">
              <Text className="text-sm font-bold mb-2 text-gray-700 uppercase tracking-wider">
                Email
              </Text>
              <Controller
                control={control}
                rules={{
                  required: "Email is required",
                  pattern: {
                    value: /^\S+@\S+$/i,
                    message: "Invalid email format",
                  },
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <View>
                    <View
                      className="flex-row items-center rounded-xl px-4 py-3"
                      style={{
                        backgroundColor: errors.email ? "#FEF2F2" : "#f8fafc",
                        borderWidth: 1,
                        borderColor: errors.email ? "#ef4444" : "#e2e8f0",
                      }}
                    >
                      <MaterialIcons
                        name="email"
                        size={20}
                        color={errors.email ? "#ef4444" : "#6b7280"}
                      />
                      <TextInput
                        className="flex-1 ml-3 text-gray-900"
                        placeholder="Enter your email"
                        placeholderTextColor="#9ca3af"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        keyboardType="email-address"
                        autoCapitalize="none"
                      />
                    </View>
                    {errors.email && (
                      <Text className="text-red-500 text-xs mt-1 ml-1">
                        {errors.email.message}
                      </Text>
                    )}
                  </View>
                )}
                name="email"
              />
            </View>

            {/* Gender */}
            <View className="mb-4">
              <Text className="text-sm font-bold mb-2 text-gray-700 uppercase tracking-wider">
                Gender
              </Text>
              <Controller
                control={control}
                rules={{ required: "Please select your gender" }}
                render={({ field: { onChange, value } }) => (
                  <View>
                    <View className="flex-row space-x-2">
                      {genderOptions.map((option) => (
                        <TouchableOpacity
                          key={option.value}
                          onPress={() => onChange(option.value)}
                          className="flex-1 rounded-xl py-3 px-4 items-center"
                          style={{
                            backgroundColor:
                              value === option.value ? "#395886" : "#f8fafc",
                            borderWidth: 1,
                            borderColor:
                              value === option.value ? "#395886" : "#e2e8f0",
                          }}
                        >
                          <Text
                            className="font-medium"
                            style={{
                              color:
                                value === option.value ? "white" : "#6b7280",
                            }}
                          >
                            {option.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    {errors.gender && (
                      <Text className="text-red-500 text-xs mt-1 ml-1">
                        {errors.gender.message}
                      </Text>
                    )}
                  </View>
                )}
                name="gender"
              />
            </View>

            {/* Blood Group */}
            <View className="mb-4">
              <Text className="text-sm font-bold mb-2 text-gray-700 uppercase tracking-wider">
                Blood Group
              </Text>
              <Controller
                control={control}
                rules={{ required: "Please select your blood group" }}
                render={({ field: { onChange, value } }) => (
                  <View>
                    <View className="flex-row flex-wrap">
                      {bloodGroupOptions.map((option) => (
                        <TouchableOpacity
                          key={option}
                          onPress={() => onChange(option)}
                          className="rounded-xl py-2 px-4 m-1"
                          style={{
                            backgroundColor:
                              value === option ? "#395886" : "#f8fafc",
                            borderWidth: 1,
                            borderColor:
                              value === option ? "#395886" : "#e2e8f0",
                          }}
                        >
                          <Text
                            className="font-medium"
                            style={{
                              color: value === option ? "white" : "#6b7280",
                            }}
                          >
                            {option}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    {errors.bloodGroup && (
                      <Text className="text-red-500 text-xs mt-1 ml-1">
                        {errors.bloodGroup.message}
                      </Text>
                    )}
                  </View>
                )}
                name="bloodGroup"
              />
            </View>

            {/* Password */}
            <View className="mb-4">
              <Text className="text-sm font-bold mb-2 text-gray-700 uppercase tracking-wider">
                Password
              </Text>
              <Controller
                control={control}
                rules={{
                  required: "Password is required",
                  minLength: {
                    value: 6,
                    message: "Password must be at least 6 characters",
                  },
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <View>
                    <View
                      className="flex-row items-center rounded-xl px-4 py-3"
                      style={{
                        backgroundColor: errors.password
                          ? "#FEF2F2"
                          : "#f8fafc",
                        borderWidth: 1,
                        borderColor: errors.password ? "#ef4444" : "#e2e8f0",
                      }}
                    >
                      <MaterialIcons
                        name="lock"
                        size={20}
                        color={errors.password ? "#ef4444" : "#6b7280"}
                      />
                      <TextInput
                        className="flex-1 ml-3 text-gray-900"
                        placeholder="Create a password"
                        placeholderTextColor="#9ca3af"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        secureTextEntry={!showPassword}
                      />
                      <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        className="p-1"
                      >
                        <MaterialIcons
                          name={showPassword ? "visibility-off" : "visibility"}
                          size={20}
                          color="#6b7280"
                        />
                      </TouchableOpacity>
                    </View>
                    {errors.password && (
                      <Text className="text-red-500 text-xs mt-1 ml-1">
                        {errors.password.message}
                      </Text>
                    )}
                  </View>
                )}
                name="password"
              />
            </View>

            {/* Confirm Password */}
            <View className="mb-6">
              <Text className="text-sm font-bold mb-2 text-gray-700 uppercase tracking-wider">
                Confirm Password
              </Text>
              <Controller
                control={control}
                rules={{
                  required: "Please confirm your password",
                  validate: (value) =>
                    value === password || "Passwords do not match",
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <View>
                    <View
                      className="flex-row items-center rounded-xl px-4 py-3"
                      style={{
                        backgroundColor: errors.confirmPassword
                          ? "#FEF2F2"
                          : "#f8fafc",
                        borderWidth: 1,
                        borderColor: errors.confirmPassword
                          ? "#ef4444"
                          : "#e2e8f0",
                      }}
                    >
                      <MaterialIcons
                        name="lock"
                        size={20}
                        color={errors.confirmPassword ? "#ef4444" : "#6b7280"}
                      />
                      <TextInput
                        className="flex-1 ml-3 text-gray-900"
                        placeholder="Confirm your password"
                        placeholderTextColor="#9ca3af"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        secureTextEntry={!showConfirmPassword}
                      />
                      <TouchableOpacity
                        onPress={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="p-1"
                      >
                        <MaterialIcons
                          name={
                            showConfirmPassword
                              ? "visibility-off"
                              : "visibility"
                          }
                          size={20}
                          color="#6b7280"
                        />
                      </TouchableOpacity>
                    </View>
                    {errors.confirmPassword && (
                      <Text className="text-red-500 text-xs mt-1 ml-1">
                        {errors.confirmPassword.message}
                      </Text>
                    )}
                  </View>
                )}
                name="confirmPassword"
              />
            </View>

            {/* Sign Up Button */}
            <TouchableOpacity
              onPress={handleSubmit(onSignup)}
              disabled={loading}
              className="rounded-xl py-4 items-center mb-4"
              style={{
                backgroundColor: loading ? "#9ca3af" : "#395886",
                shadowColor: "#395886",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              <View className="flex-row items-center">
                {loading && (
                  <MaterialIcons
                    name="hourglass-empty"
                    size={20}
                    color="white"
                    style={{ marginRight: 8 }}
                  />
                )}
                <Text className="text-white font-bold text-lg">
                  {loading ? "Creating Account..." : "Create Account"}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Login Link */}
          <View className="flex-row justify-center items-center mt-4">
            <Text className="text-gray-600">Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push("/login")}>
              <Text className="text-blue-600 font-bold">Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
