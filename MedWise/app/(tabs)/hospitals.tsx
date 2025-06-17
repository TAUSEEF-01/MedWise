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
    name: "City General Hospital",
    address: "123 Main Street, Downtown",
    phone: "+1 (555) 123-4567",
    specialties: ["Emergency Care", "Cardiology", "Orthopedics", "Neurology"],
    rating: 4.5,
    distance: 2.3,
    website: "https://citygeneral.com",
  },
  {
    id: "2",
    name: "St. Mary's Medical Center",
    address: "456 Oak Avenue, Midtown",
    phone: "+1 (555) 987-6543",
    specialties: ["Pediatrics", "Maternity", "Oncology", "Surgery"],
    rating: 4.8,
    distance: 3.7,
    website: "https://stmarysmedical.com",
  },
  {
    id: "3",
    name: "Metro Urgent Care",
    address: "789 Pine Road, Westside",
    phone: "+1 (555) 456-7890",
    specialties: ["Urgent Care", "Family Medicine", "Minor Surgery"],
    rating: 4.2,
    distance: 1.8,
  },
];

export default function HospitalsScreen() {
  const colorScheme = useColorScheme();
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>("All");

  const specialties = [
    "All",
    "Emergency Care",
    "Cardiology",
    "Pediatrics",
    "Orthopedics",
    "Neurology",
    "Oncology",
  ];

  const filteredHospitals =
    selectedSpecialty === "All"
      ? sampleHospitals
      : sampleHospitals.filter((hospital) =>
          hospital.specialties.includes(selectedSpecialty)
        );

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleWebsite = (website?: string) => {
    if (website) {
      Linking.openURL(website);
    }
  };

  const handleDirections = (address: string) => {
    const query = encodeURIComponent(address);
    Linking.openURL(`https://maps.google.com/?q=${query}`);
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <MaterialIcons key={i} name="star" size={16} color="#fbbf24" />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <MaterialIcons key="half" name="star-half" size={16} color="#fbbf24" />
      );
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <MaterialIcons
          key={`empty-${i}`}
          name="star-border"
          size={16}
          color="#d1d5db"
        />
      );
    }

    return stars;
  };

  const renderHospitalCard = ({ item }: { item: Hospital }) => (
    <View style={styles.hospitalCard}>
      <View style={styles.hospitalHeader}>
        <View style={styles.hospitalInfo}>
          <Text style={styles.hospitalName}>{item.name}</Text>
          <View style={styles.ratingContainer}>
            <View style={styles.starsContainer}>{renderStars(item.rating)}</View>
            <Text style={styles.ratingText}>{item.rating}</Text>
            {item.distance && (
              <Text style={styles.distanceText}>• {item.distance} km away</Text>
            )}
          </View>
        </View>
        <MaterialIcons
          name="local-hospital"
          size={32}
          color={Colors[colorScheme ?? "light"].primary}
        />
      </View>

      <View style={styles.addressContainer}>
        <MaterialIcons
          name="location-on"
          size={16}
          color={Colors[colorScheme ?? "light"].tabIconDefault}
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
          style={styles.actionButton}
          onPress={() => handleCall(item.phone)}
        >
          <MaterialIcons name="phone" size={18} color="white" />
          <Text style={styles.actionButtonText}>Call</Text>
        </TouchableOpacity>

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
    maxHeight: 64, // Increased to accommodate text properly
    marginBottom: 8, // Add small margin between filter and hospital list
  },
  specialtiesContent: {

    paddingHorizontal: 16,
    paddingVertical: 12, // Keep compact but ensure text is visible
  },
  specialtyButton: {
    paddingHorizontal: 16, // Restored padding for text visibility
    paddingVertical: 8, // Restored padding for text visibility
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#d1d5db",
    justifyContent: 'center', // Center text vertically
    alignItems: 'center', // Center text horizontally
    minHeight: 40, // Ensure minimum height for text
  },
  selectedSpecialtyButton: {
    backgroundColor: "#395886",
  },
  specialtyButtonText: {
    fontSize: 14,
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
    padding: 16,
  },
  hospitalCard: {
    backgroundColor: "#d5deef",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#395886",
    padding: 16,
    marginBottom: 16,
  },
  hospitalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  hospitalInfo: {
    flex: 1,
  },
  hospitalName: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
    color: "#1e293b",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  starsContainer: {
    flexDirection: "row",
    marginRight: 6,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#334155",
  },
  distanceText: {
    fontSize: 14,
    color: "#334155",
    marginLeft: 4,
  },
  addressContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  addressText: {
    fontSize: 14,
    color: "#334155",
    marginLeft: 4,
    flex: 1,
  },
  specialtiesContainer: {
    marginBottom: 12,
  },
  specialtiesTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 8,
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
    fontSize: 12,
    color: "#1d4ed8",
    fontWeight: "500",
  },
  actionsContainer: {
    flexDirection: "row",
    marginTop: 16,
    gap: 8,
    justifyContent: "space-between",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2563eb",
    paddingHorizontal: 5,
    paddingVertical: 5,
    borderRadius: 8,
    flex: 1,
    minWidth: 105,
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#2563eb",
  },
  actionButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 4,
  },
  secondaryButtonText: {
    color: "#2563eb",
  },
});