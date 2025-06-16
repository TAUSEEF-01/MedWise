import React, { useState, useEffect } from "react";
import {
  ScrollView,
  TextInput,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

import { Text, View } from "@/components/Themed";
import { Disease } from "@/types/medical";
import '../../global.css';

const sampleDiseases: Disease[] = [
  {
    id: "1",
    name: "Hypertension",
    description:
      "High blood pressure is a common condition where blood flows through blood vessels with more force than normal.",
    symptoms: ["Headaches", "Shortness of breath", "Nosebleeds", "Chest pain"],
    causes: ["Poor diet", "Lack of exercise", "Stress", "Genetics"],
    treatments: [
      "Lifestyle changes",
      "Blood pressure medications",
      "Regular monitoring",
    ],
    severity: "medium",
    category: "Cardiovascular",
  },
  {
    id: "2",
    name: "Type 2 Diabetes",
    description:
      "A chronic condition that affects how your body processes blood sugar (glucose).",
    symptoms: [
      "Increased thirst",
      "Frequent urination",
      "Increased hunger",
      "Fatigue",
      "Blurred vision",
    ],
    causes: [
      "Insulin resistance",
      "Genetics",
      "Obesity",
      "Sedentary lifestyle",
    ],
    treatments: [
      "Diet modification",
      "Exercise",
      "Medications",
      "Blood sugar monitoring",
    ],
    severity: "high",
    category: "Endocrine",
  },
  {
    id: "3",
    name: "Common Cold",
    description:
      "A viral infection of your nose and throat (upper respiratory tract).",
    symptoms: [
      "Runny nose",
      "Sore throat",
      "Cough",
      "Congestion",
      "Body aches",
    ],
    causes: [
      "Viral infection",
      "Weakened immune system",
      "Close contact with infected person",
    ],
    treatments: [
      "Rest",
      "Fluids",
      "Over-the-counter medications",
      "Throat lozenges",
    ],
    severity: "low",
    category: "Respiratory",
  },
  {
    id: "4",
    name: "Migraine",
    description:
      "A neurological condition characterized by intense, debilitating headaches.",
    symptoms: ["Severe headache", "Nausea", "Sensitivity to light", "Visual disturbances"],
    causes: ["Genetics", "Hormonal changes", "Stress", "Certain foods"],
    treatments: ["Pain medications", "Preventive medications", "Lifestyle changes", "Rest"],
    severity: "medium",
    category: "Neurological",
  },
  {
    id: "5",
    name: "Gastroesophageal Reflux Disease (GERD)",
    description:
      "A digestive disorder where stomach acid frequently flows back into the esophagus.",
    symptoms: ["Heartburn", "Chest pain", "Difficulty swallowing", "Regurgitation"],
    causes: ["Hiatal hernia", "Obesity", "Pregnancy", "Certain foods"],
    treatments: ["Antacids", "Lifestyle changes", "H2 blockers", "Proton pump inhibitors"],
    severity: "medium",
    category: "Digestive",
  },
];

export default function DiseasesScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredDiseases, setFilteredDiseases] = useState<Disease[]>(sampleDiseases);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const categories = [
    "All",
    "Cardiovascular",
    "Respiratory",
    "Endocrine",
    "Neurological",
    "Digestive",
  ];

  useEffect(() => {
    filterDiseases();
  }, [searchQuery, selectedCategory]);

  const filterDiseases = () => {
    let filtered = sampleDiseases;

    if (selectedCategory !== "All") {
      filtered = filtered.filter(
        (disease) => disease.category === selectedCategory
      );
    }

    if (searchQuery) {
      filtered = filtered.filter(
        (disease) =>
          disease.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          disease.symptoms.some((symptom) =>
            symptom.toLowerCase().includes(searchQuery.toLowerCase())
          )
      );
    }

    setFilteredDiseases(filtered);
  };

  const getSeverityColor = (severity: Disease["severity"]) => {
    switch (severity) {
      case "low":
        return "bg-green-500";
      case "medium":
        return "bg-yellow-500";
      case "high":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getSeverityIcon = (severity: Disease["severity"]) => {
    switch (severity) {
      case "low":
        return "info";
      case "medium":
        return "warning";
      case "high":
        return "error";
      default:
        return "info";
    }
  };

  const renderDiseaseCard = ({ item }: { item: Disease }) => (
    <TouchableOpacity className="bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-100">
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-1">
          <Text className="text-lg font-semibold text-gray-900 mb-1">{item.name}</Text>
          <Text className="text-xs text-gray-500 uppercase tracking-wider">{item.category}</Text>
        </View>
        <View className={`w-7 h-7 rounded-full items-center justify-center ${getSeverityColor(item.severity)}`}>
          <MaterialIcons
            name={getSeverityIcon(item.severity)}
            size={16}
            color="white"
          />
        </View>
      </View>

      <Text className="text-sm text-gray-700 leading-5 mb-3" numberOfLines={2}>
        {item.description}
      </Text>

      <View>
        <Text className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wider">
          Common Symptoms:
        </Text>
        <View className="flex-row flex-wrap">
          {item.symptoms.slice(0, 3).map((symptom, index) => (
            <View key={index} className="bg-blue-50 px-2 py-1 rounded-lg mr-2 mb-1">
              <Text className="text-xs text-blue-700 font-medium">{symptom}</Text>
            </View>
          ))}
          {item.symptoms.length > 3 && (
            <Text className="text-xs text-gray-500 italic self-center">
              +{item.symptoms.length - 3} more
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-gray-50">
      {/* Search Section */}
      <View className="bg-white p-4 border-b border-gray-200">
        <View className="flex-row items-center bg-gray-100 rounded-xl px-3">
          <MaterialIcons name="search" size={20} color="#9ca3af" />
          <TextInput
            className="flex-1 py-3 px-2 text-base"
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search diseases or symptoms..."
            placeholderTextColor="#9ca3af"
          />
        </View>
      </View>

      {/* Categories Section */}
      <View className="bg-white border-b border-gray-200">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12 }}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              onPress={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full mr-2 border ${
                selectedCategory === category
                  ? "bg-blue-600 border-blue-600"
                  : "bg-gray-100 border-gray-300"
              }`}
            >
              <Text
                className={`text-sm font-medium ${
                  selectedCategory === category ? "text-white" : "text-gray-700"
                }`}
              >
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Results Header */}
      <View className="bg-white px-4 py-2 border-b border-gray-200">
        <Text className="text-sm text-gray-600">
          {filteredDiseases.length} {filteredDiseases.length === 1 ? 'result' : 'results'} found
        </Text>
      </View>

      {/* Diseases List */}
      <FlatList
        data={filteredDiseases}
        renderItem={renderDiseaseCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <MaterialIcons name="search-off" size={48} color="#9ca3af" />
            <Text className="text-gray-500 text-lg font-medium mt-4">No diseases found</Text>
            <Text className="text-gray-400 text-center mt-2 px-8">
              Try adjusting your search terms or category filter
            </Text>
          </View>
        }
      />
    </View>
  );
}