import React, { useState, useEffect } from "react";
import { ScrollView, TouchableOpacity, Alert } from "react-native";
import { StatusBar } from "react-native";

import { MaterialIcons } from "@expo/vector-icons";

import { Text, View } from "@/components/Themed";
import { storageUtils } from "@/utils/storage";
import "../../global.css";
import { useRouter } from "expo-router";
import PrivacySettingsSidebar from "@/components/PrivacySettingsSidebar";

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
  const router = useRouter(); // Add this line
  const [showPrivacySettings, setShowPrivacySettings] = useState(false);


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

  const exportHealthSummary = () => {
    Alert.alert(
      "Export Health Summary",
      "Your health summary will be exported as a PDF file.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Export",
          onPress: () => console.log("Export health summary"),
        },
      ]
    );
  };

  const menuItems = [
    {
      icon: "edit",
      title: "Edit Profile",
      onPress: () => console.log("Edit profile"),
        },
    {
      icon: "file-download",
      title: "Export Health Summary",
      onPress: exportHealthSummary,
    },
    {
      icon: "security",
      title: "Privacy Settings",
      //onPress: () => console.log("Privacy settings"),
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
    <PrivacySettingsSidebar
      visible={showPrivacySettings}
      onClose={() => setShowPrivacySettings(false)}
    />

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
      <View style={{ backgroundColor: "#f0f3fa" }} className="flex-row p-4 gap-3">
        <View className="flex-1 bg-white rounded-xl p-4 items-center shadow-sm">
          <MaterialIcons name="folder" size={24} color="#2563eb" />
          <Text className="text-2xl font-bold text-gray-900 mt-2">12</Text>
          <Text className="text-sm text-gray-600 text-center">Medical Records</Text>
        </View>
        <View className="flex-1 bg-white rounded-xl p-4 items-center shadow-sm">
          <MaterialIcons name="medication" size={24} color="#059669" />
          <Text className="text-2xl font-bold text-gray-900 mt-2">3</Text>
          <Text className="text-sm text-gray-600 text-center">Active Medications</Text>
        </View>
        <View className="flex-1 bg-white rounded-xl p-4 items-center shadow-sm">
          <MaterialIcons name="schedule" size={24} color="#f59e0b" />
          <Text className="text-2xl font-bold text-gray-900 mt-2">2</Text>
          <Text className="text-sm text-gray-600 text-center">Upcoming Appointments</Text>
        </View>
      </View>

      {/* Medical Information */}
      <View style={{ backgroundColor: "#f0f3fa" }} className="p-4">
        <Text className="text-lg font-semibold text-gray-900 mb-4">Medical Information</Text>

        <View className="bg-white rounded-xl p-4 mb-3 shadow-sm">
          <View className="flex-row items-center">
            <MaterialIcons name="warning" size={20} color="#ef4444" />
            <View className="flex-1 ml-3">
              <Text className="text-sm font-medium text-gray-700">Allergies</Text>
              <Text className="text-gray-600">
                {profile.allergies.length > 0 ? profile.allergies.join(", ") : "None reported"}
              </Text>
            </View>
          </View>
        </View>

        <View className="bg-white rounded-xl p-4 mb-3 shadow-sm">
          <View className="flex-row items-center">
            <MaterialIcons name="medical-services" size={20} color="#2563eb" />
            <View className="flex-1 ml-3">
              <Text className="text-sm font-medium text-gray-700">Chronic Conditions</Text>
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
              <Text className="text-sm font-medium text-gray-700">Emergency Contact</Text>
              <Text className="text-gray-600">
                {profile.emergencyContact.name} - {profile.emergencyContact.phone}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Settings Menu */}
      <View style={{ backgroundColor: "#f0f3fa" }} className="p-4">
        <Text className="text-lg font-semibold text-gray-900 mb-4">Settings</Text>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            onPress={item.onPress}
            className="bg-white rounded-xl p-4 mb-2 flex-row items-center shadow-sm"
          >
            <MaterialIcons name={item.icon as any} size={24} color="#395886" />
            <Text className="flex-1 text-gray-900 font-medium ml-3">{item.title}</Text>
            <MaterialIcons name="chevron-right" size={24} color="#9ca3af" />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  </>
);


  
}
