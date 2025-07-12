import * as Print from 'expo-print';
import { shareAsync } from 'expo-sharing';
import { MedicalRecord, Medication } from '@/types/medical';

export interface PDFExportData {
  title: string;
  type: MedicalRecord["type"];
  description: string;
  doctorName: string;
  hospitalName: string;
  patientName?: string;
  patientAge?: string;
  patientSex?: string;
  patientAddress?: string;
  bloodPressure?: string;
  heartRate?: string;
  temperature?: string;
  weight?: string;
  height?: string;
  medications?: string;
  diagnosis?: string;
  date?: Date;
}

export interface HealthSummaryData {
  userProfile: {
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
  };
  medicalRecords: MedicalRecord[];
  generatedDate: Date;
}

export class PDFExportService {
  
  static formatRecordType(type: MedicalRecord["type"]): string {
    const typeMap = {
      'lab_report': 'Lab Report',
      'prescription': 'Prescription',
      'scan': 'Medical Scan',
      'consultation': 'Consultation',
      'vaccination': 'Vaccination',
      'allergy': 'Allergy Record',
      'insurance': 'Insurance Record',
      'other': 'Other Medical Record'
    };
    return typeMap[type] || 'Medical Record';
  }

  static formatDiseaseTitle(title: string): string {
    const diseaseMap: { [key: string]: string } = {
      'Annual Checkup': 'Routine Physical Examination',
      'Blood Testing': 'Laboratory Blood Work Analysis',
      'Chronic Stress': 'Chronic Stress Disorder',
      'Diabetes': 'Diabetes Mellitus',
      'Hypertension': 'Essential Hypertension',
      'Heart Disease': 'Cardiovascular Disease',
      'Asthma': 'Bronchial Asthma',
      'Migraine': 'Migraine Headache',
      'Arthritis': 'Arthritis (Joint Inflammation)',
      'Depression': 'Major Depressive Disorder',
      'Anxiety': 'Generalized Anxiety Disorder',
      'Obesity': 'Obesity (BMI >30)',
      'Insomnia': 'Sleep Disorder - Insomnia',
      'Allergies': 'Allergic Reaction',
      'Flu': 'Influenza',
      'Cold': 'Common Cold (Upper Respiratory Infection)',
      'Fever': 'Pyrexia (Elevated Body Temperature)',
      'Headache': 'Cephalgia (Headache)',
      'Back Pain': 'Lumbar Pain Syndrome',
      'Chest Pain': 'Chest Pain - Rule Out Cardiac Cause',
      'Shortness of Breath': 'Dyspnea (Difficulty Breathing)',
      'Fatigue': 'Chronic Fatigue Syndrome',
      'Nausea': 'Nausea and Vomiting',
      'Diarrhea': 'Acute Diarrhea',
      'Constipation': 'Chronic Constipation',
      'Skin Rash': 'Dermatitis (Skin Inflammation)',
      'Eye Infection': 'Conjunctivitis (Eye Infection)',
      'Ear Infection': 'Otitis Media (Ear Infection)',
      'Sore Throat': 'Pharyngitis (Throat Infection)',
      'Urinary Tract Infection': 'UTI (Urinary Tract Infection)',
      'Fracture': 'Bone Fracture',
      'Sprain': 'Ligament Sprain',
      'Burn': 'Thermal/Chemical Burn',
      'Cut': 'Laceration (Deep Cut)',
      'Bruise': 'Contusion (Bruising)',
      'Pregnancy': 'Pregnancy - Prenatal Care',
      'Menstrual Problems': 'Menstrual Irregularities',
      'Erectile Dysfunction': 'Erectile Dysfunction',
      'Prostate Problems': 'Prostate Enlargement/Issues',
      'Kidney Stones': 'Nephrolithiasis (Kidney Stones)',
      'Gallstones': 'Cholelithiasis (Gallstones)',
      'Ulcer': 'Peptic Ulcer Disease',
      'Gastritis': 'Gastric Inflammation',
      'Pneumonia': 'Pneumonia (Lung Infection)',
      'Bronchitis': 'Acute Bronchitis',
      'Sinusitis': 'Acute Sinusitis',
      'Tonsillitis': 'Acute Tonsillitis',
      'Appendicitis': 'Acute Appendicitis',
      'Hernia': 'Hernia (Abdominal Wall Defect)',
      'Varicose Veins': 'Varicose Veins',
      'Hemorrhoids': 'Hemorrhoids (Piles)',
      'Cataracts': 'Cataracts (Eye Lens Opacity)',
      'Glaucoma': 'Glaucoma (Increased Eye Pressure)',
      'Hearing Loss': 'Hearing Impairment',
      'Vertigo': 'Vertigo (Dizziness)',
      'Seizure': 'Seizure Disorder',
      'Stroke': 'Cerebrovascular Accident (Stroke)',
      'Memory Loss': 'Cognitive Impairment',
      'Parkinson': 'Parkinson\'s Disease',
      'Alzheimer': 'Alzheimer\'s Disease',
      'Cancer': 'Malignant Neoplasm',
      'Tumor': 'Neoplasm (Tumor)',
      'Cyst': 'Cystic Lesion',
      'Infection': 'Infectious Disease',
      'Inflammation': 'Inflammatory Condition',
      'Autoimmune': 'Autoimmune Disorder',
      'Genetic': 'Genetic Disorder',
      'Metabolic': 'Metabolic Disorder',
      'Hormonal': 'Endocrine Disorder',
      'Nutritional': 'Nutritional Deficiency',
      'Poisoning': 'Toxic Exposure/Poisoning',
      'Drug Reaction': 'Adverse Drug Reaction',
      'Overdose': 'Drug Overdose',
      'Withdrawal': 'Substance Withdrawal',
      'Addiction': 'Substance Use Disorder',
      'Mental Health': 'Mental Health Disorder',
      'Behavioral': 'Behavioral Disorder',
      'Developmental': 'Developmental Disorder',
      'Learning': 'Learning Disability',
      'Speech': 'Speech Disorder',
      'Vision': 'Visual Impairment',
      'Mobility': 'Mobility Impairment',
      'Chronic Pain': 'Chronic Pain Syndrome',
      'Disability': 'Physical Disability',
      'Rehabilitation': 'Rehabilitation Therapy',
      'Physical Therapy': 'Physical Therapy Treatment',
      'Occupational Therapy': 'Occupational Therapy',
      'Speech Therapy': 'Speech Language Therapy',
      'Counseling': 'Psychological Counseling',
      'Therapy': 'Therapeutic Intervention',
      'Surgery': 'Surgical Procedure',
      'Procedure': 'Medical Procedure',
      'Test': 'Diagnostic Test',
      'Scan': 'Medical Imaging',
      'X-ray': 'Radiographic Examination',
      'MRI': 'Magnetic Resonance Imaging',
      'CT Scan': 'Computed Tomography',
      'Ultrasound': 'Ultrasonography',
      'Blood Work': 'Laboratory Blood Analysis',
      'Urine Test': 'Urinalysis',
      'Biopsy': 'Tissue Biopsy',
      'Vaccination': 'Immunization',
      'Immunization': 'Vaccination/Immunization',
      'Checkup': 'Routine Medical Examination',
      'Follow-up': 'Follow-up Consultation',
      'Consultation': 'Medical Consultation',
      'Second Opinion': 'Second Opinion Consultation',
      'Referral': 'Specialist Referral',
      'Emergency': 'Emergency Medical Care',
      'Urgent Care': 'Urgent Medical Care',
      'Admission': 'Hospital Admission',
      'Discharge': 'Hospital Discharge',
      'Transfer': 'Patient Transfer',
      'Monitoring': 'Patient Monitoring',
      'Observation': 'Medical Observation',
      'Recovery': 'Medical Recovery',
      'Healing': 'Wound Healing',
      'Prevention': 'Preventive Medicine',
      'Screening': 'Medical Screening',
      'Wellness': 'Wellness Examination',
      'Health': 'Health Assessment',
      'Fitness': 'Physical Fitness Evaluation',
      'Nutrition': 'Nutritional Assessment',
      'Diet': 'Dietary Consultation',
      'Weight Management': 'Weight Management Program',
      'Exercise': 'Exercise Prescription',
      'Lifestyle': 'Lifestyle Modification',
      'Stress Management': 'Stress Management Program',
      'Sleep Study': 'Sleep Disorder Study',
      'Cardiac': 'Cardiac Evaluation',
      'Pulmonary': 'Pulmonary Function Test',
      'Neurological': 'Neurological Examination',
      'Orthopedic': 'Orthopedic Evaluation',
      'Dermatological': 'Dermatological Examination',
      'Ophthalmological': 'Eye Examination',
      'ENT': 'ENT (Ear, Nose, Throat) Examination',
      'Gynecological': 'Gynecological Examination',
      'Urological': 'Urological Examination',
      'Psychiatric': 'Psychiatric Evaluation',
      'Pediatric': 'Pediatric Examination',
      'Geriatric': 'Geriatric Assessment',
      'Occupational': 'Occupational Health Assessment',
      'Travel': 'Travel Medicine Consultation',
      'Sports': 'Sports Medicine Evaluation',
      'Worker Compensation': 'Worker\'s Compensation Evaluation',
      'Disability Assessment': 'Disability Medical Assessment',
      'Insurance Medical': 'Insurance Medical Examination',
      'Pre-Employment': 'Pre-Employment Medical Examination',
      'DOT Physical': 'DOT Physical Examination',
      'Immigration': 'Immigration Medical Examination',
      'School Physical': 'School Physical Examination',
      'Camp Physical': 'Camp Physical Examination',
      'Sports Physical': 'Sports Physical Examination'
    };
    
    // First try exact match
    if (diseaseMap[title]) {
      return diseaseMap[title];
    }
    
    // Then try case-insensitive match
    const lowerTitle = title.toLowerCase();
    for (const [key, value] of Object.entries(diseaseMap)) {
      if (key.toLowerCase() === lowerTitle) {
        return value;
      }
    }
    
    // If no match found, return the original title with proper formatting
    return title.charAt(0).toUpperCase() + title.slice(1);
  }

  static formatDate(date: Date | string | undefined): string {
    let dateObj: Date;
    
    if (!date) {
      dateObj = new Date();
    } else if (typeof date === 'string') {
      dateObj = new Date(date);
    } else if (date instanceof Date) {
      dateObj = date;
    } else {
      dateObj = new Date();
    }
    
    // Validate the date object
    if (isNaN(dateObj.getTime())) {
      dateObj = new Date();
    }
    
    return dateObj.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  static generateHTML(data: PDFExportData): string {
    const currentDate = data.date || new Date();
    const formattedDate = this.formatDate(currentDate);
    const recordType = this.formatRecordType(data.type);
    const formattedDiseaseTitle = this.formatDiseaseTitle(data.title);

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Medical Record - ${data.title}</title>
        <style>
          body {
            font-family: 'Arial', 'Helvetica', sans-serif;
            line-height: 1.4;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 0;
            background-color: #fff;
          }
          .prescription-container {
            border: 2px solid #1e40af;
            min-height: 100vh;
            position: relative;
            display: flex;
            flex-direction: column;
          }
          .header {
            background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
            color: white;
            padding: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            position: relative;
          }
          .header::before {
            content: '';
            position: absolute;
            left: 0;
            top: 0;
            bottom: 0;
            width: 20px;
            background: #0ea5e9;
          }
          .logo-section {
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .logo {
            background-color: white;
            color: #1e40af;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: bold;
            font-size: 14px;
          }
          .doctor-info {
            text-align: left;
            flex-grow: 1;
            margin-left: 20px;
          }
          .doctor-name {
            font-size: 24px;
            font-weight: bold;
            margin: 0;
          }
          .doctor-specialty {
            font-size: 14px;
            margin: 2px 0;
            opacity: 0.9;
          }
          .doctor-credentials {
            font-size: 12px;
            margin: 2px 0;
            opacity: 0.8;
          }
          .hospital-info {
            font-size: 12px;
            margin: 5px 0 0 0;
            opacity: 0.8;
          }
          .date-section {
            text-align: right;
            color: white;
          }
          .date-label {
            font-size: 12px;
            margin-bottom: 5px;
          }
          .date-value {
            font-size: 14px;
            font-weight: bold;
          }
          .stethoscope-icon {
            position: absolute;
            right: 20px;
            top: 50%;
            transform: translateY(-50%);
            font-size: 48px;
            color: rgba(255, 255, 255, 0.2);
          }
          .content-area {
            display: flex;
            padding: 30px;
            gap: 30px;
            flex-grow: 1;
          }
          .rx-section {
            width: 100px;
            flex-shrink: 0;
          }
          .rx-symbol {
            font-size: 72px;
            font-weight: bold;
            color: #1e40af;
            font-family: 'Times New Roman', serif;
            text-align: center;
            margin-bottom: 20px;
          }
          .patient-info {
            flex-grow: 1;
          }
          .patient-fields {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
          }
          .field-group {
            display: flex;
            flex-direction: column;
          }
          .field-label {
            font-weight: bold;
            color: #374151;
            font-size: 14px;
            margin-bottom: 5px;
          }
          .field-value {
            color: #1e40af;
            font-size: 16px;
            font-weight: 500;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 5px;
            min-height: 20px;
          }
          .prescription-content {
            margin-top: 30px;
            border-top: 2px solid #e5e7eb;
            padding-top: 20px;
          }
          .section-title {
            font-size: 18px;
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 15px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .description {
            background-color: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #1e40af;
            font-size: 16px;
            line-height: 1.6;
            margin-bottom: 20px;
          }
          .vital-signs {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
          }
          .vital-card {
            background-color: #ffffff;
            border: 1px solid #1e40af;
            border-radius: 8px;
            padding: 15px;
            text-align: center;
            box-shadow: 0 2px 4px rgba(30, 64, 175, 0.1);
          }
          .vital-label {
            font-weight: bold;
            color: #374151;
            font-size: 12px;
            margin-bottom: 5px;
            text-transform: uppercase;
          }
          .vital-value {
            font-size: 18px;
            color: #1e40af;
            font-weight: bold;
          }
          .medications {
            background-color: #fef7ff;
            border: 1px solid #a855f7;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
          }
          .medications ul {
            margin: 10px 0;
            padding-left: 20px;
          }
          .medications li {
            margin-bottom: 8px;
            font-size: 16px;
            line-height: 1.5;
          }
          .diagnosis {
            background-color: #f0f9ff;
            border: 1px solid #0ea5e9;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
          }
          .section {
            margin-bottom: 20px;
          }
          .footer {
            background-color: #1e40af;
            color: white;
            padding: 15px 30px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 12px;
            margin-top: auto;
          }
          .footer-left {
            display: flex;
            flex-direction: column;
          }
          .footer-right {
            text-align: right;
          }
          .qr-placeholder {
            width: 40px;
            height: 40px;
            background-color: white;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            color: #1e40af;
            font-weight: bold;
          }
          @media print {
            body {
              padding: 0;
              margin: 0;
            }
            .prescription-container {
              border: none;
              min-height: auto;
            }
            .header {
              break-inside: avoid;
            }
            .content-area {
              break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        <div class="prescription-container">
          <div class="header">
            <div class="logo-section">
              <div class="logo">MedWise</div>
            </div>
            <div class="doctor-info">
              <h1 class="doctor-name">${data.doctorName || 'Dr. [Doctor Name]'}</h1>
              <div class="doctor-specialty">${recordType} Specialist</div>
              <div class="doctor-credentials">MBBS, MD | Medicine, MCPS</div>
              <div class="hospital-info">${data.hospitalName || 'Hospital or Department Name Here'}</div>
            </div>
            <div class="date-section">
              <div class="date-label">Date:</div>
              <div class="date-value">${formattedDate}</div>
            </div>
            <div class="stethoscope-icon">🩺</div>
          </div>

          <div class="content-area">
            <div class="rx-section">
              <div class="rx-symbol">℞</div>
            </div>
            <div class="patient-info">
              <div class="patient-fields">
                <div class="field-group">
                  <div class="field-label">Name:</div>
                  <div class="field-value">${data.patientName || 'John Doe'}</div>
                </div>
                <div class="field-group">
                  <div class="field-label">Age:</div>
                  <div class="field-value">${data.patientAge || '35 years'}</div>
                </div>
                <div class="field-group">
                  <div class="field-label">Sex:</div>
                  <div class="field-value">${data.patientSex || 'Male'}</div>
                </div>
                <div class="field-group">
                  <div class="field-label">Address:</div>
                  <div class="field-value">${data.patientAddress || '123 Main Street, City, State 12345'}</div>
                </div>
              </div>

              <div class="prescription-content">
                <div class="section">
                  <div class="section-title">Chief Complaint</div>
                  <div class="description">
                    <strong>Disease Detected:</strong> ${formattedDiseaseTitle}
                    ${data.description ? `<br><br><strong>Additional Notes:</strong> ${data.description}` : ''}
                  </div>
                </div>

                ${this.hasVitalSigns(data) ? `
                <div class="section">
                  <div class="section-title">Vital Signs</div>
                  <div class="vital-signs">
                    ${data.bloodPressure ? `
                    <div class="vital-card">
                      <div class="vital-label">Blood Pressure</div>
                      <div class="vital-value">${data.bloodPressure}</div>
                    </div>
                    ` : ''}
                    ${data.heartRate ? `
                    <div class="vital-card">
                      <div class="vital-label">Heart Rate</div>
                      <div class="vital-value">${data.heartRate} bpm</div>
                    </div>
                    ` : ''}
                    ${data.temperature ? `
                    <div class="vital-card">
                      <div class="vital-label">Temperature</div>
                      <div class="vital-value">${data.temperature}°F</div>
                    </div>
                    ` : ''}
                    ${data.weight ? `
                    <div class="vital-card">
                      <div class="vital-label">Weight</div>
                      <div class="vital-value">${data.weight} lbs</div>
                    </div>
                    ` : ''}
                    ${data.height ? `
                    <div class="vital-card">
                      <div class="vital-label">Height</div>
                      <div class="vital-value">${data.height} ft</div>
                    </div>
                    ` : ''}
                  </div>
                </div>
                ` : ''}

                ${data.medications ? `
                <div class="section">
                  <div class="section-title">℞ Medications Prescribed</div>
                  <div class="medications">
                    <ul>
                      ${data.medications.split(',').map(med => `<li>${med.trim()}</li>`).join('')}
                    </ul>
                  </div>
                </div>
                ` : ''}

                ${data.diagnosis ? `
                <div class="section">
                  <div class="section-title">Diagnosis</div>
                  <div class="diagnosis">
                    <div style="font-size: 16px; line-height: 1.6;">${data.diagnosis}</div>
                  </div>
                </div>
                ` : ''}
              </div>
            </div>
          </div>

          <div class="footer">
            <div class="footer-left">
              <div>📞 123-456-7890, 444-666-8899</div>
              <div>✉️ contact@medwise.com | 🌐 www.medwise.com</div>
            </div>
            <div class="footer-right">
              <div>Days: Mon, Tue, Wed, Thu, Fri</div>
              <div>Timings: 05:00 PM - 08:30 PM</div>
            </div>
            <div class="qr-placeholder">QR</div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  static generateHealthSummaryHTML(data: HealthSummaryData): string {
    const formattedDate = this.formatDate(data.generatedDate);
    const recordsByType = this.groupRecordsByType(data.medicalRecords);
    const recentRecords = this.getRecentRecords(data.medicalRecords, 5);
    const allMedications = this.extractAllMedications(data.medicalRecords);
    const allDiagnoses = this.extractAllDiagnoses(data.medicalRecords);
    const vitalSignsSummary = this.getLatestVitalSigns(data.medicalRecords);

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Health Summary - ${data.userProfile.name}</title>
        <style>
          body {
            font-family: 'Arial', 'Helvetica', sans-serif;
            line-height: 1.4;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 0;
            background-color: #fff;
          }
          .health-summary-container {
            border: 2px solid #1e40af;
            min-height: 100vh;
            position: relative;
            display: flex;
            flex-direction: column;
          }
          .header {
            background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
            color: white;
            padding: 25px;
            text-align: center;
            position: relative;
          }
          .header::before {
            content: '';
            position: absolute;
            left: 0;
            top: 0;
            bottom: 0;
            width: 20px;
            background: #0ea5e9;
          }
          .header h1 {
            font-size: 28px;
            margin: 0 0 10px 0;
            font-weight: bold;
          }
          .header .subtitle {
            font-size: 16px;
            opacity: 0.9;
            margin-bottom: 5px;
          }
          .header .date {
            font-size: 14px;
            opacity: 0.8;
          }
          .logo {
            position: absolute;
            top: 20px;
            left: 40px;
            background-color: white;
            color: #1e40af;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: bold;
            font-size: 14px;
          }
          .health-icon {
            position: absolute;
            right: 25px;
            top: 25px;
            font-size: 48px;
            color: rgba(255, 255, 255, 0.2);
          }
          .content {
            padding: 30px;
            flex-grow: 1;
          }
          .section {
            margin-bottom: 30px;
            break-inside: avoid;
          }
          .section-title {
            font-size: 20px;
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 15px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-bottom: 2px solid #1e40af;
            padding-bottom: 5px;
          }
          .patient-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 20px;
          }
          .info-card {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
          }
          .info-card h3 {
            font-size: 16px;
            font-weight: bold;
            color: #1e40af;
            margin: 0 0 15px 0;
          }
          .info-item {
            margin-bottom: 10px;
          }
          .info-label {
            font-weight: bold;
            color: #374151;
            font-size: 14px;
          }
          .info-value {
            color: #1e40af;
            font-size: 16px;
            font-weight: 500;
          }
          .records-summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
          }
          .record-type-card {
            background-color: #ffffff;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            padding: 15px;
            text-align: center;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
          }
          .record-count {
            font-size: 24px;
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 5px;
          }
          .record-label {
            font-size: 12px;
            color: #6b7280;
            text-transform: uppercase;
            font-weight: 500;
          }
          .medications-list {
            background-color: #fef7ff;
            border: 1px solid #a855f7;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
          }
          .medications-list ul {
            margin: 0;
            padding-left: 20px;
          }
          .medications-list li {
            margin-bottom: 8px;
            font-size: 14px;
            line-height: 1.5;
          }
          .diagnoses-list {
            background-color: #f0f9ff;
            border: 1px solid #0ea5e9;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
          }
          .diagnoses-list ul {
            margin: 0;
            padding-left: 20px;
          }
          .diagnoses-list li {
            margin-bottom: 8px;
            font-size: 14px;
            line-height: 1.5;
          }
          .vitals-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
          }
          .vital-card {
            background-color: #ffffff;
            border: 1px solid #1e40af;
            border-radius: 8px;
            padding: 15px;
            text-align: center;
          }
          .vital-label {
            font-weight: bold;
            color: #374151;
            font-size: 12px;
            margin-bottom: 5px;
            text-transform: uppercase;
          }
          .vital-value {
            font-size: 18px;
            color: #1e40af;
            font-weight: bold;
          }
          .recent-records {
            background-color: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 20px;
          }
          .record-item {
            background-color: white;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            padding: 15px;
            margin-bottom: 15px;
          }
          .record-item:last-child {
            margin-bottom: 0;
          }
          .record-title {
            font-weight: bold;
            color: #1e40af;
            font-size: 16px;
            margin-bottom: 5px;
          }
          .record-date {
            color: #6b7280;
            font-size: 12px;
            margin-bottom: 5px;
          }
          .record-type {
            display: inline-block;
            padding: 2px 8px;
            background-color: #e5e7eb;
            border-radius: 12px;
            font-size: 10px;
            font-weight: 500;
            color: #374151;
            text-transform: uppercase;
          }
          .allergies-warning {
            background-color: #fef2f2;
            border: 1px solid #f87171;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 20px;
          }
          .allergies-warning h4 {
            color: #dc2626;
            margin: 0 0 10px 0;
            font-size: 16px;
          }
          .allergies-warning ul {
            margin: 0;
            padding-left: 20px;
          }
          .allergies-warning li {
            color: #dc2626;
            font-weight: 500;
            margin-bottom: 5px;
          }
          .emergency-contact {
            background-color: #ecfdf5;
            border: 1px solid #10b981;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 20px;
          }
          .emergency-contact h4 {
            color: #059669;
            margin: 0 0 10px 0;
            font-size: 16px;
          }
          .contact-info {
            color: #065f46;
            font-weight: 500;
          }
          .footer {
            background-color: #1e40af;
            color: white;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            margin-top: auto;
          }
          .footer-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .footer-left, .footer-right {
            text-align: left;
          }
          .footer-center {
            text-align: center;
          }
          .qr-placeholder {
            width: 50px;
            height: 50px;
            background-color: white;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            color: #1e40af;
            font-weight: bold;
          }
          @media print {
            body {
              padding: 0;
              margin: 0;
            }
            .health-summary-container {
              border: none;
            }
            .section {
              break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        <div class="health-summary-container">
          <div class="header">
            <div class="logo">MedWise</div>
            <h1>Comprehensive Health Summary</h1>
            <div class="subtitle">Complete Medical Overview for ${data.userProfile.name}</div>
            <div class="date">Generated on ${formattedDate}</div>
            <div class="health-icon">🏥</div>
          </div>

          <div class="content">
            <!-- Patient Information -->
            <div class="section">
              <div class="section-title">Patient Information</div>
              <div class="patient-info">
                <div class="info-card">
                  <h3>Personal Details</h3>
                  <div class="info-item">
                    <span class="info-label">Name:</span>
                    <div class="info-value">${data.userProfile.name}</div>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Age:</span>
                    <div class="info-value">${data.userProfile.age} years</div>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Gender:</span>
                    <div class="info-value">${data.userProfile.gender.charAt(0).toUpperCase() + data.userProfile.gender.slice(1)}</div>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Blood Type:</span>
                    <div class="info-value">${data.userProfile.bloodType}</div>
                  </div>
                </div>
                <div class="info-card">
                  <h3>Medical Overview</h3>
                  <div class="info-item">
                    <span class="info-label">Total Records:</span>
                    <div class="info-value">${data.medicalRecords.length}</div>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Chronic Conditions:</span>
                    <div class="info-value">${data.userProfile.chronicConditions.length}</div>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Active Medications:</span>
                    <div class="info-value">${allMedications.length}</div>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Known Allergies:</span>
                    <div class="info-value">${data.userProfile.allergies.length}</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Medical Records Summary -->
            <div class="section">
              <div class="section-title">Medical Records Summary</div>
              <div class="records-summary">
                <div class="record-type-card">
                  <div class="record-count">${recordsByType.lab_report || 0}</div>
                  <div class="record-label">Lab Reports</div>
                </div>
                <div class="record-type-card">
                  <div class="record-count">${recordsByType.prescription || 0}</div>
                  <div class="record-label">Prescriptions</div>
                </div>
                <div class="record-type-card">
                  <div class="record-count">${recordsByType.scan || 0}</div>
                  <div class="record-label">Medical Scans</div>
                </div>
                <div class="record-type-card">
                  <div class="record-count">${recordsByType.consultation || 0}</div>
                  <div class="record-label">Consultations</div>
                </div>
                <div class="record-type-card">
                  <div class="record-count">${recordsByType.other || 0}</div>
                  <div class="record-label">Other Records</div>
                </div>
              </div>
            </div>

            <!-- Allergies Warning -->
            ${data.userProfile.allergies.length > 0 ? `
            <div class="section">
              <div class="allergies-warning">
                <h4>⚠️ ALLERGIES WARNING</h4>
                <ul>
                  ${data.userProfile.allergies.map(allergy => `<li>${allergy}</li>`).join('')}
                </ul>
              </div>
            </div>
            ` : ''}

            <!-- Emergency Contact -->
            <div class="section">
              <div class="emergency-contact">
                <h4>🚨 Emergency Contact</h4>
                <div class="contact-info">
                  <strong>${data.userProfile.emergencyContact.name}</strong><br>
                  ${data.userProfile.emergencyContact.phone}
                </div>
              </div>
            </div>

            <!-- Latest Vital Signs -->
            ${vitalSignsSummary ? `
            <div class="section">
              <div class="section-title">Latest Vital Signs</div>
              <div class="vitals-grid">
                ${vitalSignsSummary.bloodPressure ? `
                <div class="vital-card">
                  <div class="vital-label">Blood Pressure</div>
                  <div class="vital-value">${vitalSignsSummary.bloodPressure}</div>
                </div>
                ` : ''}
                ${vitalSignsSummary.heartRate ? `
                <div class="vital-card">
                  <div class="vital-label">Heart Rate</div>
                  <div class="vital-value">${vitalSignsSummary.heartRate} bpm</div>
                </div>
                ` : ''}
                ${vitalSignsSummary.temperature ? `
                <div class="vital-card">
                  <div class="vital-label">Temperature</div>
                  <div class="vital-value">${vitalSignsSummary.temperature}°F</div>
                </div>
                ` : ''}
                ${vitalSignsSummary.weight ? `
                <div class="vital-card">
                  <div class="vital-label">Weight</div>
                  <div class="vital-value">${vitalSignsSummary.weight} lbs</div>
                </div>
                ` : ''}
                ${vitalSignsSummary.height ? `
                <div class="vital-card">
                  <div class="vital-label">Height</div>
                  <div class="vital-value">${vitalSignsSummary.height} ft</div>
                </div>
                ` : ''}
              </div>
            </div>
            ` : ''}

            <!-- Current Medications -->
            ${allMedications.length > 0 ? `
            <div class="section">
              <div class="section-title">Current Medications</div>
              <div class="medications-list">
                <ul>
                  ${allMedications.map(med => `
                    <li><strong>${med.name}</strong> - ${med.dosage} - ${med.frequency}${med.duration ? ` (${med.duration})` : ''}</li>
                  `).join('')}
                </ul>
              </div>
            </div>
            ` : ''}

            <!-- Chronic Conditions -->
            ${data.userProfile.chronicConditions.length > 0 ? `
            <div class="section">
              <div class="section-title">Chronic Conditions</div>
              <div class="diagnoses-list">
                <ul>
                  ${data.userProfile.chronicConditions.map(condition => `<li>${condition}</li>`).join('')}
                </ul>
              </div>
            </div>
            ` : ''}

            <!-- Recent Diagnoses -->
            ${allDiagnoses.length > 0 ? `
            <div class="section">
              <div class="section-title">Recent Diagnoses</div>
              <div class="diagnoses-list">
                <ul>
                  ${allDiagnoses.map(diagnosis => `<li>${diagnosis}</li>`).join('')}
                </ul>
              </div>
            </div>
            ` : ''}

            <!-- Recent Medical Records -->
            ${recentRecords.length > 0 ? `
            <div class="section">
              <div class="section-title">Recent Medical Records</div>
              <div class="recent-records">
                ${recentRecords.map(record => `
                  <div class="record-item">
                    <div class="record-title">${record.title}</div>
                    <div class="record-date">${this.formatDate(record.date)}</div>
                    <span class="record-type">${record.type.replace('_', ' ')}</span>
                    ${record.description ? `<div style="margin-top: 10px; color: #374151;">${record.description}</div>` : ''}
                  </div>
                `).join('')}
              </div>
            </div>
            ` : ''}
          </div>

          <div class="footer">
            <div class="footer-content">
              <div class="footer-left">
                <div>Generated by MedWise</div>
                <div>📞 123-456-7890</div>
              </div>
              <div class="footer-center">
                <div>Complete Health Summary</div>
                <div>Confidential Medical Document</div>
              </div>
              <div class="footer-right">
                <div>✉️ contact@medwise.com</div>
                <div>🌐 www.medwise.com</div>
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Helper methods for health summary
  static groupRecordsByType(records: MedicalRecord[]): { [key: string]: number } {
    const groups: { [key: string]: number } = {};
    records.forEach(record => {
      groups[record.type] = (groups[record.type] || 0) + 1;
    });
    return groups;
  }

  static getRecentRecords(records: MedicalRecord[], limit: number = 5): MedicalRecord[] {
    return records
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
  }

  static extractAllMedications(records: MedicalRecord[]): Medication[] {
    const medications: Medication[] = [];
    records.forEach(record => {
      if (record.extractedData?.medications) {
        medications.push(...record.extractedData.medications);
      }
    });
    return medications;
  }

  static extractAllDiagnoses(records: MedicalRecord[]): string[] {
    const diagnoses: string[] = [];
    records.forEach(record => {
      if (record.extractedData?.diagnosis) {
        diagnoses.push(...record.extractedData.diagnosis);
      }
    });
    return Array.from(new Set(diagnoses)); // Remove duplicates
  }

  static getLatestVitalSigns(records: MedicalRecord[]): any | null {
    const recordsWithVitals = records.filter(record => 
      record.extractedData && (
        record.extractedData.bloodPressure ||
        record.extractedData.heartRate ||
        record.extractedData.temperature ||
        record.extractedData.weight ||
        record.extractedData.height
      )
    );

    if (recordsWithVitals.length === 0) return null;

    // Get the most recent record with vitals
    const latestRecord = recordsWithVitals.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )[0];

    return latestRecord.extractedData;
  }

  static async exportToPDF(data: PDFExportData): Promise<string> {
    try {
      const html = this.generateHTML(data);
      
      const { uri } = await Print.printToFileAsync({
        html,
        base64: false,
        width: 612,
        height: 792,
        margins: {
          left: 20,
          top: 20,
          right: 20,
          bottom: 20,
        }
      });

      return uri;
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw new Error('Failed to generate PDF');
    }
  }

  static async exportAndShare(data: PDFExportData): Promise<void> {
    try {
      const pdfUri = await this.exportToPDF(data);
      const fileName = `${data.title.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().getTime()}.pdf`;
      
      await shareAsync(pdfUri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Share Medical Record',
        UTI: 'com.adobe.pdf'
      });
    } catch (error) {
      console.error('Error sharing PDF:', error);
      throw new Error('Failed to share PDF');
    }
  }

  static async exportHealthSummaryToPDF(data: HealthSummaryData): Promise<string> {
    try {
      const html = this.generateHealthSummaryHTML(data);
      
      const { uri } = await Print.printToFileAsync({
        html,
        base64: false,
        width: 612,
        height: 792,
        margins: {
          left: 20,
          top: 20,
          right: 20,
          bottom: 20,
        }
      });

      return uri;
    } catch (error) {
      console.error('Error generating Health Summary PDF:', error);
      throw new Error('Failed to generate Health Summary PDF');
    }
  }

  static async exportHealthSummaryAndShare(data: HealthSummaryData): Promise<void> {
    try {
      const pdfUri = await this.exportHealthSummaryToPDF(data);
      const fileName = `Health_Summary_${data.userProfile.name.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().getTime()}.pdf`;
      
      await shareAsync(pdfUri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Share Health Summary',
        UTI: 'com.adobe.pdf'
      });
    } catch (error) {
      console.error('Error sharing Health Summary PDF:', error);
      throw new Error('Failed to share Health Summary PDF');
    }
  }

  static async exportHealthSummary(data: HealthSummaryData): Promise<string> {
    try {
      const html = this.generateHealthSummaryHTML(data);
      
      const { uri } = await Print.printToFileAsync({
        html,
        base64: false,
        width: 612,
        height: 792,
        margins: {
          left: 20,
          top: 20,
          right: 20,
          bottom: 20,
        }
      });

      return uri;
    } catch (error) {
      console.error('Error generating health summary PDF:', error);
      throw new Error('Failed to generate health summary PDF');
    }
  }

  static async exportAndShareHealthSummary(data: HealthSummaryData): Promise<void> {
    try {
      const pdfUri = await this.exportHealthSummary(data);
      const fileName = `Health_Summary_${data.userProfile.name.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().getTime()}.pdf`;
      
      await shareAsync(pdfUri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Share Health Summary',
        UTI: 'com.adobe.pdf'
      });
    } catch (error) {
      console.error('Error sharing health summary PDF:', error);
      throw new Error('Failed to share health summary PDF');
    }
  }

  static hasVitalSigns(data: PDFExportData): boolean {
    return !!(data.bloodPressure || data.heartRate || data.temperature || data.weight || data.height);
  }
}
