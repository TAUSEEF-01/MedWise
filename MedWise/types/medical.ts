
export interface MedicalRecord {
  id: string;
  date: Date;
  title: string;
  type: "lab_report" | "prescription" | "scan" | "consultation" | "other";
  description?: string;
  fileUri?: string;
  doctorName?: string;
  hospitalName?: string;
  extractedData?: {
    bloodPressure?: string;
    heartRate?: number;
    temperature?: number;
    weight?: number;
    height?: number;
    medications?: Medication[];
    diagnosis?: string[];
    [key: string]: any;
  };
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
  rating: number;
  distance: number;
  specialties: string[];
  emergencyService: boolean;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

export interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  type?: "text" | "image" | "file";
}
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}
