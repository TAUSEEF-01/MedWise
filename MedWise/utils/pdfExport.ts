import * as Print from 'expo-print';
import { shareAsync } from 'expo-sharing';
import { MedicalRecord } from '@/types/medical';

export interface PDFExportData {
  title: string;
  type: MedicalRecord["type"];
  description: string;
  doctorName: string;
  hospitalName: string;
  bloodPressure?: string;
  heartRate?: string;
  temperature?: string;
  weight?: string;
  height?: string;
  medications?: string;
  diagnosis?: string;
  date?: Date;
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

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Medical Record - ${data.title}</title>
        <style>
          body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #fff;
          }
          .header {
            text-align: center;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .header h1 {
            color: #2563eb;
            font-size: 28px;
            margin: 0;
            font-weight: bold;
          }
          .header h2 {
            color: #64748b;
            font-size: 16px;
            margin: 5px 0 0 0;
            font-weight: normal;
          }
          .metadata {
            background-color: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
            border-left: 4px solid #2563eb;
          }
          .metadata-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
          }
          .metadata-item {
            display: flex;
            flex-direction: column;
          }
          .metadata-label {
            font-weight: bold;
            color: #374151;
            font-size: 14px;
            margin-bottom: 5px;
          }
          .metadata-value {
            color: #6b7280;
            font-size: 16px;
          }
          .section {
            margin-bottom: 30px;
          }
          .section-title {
            font-size: 20px;
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 15px;
            padding-bottom: 8px;
            border-bottom: 2px solid #e5e7eb;
          }
          .description {
            background-color: #f9fafb;
            padding: 20px;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
            font-size: 16px;
            line-height: 1.7;
          }
          .vital-signs {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-top: 20px;
          }
          .vital-card {
            background-color: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 15px;
            text-align: center;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          }
          .vital-label {
            font-weight: bold;
            color: #374151;
            font-size: 14px;
            margin-bottom: 5px;
          }
          .vital-value {
            font-size: 18px;
            color: #2563eb;
            font-weight: bold;
          }
          .medications, .diagnosis {
            background-color: #fef7ff;
            border: 1px solid #e879f9;
            border-radius: 8px;
            padding: 20px;
            margin-top: 15px;
          }
          .medications ul, .diagnosis ul {
            margin: 10px 0;
            padding-left: 20px;
          }
          .medications li, .diagnosis li {
            margin-bottom: 5px;
            font-size: 16px;
          }
          .footer {
            margin-top: 50px;
            text-align: center;
            font-size: 12px;
            color: #9ca3af;
            border-top: 1px solid #e5e7eb;
            padding-top: 20px;
          }
          .logo {
            display: inline-block;
            background-color: #2563eb;
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: bold;
            font-size: 14px;
            margin-bottom: 10px;
          }
          @media print {
            body {
              padding: 10px;
            }
            .header {
              break-inside: avoid;
            }
            .section {
              break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">MedWise</div>
          <h1>${data.title}</h1>
          <h2>${recordType}</h2>
        </div>

        <div class="metadata">
          <div class="metadata-grid">
            <div class="metadata-item">
              <div class="metadata-label">Date Created</div>
              <div class="metadata-value">${formattedDate}</div>
            </div>
            <div class="metadata-item">
              <div class="metadata-label">Record Type</div>
              <div class="metadata-value">${recordType}</div>
            </div>
            ${data.doctorName ? `
            <div class="metadata-item">
              <div class="metadata-label">Doctor</div>
              <div class="metadata-value">${data.doctorName}</div>
            </div>
            ` : ''}
            ${data.hospitalName ? `
            <div class="metadata-item">
              <div class="metadata-label">Hospital/Clinic</div>
              <div class="metadata-value">${data.hospitalName}</div>
            </div>
            ` : ''}
          </div>
        </div>

        ${data.description ? `
        <div class="section">
          <div class="section-title">Description</div>
          <div class="description">${data.description}</div>
        </div>
        ` : ''}

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
          <div class="section-title">Medications</div>
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

        <div class="footer">
          <p>This medical record was generated by MedWise on ${formattedDate}</p>
          <p>For questions or concerns, please consult with your healthcare provider.</p>
        </div>
      </body>
      </html>
    `;
  }

  static hasVitalSigns(data: PDFExportData): boolean {
    return !!(data.bloodPressure || data.heartRate || data.temperature || data.weight || data.height);
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
}
