import * as PDFDocument from 'pdfkit';
import { Prescription } from '../models/Prescription';
import { Doctor } from '../models/Doctor';
import { PrescriptionMedicine } from '../models/PrescriptionMedicine';
import { DRIVERMASTER } from '../models/DriverMaster';
import { User } from '../models/User';
import * as https from 'https';
import * as http from 'http';
import * as path from 'path';
import * as fs from 'fs';
import { URL } from 'url';
import { resolvePatientAge } from './patient-age.util';

/**
 * Interface for vitals data structure
 */
interface VitalsData {
  // Simple format properties
  temperature?: string;
  systolicBP?: string;
  diastolicBP?: string;
  spo2?: string;
  height?: string;
  weight?: string;
  bloodSugar?: string;  // Added for blood sugar
  haemoglobin?: string; // Added for haemoglobin
  
  // Legacy nested format properties
  temperature_unit?: { value?: string };
  blood_pressure_unit?: {
    systolic_bp_unit?: { value?: string };
    diastolic_bp_unit?: { value?: string };
  };
  spo2_unit?: { value?: string };
  bmi_unit?: { 
    height?: string;
    weight?: string;
  };
  [key: string]: any;
}

/**
 * Downloads an image from a URL and returns it as a buffer
 */
function getImageFromUrl(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    // Remove @ symbol if present at the beginning of the URL
    if (url.startsWith('@')) {
      url = url.substring(1);
    }

    const parsedUrl = new URL(url);
    const protocol = parsedUrl.protocol === 'https:' ? https : http;

    protocol.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        // Handle redirects
        if (response.headers.location) {
          return getImageFromUrl(response.headers.location)
            .then(resolve)
            .catch(reject);
        }
      }

      if (response.statusCode !== 200) {
        return reject(new Error(`Failed to fetch image: ${response.statusCode} ${response.statusMessage}`));
      }
      
      const chunks: Buffer[] = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
      response.on('error', reject);
    }).on('error', reject);
  });
}

/**
 * Format date to DD/MM/YYYY format
 */
function formatDate(dateString: string | Date): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch (e) {
    console.error('Error formatting date:', e);
    return '-';
  }
}

/**
 * Extracts advice items from a stringified set/array (e.g., '{"A","B"}')
 */
function extractAdviceItems(str: string): string[] {
  // Remove leading/trailing braces and quotes
  let cleaned = str.trim();
  if ((cleaned.startsWith('{') && cleaned.endsWith('}')) || (cleaned.startsWith('[') && cleaned.endsWith(']'))) {
    cleaned = cleaned.slice(1, -1);
  }
  // Split by comma, remove quotes, trim
  return cleaned
    .split(/","|",\s*"|, ?/)
    .map(s => s.replace(/^\"|\"$/g, '').trim())
    .filter(Boolean);
}

/**
 * Normalizes advice fields (preventive_advice, instructions) to a clean string or comma-separated list.
 * Handles arrays, stringified sets/arrays, objects, or plain strings.
 */
function normalizeAdviceField(input: unknown): string {
  if (input == null) return '-';
  if (Array.isArray(input)) {
    // Flatten all advice items from array elements
    const items: string[] = [];
    for (const el of input) {
      if (typeof el === 'string') {
        // If string looks like a set/array, extract items
        if ((el.startsWith('{') && el.endsWith('}')) || (el.startsWith('[') && el.endsWith(']'))) {
          items.push(...extractAdviceItems(el));
        } else {
          items.push(el);
        }
      } else {
        items.push(String(el));
      }
    }
    return items.length > 0 ? items.join(', ') : '-';
  }
  if (typeof input === 'string') {
    // Try to parse stringified JSON
    try {
      const parsed = JSON.parse(input);
      if (Array.isArray(parsed)) {
        return normalizeAdviceField(parsed);
      }
      if (typeof parsed === 'string') {
        return parsed;
      }
      if (typeof parsed === 'object' && parsed !== null) {
        const values = Object.values(parsed).filter(v => typeof v === 'string');
        if (values.length > 0) return values.join(', ');
        // Special case: object with a single key that is a stringified array or set
        const keys = Object.keys(parsed);
        if (keys.length === 1) {
          let key = keys[0];
          // Try to parse as JSON array
          try {
            const arr = JSON.parse(key);
            if (Array.isArray(arr)) {
              return arr.map(String).join(', ');
            }
          } catch {
            // Not a JSON array, try to extract advice items
            const items = extractAdviceItems(key);
            if (items.length > 0) {
              return items.join(', ');
            }
          }
        }
        return '-';
      }
    } catch {
      // Not a JSON string, check if it looks like a set/array
      if ((input.startsWith('{') && input.endsWith('}')) || (input.startsWith('[') && input.endsWith(']'))) {
        const items = extractAdviceItems(input);
        if (items.length > 0) return items.join(', ');
      }
      return input;
    }
    return input;
  }
  // Fallback: convert to string
  return String(input);
}

type PrescriptionPdfTemplate = 'standard' | 'govJharkhand';
interface GeneratePrescriptionPdfOptions { template?: PrescriptionPdfTemplate }

/**
 * Generates a PDF prescription document based on the provided data
 */
export const generatePrescriptionPdf = async (
  prescription: Prescription,
  doctor: Doctor & { user?: User },
  patient: DRIVERMASTER,
  medicines: PrescriptionMedicine[],
  options: GeneratePrescriptionPdfOptions = {},
): Promise<Buffer> => {
  return new Promise(async (resolve, reject) => {

    console.log("prescription is" , JSON.stringify(prescription , null ,2))
    console.log("medicines is" , JSON.stringify(medicines, null ,2))
    try {
      // Pre-fetch the signature image if it exists
      let signatureBuffer: Buffer | null = null;
      if (doctor.signature) {
        try {
          console.log('Fetching signature from:', doctor.signature);
          signatureBuffer = await getImageFromUrl(doctor.signature);
          console.log('Signature fetched successfully');
        } catch (e) {
          console.error('Error pre-fetching signature image:', e);
        }
      }
      
      // Load header images directly from assets
      let logoBuffer: Buffer | null = null; // center logo (LMC)
      let headerLeftBuffer: Buffer | null = null; // JharkhandGov
      let headerRightBuffer: Buffer | null = null; // NHM

      const assetsBasePath = path.resolve(process.cwd(), 'assets');
      const logoPath = path.join(assetsBasePath, 'Last-Mile-Care_logo.jpg');
      const leftLogoPath = path.join(assetsBasePath, 'JharkhandGov_logo.jpeg');
      const rightLogoPath = path.join(assetsBasePath, 'NHM_logo.jpeg');

      try {
        if (fs.existsSync(logoPath)) {
          logoBuffer = fs.readFileSync(logoPath);
        }
      } catch {}
      try {
        if (fs.existsSync(leftLogoPath)) {
          headerLeftBuffer = fs.readFileSync(leftLogoPath);
        }
      } catch {}
      try {
        if (fs.existsSync(rightLogoPath)) {
          headerRightBuffer = fs.readFileSync(rightLogoPath);
        }
      } catch {}

      // Create a PDF document
      const doc = new PDFDocument({
        size: 'A4',
        margin: 40,
        info: {
          Title: `Medical Prescription - ${patient.name}`,
          Author: doctor.user?.username || 'Doctor',
        },
      });

      // Collect PDF data in a buffer
      const buffers: Buffer[] = [];
      doc.on('data', (buffer) => buffers.push(buffer));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (error) => reject(error));

      // Set up document constants
      const pageWidth = doc.page.width;
      const contentWidth = pageWidth - 80; // Left and right margin of 40 each
      const leftMargin = 40;
      const rightMargin = pageWidth - 40;
      const headerMaxImageWidth = 100; // px
      const headerMaxImageHeight = 50; // px
      const headerAreaHeight = 60; // px reserved for header
      
      // Helper to draw horizontal line
      const drawHorizontalLine = (y: number) => {
        doc.moveTo(leftMargin, y).lineTo(rightMargin, y).stroke();
      };
      
      const template: PrescriptionPdfTemplate = options.template || 'standard';

      // Add header images (left, center optional logo, right)
      const topY = leftMargin; // use top margin as Y for header
      // Left image (govJharkhand only)
      if (template === 'govJharkhand' && headerLeftBuffer) {
        try {
          doc.image(headerLeftBuffer, leftMargin, topY, { fit: [headerMaxImageWidth, headerMaxImageHeight] });
        } catch (e) {
          console.error('Error adding left header image:', e);
        }
      }
      // Center logo (always when available)
      if (logoBuffer) {
        try {
          const centerX = leftMargin + (contentWidth / 2) - (headerMaxImageWidth / 2);
          doc.image(logoBuffer, centerX, topY, { fit: [headerMaxImageWidth, headerMaxImageHeight] });
        } catch (e) {
          console.error('Error adding center logo to document:', e);
        }
      } else {
        console.warn('No logo available for PDF, proceeding without center logo');
      }
      // Right image (govJharkhand only)
      if (template === 'govJharkhand' && headerRightBuffer) {
        try {
          doc.image(headerRightBuffer, rightMargin - headerMaxImageWidth, topY, { fit: [headerMaxImageWidth, headerMaxImageHeight] });
        } catch (e) {
          console.error('Error adding right header image:', e);
        }
      }

      // Title placed below header area
      doc.y = topY + headerAreaHeight;
      doc.fontSize(14).font('Helvetica-Bold').text('MEDICAL PRESCRIPTION', { align: 'center' });
      // Separator under header/title
      let currentY = doc.y + 5;
      drawHorizontalLine(currentY);
      currentY += 5;

      // Doctor and Patient Information
      const colWidth = contentWidth / 2 - 10;

      // Left column - Doctor Information
      doc.y = currentY;
      doc.x = leftMargin;
      doc.fontSize(10).font('Helvetica-Bold').text('Doctor Information:');
      doc.fontSize(9).font('Helvetica');
      doc.text(`Name: ${doctor.user?.username || '-'}`);
      doc.text(`Qualification: ${doctor.qualification || '-'}`);
      doc.text(`Registration No: ${doctor.registration_number || '-'}`);

      // Right column - Patient Information
      doc.y = currentY;
      doc.x = leftMargin + contentWidth / 2 + 20;
      doc.fontSize(10).font('Helvetica-Bold').text('Patient Information:', { align: 'right' });
      doc.fontSize(9).font('Helvetica');
      doc.text(`ID: ${patient.driverId || patient.id || '-'}`, { align: 'right' });
      doc.text(`Name: ${patient.name || '-'}`, { align: 'right' });
      doc.text(`Age: ${resolvePatientAge(patient)}`, { align: 'right' });
      const dateText = prescription.createdAt ? formatDate(prescription.createdAt) : '-';
      doc.text(`Date: ${dateText}`, { align: 'right' });
      if (patient.contactNumber) {
        doc.text(`Contact: ${patient.contactNumber}`, { align: 'right' });
      }
      if (patient.idProof_number) {
        const idProofLabels: Record<string, string> = {
          aadhar_card: 'Aadhar No.',
          driving_licence: 'DL No.',
          voter_id: 'Voter ID No.',
        };
        const label =
          patient.idProof === 'other_id' && patient.idProof_name
            ? patient.idProof_name
            : idProofLabels[patient.idProof as string] || 'ID No.';
        doc.text(`${label}: ${patient.idProof_number}`, { align: 'right' });
      }

      // Update Y position for next section
      currentY = Math.max(doc.y, currentY) + 4.5;
      drawHorizontalLine(currentY);
      currentY += 4.5;

      // Vitals section
      doc.y = currentY;
      doc.x = leftMargin;
      doc.fontSize(10).font('Helvetica-Bold').text('Vitals:');
      currentY = doc.y + 3;
      
      // Parse vitals data with proper typing
      const vitalsData: VitalsData = prescription.vitals as VitalsData || {};
      
      // Extract BP values - support both new simple format and legacy nested format
      let systolicBP = '-';
      let diastolicBP = '-';
      
      // Check for new simple format first
      if (vitalsData.systolicBP && typeof vitalsData.systolicBP === 'string') {
        systolicBP = vitalsData.systolicBP;
      }
      if (vitalsData.diastolicBP && typeof vitalsData.diastolicBP === 'string') {
        diastolicBP = vitalsData.diastolicBP;
      }
      
      // Fallback to legacy nested format if simple format values not found
      if (systolicBP === '-' && vitalsData.blood_pressure_unit) {
        if (vitalsData.blood_pressure_unit.systolic_bp_unit?.value) {
          systolicBP = vitalsData.blood_pressure_unit.systolic_bp_unit.value;
        }
        if (vitalsData.blood_pressure_unit.diastolic_bp_unit?.value) {
          diastolicBP = vitalsData.blood_pressure_unit.diastolic_bp_unit.value;
        }
      }
      
      const bpValue = (systolicBP !== '-' && diastolicBP !== '-') 
        ? `${systolicBP}/${diastolicBP}mm Hg` 
        : '-';
      
      // Extract temperature - support both formats
      let temperatureValue = '-';
      
      // Check for new simple format first
      if (vitalsData.temperature && typeof vitalsData.temperature === 'string') {
        temperatureValue = `${vitalsData.temperature}°F`;
      } 
      // Fallback to legacy nested format if simple format not found
      else if (vitalsData.temperature_unit?.value) {
        temperatureValue = `${vitalsData.temperature_unit.value}°F`;
      }
      
      // Extract height - support both formats
      let heightValue = '-';
      
      // Check for new simple format first
      if (vitalsData.height && typeof vitalsData.height === 'string') {
        const heightInCm = Number(vitalsData.height);
        if (!isNaN(heightInCm)) {
          const heightInFeet = (heightInCm / 30.48).toFixed(1);
          heightValue = `${heightInFeet} ft`;
        }
      } 
      // Fallback to legacy nested format
      else if (vitalsData.bmi_unit?.height) {
        const heightInCm = Number(vitalsData.bmi_unit.height);
        if (!isNaN(heightInCm)) {
          const heightInFeet = (heightInCm / 30.48).toFixed(1);
          heightValue = `${heightInFeet} ft`;
        }
      }
      
      // Extract weight - support both formats
      let weightValue = '-';
      
      // Check for new simple format first
      if (vitalsData.weight && typeof vitalsData.weight === 'string') {
        weightValue = `${vitalsData.weight} kg`;
      } 
      // Fallback to legacy nested format
      else if (vitalsData.bmi_unit?.weight) {
        weightValue = `${vitalsData.bmi_unit.weight} kg`;
      }
      
      // Extract oxygen level (SpO2) - support both formats
      let oxyValue = '-';
      
      // Check for new simple format first
      if (vitalsData.spo2 && typeof vitalsData.spo2 === 'string') {
        oxyValue = `${vitalsData.spo2}%`;
      } 
      // Fallback to legacy nested format
      else if (vitalsData.spo2_unit?.value) {
        oxyValue = `${vitalsData.spo2_unit.value}%`;
      }


      let pulseValue = '-';
      
      // Check for new simple format first
      if (vitalsData.pulse && typeof vitalsData.pulse === 'string') {
        pulseValue = `${vitalsData.pulse}bpm`;
      } 
      // Fallback to legacy nested format
      else if (vitalsData.pulse_unit?.value) {
        pulseValue = `${vitalsData.pulse_unit.value}bpm`;
      }

      // Extract blood sugar value
      let bloodSugarValue = '-';
      if (vitalsData.bloodSugar && typeof vitalsData.bloodSugar === 'string') {
        bloodSugarValue = `${vitalsData.bloodSugar} mg/dL`;
      }

      // Extract haemoglobin value
      let haemoglobinValue = '-';
      if (vitalsData.haemoglobin && typeof vitalsData.haemoglobin === 'string') {
        haemoglobinValue = `${vitalsData.haemoglobin} g/dL`;
      }

      // Create vitals table
      try {
        // Vitals table
        const tableTop = currentY;
        const tableWidth = contentWidth;
        const numCols = 8;
        const colWidth = tableWidth / numCols;
        const vitalsHeaders = [
          'Blood Pressure', 'Temperature', 'Height', 'Weight',
          'Oxygen Level', 'Blood Sugar', 'Haemoglobin', 'Pulse'
        ];
        const vitalsValues = [
          bpValue, temperatureValue, heightValue, weightValue,
          oxyValue, bloodSugarValue, haemoglobinValue, pulseValue
        ];

        // --- Calculate header row height dynamically ---
        doc.fontSize(8.5).font('Helvetica-Bold');
        const headerHeights = vitalsHeaders.map(header =>
          doc.heightOfString(header, { width: colWidth - 8 })
        );
        const headerRowHeight = Math.max(16, ...headerHeights.map(h => h + 6));

        // --- Calculate value row height dynamically ---
        doc.fontSize(9).font('Helvetica');
        const valueHeights = vitalsValues.map(value =>
          doc.heightOfString(value, { width: colWidth - 8 })
        );
        const valueRowHeight = Math.max(16, ...valueHeights.map(h => h + 6));

        const totalTableHeight = headerRowHeight + valueRowHeight;

        // Draw table borders
        doc.rect(leftMargin, tableTop, tableWidth, totalTableHeight).stroke();

        // Column dividers
        for (let i = 1; i < numCols; i++) {
          doc.moveTo(leftMargin + (i * colWidth), tableTop)
             .lineTo(leftMargin + (i * colWidth), tableTop + totalTableHeight)
             .stroke();
        }

        // Row divider
        doc.moveTo(leftMargin, tableTop + headerRowHeight)
           .lineTo(leftMargin + tableWidth, tableTop + headerRowHeight)
           .stroke();

        // --- Draw headers, vertically centered ---
        doc.fontSize(8.5).font('Helvetica-Bold');
        for (let i = 0; i < numCols; i++) {
          const textHeight = headerHeights[i];
          const yOffset = tableTop + (headerRowHeight - textHeight) / 2;
          doc.text(vitalsHeaders[i], leftMargin + (colWidth * i) + 4, yOffset, {
            width: colWidth - 8,
            align: 'center'
          });
        }

        // --- Draw values, vertically centered ---
        doc.fontSize(9).font('Helvetica');
        for (let i = 0; i < numCols; i++) {
          const textHeight = valueHeights[i];
          const yOffset = tableTop + headerRowHeight + (valueRowHeight - textHeight) / 2;
          doc.text(vitalsValues[i], leftMargin + (colWidth * i) + 4, yOffset, {
            width: colWidth - 8,
            align: 'center'
          });
        }

        currentY = tableTop + totalTableHeight + 4.5; // Space after vitals table
      } catch (err) {
        console.error('Error creating vitals table:', err);
        doc.text('Unable to display vitals table');
        currentY = doc.y + 4.5;
      }

      // Chief Complaint section
      drawHorizontalLine(currentY);
      currentY += 4.5;
      doc.y = currentY;
      doc.x = leftMargin;
      doc.fontSize(10).font('Helvetica-Bold').text('Chief Complaint:');
      currentY = doc.y + 3;
      doc.y = currentY;
      doc.fontSize(9).font('Helvetica');
      doc.text(Array.isArray(prescription.chief_complaints) 
        ? prescription.chief_complaints.join(', ') 
        : (prescription.chief_complaints || "-"));
      currentY = doc.y + 4.5;
      drawHorizontalLine(currentY);
      currentY += 4.5;

      // Diagnosis section
      doc.y = currentY;
      doc.x = leftMargin;
      doc.fontSize(10).font('Helvetica-Bold').text('Diagnosis:');
      currentY = doc.y + 3;
      doc.y = currentY;
      doc.fontSize(9).font('Helvetica');
      doc.text(prescription.diagnose || "-");
      currentY = doc.y + 4.5;
      drawHorizontalLine(currentY);
      currentY += 4.5;

      // Drug Allergies section
      doc.y = currentY;
      doc.x = leftMargin;
      doc.fontSize(10).font('Helvetica-Bold').text('Drug Allergies:');
      currentY = doc.y + 3;
      doc.y = currentY;
      doc.fontSize(9).font('Helvetica');
      doc.text(Array.isArray(prescription.drug_allergies)
        ? prescription.drug_allergies.join(', ')
        : (prescription.drug_allergies || "-"));
      currentY = doc.y + 4.5;
      drawHorizontalLine(currentY);
      currentY += 4.5;

      // Prescribed Medicines section
      doc.y = currentY;
      doc.x = leftMargin;
      doc.fontSize(10).font('Helvetica-Bold').text('Prescribed Medicines:');
      currentY = doc.y + 3;

      // Create medicines table
      try {
        doc.y = currentY;
        if (medicines && medicines.length > 0) {
          // Define column widths proportionally
          const tableWidth = contentWidth;
          const colWidths = [
            tableWidth * 0.08, // S.No
            tableWidth * 0.15, // Medicine Type
            tableWidth * 0.20, // Medicine Name
            tableWidth * 0.10, // Dosage
            tableWidth * 0.15, // Frequency
            tableWidth * 0.12, // Duration
            tableWidth * 0.20  // Instructions
          ];
          
          const tableTop = doc.y;
          let tableY = tableTop;
          
          // Header row
          doc.fontSize(8.5).font('Helvetica-Bold');
          const headerRowHeight = 16;
          
          // Draw header row rectangle
          doc.rect(leftMargin, tableY, tableWidth, headerRowHeight).stroke();
          
          // Draw column dividers in header
          let xPos = leftMargin;
          for (let i = 0; i < colWidths.length - 1; i++) {
            xPos += colWidths[i];
            doc.moveTo(xPos, tableY).lineTo(xPos, tableY + headerRowHeight).stroke();
          }
          
          // Add header texts
          xPos = leftMargin;
          doc.text('S.No', xPos + 3, tableY + 3, { width: colWidths[0] - 6, align: 'center' });
          xPos += colWidths[0];
          doc.text('Medicine Type', xPos + 3, tableY + 3, { width: colWidths[1] - 6, align: 'center' });
          xPos += colWidths[1];
          doc.text('Medicine Name', xPos + 3, tableY + 3, { width: colWidths[2] - 6, align: 'center' });
          xPos += colWidths[2];
          doc.text('Dosage', xPos + 3, tableY + 3, { width: colWidths[3] - 6, align: 'center' });
          xPos += colWidths[3];
          doc.text('Frequency', xPos + 3, tableY + 3, { width: colWidths[4] - 6, align: 'center' });
          xPos += colWidths[4];
          doc.text('Duration', xPos + 3, tableY + 3, { width: colWidths[5] - 6, align: 'center' });
          xPos += colWidths[5];
          doc.text('Instructions', xPos + 3, tableY + 3, { width: colWidths[6] - 6, align: 'center' });
          
          tableY += headerRowHeight; // Move to next row
          
          // Data rows
          doc.fontSize(9).font('Helvetica');
          
          for (let i = 0; i < medicines.length; i++) {
            const medicine = medicines[i];
            
            // Prepare data with proper formatting
            const medType = medicine.medicine_type || '-';
            const medName = medicine.medicine_name || '-';
            const dosage = medicine.dosage || '-';
            let frequency = '-';
            if (medicine.frequency) {
              frequency = Array.isArray(medicine.frequency)
                ? medicine.frequency.map(f => String(f)).join(',')
                : String(medicine.frequency);
            }
            const duration = medicine.duration ? `${medicine.duration} days` : '-';
            const instructions = medicine.instructions || '-';

            // Prepare all cell values in an array for easier processing
            const cellValues = [
              (i + 1).toString(),
              medType,
              medName,
              dosage,
              frequency,
              duration,
              instructions
            ];

            // Calculate the height needed for each cell
            const cellHeights = cellValues.map((value, idx) =>
              doc.heightOfString(value, { width: colWidths[idx] - 6 })
            );
            // Set row height based on the tallest cell, plus padding
            const rowHeight = Math.max(16, ...cellHeights.map(h => h + 6));

            // Draw row rectangle
            doc.rect(leftMargin, tableY, tableWidth, rowHeight).stroke();

            // Draw column dividers in row
            let xPos = leftMargin;
            for (let j = 0; j < colWidths.length - 1; j++) {
              xPos += colWidths[j];
              doc.moveTo(xPos, tableY).lineTo(xPos, tableY + rowHeight).stroke();
            }

            // Add cell data, vertically centered
            xPos = leftMargin;
            for (let j = 0; j < cellValues.length; j++) {
              const cellText = cellValues[j];
              const cellHeight = cellHeights[j];
              // Calculate vertical offset for centering
              const yOffset = tableY + (rowHeight - cellHeight) / 2;
              doc.text(cellText, xPos + 3, yOffset, {
                width: colWidths[j] - 6,
                align: 'center'
              });
              xPos += colWidths[j];
            }

            // Move to next row
            tableY += rowHeight;
          }
          
          currentY = tableY + 4.5; // Space after medicines table
        } else {
          doc.fontSize(9).font('Helvetica').text('No medicines prescribed');
          currentY = doc.y + 4.5;
        }
      } catch (err) {
        console.error('Error creating medicines table:', err);
        doc.text('Unable to display medicines table');
        currentY = doc.y + 4.5;
      }
      
      drawHorizontalLine(currentY);
      currentY += 4.5;

      // Lab Tests section if available
      if (prescription.lab || prescription.other_lab) {
        doc.y = currentY;
        doc.x = leftMargin;
        doc.fontSize(10).font('Helvetica-Bold').text('Lab Tests:');
        currentY = doc.y + 3;
        doc.y = currentY;
        doc.fontSize(9).font('Helvetica');
        
        const labTests = [prescription.lab, prescription.other_lab]
          .filter(Boolean)
          .join(', ');
        
        doc.text(labTests || '-');
        currentY = doc.y + 4.5;
        drawHorizontalLine(currentY);
        currentY += 4.5;
      }
      
      // Preventive Advice section if available
      if (prescription.preventive_advice || prescription.instructions) {
        doc.y = currentY;
        doc.x = leftMargin;
        doc.fontSize(10).font('Helvetica-Bold').text('Preventive Advice:');
        currentY = doc.y + 3;
        doc.y = currentY;
        doc.fontSize(9).font('Helvetica');
        // Prefer preventive_advice, fallback to instructions
        const adviceText = normalizeAdviceField(prescription.preventive_advice) !== '-' ?
          normalizeAdviceField(prescription.preventive_advice) :
          normalizeAdviceField(prescription.instructions);
        doc.text(adviceText);
        currentY = doc.y + 4.5;
        drawHorizontalLine(currentY);
        currentY += 4.5;
      }

      // Follow-up section
      if (prescription.follow_up) {
        doc.y = currentY;
        doc.x = leftMargin;
        doc.fontSize(10).font('Helvetica-Bold').text('Follow-up:');
        currentY = doc.y + 3;
        doc.y = currentY;
        doc.fontSize(9).font('Helvetica');
        const followUpText = prescription.follow_up ? formatDate(prescription.follow_up) : '-';
        doc.text(`Next Visit: ${followUpText}`);
        currentY = doc.y + 4.5;
        drawHorizontalLine(currentY);
        currentY += 4.5;
      }

      // Fitness status section (hidden for Latehar / govJharkhand template)
      if (template !== 'govJharkhand') {
        doc.y = currentY;
        doc.x = leftMargin;
        doc.fontSize(10).font('Helvetica-Bold').text('Fitness Status:');
        currentY = doc.y + 3;
        doc.y = currentY;
        doc.fontSize(9).font('Helvetica');
        doc.text(prescription.fitness_status || '-');
        currentY = doc.y + 4.5;
        drawHorizontalLine(currentY);
        currentY += 4.5;
      }

      // Footer Block (Doctor Signature & Disclaimer)
      const footerBlockHeight = 105;
      const pageBottomLimit = doc.page.height - doc.page.margins.bottom - 10;

      if (currentY + footerBlockHeight > pageBottomLimit) {
        doc.addPage();
        currentY = doc.page.margins.top || 40;
      }

      const sigWidth = 140;
      const signatureX = rightMargin - sigWidth;
      const doctorName = doctor.user?.username || 'Doctor';
      const sigStartY = currentY;

      if (signatureBuffer) {
        try {
          doc.image(signatureBuffer, signatureX, sigStartY, {
            fit: [sigWidth, 30],
            align: 'center',
            valign: 'center',
          });
        } catch (e) {
          console.error('Error adding signature to document:', e);
        }
      }

      const textY = sigStartY + (signatureBuffer ? 34 : 5);
      doc.fontSize(9).font('Helvetica-Bold').text("Doctor's Signature", signatureX, textY, { width: sigWidth, align: 'center' });
      doc.fontSize(9).font('Helvetica').text(doctorName, signatureX, textY + 12, { width: sigWidth, align: 'center' });

      currentY = textY + 26;

      // Add Disclaimer section right below signature
      drawHorizontalLine(currentY);
      currentY += 6;

      const disclaimerLine1Part1 = 'DISCLAIMER: ';
      const disclaimerLine1Part2 = 'The prescription is generated based on the health parameters checked during the visit and the consultation with doctor using';
      const disclaimerLine2 = 'online media.';
      const disclaimerLine3 = 'This prescription is valid in India only. Please visit a nearby doctor for further evaluation and treatment, if required.';

      doc.fontSize(8).font('Helvetica-Bold').text(disclaimerLine1Part1, leftMargin, currentY, { continued: true });
      doc.fontSize(8).font('Helvetica').text(disclaimerLine1Part2);

      currentY = doc.y + 2;
      doc.fontSize(8).font('Helvetica').text(disclaimerLine2, leftMargin, currentY);

      currentY = doc.y + 2;
      doc.fontSize(8).font('Helvetica').text(disclaimerLine3, leftMargin, currentY);

      // Finalize the PDF
      doc.end();
    } catch (error) {
      console.error('PDF generation error:', error);
      reject(error);
    }
  });
};
