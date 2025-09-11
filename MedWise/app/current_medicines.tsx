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

  const addNewTime = async () => {
    if (!editingDrug || !editingDrug.id || !userId) return;
    const value = newTimeInput.trim().toUpperCase();
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
      // Update in allDrugs
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
        animationType="slide"
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
                style={{ maxHeight: 240 }}
                contentContainerStyle={{ paddingVertical: 4 }}
              >
                {editingTimes.length === 0 ? (
                  <Text style={styles.noTimesText}>No times set yet</Text>
                ) : (
                  <View style={styles.editTimesWrap}>
                    {editingTimes.sort().map((t) => (
                      <View key={t} style={styles.editTimeChip}>
                        <Text style={styles.editTimeText}>{t}</Text>
                        <TouchableOpacity
                          onPress={() => deleteTime(t)}
                          disabled={timeModalLoading}
                          style={styles.deleteTimeBtn}
                        >
                          <Text style={styles.deleteTimeBtnText}>✕</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </ScrollView>
              <View style={styles.addTimeRow}>
                <TextInput
                  placeholder="HH:MM AM/PM"
                  placeholderTextColor="#999"
                  style={styles.addTimeInput}
                  value={newTimeInput}
                  onChangeText={setNewTimeInput}
                  autoCapitalize="characters"
                  maxLength={8}
                />
                <TouchableOpacity
                  style={styles.addTimeButton}
                  onPress={addNewTime}
                  disabled={timeModalLoading}
                >
                  <Text style={styles.addTimeButtonText}>Add</Text>
                </TouchableOpacity>
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
  container: {
    flex: 1,
    backgroundColor: "#F8FFFE",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    fontWeight: "400",
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginHorizontal: 4,
    backgroundColor: "#F8F9FA",
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  activeTabButton: {
    backgroundColor: "#4CAF50",
    borderColor: "#4CAF50",
    shadowColor: "#4CAF50",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6C757D",
    marginRight: 8,
  },
  activeTabText: {
    color: "#FFFFFF",
  },
  countBadge: {
    backgroundColor: "#E9ECEF",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: "center",
  },
  activeCountBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  countText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6C757D",
  },
  activeCountText: {
    color: "#FFFFFF",
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 12,
    color: "#6C757D",
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    height: "100%",
  },
  clearButton: {
    padding: 4,
  },
  clearIcon: {
    fontSize: 18,
    color: "#6C757D",
    fontWeight: "bold",
  },
  listContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  drugCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: "hidden",
  },
  drugHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 20,
    paddingBottom: 16,
    backgroundColor: "#FAFAFA",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  drugTitleContainer: {
    flex: 1,
    marginRight: 16,
  },
  drugName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1A1A1A",
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
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  switchContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  switch: {
    transform: [{ scaleX: 1.1 }, { scaleY: 1.1 }],
  },
  infoContainer: {
    padding: 20,
  },
  infoSection: {
    marginBottom: 16,
  },
  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#F0F8FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  icon: {
    fontSize: 16,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4A5568",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 16,
    color: "#1A1A1A",
    lineHeight: 22,
    marginLeft: 44,
    fontWeight: "400",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },
  errorText: {
    fontSize: 18,
    color: "#E53E3E",
    textAlign: "center",
    fontWeight: "500",
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
    opacity: 0.3,
  },
  emptyText: {
    fontSize: 20,
    color: "#4A5568",
    textAlign: "center",
    marginBottom: 8,
    fontWeight: "600",
  },
  emptySubtext: {
    fontSize: 16,
    color: "#718096",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  refreshButton: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: "#4CAF50",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  refreshButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  loadingIndicator: {
    marginTop: 8,
  },
  manageTimesButton: {
    marginLeft: "auto",
    backgroundColor: "#4CAF50",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  manageTimesButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  timesWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginLeft: 44,
  },
  timeChip: {
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  timeChipText: {
    color: "#0D47A1",
    fontSize: 12,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    width: "100%",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  modalTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  closeButton: {
    padding: 8,
    backgroundColor: "#F1F1F1",
    borderRadius: 12,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
  },
  modalLoadingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  modalLoadingText: {
    marginLeft: 8,
    color: "#4CAF50",
    fontWeight: "600",
  },
  noTimesText: {
    textAlign: "center",
    color: "#777",
    fontStyle: "italic",
    paddingVertical: 12,
  },
  editTimesWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  editTimeChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 18,
    marginRight: 8,
    marginBottom: 8,
  },
  editTimeText: {
    color: "#2E7D32",
    fontSize: 13,
    fontWeight: "600",
    marginRight: 6,
  },
  deleteTimeBtn: {
    backgroundColor: "#C62828",
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  deleteTimeBtnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  addTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },
  addTimeInput: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    backgroundColor: "#F8F9FA",
    color: "#1A1A1A",
  },
  addTimeButton: {
    marginLeft: 12,
    backgroundColor: "#4CAF50",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  addTimeButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  modalFooterRow: {
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  saveTimesButton: {
    backgroundColor: "#2E7D32",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
  },
  saveTimesButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
