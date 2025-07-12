import React, { useEffect, useState } from "react";
import {
  ScrollView,
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const BACKEND_URL = "http://192.168.50.242:8000/api/images/all";

export default function ImageUploadsScreen() {
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

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

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchImages();
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "#10b981";
      case "failed":
        return "#ef4444";
      case "processing":
        return "#f59e0b";
      default:
        return "#6b7280";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return "check-circle";
      case "failed":
        return "error";
      case "processing":
        return "hourglass-empty";
      default:
        return "help";
    }
  };

  return (
    <View className="flex-1" style={{ backgroundColor: "#f0f3fa" }}>
      {/* Header */}
      <View
        className="px-6 pt-12 pb-6"
        style={{
          backgroundColor: "#395886",
          borderBottomLeftRadius: 24,
          borderBottomRightRadius: 24,
        }}
      >
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-xl items-center justify-center"
            style={{ backgroundColor: "rgba(255, 255, 255, 0.2)" }}
          >
            <MaterialIcons name="arrow-back" size={20} color="white" />
          </TouchableOpacity>
          <View className="flex-1 ml-4">
            <Text className="text-2xl font-bold text-white">Image Uploads</Text>
            <Text className="text-white/80 text-sm">
              {images.length} {images.length === 1 ? "record" : "records"} found
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ paddingTop: 20, paddingBottom: 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <View className="items-center justify-center py-20">
            <View
              className="w-16 h-16 rounded-full items-center justify-center mb-4"
              style={{ backgroundColor: "#d5deef" }}
            >
              <ActivityIndicator size="large" color="#395886" />
            </View>
            <Text className="text-gray-600 text-lg font-medium">
              Loading uploads...
            </Text>
          </View>
        ) : images.length === 0 ? (
          <View className="items-center justify-center py-20">
            <View
              className="w-20 h-20 rounded-full items-center justify-center mb-6"
              style={{ backgroundColor: "#d5deef" }}
            >
              <MaterialIcons name="cloud-upload" size={40} color="#395886" />
            </View>
            <Text className="text-xl font-bold text-gray-900 mb-2">
              No Uploads Yet
            </Text>
            <Text className="text-gray-600 text-center px-8">
              Your uploaded medical images will appear here
            </Text>
          </View>
        ) : (
          images.map((img, idx) => (
            <View
              key={img._id || idx}
              className="mb-4 rounded-2xl overflow-hidden"
              style={{
                backgroundColor: "#ffffff",
                shadowColor: "#395886",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.08,
                shadowRadius: 12,
                elevation: 4,
                borderWidth: 1,
                borderColor: "#e2e8f0",
              }}
            >
              {/* Card Header */}
              <View
                className="px-4 py-3"
                style={{
                  backgroundColor: "#f8fafc",
                  borderBottomWidth: 1,
                  borderBottomColor: "#e2e8f0",
                }}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center flex-1">
                    <View
                      className="w-10 h-10 rounded-xl items-center justify-center mr-3"
                      style={{ backgroundColor: "#d5deef" }}
                    >
                      <MaterialIcons name="image" size={20} color="#395886" />
                    </View>
                    <Text
                      className="font-bold text-gray-900 flex-1"
                      numberOfLines={1}
                      style={{ fontSize: 16 }}
                    >
                      {img.original_filename}
                    </Text>
                  </View>
                  <View
                    className="px-3 py-1 rounded-full flex-row items-center"
                    style={{
                      backgroundColor: `${getStatusColor(img.status)}15`,
                    }}
                  >
                    <MaterialIcons
                      name={getStatusIcon(img.status)}
                      size={14}
                      color={getStatusColor(img.status)}
                    />
                    <Text
                      className="ml-1 font-semibold text-xs"
                      style={{ color: getStatusColor(img.status) }}
                    >
                      {img.status.toUpperCase()}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Card Content */}
              <View className="p-4">
                <View className="space-y-2">
                  <View className="flex-row items-center">
                    <MaterialIcons
                      name="fingerprint"
                      size={16}
                      color="#6b7280"
                    />
                    <Text className="text-gray-600 text-sm ml-2">
                      ID: {img.image_id?.substring(0, 12)}...
                    </Text>
                  </View>

                  <View className="flex-row items-center">
                    <MaterialIcons
                      name="access-time"
                      size={16}
                      color="#6b7280"
                    />
                    <Text className="text-gray-600 text-sm ml-2">
                      {formatDate(img.uploaded_at)}
                    </Text>
                  </View>

                  {img.completed_at && (
                    <View className="flex-row items-center">
                      <MaterialIcons name="done" size={16} color="#10b981" />
                      <Text className="text-gray-600 text-sm ml-2">
                        Completed: {formatDate(img.completed_at)}
                      </Text>
                    </View>
                  )}

                  {img.error_message && (
                    <View className="flex-row items-start mt-2">
                      <MaterialIcons name="error" size={16} color="#ef4444" />
                      <Text className="text-red-600 text-sm ml-2 flex-1">
                        {img.error_message}
                      </Text>
                    </View>
                  )}
                </View>

                {img.analysis_result && (
                  <TouchableOpacity
                    className="mt-4 rounded-xl py-3 px-4 flex-row items-center justify-center"
                    style={{
                      backgroundColor: "#395886",
                      shadowColor: "#395886",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.2,
                      shadowRadius: 4,
                      elevation: 2,
                    }}
                    onPress={() => {
                      router.push({
                        pathname: "/report-view",
                        params: { report: JSON.stringify(img.analysis_result) },
                      });
                    }}
                  >
                    <MaterialIcons name="description" size={18} color="white" />
                    <Text className="text-white font-semibold ml-2">
                      View Report
                    </Text>
                    <MaterialIcons
                      name="arrow-forward"
                      size={16}
                      color="white"
                      style={{ marginLeft: 8 }}
                    />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
