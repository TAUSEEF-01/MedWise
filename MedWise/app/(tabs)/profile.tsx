import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { authService, type CurrentUser } from "@/utils/authService";

export default function ProfileScreen() {
  const router = useRouter();
  const { logout, isAuthenticated } = useAuth();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      console.log("Loading user profile...");

      if (!isAuthenticated) {
        console.log("User not authenticated, redirecting to login...");
        router.replace("/login");
        return;
      }

      const userData = await authService.getCurrentUser();
      if (userData) {
        setUser(userData);
        console.log("User profile loaded:", userData.user_email);
      } else {
        console.log("Failed to load user profile, redirecting to login...");
        await logout();
      }
    } catch (error) {
      console.error("Error loading user profile:", error);
      Alert.alert("Error", "Failed to load profile. Please try logging in again.");
      await logout();
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            console.log("Starting logout process...");
            await logout();
            console.log("Logout completed - AuthContext will handle navigation");
          } catch (error) {
            console.error("Logout error:", error);
          }
        },
      },
    ]);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#395886" />
        <Text className="text-gray-600 mt-4">Loading profile...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <MaterialIcons name="error-outline" size={64} color="#ef4444" />
        <Text className="text-xl font-semibold text-gray-900 mt-4 mb-2">
          Profile Not Found
        </Text>
        <Text className="text-gray-600 text-center mb-6">
          Unable to load your profile information
        </Text>
        <TouchableOpacity
          onPress={() => router.replace("/login")}
          className="bg-blue-600 px-6 py-3 rounded-xl"
        >
          <Text className="text-white font-semibold">Go to Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Header */}
      <View
        className="pt-12 pb-8 px-6"
        style={{
          backgroundColor: "#395886",
          borderBottomLeftRadius: 32,
          borderBottomRightRadius: 32,
        }}
      >
        <View className="items-center">
          <View className="w-24 h-24 bg-white/20 rounded-full items-center justify-center mb-4">
            <MaterialIcons name="person" size={48} color="white" />
          </View>
          <Text className="text-2xl font-bold text-white mb-2">
            {user.user_name}
          </Text>
          <Text className="text-white/80 text-base">{user.user_email}</Text>
        </View>
      </View>

      {/* Profile Information */}
      <View className="p-6">
        <Text className="text-xl font-bold text-gray-900 mb-4">
          Profile Information
        </Text>

        {/* Info Cards */}
        <View className="space-y-4">
          {/* Personal Details */}
          <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <Text className="text-lg font-semibold text-gray-900 mb-3">
              Personal Details
            </Text>

            <View className="space-y-3">
              <View className="flex-row items-center">
                <MaterialIcons name="person" size={20} color="#6b7280" />
                <View className="ml-3">
                  <Text className="text-sm text-gray-500">Full Name</Text>
                  <Text className="text-base font-medium text-gray-900">
                    {user.user_name}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center">
                <MaterialIcons name="email" size={20} color="#6b7280" />
                <View className="ml-3">
                  <Text className="text-sm text-gray-500">Email</Text>
                  <Text className="text-base font-medium text-gray-900">
                    {user.user_email}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center">
                <MaterialIcons name="phone" size={20} color="#6b7280" />
                <View className="ml-3">
                  <Text className="text-sm text-gray-500">Phone</Text>
                  <Text className="text-base font-medium text-gray-900">
                    {user.phone_no}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Medical Information */}
          <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <Text className="text-lg font-semibold text-gray-900 mb-3">
              Medical Information
            </Text>

            <View className="space-y-3">
              <View className="flex-row items-center">
                <MaterialIcons name="bloodtype" size={20} color="#dc2626" />
                <View className="ml-3">
                  <Text className="text-sm text-gray-500">Blood Group</Text>
                  <Text className="text-base font-medium text-gray-900">
                    {user.blood_group}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center">
                <MaterialIcons name="wc" size={20} color="#6b7280" />
                <View className="ml-3">
                  <Text className="text-sm text-gray-500">Gender</Text>
                  <Text className="text-base font-medium text-gray-900 capitalize">
                    {user.sex}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center">
                <MaterialIcons name="calendar-today" size={20} color="#6b7280" />
                <View className="ml-3">
                  <Text className="text-sm text-gray-500">Member Since</Text>
                  <Text className="text-base font-medium text-gray-900">
                    {formatDate(user.created_at)}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Account Actions */}
          <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <Text className="text-lg font-semibold text-gray-900 mb-3">
              Account Actions
            </Text>

            <TouchableOpacity
              onPress={() => router.push("/edit-profile")}
              className="flex-row items-center py-3"
            >
              <MaterialIcons name="edit" size={20} color="#395886" />
              <Text className="ml-3 text-base font-medium text-gray-900">
                Edit Profile
              </Text>
              <MaterialIcons
                name="chevron-right"
                size={20}
                color="#9ca3af"
                className="ml-auto"
              />
            </TouchableOpacity>

            <View className="border-t border-gray-100 my-2" />

            <TouchableOpacity
              onPress={handleLogout}
              className="flex-row items-center py-3"
            >
              <MaterialIcons name="logout" size={20} color="#dc2626" />
              <Text className="ml-3 text-base font-medium text-red-600">
                Logout
              </Text>
              <MaterialIcons
                name="chevron-right"
                size={20}
                color="#9ca3af"
                className="ml-auto"
              />
            </TouchableOpacity>
          </View>

          {/* App Info */}
          {/* <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <Text className="text-lg font-semibold text-gray-900 mb-3">
              App Information
            </Text>

            <View className="space-y-2">
              <Text className="text-sm text-gray-500">
                User ID: {user.user_id}
              </Text>
              <Text className="text-sm text-gray-500">Version: 1.0.0</Text>
              <Text className="text-sm text-gray-500">MedWise Health App</Text>
            </View>
          </View> */}
        </View>
      </View>
    </ScrollView>
  );
}
    