export interface MedicalRecord {
  id: string;
  date: Date;
  title: string;
  type: "lab_report" | "prescription" | "scan" | "consultation" | "other";
  description?: string;
  fileUri?: string;
  extractedData?: ExtractedData;
  doctorName?: string;
  hospitalName?: string;
}

export interface ExtractedData {
  bloodPressure?: string;
  heartRate?: number;
  temperature?: number;
  weight?: number;
  height?: number;
  labValues?: LabValue[];
  medications?: Medication[];
  diagnosis?: string[];
}

export interface LabValue {
  name: string;
  value: string;
  unit: string;
  normalRange?: string;
  isNormal: boolean;
}

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration?: string;
}

export interface Disease {
  id: string;
  name: string;
  description: string;
  symptoms: string[];
  causes: string[];
  treatments: string[];
  severity: "low" | "medium" | "high";
  category: string;
}

export interface Hospital {
  id: string;
  name: string;
  address: string;
  phone: string;
  specialties: string[];
  rating: number;
  distance?: number;
  website?: string;
}

export interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}
