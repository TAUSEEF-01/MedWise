import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Alert,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Switch,
  TextInput,
  Dimensions,
  Modal,
  Pressable,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import { useLocalSearchParams, useRouter } from "expo-router";
// Optional dynamic require to prevent crash if module not installed
let DateTimePicker: any = null;
try {
  const dt = require("@react-native-community/datetimepicker");
  DateTimePicker = dt.default || dt;
} catch (e) {
  // Module not installed; will show fallback
}

// Unified palette for consistent aesthetic (similar to lab-report-list)
const palette = {
  background: "#F5F9FF",
  backgroundAlt: "#FFFFFF",
  backgroundSoft: "#F0F4FA",
  primary: "#1E88E5",
  primaryDark: "#1565C0",
  primaryLight: "#E3F2FD",
  primaryTint: "#BBDEFB",
  border: "#E1E8F0",
  text: "#1A1F29",
  textMuted: "#5A6475",
  textSubtle: "#6B7280",
  danger: "#E53935",
  success: "#2E7D32",
  overlay: "rgba(0,0,0,0.35)",
};

interface Drug {
  id?: string;
  drug_name: string;
  dosage?: string;
  instruction?: string;
  duration?: string;
  isActive?: boolean;
  time?: string[]; // Added time array
}

type TabType = "active" | "all" | "inactive";

export default function CurrentMedicines() {
  const [userId, setUserId] = useState<string | null>(null);
  const [allDrugs, setAllDrugs] = useState<Drug[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingDrugId, setUpdatingDrugId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredDrugs, setFilteredDrugs] = useState<Drug[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>("active");
  // Time editing state
  const [timeModalVisible, setTimeModalVisible] = useState(false);
  const [timeModalLoading, setTimeModalLoading] = useState(false);
  const [editingDrug, setEditingDrug] = useState<Drug | null>(null);
  const [editingTimes, setEditingTimes] = useState<string[]>([]);
  const [newTimeInput, setNewTimeInput] = useState("");
  const timeRegex = /^(1[0-2]|0?[1-9]):[0-5][0-9] (AM|PM)$/;
  // New picker state
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [pickerTempDate, setPickerTempDate] = useState<Date | null>(null); // for iOS inline adjustments if needed

  const { getCurrentUser, currentUser, isAuthenticated } = useAuth();
  const { drugsData } = useLocalSearchParams();
  const router = useRouter();

  // Simplified function to get user_id from cached data
  const fetchUserId = useCallback(async () => {
    try {
      // First check if we already have user data in context
      if (currentUser?.user_id) {
        setUserId(currentUser.user_id);
        return;
      }

      // Only call API if we don't have cached user data
      const user = await getCurrentUser();
      if (user?.user_id) {
        setUserId(user.user_id);
      } else {
        Alert.alert("Error", "User not authenticated. Please log in.");
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      Alert.alert("Error", "Failed to get user information");
    }
  }, [getCurrentUser, currentUser]);

  // Function to fetch all drugs (only used for refresh)
  const fetchAllDrugs = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const endpoint = `https://medwise-9nv0.onrender.com/user-drugs/all-drugs/${userId}`;
      console.log(`Fetching all drugs from:`, endpoint);

      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const rawData = await response.json();
      console.log(`Raw API data for all drugs:`, rawData);

      // Transform the data to map _id to id
      const transformedData: Drug[] = (rawData || []).map((drug: any) => ({
        id: drug._id,
        drug_name: drug.drug_name,
        dosage: drug.dosage,
        instruction: drug.instruction,
        duration: drug.duration,
        isActive: drug.isActive,
        time: drug.time || [], // include time
      }));

      console.log(`Transformed data:`, transformedData);
      setAllDrugs(transformedData);
    } catch (error) {
      console.error(`Error fetching all drugs:`, error);
      Alert.alert("Error", `Failed to fetch medicines`);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Function to handle refresh button press
  const handleRefresh = useCallback(async () => {
    await fetchAllDrugs();
  }, [fetchAllDrugs]);

  // Function to handle pull-to-refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAllDrugs();
    setRefreshing(false);
  }, [fetchAllDrugs]);

  // Function to change drug active status
  const changeDrugActiveStatus = useCallback(
    async (drugId: string, newStatus: boolean) => {
      if (!userId) {
        Alert.alert("Error", "User not authenticated");
        return;
      }

      if (!drugId) {
        Alert.alert("Error", "Invalid drug ID");
        return;
      }

      setUpdatingDrugId(drugId);
      console.log(
        `Updating drug status - User ID: ${userId}, Drug ID: ${drugId}, New Status: ${newStatus}`
      );

      try {
        const url = `https://medwise-9nv0.onrender.com/user-drugs/change-drug-active-status/${userId}?drug_id=${drugId}&is_active=${newStatus}`;
        console.log(`API URL: ${url}`);

        const response = await fetch(url, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        });

        console.log(`Response status: ${response.status}`);

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`API Error: ${response.status} - ${errorText}`);
          throw new Error(
            `HTTP error! status: ${response.status}, message: ${errorText}`
          );
        }

        const responseData = await response.json();
        console.log("API Response:", responseData);

        // Update local state only if API call was successful
        setAllDrugs((prevDrugs) =>
          prevDrugs.map((drug) =>
            drug.id === drugId ? { ...drug, isActive: newStatus } : drug
          )
        );

        Alert.alert(
          "Success",
          `Medicine ${newStatus ? "activated" : "deactivated"} successfully`
        );
      } catch (error) {
        console.error("Error updating drug status:", error);

        let errorMessage = "Failed to update medicine status";
        if (error instanceof Error) {
          errorMessage = error.message;
        }

        Alert.alert("Error", errorMessage);

        // Revert the switch state by forcing a re-render
        // This ensures the UI reflects the actual state
        setAllDrugs((prevDrugs) => [...prevDrugs]);
      } finally {
        setUpdatingDrugId(null);
      }
    },
    [userId]
  );

  // Initialize user ID
  useEffect(() => {
    const initializeData = async () => {
      await fetchUserId();
    };
    initializeData();
  }, [fetchUserId]);

  // Load drugs data from params only
  useEffect(() => {
    if (drugsData) {
      try {
        const parsedDrugs = JSON.parse(drugsData as string);
        console.log("Loaded drugs from params:", parsedDrugs);
        setAllDrugs(parsedDrugs);
      } catch (error) {
        console.error("Error parsing drugs data:", error);
        Alert.alert("Error", "Failed to load medicines data");
      }
    } else {
      // No data provided, show empty state
      setAllDrugs([]);
    }
  }, [drugsData]);

  // Filter drugs based on active tab and search query
  useEffect(() => {
    let drugsToFilter: Drug[] = [];

    // First filter by tab
    switch (activeTab) {
      case "active":
        drugsToFilter = allDrugs.filter((drug) => drug.isActive === true);
        break;
      case "inactive":
        drugsToFilter = allDrugs.filter((drug) => drug.isActive === false);
        break;
      case "all":
        drugsToFilter = allDrugs;
        break;
      default:
        drugsToFilter = allDrugs.filter((drug) => drug.isActive === true);
    }

    // Then filter by search query
    if (!searchQuery.trim()) {
      setFilteredDrugs(drugsToFilter);
    } else {
      const filtered = drugsToFilter.filter((drug) =>
        drug.drug_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredDrugs(filtered);
    }
  }, [allDrugs, activeTab, searchQuery]);

  // Calculate counts for tabs
  const activeDrugsCount = allDrugs.filter(
    (drug) => drug.isActive === true
  ).length;
  const inactiveDrugsCount = allDrugs.filter(
    (drug) => drug.isActive === false
  ).length;
  const allDrugsCount = allDrugs.length;

  // Render tab button
  const renderTabButton = (tabType: TabType, label: string, count: number) => {
    const isActive = activeTab === tabType;
    return (
      <TouchableOpacity
        style={[styles.tabButton, isActive && styles.activeTabButton]}
        onPress={() => setActiveTab(tabType)}
      >
        <Text style={[styles.tabText, isActive && styles.activeTabText]}>
          {label}
        </Text>
        <View style={[styles.countBadge, isActive && styles.activeCountBadge]}>
          <Text style={[styles.countText, isActive && styles.activeCountText]}>
            {count}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Render individual drug item with enhanced design
  const renderDrugItem = ({ item }: { item: Drug }) => (
    <View style={styles.drugCard}>
      {/* Header Section */}
      <View style={styles.drugHeader}>
        <View style={styles.drugTitleContainer}>
          <Text style={styles.drugName}>{item.drug_name}</Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: item.isActive ? "#E8F5E8" : "#FFF2F2" },
            ]}
          >
            <View
              style={[
                styles.statusDot,
                { backgroundColor: item.isActive ? "#4CAF50" : "#F44336" },
              ]}
            />
            <Text
              style={[
                styles.statusText,
                { color: item.isActive ? "#2E7D32" : "#C62828" },
              ]}
            >
              {item.isActive ? "Active" : "Inactive"}
            </Text>
          </View>
        </View>
        <View style={styles.switchContainer}>
          <Switch
            value={item.isActive ?? true}
            onValueChange={(newValue) => {
              if (item.id) {
                changeDrugActiveStatus(item.id, newValue);
              } else {
                Alert.alert("Error", "Cannot update medicine - ID is missing");
              }
            }}
            disabled={updatingDrugId === item.id}
            trackColor={{ false: "#E0E0E0", true: "#C8E6C9" }}
            thumbColor={item.isActive ? "#4CAF50" : "#BDBDBD"}
            style={styles.switch}
          />
          {updatingDrugId === item.id && (
            <ActivityIndicator
              size="small"
              color="#4CAF50"
              style={styles.loadingIndicator}
            />
          )}
        </View>
      </View>
      <View style={styles.infoContainer}>
        {/* Times Section */}
        <View style={styles.infoSection}>
          <View style={styles.infoHeader}>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>🕒</Text>
            </View>
            <Text style={styles.infoLabel}>Times</Text>
            <TouchableOpacity
              style={styles.manageTimesButton}
              onPress={() => openTimeModal(item)}
            >
              <Text style={styles.manageTimesButtonText}>Manage</Text>
            </TouchableOpacity>
          </View>
          {item.time && item.time.length > 0 ? (
            <View style={styles.timesWrap}>
              {item.time.map((t) => (
                <View key={t} style={styles.timeChip}>
                  <Text style={styles.timeChipText}>{t}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text
              style={[
                styles.infoValue,
                { marginLeft: 44, fontStyle: "italic", color: "#777" },
              ]}
            >
              No times set
            </Text>
          )}
        </View>
        {item.dosage && (
          <View style={styles.infoSection}>
            <View style={styles.infoHeader}>
              <View style={styles.iconContainer}>
                <Text style={styles.icon}>💊</Text>
              </View>
              <Text style={styles.infoLabel}>Dosage</Text>
            </View>
            <Text style={styles.infoValue}>{item.dosage}</Text>
          </View>
        )}

        {item.instruction && (
          <View style={styles.infoSection}>
            <View style={styles.infoHeader}>
              <View style={styles.iconContainer}>
                <Text style={styles.icon}>📋</Text>
              </View>
              <Text style={styles.infoLabel}>Instructions</Text>
            </View>
            <Text style={styles.infoValue}>{item.instruction}</Text>
          </View>
        )}

        {item.duration && (
          <View style={styles.infoSection}>
            <View style={styles.infoHeader}>
              <View style={styles.iconContainer}>
                <Text style={styles.icon}>⏰</Text>
              </View>
              <Text style={styles.infoLabel}>Duration</Text>
            </View>
            <Text style={styles.infoValue}>{item.duration}</Text>
          </View>
        )}
      </View>
    </View>
  );

  // ===================== Time Management Functions =====================
  const formatPickedTime = (date: Date) => {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 -> 12
    const hh = hours < 10 ? `0${hours}` : `${hours}`;
    const mm = minutes < 10 ? `0${minutes}` : `${minutes}`;
    return `${hh}:${mm} ${ampm}`;
  };

  const openTimeModal = useCallback(
    async (drug: Drug) => {
      if (!userId || !drug.id) return;
      setEditingDrug(drug);
      setTimeModalVisible(true);
      setTimeModalLoading(true);
      try {
        const url = `https://medwise-9nv0.onrender.com/user-drugs/drug-times/${userId}/${drug.id}`;
        const res = await fetch(url, { method: "GET" });
        if (!res.ok) throw new Error(`Failed to load times (${res.status})`);
        const data = await res.json();
        setEditingTimes(data.times || []);
      } catch (e: any) {
        Alert.alert("Error", e.message || "Failed to load times");
        setEditingTimes(drug.time || []);
      } finally {
        setTimeModalLoading(false);
      }
    },
    [userId]
  );

  const closeTimeModal = () => {
    setTimeModalVisible(false);
    setEditingDrug(null);
    setEditingTimes([]);
    setNewTimeInput("");
  };

  const addNewTime = async (pickedValue?: string) => {
    if (!editingDrug || !editingDrug.id || !userId) return;
    const valueSource = pickedValue
      ? pickedValue.trim().toUpperCase()
      : newTimeInput.trim().toUpperCase();
    const value = valueSource;
    if (!value) return;
    if (!timeRegex.test(value)) {
      Alert.alert("Invalid Time", "Use format HH:MM AM/PM (e.g., 08:30 AM)");
      return;
    }
    if (editingTimes.includes(value)) {
      Alert.alert("Duplicate", "This time already exists");
      return;
    }
    setTimeModalLoading(true);
    try {
      const url = `https://medwise-9nv0.onrender.com/user-drugs/drug-times/${userId}/${editingDrug.id}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ times: [value] }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      const updatedTimes = data.times || [...editingTimes, value];
      setEditingTimes(updatedTimes);
      setAllDrugs((prev) =>
        prev.map((d) =>
          d.id === editingDrug.id ? { ...d, time: updatedTimes } : d
        )
      );
      setNewTimeInput("");
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to add time");
    } finally {
      setTimeModalLoading(false);
    }
  };

  const deleteTime = async (timeStr: string) => {
    if (!editingDrug || !editingDrug.id || !userId) return;
    setTimeModalLoading(true);
    try {
      const url = `https://medwise-9nv0.onrender.com/user-drugs/drug-times/${userId}/${editingDrug.id}`;
      const res = await fetch(url, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ times: [timeStr] }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      const updatedTimes =
        data.times || editingTimes.filter((t) => t !== timeStr);
      setEditingTimes(updatedTimes);
      setAllDrugs((prev) =>
        prev.map((d) =>
          d.id === editingDrug.id ? { ...d, time: updatedTimes } : d
        )
      );
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to delete time");
    } finally {
      setTimeModalLoading(false);
    }
  };

  const replaceAllTimes = async () => {
    if (!editingDrug || !editingDrug.id || !userId) return;
    if (editingTimes.length === 0) {
      Alert.alert("Validation", "Add at least one time before saving");
      return;
    }
    // Validation
    const invalid = editingTimes.filter((t) => !timeRegex.test(t));
    if (invalid.length) {
      Alert.alert("Invalid Times", `Incorrect format: ${invalid.join(", ")}`);
      return;
    }
    setTimeModalLoading(true);
    try {
      const url = `https://medwise-9nv0.onrender.com/user-drugs/drug-times/${userId}/${editingDrug.id}`;
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ times: editingTimes }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      const updated = data.times || editingTimes;
      setEditingTimes(updated);
      setAllDrugs((prev) =>
        prev.map((d) => (d.id === editingDrug.id ? { ...d, time: updated } : d))
      );
      Alert.alert("Success", "Times updated");
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to update times");
    } finally {
      setTimeModalLoading(false);
    }
  };
  // =================== End Time Management Functions ===================

  if (!isAuthenticated) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>
          Please log in to view your medicines
        </Text>
      </View>
    );
  }

  if (loading && !refreshing && allDrugs.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading medicines...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Current Medicines</Text>
        <Text style={styles.subtitle}>Manage your daily medications</Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {renderTabButton("active", "Active", activeDrugsCount)}
        {renderTabButton("all", "All", allDrugsCount)}
        {renderTabButton("inactive", "Inactive", inactiveDrugsCount)}
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder={`Search ${activeTab} medicines...`}
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery("")}
              style={styles.clearButton}
            >
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Content */}
      {filteredDrugs.length === 0 ? (
        <View style={styles.centerContainer}>
          {searchQuery ? (
            <>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={styles.emptyText}>
                No {activeTab} medicines found for "{searchQuery}"
              </Text>
              <Text style={styles.emptySubtext}>
                Try adjusting your search terms
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.emptyIcon}>💊</Text>
              <Text style={styles.emptyText}>
                No {activeTab} medicines found
              </Text>
              <Text style={styles.emptySubtext}>
                {activeTab === "active"
                  ? "No active medicines at the moment"
                  : activeTab === "inactive"
                  ? "No inactive medicines found"
                  : "Add some medicines to get started"}
              </Text>
              <TouchableOpacity
                style={styles.refreshButton}
                onPress={handleRefresh}
              >
                <Text style={styles.refreshButtonText}>Refresh</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredDrugs}
          renderItem={renderDrugItem}
          keyExtractor={(item, index) => item.id || index.toString()}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#4CAF50"]}
              tintColor="#4CAF50"
            />
          }
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Time Management Modal */}
      <Modal
        visible={timeModalVisible}
        animationType="fade"
        transparent
        onRequestClose={closeTimeModal}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            style={styles.modalContainer}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {editingDrug?.drug_name || "Medicine"} Times
                </Text>
                <Pressable onPress={closeTimeModal} style={styles.closeButton}>
                  <Text style={styles.closeButtonText}>✕</Text>
                </Pressable>
              </View>
              {timeModalLoading && (
                <View style={styles.modalLoadingRow}>
                  <ActivityIndicator color="#4CAF50" />
                  <Text style={styles.modalLoadingText}>Processing...</Text>
                </View>
              )}
              <ScrollView
                style={{ maxHeight: 420 }}
                contentContainerStyle={{ paddingVertical: 4 }}
              >
                {editingTimes.length === 0 ? (
                  <Text style={styles.noTimesText}>No times set yet</Text>
                ) : (
                  <View style={styles.timesGridWrapper}>
                    <Text style={styles.timesSectionTitle}>Selected Times</Text>
                    <View style={styles.timesGrid}>
                      {[...editingTimes].sort().map((t, idx) => {
                        const isAM = t.endsWith("AM");
                        return (
                          <View
                            key={t}
                            style={[
                              styles.timeTile,
                              isAM ? styles.timeTileAM : styles.timeTilePM,
                            ]}
                          >
                            <Text style={styles.timeTileText}>{t}</Text>
                            <TouchableOpacity
                              onPress={() => deleteTime(t)}
                              disabled={timeModalLoading}
                              style={styles.timeTileDelete}
                              accessibilityLabel={`Delete time ${t}`}
                            >
                              <Text style={styles.timeTileDeleteText}>✕</Text>
                            </TouchableOpacity>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                )}
              </ScrollView>
              {/* Updated Time Picker Row */}
              <View style={styles.addTimeRow}>
                <TouchableOpacity
                  style={styles.selectTimeButton}
                  onPress={() => {
                    if (!DateTimePicker) {
                      Alert.alert(
                        "Time Picker Missing",
                        "Install with: expo install @react-native-community/datetimepicker"
                      );
                      return;
                    }
                    setShowTimePicker(true);
                    setPickerTempDate(new Date());
                  }}
                  disabled={timeModalLoading}
                >
                  <Text style={styles.selectTimeButtonText}>Select Time</Text>
                </TouchableOpacity>
                {/* Fallback note if picker missing */}
                {!DateTimePicker && (
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={{ fontSize: 12, color: "#C62828" }}>
                      Install picker package to enable selection.
                    </Text>
                  </View>
                )}
                {DateTimePicker &&
                  Platform.OS === "android" &&
                  showTimePicker && (
                    <DateTimePicker
                      value={pickerTempDate || new Date()}
                      mode="time"
                      is24Hour={false}
                      display="default"
                      onChange={(event: any, selectedDate?: Date) => {
                        if (event?.type === "dismissed") {
                          setShowTimePicker(false);
                          return;
                        }
                        const date = selectedDate || new Date();
                        setShowTimePicker(false);
                        const formatted = formatPickedTime(date);
                        addNewTime(formatted);
                      }}
                    />
                  )}
                {DateTimePicker && Platform.OS === "ios" && showTimePicker && (
                  <View style={styles.iosPickerWrapper}>
                    <DateTimePicker
                      value={pickerTempDate || new Date()}
                      mode="time"
                      is24Hour={false}
                      display="spinner"
                      onChange={(_: any, selectedDate?: Date) => {
                        if (selectedDate) {
                          setPickerTempDate(selectedDate);
                        }
                      }}
                    />
                    <View style={styles.iosPickerActions}>
                      <TouchableOpacity
                        style={styles.iosPickerCancel}
                        onPress={() => {
                          setShowTimePicker(false);
                          setPickerTempDate(null);
                        }}
                      >
                        <Text style={styles.iosPickerCancelText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.iosPickerAdd}
                        onPress={() => {
                          const date = pickerTempDate || new Date();
                          const formatted = formatPickedTime(date);
                          addNewTime(formatted);
                          setShowTimePicker(false);
                          setPickerTempDate(null);
                        }}
                      >
                        <Text style={styles.iosPickerAddText}>Add</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
              <View style={styles.modalFooterRow}>
                <TouchableOpacity
                  style={styles.saveTimesButton}
                  onPress={replaceAllTimes}
                  disabled={timeModalLoading || editingTimes.length === 0}
                >
                  <Text style={styles.saveTimesButtonText}>Save All</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.background },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    backgroundColor: palette.backgroundAlt,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: palette.text,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  subtitle: { fontSize: 15, color: palette.textMuted, fontWeight: "500" },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: palette.backgroundAlt,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    marginHorizontal: 4,
    backgroundColor: palette.backgroundSoft,
    borderWidth: 1,
    borderColor: palette.border,
  },
  activeTabButton: {
    backgroundColor: palette.primary,
    borderColor: palette.primary,
    shadowColor: palette.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 4,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600",
    color: palette.textSubtle,
    marginRight: 8,
  },
  activeTabText: { color: "#FFFFFF" },
  countBadge: {
    backgroundColor: palette.primaryLight,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: "center",
  },
  activeCountBadge: { backgroundColor: "rgba(255,255,255,0.25)" },
  countText: { fontSize: 12, fontWeight: "700", color: palette.primaryDark },
  activeCountText: { color: "#FFFFFF" },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: palette.backgroundAlt,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: palette.primaryLight,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
    borderColor: palette.primaryTint,
  },
  searchIcon: { fontSize: 18, marginRight: 10, color: palette.primaryDark },
  searchInput: { flex: 1, fontSize: 16, color: palette.text, height: "100%" },
  clearButton: { padding: 4 },
  clearIcon: { fontSize: 18, color: palette.primaryDark, fontWeight: "700" },
  listContainer: { padding: 20, paddingBottom: 110 },
  drugCard: {
    backgroundColor: palette.backgroundAlt,
    borderRadius: 20,
    marginBottom: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 5,
    borderWidth: 1,
    borderColor: palette.border,
  },
  drugHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 18,
    paddingBottom: 14,
    backgroundColor: palette.primaryLight,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  drugTitleContainer: { flex: 1, marginRight: 16 },
  drugName: {
    fontSize: 19,
    fontWeight: "700",
    color: palette.primaryDark,
    marginBottom: 8,
    lineHeight: 24,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  statusText: { fontSize: 11, fontWeight: "700", letterSpacing: 0.8 },
  switchContainer: { alignItems: "center", justifyContent: "center" },
  switch: { transform: [{ scaleX: 1.05 }, { scaleY: 1.05 }] },
  infoContainer: { padding: 18 },
  infoSection: { marginBottom: 18 },
  infoHeader: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  iconContainer: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: palette.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  icon: { fontSize: 16 },
  infoLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: palette.primaryDark,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  infoValue: {
    fontSize: 15.5,
    color: palette.text,
    lineHeight: 22,
    marginLeft: 46,
    fontWeight: "500",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: palette.textMuted,
    fontWeight: "600",
  },
  errorText: {
    fontSize: 18,
    color: palette.danger,
    textAlign: "center",
    fontWeight: "600",
  },
  emptyIcon: { fontSize: 62, marginBottom: 14, opacity: 0.28 },
  emptyText: {
    fontSize: 20,
    color: palette.primaryDark,
    textAlign: "center",
    marginBottom: 6,
    fontWeight: "700",
  },
  emptySubtext: {
    fontSize: 15,
    color: palette.textMuted,
    textAlign: "center",
    marginBottom: 22,
    lineHeight: 21,
  },
  refreshButton: {
    backgroundColor: palette.primary,
    paddingHorizontal: 26,
    paddingVertical: 13,
    borderRadius: 14,
    shadowColor: palette.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  refreshButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
  loadingIndicator: { marginTop: 8 },
  manageTimesButton: {
    marginLeft: "auto",
    backgroundColor: palette.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  manageTimesButtonText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  timesWrap: { flexDirection: "row", flexWrap: "wrap", marginLeft: 46 },
  timeChip: {
    backgroundColor: palette.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 18,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: palette.primaryTint,
  },
  timeChipText: { color: palette.primaryDark, fontSize: 12, fontWeight: "700" },
  modalOverlay: {
    flex: 1,
    backgroundColor: palette.overlay,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  modalContainer: { width: "100%" },
  modalContent: {
    // enlarged modal
    backgroundColor: palette.backgroundAlt,
    borderRadius: 32,
    padding: 28,
    width: "100%",
    maxWidth: 560,
    minHeight: 520,
    maxHeight: "90%",
    borderWidth: 1,
    borderColor: palette.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28,
    shadowRadius: 30,
    elevation: 16,
  },
  modalHeader: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  modalTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: "700",
    color: palette.primaryDark,
  },
  closeButton: {
    padding: 8,
    backgroundColor: palette.primaryLight,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.primaryTint,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: palette.primaryDark,
  },
  modalLoadingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  modalLoadingText: {
    marginLeft: 8,
    color: palette.primaryDark,
    fontWeight: "700",
  },
  noTimesText: {
    textAlign: "center",
    color: palette.textMuted,
    fontStyle: "italic",
    paddingVertical: 12,
  },
  timesGridWrapper: { marginBottom: 8 },
  timesSectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: palette.primaryDark,
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  timesGrid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -6 },
  timeTile: {
    position: "relative",
    width: "46%",
    marginHorizontal: 6,
    marginBottom: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.primaryTint,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  timeTileAM: { backgroundColor: palette.primaryLight },
  timeTilePM: { backgroundColor: "#F1F5FF" },
  timeTileText: {
    fontSize: 16,
    fontWeight: "700",
    color: palette.primaryDark,
    letterSpacing: 0.5,
  },
  timeTileDelete: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: palette.danger,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  timeTileDeleteText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  // Re-added missing styles
  addTimeRow: { flexDirection: "row", alignItems: "center", marginTop: 16 },
  selectTimeButton: {
    flex: 1,
    height: 52,
    backgroundColor: palette.primary,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 18,
    shadowColor: palette.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 5,
  },
  selectTimeButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
    letterSpacing: 0.4,
  },
  iosPickerWrapper: {
    flex: 1,
    marginLeft: 14,
    backgroundColor: palette.primaryLight,
    borderRadius: 18,
    padding: 10,
    borderWidth: 1,
    borderColor: palette.primaryTint,
  },
  iosPickerActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  iosPickerCancel: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    backgroundColor: palette.primaryTint,
    borderRadius: 12,
  },
  iosPickerCancelText: {
    color: palette.primaryDark,
    fontWeight: "600",
    fontSize: 14,
  },
  iosPickerAdd: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: palette.primaryDark,
    borderRadius: 12,
  },
  iosPickerAddText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
    letterSpacing: 0.3,
  },
  // Added missing footer & save styles
  modalFooterRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 24,
  },
  saveTimesButton: {
    backgroundColor: palette.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 18,
    shadowColor: palette.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  saveTimesButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
    letterSpacing: 0.5,
  },
});
