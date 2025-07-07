import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Alert } from 'react-native';
import { MedicalRecord } from '@/types/medical';
import { PDFExportService, PDFExportData } from '@/utils/pdfExport';

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
  exportToPDF: () => Promise<void>;
  isExporting: boolean;
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
  const [isExporting, setIsExporting] = useState(false);

  const updateFormData = (data: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  const resetFormData = () => {
    setFormData(defaultFormData);
  };

  const exportToPDF = async () => {
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Please provide a title for the medical record before exporting.');
      return;
    }

    setIsExporting(true);
    try {
      const pdfData: PDFExportData = {
        title: formData.title,
        type: formData.type,
        description: formData.description,
        doctorName: formData.doctorName,
        hospitalName: formData.hospitalName,
        bloodPressure: formData.bloodPressure || undefined,
        heartRate: formData.heartRate || undefined,
        temperature: formData.temperature || undefined,
        weight: formData.weight || undefined,
        height: formData.height || undefined,
        medications: formData.medications || undefined,
        diagnosis: formData.diagnosis || undefined,
        date: new Date(),
      };

      await PDFExportService.exportAndShare(pdfData);
      Alert.alert('Success', 'Medical record exported successfully!');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      Alert.alert('Error', 'Failed to export medical record. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <ManualEntryContext.Provider value={{ formData, updateFormData, resetFormData, exportToPDF, isExporting }}>
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

// Default export for route compatibility
export default ManualEntryProvider;