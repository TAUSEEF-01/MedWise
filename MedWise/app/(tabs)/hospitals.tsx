import React, { useState } from "react";
import {
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Linking,
  StatusBar,
  Platform,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Text, View } from "react-native";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/components/useColorScheme";
import { Hospital } from "@/types/medical";

const sampleHospitals: Hospital[] = [
  {
    id: "1",
    name: "Square Hospitals Ltd.",
    address: "18/F Bir Uttam Qazi Nuruzzaman Sarak, West Panthapath, Dhaka 1205",
    specialties: ["Cardiology", "Oncology", "Neurology", "Emergency Care"],
    website: "https://www.squarehospital.com",
  },
  {
    id: "2",
    name: "United Hospital",
    address: "Plot 15, Road 71, Gulshan, Dhaka 1212",
    specialties: ["Surgery", "Cardiology", "Orthopedics", "Diabetology"],
    website: "https://www.uhlbd.com",
  },
  {
    id: "3",
    name: "Popular Diagnostic Center",
    address: "House #16, Road #2, Dhanmondi, Dhaka-1205",
    specialties: ["Diagnostic", "Medicine", "Urology", "Dermatology"],
    website: "https://www.populardiagnostic.com",
  },
  {
    id: "4",
    name: "Ibn Sina Hospital",
    address: "1/1-B, Kallyanpur, Mirpur Road, Dhaka 1207",
    specialties: ["Medicine", "Gynecology", "Surgery", "ENT"],
    website: "https://www.ibnsinatrust.com",
  },
  {
    id: "5",
    name: "Dhaka Medical College Hospital",
    address: "Secretariat Road, Shahbagh, Dhaka 1000",
    specialties: ["Emergency Care", "General Hospital", "Surgery", "Medicine"],
    website: "https://www.dmch.gov.bd",
  },
  {
    id: "6",
    name: "Labaid Specialized Hospital",
    address: "House 06, Road 04, Dhanmondi, Dhaka-1205",
    specialties: ["Cardiology", "Pediatrics", "Neurology", "Orthopedics"],
    website: "https://www.labaidgroup.com",
  },
  {
    id: "7",
    name: "Bangabandhu Sheikh Mujib Medical University (BSMMU)",
    address: "Shahbagh, Dhaka-1000",
    specialties: ["General Hospital", "Surgery", "Medicine", "Oncology"],
    website: "https://bsmmu.ac.bd",
  },
  {
    id: "8",
    name: "Evercare Hospital Dhaka",
    address: "Plot 81, Block E, Bashundhara R/A, Dhaka 1229",
    specialties: ["Cardiology", "Oncology", "Nephrology", "Surgery"],
    website: "https://www.evercarebd.com",
  },
  {
    id: "9",
    name: "City Hospital Ltd.",
    address: "Dhaka Udyan, Mohammadpur, Dhaka",
    specialties: ["Emergency Care", "Medicine", "Surgery"],
    website: "https://www.cityhospitalbd.com",
  },
  {
    id: "10",
    name: "BRB Hospital",
    address: "Panchlaish, Chattogram",
    specialties: ["Cardiology", "Pediatrics", "Medicine", "Neurology"],
    website: "https://www.brbhospital.com",
  },
  {
    id: "11",
    name: "Asgar Ali Hospital",
    address: "Gandaria, Dhaka",
    specialties: ["Cardiology", "Dermatology", "Surgery", "Oncology"],
    website: "https://www.asgaralihospital.com",
  },
  {
    id: "12",
    name: "Medinova Medical Services Ltd.",
    address: "Dhanmondi, Dhaka",
    specialties: ["Diagnostic", "Gynecology", "Medicine"],
    website: "https://www.medinova.com.bd",
  },
  {
    id: "13",
    name: "Anwer Khan Modern Hospital",
    address: "Dhanmondi, Dhaka",
    specialties: ["Emergency Care", "Orthopedics", "ENT", "Medicine"],
    website: "https://www.anwerkhanmodern.com",
  },
  {
    id: "14",
    name: "Shahid Monsur Ali Medical College",
    address: "Uttara, Dhaka",
    specialties: ["General Hospital", "Gynecology", "Neurology", "Cardiology"],
    website: "https://www.shamc.edu.bd",
  },
  {
    id: "15",
    name: "Ad-Din Women's Medical College Hospital",
    address: "Moghbazar, Dhaka",
    specialties: ["Gynecology", "Medicine", "Pediatrics"],
    website: "https://www.addinwmch.com",
  },
  {
    id: "16",
    name: "Islami Bank Hospital",
    address: "Kakrail, Dhaka",
    specialties: ["Orthopedics", "Cardiology", "Surgery"],
    website: "https://www.islamibankhospital.com",
  },
  {
    id: "17",
    name: "National Institute of Cardiovascular Diseases",
    address: "Sher-e-Bangla Nagar, Dhaka",
    specialties: ["Cardiology", "Emergency Care", "Medicine"],
    website: "https://www.nicvd.gov.bd",
  },
  {
    id: "18",
    name: "National Institute of Neurosciences & Hospital",
    address: "Sher-e-Bangla Nagar, Dhaka",
    specialties: ["Neurology", "Surgery", "Emergency Care"],
    website: "https://www.nins.gov.bd",
  },
  {
    id: "19",
    name: "Birdem General Hospital",
    address: "Shahbagh, Dhaka",
    specialties: ["Diabetology", "Medicine", "Surgery"],
    website: "https://birdembd.org",
  },
  {
    id: "20",
    name: "Holy Family Red Crescent Medical College Hospital",
    address: "Eskaton, Dhaka",
    specialties: ["General Hospital", "Pediatrics", "Gynecology", "Medicine"],
    website: "https://www.hfrcmch.edu.bd",
  },
];

export default function HospitalsScreen() {
  const colorScheme = useColorScheme();
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>("All");

  const specialties = [
    "All",
    "General Hospital",
    "Emergency Care",
    "Cardiology",
    "Pediatrics",
    "Neurology",
    "Orthopedics",
    "Gynecology",
    "Dermatology",
    "Oncology",
    "ENT",
    "Urology",
    "Surgery",
    "Diabetology",
    "Medicine",
  ];

  const filteredHospitals =
    selectedSpecialty === "All"
      ? sampleHospitals
      : sampleHospitals.filter((hospital) =>
          hospital.specialties.includes(selectedSpecialty)
        );

  const handleWebsite = (website?: string) => {
    if (website) {
      Linking.openURL(website);
    }
  };

  const handleDirections = (address: string) => {
    const query = encodeURIComponent(address);
    Linking.openURL(`https://maps.google.com/?q=${query}`);
  };

  const renderHospitalCard = ({ item }: { item: Hospital }) => (
    <View style={styles.hospitalCard}>
      <View style={styles.hospitalHeader}>
        <Text style={styles.hospitalName}>{item.name}</Text>
      </View>

      <View style={styles.addressContainer}>
        <MaterialIcons
          name="location-on"
          size={16}
          color="#fbbf24"
        />
        <Text style={styles.addressText}>{item.address}</Text>
      </View>

      <View style={styles.specialtiesContainer}>
        <Text style={styles.specialtiesTitle}>Specialties:</Text>
        <View style={styles.specialtiesRow}>
          {item.specialties.map((specialty, index) => (
            <View key={index} style={styles.specialtyTag}>
              <Text style={styles.specialtyText}>{specialty}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={() => handleDirections(item.address)}
        >
          <MaterialIcons
            name="directions"
            size={18}
            color={Colors[colorScheme ?? "light"].primary}
          />
          <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>
            Directions
          </Text>
        </TouchableOpacity>

        {item.website && (
          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={() => handleWebsite(item.website)}
          >
            <MaterialIcons
              name="language"
              size={18}
              color={Colors[colorScheme ?? "light"].primary}
            />
            <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>
              Website
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#f0f3fa" />
      <View
        style={{
          height: Platform.OS === "android" ? StatusBar.currentHeight : 0,
          backgroundColor: "#f0f3fa",
        }}
      />
      <View style={styles.container}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScrollView}
          contentContainerStyle={styles.specialtiesContent}
        >
          {specialties.map((specialty) => (
            <TouchableOpacity
              key={specialty}
              style={[
                styles.specialtyButton,
                selectedSpecialty === specialty &&
                  styles.selectedSpecialtyButton,
              ]}
              onPress={() => setSelectedSpecialty(specialty)}
            >
              <Text
                style={[
                  styles.specialtyButtonText,
                  selectedSpecialty === specialty &&
                    styles.selectedSpecialtyButtonText,
                ]}
              >
                {specialty}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <FlatList
          data={filteredHospitals}
          renderItem={renderHospitalCard}
          keyExtractor={(item) => item.id}
          style={styles.hospitalsList}
          contentContainerStyle={styles.hospitalsContent}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f3fa",
  },
  filterScrollView: {
    maxHeight: 48, // Reduced height to make buttons more compact
  },
  specialtiesContent: {
    paddingHorizontal: 12, // Slightly reduced horizontal padding
    paddingVertical: 8, // Reduced vertical padding for tighter spacing
  },
  specialtyButton: {
    paddingHorizontal: 14, // Slightly reduced padding for buttons
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
    marginRight: 6, // Reduced margin for tighter button spacing
    borderWidth: 1,
    borderColor: "#d1d5db",
    justifyContent: "center",
    alignItems: "center",
    minHeight: 36, // Slightly smaller button height
  },
  selectedSpecialtyButton: {
    backgroundColor: "#395886",
  },
  specialtyButtonText: {
    fontSize: 13, // Slightly smaller font size
    color: "#000",
    fontWeight: "500",
  },
  selectedSpecialtyButtonText: {
    color: "#ffffff",
  },
  hospitalsList: {
    flex: 1,
  },
  hospitalsContent: {
    paddingHorizontal: 12, // Reduced padding for consistency
    paddingTop: 8, // Reduced top padding to minimize gap after buttons
    paddingBottom: 16, // Kept bottom padding for scroll comfort
  },
  hospitalCard: {
    backgroundColor: "#d5deef",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#395886",
    padding: 14, // Slightly reduced padding for compact cards
    marginBottom: 12, // Reduced margin for tighter card spacing
  },
  hospitalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10, // Slightly reduced margin
  },
  hospitalName: {
    fontSize: 17, // Slightly smaller font size
    fontWeight: "600",
    marginBottom: 4,
    color: "#1e293b",
    flex: 1,
  },
  addressContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10, // Slightly reduced margin
  },
  addressText: {
    fontSize: 13, // Slightly smaller font size
    color: "#334155",
    marginLeft: 4,
    flex: 1,
  },
  specialtiesContainer: {
    marginBottom: 10, // Slightly reduced margin
  },
  specialtiesTitle: {
    fontSize: 11, // Slightly smaller font size
    fontWeight: "600",
    color: "#334155",
    marginBottom: 6, // Reduced margin
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  specialtiesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  specialtyTag: {
    backgroundColor: "#bfd2f6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  specialtyText: {
    fontSize: 11, // Slightly smaller font size
    color: "#1d4ed8",
    fontWeight: "500",
  },
  actionsContainer: {
    flexDirection: "row",
    marginTop: 12, // Reduced margin
    gap: 8,
    justifyContent: "flex-start",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#2563eb",
    paddingHorizontal: 10, // Slightly reduced padding
    paddingVertical: 5, // Slightly reduced padding
    borderRadius: 8,
    marginRight: 10, // Slightly reduced margin
  },
  actionButtonText: {
    color: "#2563eb",
    fontSize: 13, // Slightly smaller font size
    fontWeight: "500",
    marginLeft: 5, // Slightly reduced margin
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderColor: '#2563eb',
  },
  secondaryButtonText: {
    color: '#2563eb',
  },
});