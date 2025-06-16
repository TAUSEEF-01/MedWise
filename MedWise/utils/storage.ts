import AsyncStorage from "@react-native-async-storage/async-storage";
import { MedicalRecord } from "@/types/medical";

interface UserProfile {
  name: string;
  age: number;
  gender: "male" | "female" | "other";
  bloodType: string;
  allergies: string[];
  emergencyContact: {
    name: string;
    phone: string;
  };
  chronicConditions: string[];
}

const STORAGE_KEYS = {
  MEDICAL_RECORDS: "@medwise_records",
  USER_PROFILE: "@medwise_profile",
  CHAT_HISTORY: "@medwise_chat",
};

export const storageUtils = {
  // Medical Records
  async saveMedicalRecord(record: MedicalRecord): Promise<void> {
    try {
      const existingRecords = await this.getMedicalRecords();
      const updatedRecords = [record, ...existingRecords];
      await AsyncStorage.setItem(
        STORAGE_KEYS.MEDICAL_RECORDS,
        JSON.stringify(updatedRecords)
      );
    } catch (error) {
      console.error("Error saving medical record:", error);
      throw error;
    }
  },

  async getMedicalRecords(): Promise<MedicalRecord[]> {
    try {
      const records = await AsyncStorage.getItem(STORAGE_KEYS.MEDICAL_RECORDS);
      return records ? JSON.parse(records) : [];
    } catch (error) {
      console.error("Error getting medical records:", error);
      return [];
    }
  },

  async deleteMedicalRecord(recordId: string): Promise<void> {
    try {
      const records = await this.getMedicalRecords();
      const filteredRecords = records.filter(
        (record) => record.id !== recordId
      );
      await AsyncStorage.setItem(
        STORAGE_KEYS.MEDICAL_RECORDS,
        JSON.stringify(filteredRecords)
      );
    } catch (error) {
      console.error("Error deleting medical record:", error);
      throw error;
    }
  },

  // User Profile
  async saveUserProfile(profile: UserProfile): Promise<void> {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.USER_PROFILE,
        JSON.stringify(profile)
      );
    } catch (error) {
      console.error("Error saving user profile:", error);
      throw error;
    }
  },

  async getUserProfile(): Promise<UserProfile | null> {
    try {
      const profile = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      return profile ? JSON.parse(profile) : null;
    } catch (error) {
      console.error("Error getting user profile:", error);
      return null;
    }
  },

  // Clear all data
  async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
    } catch (error) {
      console.error("Error clearing data:", error);
      throw error;
    }
  },
};
