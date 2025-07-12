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
import { authService } from "@/utils/authService";
import { forceGlobalAuthCheck } from "../_layout";

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
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [exportingHealthSummary, setExportingHealthSummary] = useState(false);
  const router = useRouter(); // Add this line

  const [showPrivacySettings, setShowPrivacySettings] = useState(false);

  const handlePrivacyAction = (key: string) => {
    console.log("Selected privacy action:", key);
    setShowPrivacySettings(false);
    // You can navigate or show alerts here based on the key
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const savedProfile = await storageUtils.getUserProfile();
      if (savedProfile) {
        setProfile(savedProfile);
      } else {
        // Set default profile for demo
        setProfile({
          name: "John Doe",
          age: 35,
          gender: "male",
          bloodType: "O+",
          allergies: ["Penicillin", "Shellfish"],
          emergencyContact: {
            name: "Jane Doe",
            phone: "+1 (555) 123-4567",
          },
          chronicConditions: ["Hypertension"],
        });
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

      if (!profile) {
        Alert.alert(
          "Error",
          "No profile data available. Please set up your profile first."
        );
        return;
      }

      // Prepare health summary data
      const healthSummaryData: HealthSummaryData = {
        userProfile: profile,
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

            // Call logout service to clear tokens
            await authService.logout();
            console.log("Logout service completed");

            // Force the global auth check to update state
            forceGlobalAuthCheck();
            console.log("Global auth check triggered");

            // Small delay to ensure state update, then redirect
            setTimeout(() => {
              router.replace("/login");
              console.log("Redirected to login page");
            }, 200);
          } catch (error) {
            console.error("Logout error:", error);
            // Force logout even if there's an error
            forceGlobalAuthCheck();
            router.replace("/login");
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

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <MaterialIcons name="hourglass-empty" size={48} color="#9ca3af" />
        <Text className="text-gray-600 mt-4">Loading profile...</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <Text className="text-gray-600">No profile found</Text>
      </View>
    );
  }

  // return (

  //   <ScrollView style={{ flex: 1, backgroundColor: "#f0f3fa" }} >
  //     {/* Profile Header */}
  //     <View style={{ backgroundColor: "#f0f3fa" }} className=" p-6 items-center border-b border-gray-200">
  //       <View style={{ backgroundColor: "#f0f3fa" }} className="w-24 h-24 bg-blue-100 rounded-full items-center justify-center mb-4">
  //         <MaterialIcons name="person" size={48} color="#2563eb" />
  //       </View>
  //       <Text className="text-2xl font-semibold text-gray-900 mb-2">
  //         {profile.name}
  //       </Text>
  //       <Text className="text-gray-600">
  //         {profile.age} years old • {profile.gender} • {profile.bloodType}
  //       </Text>
  //     </View>

  //     {/* Quick Stats */}
  //     <View style={{ backgroundColor: "#f0f3fa" }}  className="flex-row p-4 gap-3">
  //       <View className="flex-1 bg-white rounded-xl p-4 items-center shadow-sm">
  //         <MaterialIcons name="folder" size={24} color="#2563eb" />
  //         <Text className="text-2xl font-bold text-gray-900 mt-2">12</Text>
  //         <Text className="text-sm text-gray-600 text-center">
  //           Medical Records
  //         </Text>
  //       </View>
  //       <View  className="flex-1 bg-white rounded-xl p-4 items-center shadow-sm">
  //         <MaterialIcons name="medication" size={24} color="#059669" />
  //         <Text className="text-2xl font-bold text-gray-900 mt-2">3</Text>
  //         <Text className="text-sm text-gray-600 text-center">
  //           Active Medications
  //         </Text>
  //       </View>
  //       <View className="flex-1 bg-white rounded-xl p-4 items-center shadow-sm">
  //         <MaterialIcons name="schedule" size={24} color="#f59e0b" />
  //         <Text className="text-2xl font-bold text-gray-900 mt-2">2</Text>
  //         <Text className="text-sm text-gray-600 text-center">
  //           Upcoming Appointments
  //         </Text>
  //       </View>
  //     </View>

  //     {/* Medical Information */}
  //     <View style={{ backgroundColor: "#f0f3fa" }} className="p-4">
  //       <Text className="text-lg font-semibold text-gray-900 mb-4">
  //         Medical Information
  //       </Text>

  //       <View className="bg-white rounded-xl p-4 mb-3 shadow-sm">
  //         <View className="flex-row items-center">
  //           <MaterialIcons name="warning" size={20} color="#ef4444" />
  //           <View className="flex-1 ml-3">
  //             <Text className="text-sm font-medium text-gray-700">
  //               Allergies
  //             </Text>
  //             <Text className="text-gray-600">
  //               {profile.allergies.length > 0
  //                 ? profile.allergies.join(", ")
  //                 : "None reported"}
  //             </Text>
  //           </View>
  //         </View>
  //       </View>

  //       <View className="bg-white rounded-xl p-4 mb-3 shadow-sm">
  //         <View className="flex-row items-center">
  //           <MaterialIcons name="medical-services" size={20} color="#2563eb" />
  //           <View className="flex-1 ml-3">
  //             <Text className="text-sm font-medium text-gray-700">
  //               Chronic Conditions
  //             </Text>
  //             <Text className="text-gray-600">
  //               {profile.chronicConditions.length > 0
  //                 ? profile.chronicConditions.join(", ")
  //                 : "None reported"}
  //             </Text>
  //           </View>
  //         </View>
  //       </View>

  //       <View className="bg-white rounded-xl p-4 mb-3 shadow-sm">
  //         <View className="flex-row items-center">
  //           <MaterialIcons name="contact-phone" size={20} color="#059669" />
  //           <View className="flex-1 ml-3">
  //             <Text className="text-sm font-medium text-gray-700">
  //               Emergency Contact
  //             </Text>
  //             <Text className="text-gray-600">
  //               {profile.emergencyContact.name} -{" "}
  //               {profile.emergencyContact.phone}
  //             </Text>
  //           </View>
  //         </View>
  //       </View>
  //     </View>

  //     {/* Settings Menu */}
  //     <View style={{ backgroundColor: "#f0f3fa" }} className="p-4">
  //       <Text className="text-lg font-semibold text-gray-900 mb-4">
  //         Settings
  //       </Text>
  //       {menuItems.map((item, index) => (
  //         <TouchableOpacity
  //           key={index}
  //           onPress={item.onPress}
  //           className="bg-white rounded-xl p-4 mb-2 flex-row items-center shadow-sm"
  //         >
  //           <MaterialIcons name={item.icon as any} size={24} color="#395886" />
  //           <Text className="flex-1 text-gray-900 font-medium ml-3">
  //             {item.title}
  //           </Text>
  //           <MaterialIcons name="chevron-right" size={24} color="#9ca3af" />
  //         </TouchableOpacity>
  //       ))}
  //     </View>
  //   </ScrollView>
  // );

  return (
    <>
      {/* Sidebar for Privacy Settings */}
      {/* Sidebar for Privacy Settings */}
      {/* <PrivacySettingsSidebar
      visible={showPrivacySettings}
      onClose={() => setShowPrivacySettings(false)}
    /> */}

      {/* Main Profile ScrollView */}
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
            {profile.name}
          </Text>
          <Text className="text-gray-600">
            {profile.age} years old • {profile.gender} • {profile.bloodType}
          </Text>
        </View>

        {/* Quick Stats */}
        <View
          style={{ backgroundColor: "#f0f3fa" }}
          className="flex-row p-4 gap-3"
        >
          <View className="flex-1 bg-white rounded-xl p-4 items-center shadow-sm">
            <MaterialIcons name="folder" size={24} color="#2563eb" />
            <Text className="text-2xl font-bold text-gray-900 mt-2">12</Text>
            <Text className="text-sm text-gray-600 text-center">
              Medical Records
            </Text>
          </View>
          <View className="flex-1 bg-white rounded-xl p-4 items-center shadow-sm">
            <MaterialIcons name="medication" size={24} color="#059669" />
            <Text className="text-2xl font-bold text-gray-900 mt-2">3</Text>
            <Text className="text-sm text-gray-600 text-center">
              Active Medications
            </Text>
          </View>
          <View className="flex-1 bg-white rounded-xl p-4 items-center shadow-sm">
            <MaterialIcons name="schedule" size={24} color="#f59e0b" />
            <Text className="text-2xl font-bold text-gray-900 mt-2">2</Text>
            <Text className="text-sm text-gray-600 text-center">
              Upcoming Appointments
            </Text>
          </View>
        </View>

        {/* Medical Information */}
        <View style={{ backgroundColor: "#f0f3fa" }} className="p-4">
          <Text className="text-lg font-semibold text-gray-900 mb-4">
            Medical Information
          </Text>

          <View className="bg-white rounded-xl p-4 mb-3 shadow-sm">
            <View className="flex-row items-center">
              <MaterialIcons name="warning" size={20} color="#ef4444" />
              <View className="flex-1 ml-3">
                <Text className="text-sm font-medium text-gray-700">
                  Allergies
                </Text>
                <Text className="text-gray-600">
                  {profile.allergies.length > 0
                    ? profile.allergies.join(", ")
                    : "None reported"}
                </Text>
              </View>
            </View>
          </View>

          <View className="bg-white rounded-xl p-4 mb-3 shadow-sm">
            <View className="flex-row items-center">
              <MaterialIcons
                name="medical-services"
                size={20}
                color="#2563eb"
              />
              <View className="flex-1 ml-3">
                <Text className="text-sm font-medium text-gray-700">
                  Chronic Conditions
                </Text>
                <Text className="text-gray-600">
                  {profile.chronicConditions.length > 0
                    ? profile.chronicConditions.join(", ")
                    : "None reported"}
                </Text>
              </View>
            </View>
          </View>

          <View className="bg-white rounded-xl p-4 mb-3 shadow-sm">
            <View className="flex-row items-center">
              <MaterialIcons name="contact-phone" size={20} color="#059669" />
              <View className="flex-1 ml-3">
                <Text className="text-sm font-medium text-gray-700">
                  Emergency Contact
                </Text>
                <Text className="text-gray-600">
                  {profile.emergencyContact.name} -{" "}
                  {profile.emergencyContact.phone}
                </Text>
              </View>
            </View>
          </View>
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

      {/* <PrivacyActionsModal
      visible={showPrivacySettings}
      onClose={() => setShowPrivacySettings(false)}
      onAction={handlePrivacyAction}
    /> */}

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
