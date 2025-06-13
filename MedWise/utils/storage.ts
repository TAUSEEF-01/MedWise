import AsyncStorage from "@react-native-async-storage/async-storage";
import { MedicalRecord, Disease, Hospital } from "@/types/medical";

const STORAGE_KEYS = {
  MEDICAL_RECORDS: "@medwise_medical_records",
  USER_PROFILE: "@medwise_user_profile",
  CHAT_HISTORY: "@medwise_chat_history",
};

export const storageUtils = {
  // Medical Records
  async saveMedicalRecord(record: MedicalRecord): Promise<void> {
    try {
      const existingRecords = await this.getMedicalRecords();
      const updatedRecords = [...existingRecords, record];
      await AsyncStorage.setItem(
        STORAGE_KEYS.MEDICAL_RECORDS,
        JSON.stringify(updatedRecords)
      );
    } catch (error) {
      console.error("Error saving medical record:", error);
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
    }
  },

  // User Profile
  async saveUserProfile(profile: any): Promise<void> {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.USER_PROFILE,
        JSON.stringify(profile)
      );
    } catch (error) {
      console.error("Error saving user profile:", error);
    }
  },

  async getUserProfile(): Promise<any> {
    try {
      const profile = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      return profile ? JSON.parse(profile) : null;
    } catch (error) {
      console.error("Error getting user profile:", error);
      return null;
    }
  },
};
