// import { useState, useEffect } from "react";
// import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from "react-native";
// import { useRouter } from "expo-router";
// import { storageUtils } from "@/utils/storage";

// export default function EditProfile() {
//   const router = useRouter();

//   const [name, setName] = useState("");
//   const [age, setAge] = useState("");
//   const [gender, setGender] = useState("");
//   const [bloodType, setBloodType] = useState("");

//   useEffect(() => {
//     (async () => {
//       const savedProfile = await storageUtils.getUserProfile();
//       if (savedProfile) {
//         setName(savedProfile.name || "");
//         setAge(savedProfile.age.toString() || "");
//         setGender(savedProfile.gender || "");
//         setBloodType(savedProfile.bloodType || "");
//       }
//     })();
//   }, []);

//   const handleSave = async () => {
//     try {
//       await storageUtils.saveUserProfile({
//         name,
//         age: parseInt(age),
//         gender: gender as "male" | "female" | "other",
//         bloodType,
//         allergies: [],
//         emergencyContact: { name: "", phone: "" },
//         chronicConditions: [],
//       });
//       Alert.alert("Success", "Profile updated successfully", [
//         { text: "OK", onPress: () => router.back() },
//       ]);
//     } catch (error) {
//       Alert.alert("Error", "Failed to save profile");
//     }
//   };

//   return (
//     <ScrollView contentContainerStyle={styles.container}>
//       <Text style={styles.heading}>Edit Profile</Text>

//       <TextInput
//         style={styles.input}
//         placeholder="Full Name"
//         value={name}
//         onChangeText={setName}
//       />
//       <TextInput
//         style={styles.input}
//         placeholder="Age"
//         value={age}
//         onChangeText={setAge}
//         keyboardType="numeric"
//       />
//       <TextInput
//         style={styles.input}
//         placeholder="Gender (male/female/other)"
//         value={gender}
//         onChangeText={setGender}
//       />
//       <TextInput
//         style={styles.input}
//         placeholder="Blood Type"
//         value={bloodType}
//         onChangeText={setBloodType}
//       />

//       <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
//         <Text style={styles.saveText}>Save Changes</Text>
//       </TouchableOpacity>
//     </ScrollView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     padding: 20,
//     backgroundColor: "#f0f3fa",
//     flexGrow: 1,
//   },
//   heading: {
//     fontSize: 22,
//     fontWeight: "bold",
//     color: "#1f2937",
//     marginBottom: 20,
//   },
//   input: {
//     backgroundColor: "#fff",
//     padding: 14,
//     borderRadius: 10,
//     borderColor: "#d1d5db",
//     borderWidth: 1,
//     marginBottom: 16,
//   },
//   saveButton: {
//     backgroundColor: "#395886",
//     paddingVertical: 14,
//     borderRadius: 10,
//     alignItems: "center",
//   },
//   saveText: {
//     color: "#fff",
//     fontSize: 16,
//     fontWeight: "600",
//   },
// });


// import { useState, useEffect } from "react";
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   StyleSheet,
//   Alert,
//   ScrollView,
//   Image,
// } from "react-native";
// import * as ImagePicker from "expo-image-picker";
// import { useRouter } from "expo-router";
// import { MaterialIcons } from "@expo/vector-icons";
// import { storageUtils } from "@/utils/storage";

// // Remove local UserProfile type and ensure storageUtils.UserProfile includes profileImage
// import DropDownPicker from "react-native-dropdown-picker";

// const bloodTypes = [
//   { label: "A+", value: "A+" },
//   { label: "A-", value: "A-" },
//   { label: "B+", value: "B+" },
//   { label: "B-", value: "B-" },
//   { label: "AB+", value: "AB+" },
//   { label: "AB-", value: "AB-" },
//   { label: "O+", value: "O+" },
//   { label: "O-", value: "O-" },
// ];

// const genderOptions = [
//   { label: "Male", value: "male" },
//   { label: "Female", value: "female" },
//   { label: "Other", value: "other" },
// ];

// export default function EditProfile() {
//   const router = useRouter();

//   const [name, setName] = useState("");
//   const [age, setAge] = useState("");
//   const [gender, setGender] = useState<"male" | "female" | "other">("male");
//   const [bloodType, setBloodType] = useState("");
//   const [emergencyName, setEmergencyName] = useState("");
//   const [emergencyPhone, setEmergencyPhone] = useState("");
//   const [profileImage, setProfileImage] = useState<string | null>(null);

//   const [genderOpen, setGenderOpen] = useState(false);
//   const [bloodOpen, setBloodOpen] = useState(false);

//   useEffect(() => {
//     (async () => {
//       const savedProfile = await storageUtils.getUserProfile();
//       if (savedProfile) {
//         setName(savedProfile.name || "");
//         setAge(savedProfile.age?.toString() || "");
//         setGender(savedProfile.gender || "male");
//         setBloodType(savedProfile.bloodType || "");
//         setEmergencyName(savedProfile.emergencyContact?.name || "");
//         setEmergencyPhone(savedProfile.emergencyContact?.phone || "");
//       }
//     })();
//   }, []);

//   const pickImage = async () => {
//     const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
//     if (!permission.granted) {
//       Alert.alert("Permission Required", "Please allow access to your photos.");
//       return;
//     }

//     const result = await ImagePicker.launchImageLibraryAsync({
//       mediaTypes: ImagePicker.MediaTypeOptions.Images,
//       quality: 0.7,
//       allowsEditing: true,
//       aspect: [1, 1],
//     });

//     if (!result.canceled) {
//       setProfileImage(result.assets[0].uri);
//     }
//   };

//   const handleSave = async () => {
//     if (!name || !age || !gender || !bloodType || !emergencyName || !emergencyPhone) {
//       Alert.alert("Incomplete", "Please fill all required fields.");
//       return;
//     }

//     try {
//       await storageUtils.saveUserProfile({
//         name,
//         age: parseInt(age),
//         gender,
//         bloodType,
//         allergies: [],
//         emergencyContact: { name: emergencyName, phone: emergencyPhone },
//         chronicConditions: [],
//         //profileImage,
//       });

//       Alert.alert("Success", "Profile updated successfully", [
//         { text: "OK", onPress: () => router.back() },
//       ]);
//     } catch (error) {
//       Alert.alert("Error", "Failed to save profile");
//     }
//   };

//   return (
//     <ScrollView contentContainerStyle={styles.container}>
//       <TouchableOpacity onPress={pickImage} style={styles.imageContainer}>
//         {profileImage ? (
//           <Image source={{ uri: profileImage }} style={styles.profileImage} />
//         ) : (
//           <View style={styles.placeholder}>
//             <MaterialIcons name="person" size={48} color="#9ca3af" />
//             <Text style={{ color: "#9ca3af", marginTop: 6 }}>Upload Photo</Text>
//           </View>
//         )}
//       </TouchableOpacity>

//       <TextInput
//         style={styles.input}
//         placeholder="Full Name"
//         value={name}
//         onChangeText={setName}
//       />
//       <TextInput
//         style={styles.input}
//         placeholder="Age"
//         value={age}
//         onChangeText={setAge}
//         keyboardType="numeric"
//       />

//       {/* Gender Dropdown */}
//       <DropDownPicker
//         open={genderOpen}
//         value={gender}
//         items={genderOptions}
//         setOpen={setGenderOpen}
//         setValue={setGender}
//         placeholder="Select Gender"
//         style={styles.dropdown}
//         dropDownContainerStyle={styles.dropdownList}
//         zIndex={3000}
//         zIndexInverse={1000}
//       />

//       {/* Blood Type Dropdown */}
//       <DropDownPicker
//         open={bloodOpen}
//         value={bloodType}
//         items={bloodTypes}
//         setOpen={setBloodOpen}
//         setValue={setBloodType}
//         placeholder="Select Blood Type"
//         style={styles.dropdown}
//         dropDownContainerStyle={styles.dropdownList}
//         zIndex={2000}
//         zIndexInverse={2000}
//       />

//       <TextInput
//         style={styles.input}
//         placeholder="Emergency Contact Name"
//         value={emergencyName}
//         onChangeText={setEmergencyName}
//       />
//       <TextInput
//         style={styles.input}
//         placeholder="Emergency Contact Phone"
//         value={emergencyPhone}
//         onChangeText={setEmergencyPhone}
//         keyboardType="phone-pad"
//       />

//       <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
//         <Text style={styles.saveText}>Save Changes</Text>
//       </TouchableOpacity>
//     </ScrollView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     padding: 20,
//     backgroundColor: "#f0f3fa",
//     flexGrow: 1,
//   },
//   imageContainer: {
//     alignSelf: "center",
//     marginBottom: 20,
//   },
//   profileImage: {
//     width: 120,
//     height: 120,
//     borderRadius: 60,
//   },
//   placeholder: {
//     width: 120,
//     height: 120,
//     borderRadius: 60,
//     backgroundColor: "#e5e7eb",
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   input: {
//     backgroundColor: "#fff",
//     padding: 14,
//     borderRadius: 10,
//     borderColor: "#d1d5db",
//     borderWidth: 1,
//     marginBottom: 16,
//   },
//   dropdown: {
//     backgroundColor: "#fff",
//     borderColor: "#d1d5db",
//     marginBottom: 16,
//   },
//   dropdownList: {
//     borderColor: "#d1d5db",
//   },
//   saveButton: {
//     backgroundColor: "#395886",
//     paddingVertical: 14,
//     borderRadius: 10,
//     alignItems: "center",
//     marginTop: 8,
//   },
//   saveText: {
//     color: "#fff",
//     fontSize: 16,
//     fontWeight: "600",
//   },
// });


// import React, { useState, useEffect } from "react";
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   StyleSheet,
//   Alert,
//   Image,
//   ScrollView,
//   KeyboardAvoidingView,
//   Platform,
// } from "react-native";
// import * as ImagePicker from "expo-image-picker";
// import { MaterialIcons } from "@expo/vector-icons";
// import DropDownPicker from "react-native-dropdown-picker";
// import { useRouter } from "expo-router";
// import { storageUtils } from "@/utils/storage";
// // Make sure UserProfile type includes profileImage
// type UserProfile = {
//   name: string;
//   age: number;
//   gender: "male" | "female" | "other";
//   bloodType: string;
//   allergies: string[];
//   emergencyContact: { name: string; phone: string };
//   chronicConditions: string[];
//   profileImage?: string; // <-- Add this line
// };

// export default function EditProfile() {
//   const router = useRouter();

//   const [profileImage, setProfileImage] = useState<string | null>(null);
//   const [name, setName] = useState("");
//   const [age, setAge] = useState("");
//   const [gender, setGender] = useState<"male" | "female" | "other" | "">("");
//   const [bloodType, setBloodType] = useState("");
//   const [emergencyContactName, setEmergencyContactName] = useState("");
//   const [emergencyContactPhone, setEmergencyContactPhone] = useState("");

//   const [genderOpen, setGenderOpen] = useState(false);
//   const [bloodOpen, setBloodOpen] = useState(false);

//   const genderItems = [
//     { label: "Male", value: "male" },
//     { label: "Female", value: "female" },
//     { label: "Other", value: "other" },
//   ];

//   const bloodItems = [
//     { label: "A+", value: "A+" },
//     { label: "A-", value: "A-" },
//     { label: "B+", value: "B+" },
//     { label: "B-", value: "B-" },
//     { label: "AB+", value: "AB+" },
//     { label: "AB-", value: "AB-" },
//     { label: "O+", value: "O+" },
//     { label: "O-", value: "O-" },
//   ];

//   useEffect(() => {
//     (async () => {
//       const savedProfile = await storageUtils.getUserProfile();
//       if (savedProfile) {
//         setName(savedProfile.name || "");
//         setAge(savedProfile.age?.toString() || "");
//         setGender(savedProfile.gender || "");
//         setBloodType(savedProfile.bloodType || "");
//         setEmergencyContactName(savedProfile.emergencyContact?.name || "");
//         setEmergencyContactPhone(savedProfile.emergencyContact?.phone || "");
//       //  if (savedProfile.profileImage) setProfileImage(savedProfile.profileImage);
//       }
//     })();
//   }, []);

//   const pickImage = async () => {
//     const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
//     if (status !== "granted") {
//       Alert.alert("Permission Denied", "Permission to access gallery is required.");
//       return;
//     }
//     const result = await ImagePicker.launchImageLibraryAsync({
//       mediaTypes: ImagePicker.MediaTypeOptions.Images,
//       allowsEditing: true,
//       aspect: [1, 1],
//       quality: 0.8,
//     });
//     if (!result.canceled) {
//       setProfileImage(result.assets[0].uri);
//     }
//   };

//   const handleSave = async () => {
//     if (!name || !age || !gender || !bloodType || !emergencyContactName || !emergencyContactPhone) {
//       Alert.alert("Incomplete", "Please fill all required fields.");
//       return;
//     }

//     try {
//       await storageUtils.saveUserProfile({
//         name,
//         age: parseInt(age),
//         gender: (gender || "male"),
//         bloodType,
//         allergies: [],
//         emergencyContact: {
//           name: emergencyContactName,
//           phone: emergencyContactPhone,
//         },
//         chronicConditions: [],
//       //  profileImage: profileImage || undefined,
//       });
//       Alert.alert("Success", "Profile updated successfully", [
//         { text: "OK", onPress: () => router.back() },
//       ]);
//     } catch (error) {
//       Alert.alert("Error", "Failed to save profile");
//     }
//   };

//   return (
//     <KeyboardAvoidingView
//       style={{ flex: 1 }}
//       behavior={Platform.OS === "ios" ? "padding" : undefined}
//     >
//       <ScrollView contentContainerStyle={styles.container} nestedScrollEnabled>
//         <TouchableOpacity onPress={pickImage} style={styles.imageContainer}>
//           {profileImage ? (
//             <Image source={{ uri: profileImage }} style={styles.profileImage} />
//           ) : (
//             <View style={styles.placeholder}>
//               <MaterialIcons name="person" size={48} color="#9ca3af" />
//               <Text style={{ color: "#9ca3af", marginTop: 6 }}>Upload Photo</Text>
//             </View>
//           )}
//         </TouchableOpacity>

//         <TextInput
//           style={styles.input}
//           placeholder="Full Name"
//           value={name}
//           onChangeText={setName}
//         />
//         <TextInput
//           style={styles.input}
//           placeholder="Age"
//           value={age}
//           onChangeText={setAge}
//           keyboardType="numeric"
//         />

//         <DropDownPicker
//           open={genderOpen}
//           setOpen={setGenderOpen}
//           value={gender}
//           setValue={setGender}
//           items={genderItems}
//           placeholder="Select Gender"
//           style={styles.dropdown}
//           dropDownContainerStyle={{ borderColor: "#d1d5db" }}
//           zIndex={3000}
//           zIndexInverse={1000}
//         />

//         <DropDownPicker
//           open={bloodOpen}
//           setOpen={setBloodOpen}
//           value={bloodType}
//           setValue={setBloodType}
//           items={bloodItems}
//           placeholder="Select Blood Type"
//           style={styles.dropdown}
//           dropDownContainerStyle={{ borderColor: "#d1d5db" }}
//           zIndex={2000}
//           zIndexInverse={2000}
//         />

//         <TextInput
//           style={styles.input}
//           placeholder="Emergency Contact Name"
//           value={emergencyContactName}
//           onChangeText={setEmergencyContactName}
//         />
//         <TextInput
//           style={styles.input}
//           placeholder="Emergency Contact Phone"
//           value={emergencyContactPhone}
//           onChangeText={setEmergencyContactPhone}
//           keyboardType="phone-pad"
//         />

//         <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
//           <Text style={styles.saveText}>Save Changes</Text>
//         </TouchableOpacity>
//       </ScrollView>
//     </KeyboardAvoidingView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     padding: 20,
//     backgroundColor: "#f0f3fa",
//     flexGrow: 1,
//   },
//   imageContainer: {
//     alignItems: "center",
//     marginBottom: 20,
//   },
//   profileImage: {
//     width: 120,
//     height: 120,
//     borderRadius: 60,
//   },
//   placeholder: {
//     width: 120,
//     height: 120,
//     borderRadius: 60,
//     backgroundColor: "#e5e7eb",
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   input: {
//     backgroundColor: "#fff",
//     padding: 14,
//     borderRadius: 10,
//     borderColor: "#d1d5db",
//     borderWidth: 1,
//     marginBottom: 16,
//   },
//   dropdown: {
//     backgroundColor: "#fff",
//     borderColor: "#d1d5db",
//     marginBottom: 16,
//     borderRadius: 10,
//   },
//   saveButton: {
//     backgroundColor: "#395886",
//     paddingVertical: 14,
//     borderRadius: 10,
//     alignItems: "center",
//     marginTop: 10,
//   },
//   saveText: {
//     color: "#fff",
//     fontSize: 16,
//     fontWeight: "600",
//   },
// });

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  ScrollView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { MaterialIcons } from "@expo/vector-icons";
import DropDownPicker from "react-native-dropdown-picker";
import { useRouter } from "expo-router";
import { storageUtils } from "@/utils/storage";

// Make sure UserProfile type includes profileImage
type UserProfile = {
  name: string;
  age: number;
  gender: "male" | "female" | "other";
  bloodType: string;
  allergies: string[];
  emergencyContact: { name: string; phone: string };
  chronicConditions: string[];
  profileImage?: string;
};

export default function EditProfile() {
  const router = useRouter();

  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "other" | "">("");
  const [bloodType, setBloodType] = useState("");
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");

  const [genderOpen, setGenderOpen] = useState(false);
  const [bloodOpen, setBloodOpen] = useState(false);

  // Focus states for styling
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const genderItems = [
    { label: "Male", value: "male" },
    { label: "Female", value: "female" },
    { label: "Other", value: "other" },
  ];

  const bloodItems = [
    { label: "A+", value: "A+" },
    { label: "A-", value: "A-" },
    { label: "B+", value: "B+" },
    { label: "B-", value: "B-" },
    { label: "AB+", value: "AB+" },
    { label: "AB-", value: "AB-" },
    { label: "O+", value: "O+" },
    { label: "O-", value: "O-" },
  ];

  useEffect(() => {
    (async () => {
      const savedProfile = await storageUtils.getUserProfile();
      if (savedProfile) {
        setName(savedProfile.name || "");
        setAge(savedProfile.age?.toString() || "");
        setGender(savedProfile.gender || "");
        setBloodType(savedProfile.bloodType || "");
        setEmergencyContactName(savedProfile.emergencyContact?.name || "");
        setEmergencyContactPhone(savedProfile.emergencyContact?.phone || "");
      //  if (savedProfile.profileImage) setProfileImage(savedProfile.profileImage);
      }
    })();
  }, []);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Denied", "Permission to access gallery is required.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!name || !age || !gender || !bloodType || !emergencyContactName || !emergencyContactPhone) {
      Alert.alert("Incomplete", "Please fill all required fields.");
      return;
    }

    try {
      await storageUtils.saveUserProfile({
        name,
        age: parseInt(age),
        gender: (gender || "male"),
        bloodType,
        allergies: [],
        emergencyContact: {
          name: emergencyContactName,
          phone: emergencyContactPhone,
        },
        chronicConditions: [],
        //profileImage: profileImage || undefined,
      });
      Alert.alert("Success", "Profile updated successfully", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert("Error", "Failed to save profile");
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" translucent={false} />
      <SafeAreaView style={styles.safeArea}>
        {/* Custom Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <View style={styles.headerRight} />
        </View>

        <KeyboardAvoidingView
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
        >
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.content}>
            {/* Profile Image Section */}
            <View style={styles.imageSection}>
              <TouchableOpacity onPress={pickImage} style={styles.imageContainer}>
                {profileImage ? (
                  <Image source={{ uri: profileImage }} style={styles.profileImage} />
                ) : (
                  <View style={styles.placeholder}>
                    <MaterialIcons name="person" size={48} color="#9ca3af" />
                  </View>
                )}
                <View style={styles.editIconContainer}>
                  <MaterialIcons name="edit" size={16} color="#fff" />
                </View>
              </TouchableOpacity>
              <Text style={styles.uploadText}>Tap to change photo</Text>
            </View>

            {/* Form Section */}
            <View style={styles.formSection}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                  style={[
                    styles.input,
                    focusedField === 'name' && styles.inputFocused
                  ]}
                  placeholder="Enter your full name"
                  value={name}
                  onChangeText={setName}
                  onFocus={() => setFocusedField('name')}
                  onBlur={() => setFocusedField(null)}
                  placeholderTextColor="#9ca3af"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Age</Text>
                <TextInput
                  style={[
                    styles.input,
                    focusedField === 'age' && styles.inputFocused
                  ]}
                  placeholder="Enter your age"
                  value={age}
                  onChangeText={setAge}
                  keyboardType="numeric"
                  onFocus={() => setFocusedField('age')}
                  onBlur={() => setFocusedField(null)}
                  placeholderTextColor="#9ca3af"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Gender</Text>
                <DropDownPicker
                  open={genderOpen}
                  setOpen={setGenderOpen}
                  value={gender}
                  setValue={setGender}
                  items={genderItems}
                  placeholder="Select your gender"
                  style={styles.dropdown}
                  dropDownContainerStyle={styles.dropdownContainer}
                  textStyle={styles.dropdownText}
                  placeholderStyle={styles.dropdownPlaceholder}
                  zIndex={3000}
                  zIndexInverse={1000}
                  listMode="SCROLLVIEW"
                  scrollViewProps={{
                    nestedScrollEnabled: true,
                  }}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Blood Type</Text>
                <DropDownPicker
                  open={bloodOpen}
                  setOpen={setBloodOpen}
                  value={bloodType}
                  setValue={setBloodType}
                  items={bloodItems}
                  placeholder="Select your blood type"
                  style={styles.dropdown}
                  dropDownContainerStyle={styles.dropdownContainer}
                  textStyle={styles.dropdownText}
                  placeholderStyle={styles.dropdownPlaceholder}
                  zIndex={2000}
                  zIndexInverse={2000}
                  listMode="SCROLLVIEW"
                  scrollViewProps={{
                    nestedScrollEnabled: true,
                  }}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Emergency Contact Name</Text>
                <TextInput
                  style={[
                    styles.input,
                    focusedField === 'emergencyName' && styles.inputFocused
                  ]}
                  placeholder="Enter emergency contact name"
                  value={emergencyContactName}
                  onChangeText={setEmergencyContactName}
                  onFocus={() => setFocusedField('emergencyName')}
                  onBlur={() => setFocusedField(null)}
                  placeholderTextColor="#9ca3af"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Emergency Contact Phone</Text>
                <TextInput
                  style={[
                    styles.input,
                    focusedField === 'emergencyPhone' && styles.inputFocused
                  ]}
                  placeholder="Enter emergency contact phone"
                  value={emergencyContactPhone}
                  onChangeText={setEmergencyContactPhone}
                  keyboardType="phone-pad"
                  onFocus={() => setFocusedField('emergencyPhone')}
                  onBlur={() => setFocusedField(null)}
                  placeholderTextColor="#9ca3af"
                />
              </View>

              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  safeArea: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    paddingTop: Platform.OS === 'android' ? 20 : 15,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
  },
  headerRight: {
    width: 34, // Same width as back button for centering
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  imageSection: {
    alignItems: "center",
    paddingVertical: 30,
    backgroundColor: "#ffffff",
    marginBottom: 20,
  },
  imageContainer: {
    position: "relative",
    marginBottom: 10,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: "#e5e7eb",
  },
  placeholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#e5e7eb",
    borderStyle: "dashed",
  },
  editIconContainer: {
    position: "absolute",
    bottom: 5,
    right: 5,
    backgroundColor: "#395886",
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#ffffff",
  },
  uploadText: {
    color: "#6b7280",
    fontSize: 14,
    marginTop: 5,
  },
  formSection: {
    paddingHorizontal: 20,
    paddingBottom: 50,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#ffffff",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    fontSize: 16,
    color: "#374151",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    height: 48,
  },
  inputFocused: {
    borderColor: "#395886",
    borderWidth: 2,
    shadowColor: "#395886",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  dropdown: {
    backgroundColor: "#ffffff",
    borderColor: "#e5e7eb",
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  dropdownContainer: {
    backgroundColor: "#ffffff",
    borderColor: "#e5e7eb",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dropdownText: {
    fontSize: 16,
    color: "#374151",
  },
  dropdownPlaceholder: {
    fontSize: 16,
    color: "#9ca3af",
  },
  saveButton: {
    backgroundColor: "#395886",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
    shadowColor: "#395886",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  saveText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});