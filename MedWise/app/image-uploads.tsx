import React, { useEffect, useState } from "react";
import {
  ScrollView,
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

const BACKEND_URL = "http://192.168.50.242:8000/api/images/all";

export default function ImageUploadsScreen() {
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      const res = await fetch(BACKEND_URL);
      const data = await res.json();

      console.log("Fetched images:", data);

      setImages(data.images || []);
    } catch (err) {
      setImages([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-gray-50 p-4">
      <Text className="text-2xl font-bold mb-4 text-blue-700">
        Image Uploads
      </Text>
      {loading ? (
        <View className="items-center justify-center py-20">
          <ActivityIndicator size="large" color="#2563eb" />
          <Text className="text-gray-600 mt-4">Loading image uploads...</Text>
        </View>
      ) : images.length === 0 ? (
        <View className="items-center justify-center py-20">
          <MaterialIcons name="image-not-supported" size={48} color="#9ca3af" />
          <Text className="text-gray-600 mt-4">No image uploads found.</Text>
        </View>
      ) : (
        images.map((img, idx) => (
          <View
            key={img._id || idx}
            className="bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-100"
          >
            <View className="flex-row items-center mb-2">
              <MaterialIcons name="image" size={24} color="#2563eb" />
              <Text className="ml-2 font-semibold text-gray-900">
                {img.original_filename}
              </Text>
            </View>
            <Text className="text-xs text-gray-500 mb-1">
              Image ID: {img.image_id}
            </Text>
            <Text className="text-xs text-gray-500 mb-1">
              User ID: {img.user_id}
            </Text>
            <Text className="text-xs text-gray-500 mb-1">
              Status: {img.status}
            </Text>
            <Text className="text-xs text-gray-500 mb-1">
              Uploaded At: {img.uploaded_at}
            </Text>
            {img.completed_at && (
              <Text className="text-xs text-gray-500 mb-1">
                Completed At: {img.completed_at}
              </Text>
            )}
            {img.error_message && (
              <Text className="text-xs text-red-500 mb-1">
                Error: {img.error_message}
              </Text>
            )}
            {img.analysis_result && (
              <TouchableOpacity
                className="mt-2 bg-blue-100 px-3 py-2 rounded-lg"
                onPress={() => {
                  alert(JSON.stringify(img.analysis_result, null, 2));
                }}
              >
                <Text className="text-blue-700 text-xs font-semibold">
                  View Analysis Result
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ))
      )}
    </ScrollView>
  );
}
