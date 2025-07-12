import React, { useState, useEffect } from "react";
import { ScrollView, TouchableOpacity, Alert } from "react-native";
import { StatusBar } from "react-native";
import { Text, View } from "react-native";

import { MaterialIcons } from "@expo/vector-icons";

import { storageUtils } from "@/utils/storage";
import { PDFExportService, HealthSummaryData } from "@/utils/pdfExport";
import { MedicalRecord } from "@/types/medical";
import "../../global.css";
import { useRouter } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";

import PrivacyActionsModal from "@/components/privacyActions";

interface UserProfile {
  name: string;
  age: number;
  gender: "male" | "female" | "other";
  bloodType: string;
  allergies: string[];
  emergencyContact: {
    name: string;
    phone: string;
  };
  chronicConditions: string[];
}

export default function ProfileScreen() {
  const { logout, currentUser, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [exportingHealthSummary, setExportingHealthSummary] = useState(false);
  const [showPrivacySettings, setShowPrivacySettings] = useState(false);

  const handlePrivacyAction = (key: string) => {
    console.log("Selected privacy action:", key);
    setShowPrivacySettings(false);
    // You can navigate or show alerts here based on the key
  };

  useEffect(() => {
    loadProfile();
  }, [currentUser]);

  const loadProfile = async () => {
    try {
      // Load local profile data for additional info like allergies, emergency contacts
      const savedProfile = await storageUtils.getUserProfile();
      if (savedProfile) {
        setProfile(savedProfile);
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const exportHealthSummary = async () => {
    if (exportingHealthSummary) return; // Prevent multiple simultaneous exports

    try {
      setExportingHealthSummary(true);

      // Get medical records
      const medicalRecords: MedicalRecord[] =
        await storageUtils.getMedicalRecords();

      if (!currentUser) {
        Alert.alert(
          "Error",
          "No user data available. Please ensure you're logged in."
        );
        return;
      }

      // Create profile from current user data
      const userProfile: UserProfile = {
        name: currentUser.user_name,
        age: 0, // You might want to calculate this from a birth date
        gender: currentUser.sex as "male" | "female" | "other",
        bloodType: currentUser.blood_group,
        allergies: profile?.allergies || [],
        emergencyContact: profile?.emergencyContact || { name: "", phone: "" },
        chronicConditions: profile?.chronicConditions || [],
      };

      // Prepare health summary data
      const healthSummaryData: HealthSummaryData = {
        userProfile: userProfile,
        medicalRecords: medicalRecords,
        generatedDate: new Date(),
      };

      // Show confirmation and export
      Alert.alert(
        "Export Health Summary",
        `Generate a comprehensive health summary PDF?\n\n• Patient Information\n• Medical Records (${medicalRecords.length})\n• Medications & Diagnoses\n• Allergies & Emergency Contacts`,
        [
          {
            text: "Cancel",
            style: "cancel",
            onPress: () => setExportingHealthSummary(false),
          },
          {
            text: "Export PDF",
            onPress: async () => {
              try {
                await PDFExportService.exportAndShareHealthSummary(
                  healthSummaryData
                );
                Alert.alert("Success", "Health summary exported successfully!");
              } catch (error) {
                console.error("Error exporting health summary:", error);
                Alert.alert(
                  "Error",
                  "Failed to export health summary. Please try again."
                );
              } finally {
                setExportingHealthSummary(false);
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error("Error preparing health summary:", error);
      Alert.alert(
        "Error",
        "Failed to prepare health summary. Please try again."
      );
      setExportingHealthSummary(false);
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
            console.log(
              "Logout completed - AuthContext will handle navigation"
            );
          } catch (error) {
            console.error("Logout error:", error);
          }
        },
      },
    ]);
  };

  const menuItems = [
    {
      icon: "edit",
      title: "Edit Profile",
      onPress: () => router.push("/edit-profile"),
    },
    {
      icon: "file-download",
      title: "Export Health Summary",
      onPress: exportHealthSummary,
    },
    {
      icon: "security",
      title: "Privacy Settings",
      onPress: () => setShowPrivacySettings(true),
    },
    {
      icon: "notifications",
      title: "Medication Reminders",
      onPress: () => console.log("Medication reminders"),
    },
    {
      icon: "help",
      title: "Help & Support",
      onPress: () => console.log("Help & support"),
    },
    {
      icon: "info",
      title: "About MedWise",
      onPress: () => console.log("About MedWise"),
    },
    {
      icon: "logout",
      title: "Logout",
      onPress: handleLogout,
    },
  ];

  if (authLoading || loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <MaterialIcons name="hourglass-empty" size={48} color="#9ca3af" />
        <Text className="text-gray-600 mt-4">Loading profile...</Text>
      </View>
    );
  }

  if (!currentUser) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <Text className="text-gray-600">No user data found</Text>
        <TouchableOpacity
          onPress={() => router.push("/login")}
          className="mt-4 bg-blue-500 px-4 py-2 rounded-lg"
        >
          <Text className="text-white">Go to Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <ScrollView style={{ flex: 1, backgroundColor: "#f0f3fa" }}>
        {/* Profile Header */}
        <View
          style={{ backgroundColor: "#f0f3fa" }}
          className=" p-6 items-center border-b border-gray-200"
        >
          <View
            style={{ backgroundColor: "#f0f3fa" }}
            className="w-24 h-24 bg-blue-100 rounded-full items-center justify-center mb-4"
          >
            <MaterialIcons name="person" size={48} color="#2563eb" />
          </View>
          <Text className="text-2xl font-semibold text-gray-900 mb-2">
            {currentUser.user_name}
          </Text>
          <Text className="text-gray-600">
            {currentUser.sex} • {currentUser.blood_group}
          </Text>
          <Text className="text-sm text-gray-500 mt-1">
            {currentUser.user_email}
          </Text>
          <Text className="text-sm text-gray-500">{currentUser.phone_no}</Text>
        </View>

        {/* Settings Menu */}
        <View style={{ backgroundColor: "#f0f3fa" }} className="p-4">
          <Text className="text-lg font-semibold text-gray-900 mb-4">
            Settings
          </Text>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              onPress={item.onPress}
              className="bg-white rounded-xl p-4 mb-2 flex-row items-center shadow-sm"
            >
              <MaterialIcons
                name={item.icon as any}
                size={24}
                color="#395886"
              />
              <Text className="flex-1 text-gray-900 font-medium ml-3">
                {item.title}
              </Text>
              <MaterialIcons name="chevron-right" size={24} color="#9ca3af" />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <PrivacyActionsModal
        visible={showPrivacySettings}
        onClose={() => setShowPrivacySettings(false)}
        onAction={(key, value) =>
          console.log(`Privacy setting '${key}' set to: ${value}`)
        }
      />
    </>
  );
}
