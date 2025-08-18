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
} from "react-native";
import { useAuth } from "@/contexts/AuthContext";

interface Drug {
  id?: string;
  drug_name: string;
  dosage?: string;
  instruction?: string;
  duration?: string;
  isActive?: boolean;
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
  const [activeDrugsCount, setActiveDrugsCount] = useState(0);
  const [inactiveDrugsCount, setInactiveDrugsCount] = useState(0);
  const [allDrugsCount, setAllDrugsCount] = useState(0);

  const { getCurrentUser, currentUser, isAuthenticated } = useAuth();

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

  // Function to get API endpoint based on tab
  const getApiEndpoint = (tabType: TabType, userIdParam: string) => {
    const baseUrl = "https://medwise-9nv0.onrender.com/user-drugs";
    switch (tabType) {
      case "active":
        return `${baseUrl}/active-drugs/${userIdParam}`;
      case "inactive":
        return `${baseUrl}/inactive-drugs/${userIdParam}`;
      case "all":
        return `${baseUrl}/all-drugs/${userIdParam}`;
      default:
        return `${baseUrl}/active-drugs/${userIdParam}`;
    }
  };

  // Function to fetch drugs based on active tab
  const fetchDrugsByTab = useCallback(
    async (tabType: TabType, userIdParam?: string) => {
      const targetUserId = userIdParam || userId;
      if (!targetUserId) return;

      setLoading(true);
      try {
        const endpoint = getApiEndpoint(tabType, targetUserId);
        console.log(`Fetching ${tabType} drugs from:`, endpoint);

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
        console.log(`Raw API data for ${tabType}:`, rawData);

        // Transform the data to map _id to id
        const transformedData: Drug[] = (rawData || []).map((drug: any) => ({
          id: drug._id,
          drug_name: drug.drug_name,
          dosage: drug.dosage,
          instruction: drug.instruction,
          duration: drug.duration,
          isActive: drug.isActive,
        }));

        console.log(`Transformed data for ${tabType}:`, transformedData);
        setAllDrugs(transformedData);
      } catch (error) {
        console.error(`Error fetching ${tabType} drugs:`, error);
        Alert.alert("Error", `Failed to fetch ${tabType} medicines`);
      } finally {
        setLoading(false);
      }
    },
    [userId]
  );

  // Function to fetch counts for all tabs
  const fetchAllCounts = useCallback(
    async (userIdParam?: string) => {
      const targetUserId = userIdParam || userId;
      if (!targetUserId) return;

      try {
        const [activeResponse, inactiveResponse, allResponse] =
          await Promise.all([
            fetch(getApiEndpoint("active", targetUserId)),
            fetch(getApiEndpoint("inactive", targetUserId)),
            fetch(getApiEndpoint("all", targetUserId)),
          ]);

        const [activeData, inactiveData, allData] = await Promise.all([
          activeResponse.ok ? activeResponse.json() : [],
          inactiveResponse.ok ? inactiveResponse.json() : [],
          allResponse.ok ? allResponse.json() : [],
        ]);

        setActiveDrugsCount((activeData || []).length);
        setInactiveDrugsCount((inactiveData || []).length);
        setAllDrugsCount((allData || []).length);
      } catch (error) {
        console.error("Error fetching drug counts:", error);
      }
    },
    [userId]
  );

  // Function to handle refresh button press
  const handleRefresh = useCallback(async () => {
    await Promise.all([fetchDrugsByTab(activeTab), fetchAllCounts()]);
  }, [fetchDrugsByTab, fetchAllCounts, activeTab]);

  // Function to handle pull-to-refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchDrugsByTab(activeTab), fetchAllCounts()]);
    setRefreshing(false);
  }, [fetchDrugsByTab, fetchAllCounts, activeTab]);

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

  // Initialize user ID and fetch drugs
  useEffect(() => {
    const initializeData = async () => {
      await fetchUserId();
    };
    initializeData();
  }, [fetchUserId]);

  // Fetch drugs and counts when userId is available
  useEffect(() => {
    if (userId) {
      fetchDrugsByTab(activeTab, userId);
      fetchAllCounts(userId);
    }
  }, [userId, fetchDrugsByTab, fetchAllCounts, activeTab]);

  // Fetch drugs when tab changes
  useEffect(() => {
    if (userId) {
      fetchDrugsByTab(activeTab);
    }
  }, [activeTab, fetchDrugsByTab]);

  // Filter drugs based on search query only (no tab filtering needed)
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredDrugs(allDrugs);
    } else {
      const filtered = allDrugs.filter((drug) =>
        drug.drug_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredDrugs(filtered);
    }
  }, [allDrugs, searchQuery]);

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
                console.log(
                  `Switch toggled for drug: ${item.drug_name}, ID: ${item.id}, New Value: ${newValue}`
                );
                changeDrugActiveStatus(item.id, newValue);
              } else {
                console.error("Drug ID is missing:", item);
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

      {/* Information Sections */}
      <View style={styles.infoContainer}>
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

  if (!isAuthenticated) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>
          Please log in to view your medicines
        </Text>
      </View>
    );
  }

  if (loading && !refreshing) {
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
});
