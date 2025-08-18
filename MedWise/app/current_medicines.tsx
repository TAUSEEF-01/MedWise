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

export default function CurrentMedicines() {
  const [userId, setUserId] = useState<string | null>(null);
  const [allDrugs, setAllDrugs] = useState<Drug[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingDrugId, setUpdatingDrugId] = useState<string | null>(null);

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

  // Function to fetch all drugs for the user
  const fetchAllDrugs = useCallback(
    async (userIdParam?: string) => {
      const targetUserId = userIdParam || userId;
      if (!targetUserId) return;

      setLoading(true);
      try {
        const response = await fetch(
          `https://medwise-9nv0.onrender.com/user-drugs/active-drugs/${targetUserId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        // API returns direct array of drugs, not wrapped object
        const data: Drug[] = await response.json();
        setAllDrugs(data || []);
      } catch (error) {
        console.error("Error fetching drugs:", error);
        Alert.alert("Error", "Failed to fetch medicines");
      } finally {
        setLoading(false);
      }
    },
    [userId]
  );

  // Function to handle pull-to-refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAllDrugs();
    setRefreshing(false);
  }, [fetchAllDrugs]);

  // Function to change drug active status
  const changeDrugActiveStatus = useCallback(
    async (drugId: string, newStatus: boolean) => {
      if (!userId) return;

      setUpdatingDrugId(drugId);
      try {
        const response = await fetch(
          `https://medwise-9nv0.onrender.com/user-drugs/change-drug-active-status/${userId}?drug_id=${drugId}&is_active=${newStatus}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Update local state
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
        Alert.alert("Error", "Failed to update medicine status");
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

  // Fetch drugs when userId is available
  useEffect(() => {
    if (userId) {
      fetchAllDrugs(userId);
    }
  }, [userId, fetchAllDrugs]);

  // Render individual drug item
  const renderDrugItem = ({ item }: { item: Drug }) => (
    <TouchableOpacity style={styles.drugItem}>
      <View style={styles.drugHeader}>
        <Text style={styles.drugName}>{item.drug_name}</Text>
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>
            {item.isActive ? "Active" : "Inactive"}
          </Text>
          <Switch
            value={item.isActive ?? true}
            onValueChange={(newValue) => {
              if (item.id) {
                changeDrugActiveStatus(item.id, newValue);
              }
            }}
            disabled={updatingDrugId === item.id}
            trackColor={{ false: "#767577", true: "#81b0ff" }}
            thumbColor={item.isActive ? "#007AFF" : "#f4f3f4"}
          />
          {updatingDrugId === item.id && (
            <ActivityIndicator
              size="small"
              color="#007AFF"
              style={styles.loadingIndicator}
            />
          )}
        </View>
      </View>
      {item.dosage && (
        <Text style={styles.drugDetail}>Dosage: {item.dosage}</Text>
      )}
      {item.instruction && (
        <Text style={styles.drugDetail}>Instruction: {item.instruction}</Text>
      )}
      {item.duration && (
        <Text style={styles.drugDescription}>Duration: {item.duration}</Text>
      )}
    </TouchableOpacity>
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
      <Text style={styles.title}>Current Medicines</Text>

      {allDrugs.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>No medicines found</Text>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={() => fetchAllDrugs()}
          >
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={allDrugs}
          renderItem={renderDrugItem}
          keyExtractor={(item, index) => item.id || index.toString()}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
    textAlign: "center",
  },
  listContainer: {
    paddingBottom: 20,
  },
  drugItem: {
    backgroundColor: "#fff",
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  drugHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  drugName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  drugDetail: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  drugDescription: {
    fontSize: 14,
    color: "#888",
    fontStyle: "italic",
    marginTop: 8,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  errorText: {
    fontSize: 16,
    color: "#ff4444",
    textAlign: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  refreshButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  loadingIndicator: {
    marginLeft: 4,
  },
});
