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

const BACKEND_URL = "http://192.168.0.110:8000/api/images/all";

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
      {/* Simple White App Bar */}
      <View
        className="px-5 pt-10 pb-4 bg-white"
        style={{
          borderBottomWidth: 1,
          borderBottomColor: "#e2e8f0",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 3,
          elevation: 2,
        }}
      >
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full items-center justify-center mr-4"
            style={{ backgroundColor: "#f1f5f9" }}
          >
            <MaterialIcons name="arrow-back" size={22} color="#1e293b" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-2xl font-bold text-black">Image Uploads</Text>
            <Text className="text-gray-500 text-sm mt-1">
              {images.length} {images.length === 1 ? "record" : "records"} found
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingTop: 24, paddingBottom: 24 }}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={["#395886"]}
            tintColor="#395886"
          />
        }
      >
        {loading ? (
          <View className="items-center justify-center py-20">
            <View
              className="w-20 h-20 rounded-full items-center justify-center mb-6"
              style={{ 
                backgroundColor: "#f0f3fa",
                borderWidth: 2,
                borderColor: "#395886"
              }}
            >
              <ActivityIndicator size="large" color="#395886" />
            </View>
            <Text className="text-gray-700 text-lg font-semibold">
              Loading uploads...
            </Text>
            <Text className="text-gray-500 text-sm mt-1">
              Please wait while we fetch your data
            </Text>
          </View>
        ) : images.length === 0 ? (
          <View className="items-center justify-center py-20">
            <View
              className="w-24 h-24 rounded-full items-center justify-center mb-6"
              style={{ 
                backgroundColor: "#f0f3fa",
                borderWidth: 2,
                borderColor: "#395886"
              }}
            >
              <MaterialIcons name="cloud-upload" size={48} color="#395886" />
            </View>
            <Text className="text-xl font-bold text-gray-900 mb-2">
              No Uploads Yet
            </Text>
            <Text className="text-gray-500 text-center px-8 leading-5">
              Your uploaded medical images will appear here once you start uploading
            </Text>
          </View>
        ) : (
          images.map((img, idx) => (
            <View
              key={img._id || idx}
              className="mb-5 rounded-2xl overflow-hidden"
              style={{
                backgroundColor: "#d5deef",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 8,
                elevation: 3,
                borderWidth: 1,
                borderColor: "#395886",
              }}
            >
              {/* Enhanced Card Header */}
              <View
                className="px-5 py-4"
                style={{
                  backgroundColor: "#fafbfc",
                  borderBottomWidth: 1,
                  borderBottomColor: "#395886",
                }}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center flex-1">
                    <View
                      className="w-12 h-12 rounded-2xl items-center justify-center mr-4"
                      style={{ 
                        backgroundColor: "#f0f3fa",
                        borderWidth: 2,
                        borderColor: "#395886"
                      }}
                    >
                      <MaterialIcons name="image" size={24} color="#395886" />
                    </View>
                    <View className="flex-1">
                      <Text
                        className="font-bold text-gray-900 mb-1"
                        numberOfLines={1}
                        style={{ fontSize: 16 }}
                      >
                        {img.original_filename}
                      </Text>
                      <Text className="text-gray-500 text-xs">
                        {formatDate(img.uploaded_at)}
                      </Text>
                    </View>
                  </View>
                  <View
                    className="px-3 py-2 rounded-full flex-row items-center"
                    style={{
                      backgroundColor: `${getStatusColor(img.status)}20`,
                      borderWidth: 1,
                      borderColor: `${getStatusColor(img.status)}40`,
                    }}
                  >
                    <MaterialIcons
                      name={getStatusIcon(img.status)}
                      size={16}
                      color={getStatusColor(img.status)}
                    />
                    <Text
                      className="ml-2 font-semibold text-xs"
                      style={{ color: getStatusColor(img.status) }}
                    >
                      {img.status.toUpperCase()}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Enhanced Card Content */}
              <View className="p-5">
                <View className="space-y-3">
                  <View className="flex-row items-center">
                    <View
                      className="w-8 h-8 rounded-lg items-center justify-center mr-3"
                      style={{ backgroundColor: "#f3f4f6" }}
                    >
                      <MaterialIcons name="fingerprint" size={18} color="#6b7280" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-gray-500 text-xs font-medium">Image ID</Text>
                      <Text className="text-gray-800 text-sm font-mono">
                        {img.image_id?.substring(0, 16)}...
                      </Text>
                    </View>
                  </View>

                  {img.completed_at && (
                    <View className="flex-row items-center">
                      <View
                        className="w-8 h-8 rounded-lg items-center justify-center mr-3"
                        style={{ backgroundColor: "#dcfce7" }}
                      >
                        <MaterialIcons name="done" size={18} color="#10b981" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-gray-500 text-xs font-medium">Completed</Text>
                        <Text className="text-gray-800 text-sm">
                          {formatDate(img.completed_at)}
                        </Text>
                      </View>
                    </View>
                  )}

                  {img.error_message && (
                    <View className="flex-row items-start">
                      <View
                        className="w-8 h-8 rounded-lg items-center justify-center mr-3"
                        style={{ backgroundColor: "#fee2e2" }}
                      >
                        <MaterialIcons name="error" size={18} color="#ef4444" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-gray-500 text-xs font-medium">Error</Text>
                        <Text className="text-red-600 text-sm leading-5">
                          {img.error_message}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>

                {img.analysis_result && (
                  <TouchableOpacity
                    className="mt-5 rounded-xl py-4 px-5 flex-row items-center justify-center"
                    style={{
                      backgroundColor: "#395886",
                      shadowColor: "#395886",
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.25,
                      shadowRadius: 8,
                      elevation: 4,
                    }}
                    onPress={() => {
                      router.push({
                        pathname: "/report-view",
                        params: { report: JSON.stringify(img.analysis_result) },
                      });
                    }}
                  >
                    <View
                      className="w-8 h-8 rounded-lg items-center justify-center mr-3"
                      style={{ backgroundColor: "rgba(255, 255, 255, 0.2)" }}
                    >
                      <MaterialIcons name="description" size={20} color="white" />
                    </View>
                    <Text className="text-white font-semibold text-base flex-1">
                      View Report
                    </Text>
                    <MaterialIcons
                      name="arrow-forward"
                      size={18}
                      color="white"
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