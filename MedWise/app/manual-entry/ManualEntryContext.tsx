import React, { createContext, useContext, useState, ReactNode } from 'react';
import { MedicalRecord } from '@/types/medical';

interface FormData {
  title: string;
  type: MedicalRecord["type"];
  description: string;
  doctorName: string;
  hospitalName: string;
  bloodPressure: string;
  heartRate: string;
  temperature: string;
  weight: string;
  height: string;
  medications: string;
  diagnosis: string;
}

interface ManualEntryContextType {
  formData: FormData;
  updateFormData: (data: Partial<FormData>) => void;
  resetFormData: () => void;
}

const defaultFormData: FormData = {
  title: "",
  type: "consultation",
  description: "",
  doctorName: "",
  hospitalName: "",
  bloodPressure: "",
  heartRate: "",
  temperature: "",
  weight: "",
  height: "",
  medications: "",
  diagnosis: "",
};

const ManualEntryContext = createContext<ManualEntryContextType | undefined>(undefined);

export const ManualEntryProvider = ({ children }: { children: ReactNode }) => {
  const [formData, setFormData] = useState<FormData>(defaultFormData);

  const updateFormData = (data: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  const resetFormData = () => {
    setFormData(defaultFormData);
  };

  return (
    <ManualEntryContext.Provider value={{ formData, updateFormData, resetFormData }}>
      {children}
    </ManualEntryContext.Provider>
  );
};

export const useManualEntry = () => {
  const context = useContext(ManualEntryContext);
  if (!context) {
    throw new Error('useManualEntry must be used within ManualEntryProvider');
  }
  return context;
};