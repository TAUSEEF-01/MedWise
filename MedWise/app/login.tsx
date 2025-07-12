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
import { useAuth } from "@/contexts/AuthContext";

interface LoginForm {
  email: string;
  password: string;
}

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>();

  const onLogin = async (data: LoginForm) => {
    setLoading(true);
    try {
      console.log("Attempting login with email:", data.email);

      await login(data.email, data.password);
      console.log("Login successful through AuthContext");

      // The AuthContext will handle state updates and navigation
      // No need for manual navigation here
    } catch (error: any) {
      console.error("Login error:", error);
      Alert.alert(
        "Login Failed",
        error.message || "Invalid credentials. Please try again."
      );
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
            minHeight: 200,
          }}
        >
          <View className="items-center">
            <View
              className="w-20 h-20 rounded-full items-center justify-center mb-4"
              style={{ backgroundColor: "rgba(255, 255, 255, 0.2)" }}
            >
              <MaterialIcons name="medical-services" size={40} color="white" />
            </View>
            <Text className="text-3xl font-bold text-white mb-2">MedWise</Text>
            <Text className="text-white/80 text-lg text-center">
              Your Health Companion
            </Text>
          </View>
        </View>

        {/* Login Form */}
        <View className="flex-1 px-6 pt-8">
          <View
            className="rounded-2xl p-6 mb-6"
            style={{
              backgroundColor: "#ffffff",
              shadowColor: "#395886",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 12,
              elevation: 6,
            }}
          >
            <Text className="text-2xl font-bold text-gray-900 mb-2 text-center">
              Welcome Back
            </Text>
            <Text className="text-gray-600 text-center mb-6">
              Sign in to access your medical records
            </Text>

            {/* Email Input */}
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

            {/* Password Input */}
            <View className="mb-6">
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
                        placeholder="Enter your password"
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

            {/* Login Button */}
            <TouchableOpacity
              onPress={handleSubmit(onLogin)}
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
                  {loading ? "Signing In..." : "Sign In"}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Forgot Password */}
            <TouchableOpacity className="items-center mb-4">
              <Text className="text-blue-600 font-medium">
                Forgot Password?
              </Text>
            </TouchableOpacity>
          </View>

          {/* Sign Up Link */}
          <View className="flex-row justify-center items-center">
            <Text className="text-gray-600">Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push("/signup")}>
              <Text className="text-blue-600 font-bold">Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}