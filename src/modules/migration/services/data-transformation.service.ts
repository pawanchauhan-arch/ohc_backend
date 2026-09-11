import { Injectable, Logger } from '@nestjs/common';
import { DataTransformationResult } from '../types/migration.types';
import { getMigrationConfig, MigrationConfig } from '../config/migration.config';

/**
 * Data Transformation Service
 * Transforms data from Picaso format to Last Mile Care format
 */
@Injectable()
export class DataTransformationService {
  private readonly logger = new Logger(DataTransformationService.name);
  private readonly migrationConfig: MigrationConfig;

  constructor() {
    this.migrationConfig = getMigrationConfig();
  }

  /**
   * Transforms driver data from Picaso to LMC format (backward compatibility)
   */
  transformDriverData(picasoData: any): DataTransformationResult {
    return this.transformDriverDataWithCreatorId(picasoData, this.migrationConfig.sources[0]?.creatorId || 99);
  }

  /**
   * Transforms driver data from Picaso to LMC format with source-specific creator ID
   */
  transformDriverDataWithCreatorId(picasoData: any, creatorId: number): DataTransformationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      const transformedData = {
        driverId: picasoData.PatientID?.toString(),
        driver_cetid: picasoData.CetId || null,
        driver_cetname: picasoData.CetName || null,
        external_id: picasoData.PicasoID || picasoData.PatientID?.toString(),
        createdBy: creatorId, // Use source-specific creator ID
        name: picasoData.PatientName || null,
        healthCardNumber: picasoData.HealthCardNumber || null,
        abhaNumber: picasoData.AbhaNumber || null,
        dateOfBirthOrAge: this.transformDate(picasoData.DOB),
        gender: this.transformGenderFromSex(picasoData.Sex),
        photographOfDriver: picasoData.Photograph || null,
        localAddress: picasoData.PermanentAddress || picasoData.MailingAddress || null,
        localAddressDistrict: this.getDistrictName(picasoData.District),
        localAddressState: this.getStateName(picasoData.State),
        contactNumber: picasoData.ContactNo || null,
        emergencyContactName: picasoData.EmergencyContactName || null,
        emergencyContactNumber: picasoData.EmergencyContactNumber || null,
        idProof_name: picasoData.IdProofName || null,
        idProof: picasoData.IdProof || null,
        idProof_number: picasoData.IdProofNumber || null,
        idProof_doc: picasoData.IdProofDoc || null,
        blood_group: this.transformBloodGroupFromInt(picasoData.BloodGroup),
        abhaDetailsJson: this.buildAbhaDetails(picasoData),
        preferred_language: picasoData.PreferredLanguage || 'English',
        isBanned: picasoData.IsBanned || false,
      };

      // Validate transformed data
      if (!transformedData.driverId) {
        errors.push('Missing required field: driverId');
      }

      if (!transformedData.name) {
        errors.push('Missing required field: name');
      }

      return {
        originalRecord: picasoData,
        transformedRecord: transformedData,
        isValid: errors.length === 0,
        errors,
        warnings,
      };
    } catch (error) {
      return {
        originalRecord: picasoData,
        transformedRecord: null,
        isValid: false,
        errors: [`Transformation failed: ${error.message}`],
        warnings,
      };
    }
  }

  /**
   * Transforms health checkup data from Picaso to LMC format (backward compatibility)
   */
  transformHealthCheckupData(picasoData: any): { isValid: boolean; transformedRecord: any; errors: string[] } {
    return this.transformHealthCheckupDataWithCreatorId(picasoData, this.migrationConfig.sources[0]?.creatorId || 99);
  }

  /**
   * Transforms health checkup data from Picaso to LMC format with source-specific creator ID
   */
  transformHealthCheckupDataWithCreatorId(picasoData: any, creatorId: number): { isValid: boolean; transformedRecord: any; errors: string[] } {
    const errors: string[] = [];
    const transformedRecord: any = {};

    try {
      // Basic required fields
      transformedRecord.uniqueId = picasoData.ID?.toString() || null;
      transformedRecord.external_id = picasoData.PicasoID || picasoData.ID?.toString() || null;
      transformedRecord.unique_code = picasoData.ConsultingID?.toString() || null;
      transformedRecord.patientName = picasoData.PatientName || null;
      transformedRecord.contactNumber = picasoData.ContactNo || null;
      transformedRecord.age = picasoData.Age || null;
      transformedRecord.gender = picasoData.Gender || null;

      // Date handling
      transformedRecord.date_time = this.transformDateTime(picasoData.AddedDate);
      transformedRecord.createdBy = creatorId; // Use source-specific creator ID
      transformedRecord.user_id = creatorId; // Use source-specific creator ID
      transformedRecord.doctor_id = creatorId; // Use source-specific creator ID
      transformedRecord.driver_id = null; // Will be populated in migration service

      // Health metrics with proper type conversion
      const bpsystolic = picasoData.BPsystolic ? Number(picasoData.BPsystolic) : null;
      const bpdiastolic = picasoData.BPdiastolic ? Number(picasoData.BPdiastolic) : null;
      const pulseRate = picasoData.PulseRate ? Number(picasoData.PulseRate) : null;
      const spo2 = picasoData.SPO2 ? Number(picasoData.SPO2) : null;
      const temperature = picasoData.Temperature ? Number(picasoData.Temperature) : null;
      const height = picasoData.Height ? Number(picasoData.Height) : null;
      const weight = picasoData.Weight ? Number(picasoData.Weight) : null;

      // String fields (as per database schema)
      transformedRecord.spo2_unit = spo2 ? `${spo2}%` : '';
      transformedRecord.temperature_unit = temperature ? `${temperature}°F` : '';
      transformedRecord.pulse_unit = pulseRate ? `${pulseRate} bpm` : '';

      // JSON object fields
      transformedRecord.blood_pressure_unit = this.buildBloodPressureUnit({
        BPsystolic: bpsystolic,
        BPdiastolic: bpdiastolic,
      });

      // BMI calculation
      const bmi = this.calculateBMI(height, weight);
      transformedRecord.bmi_unit = {
        value: bmi,
        unit: 'kg/m²',
        status: this.getBMIStatus(bmi),
      };

      // Height and Weight units
      transformedRecord.height_unit = {
        value: height,
        unit: 'cm',
        status: this.getHeightStatus(height),
      };

      transformedRecord.weight_unit = {
        value: weight,
        unit: 'kg',
        status: this.getWeightStatus(weight),
      };

      // Default values for required fields
      transformedRecord.is_submited = true;
      transformedRecord.accept_term_condition = true;
      transformedRecord.package_list = [];
      transformedRecord.selected_package_name = [];
      transformedRecord.selected_package_list = [];

      // Generate selected_test JSON based on available health data
      transformedRecord.selected_test = this.generateSelectedTestJson({
        bpsystolic,
        bpdiastolic,
        pulseRate,
        spo2,
        temperature,
        height,
        weight,
        bmi,
      });

      // Set other required fields to null/empty
      transformedRecord.package_and_test_history = null;
      transformedRecord.driver_details = null;
      transformedRecord.transpoter = null;
      transformedRecord.driver_type = null;
      transformedRecord.vehicle_no = null;
      transformedRecord.signature = null;
      transformedRecord.verify_option = null;
      transformedRecord.haemoglobin_unit = null;
      transformedRecord.patient_type = null;
      transformedRecord.random_blood_sugar_unit = null;
      transformedRecord.hearing_unit = null;
      transformedRecord.cholesterol_unit = null;
      transformedRecord.ecg_unit = null;
      transformedRecord.doc = null;
      transformedRecord.confirm_report = null;

      return { isValid: true, transformedRecord, errors };
    } catch (error) {
      errors.push(`Transformation error: ${error.message}`);
      return { isValid: false, transformedRecord: null, errors };
    }
  }

  /**
   * Transforms date string, handling invalid dates
   */
  private transformDate(dateString: string): string | null {
    if (!dateString) return null;

    // Handle invalid dates like 1752
    if (dateString === '1752-01-01' || dateString === '1752-01-01T00:00:00.000Z') {
      return null;
    }

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return null;
      }
      return date.toISOString().split('T')[0]; // Return YYYY-MM-DD format
    } catch (error) {
      return null;
    }
  }

  /**
   * Transforms date and time string
   */
  private transformDateTime(dateTimeString: string): string | null {
    if (!dateTimeString) return null;

    try {
      const date = new Date(dateTimeString);
      if (isNaN(date.getTime())) {
        return null;
      }
      return date.toISOString();
    } catch (error) {
      return null;
    }
  }

  /**
   * Transforms gender from Sex integer to string
   */
  private transformGenderFromSex(sex: number): string {
    if (!sex) return 'Other';

    const genderMap: Record<number, string> = {
      1: 'Male',
      2: 'Female',
      3: 'Other',
    };

    return genderMap[sex] || 'Other';
  }

  /**
   * Transforms blood group from integer to string
   */
  private transformBloodGroupFromInt(bloodGroup: number): string | null {
    if (!bloodGroup) return null;

    const bloodGroupMap: Record<number, string> = {
      1: 'A+',
      2: 'A-',
      3: 'B+',
      4: 'B-',
      5: 'AB+',
      6: 'AB-',
      7: 'O+',
      8: 'O-',
    };

    return bloodGroupMap[bloodGroup] || null;
  }

  /**
   * Transforms array data
   */
  private transformArray(arrayData: any): string[] {
    if (!arrayData) return [];

    if (Array.isArray(arrayData)) {
      return arrayData.map(item => item?.toString() || '').filter(item => item);
    }

    if (typeof arrayData === 'string') {
      try {
        const parsed = JSON.parse(arrayData);
        return Array.isArray(parsed) ? parsed.map(item => item?.toString() || '').filter(item => item) : [];
      } catch (error) {
        return [arrayData.toString()];
      }
    }

    return [];
  }

  /**
   * Builds ABHA details JSON
   */
  private buildAbhaDetails(picasoData: any): object | null {
    if (!picasoData.AbhaNumber) return null;

    return {
      abhaNumber: picasoData.AbhaNumber,
      abhaAddress: picasoData.AbhaAddress || null,
      abhaStatus: picasoData.AbhaStatus || 'ACTIVE',
      linkedAt: picasoData.AbhaLinkedAt || null,
    };
  }

  /**
   * Builds BMI unit JSON
   */
  private buildBmiUnit(picasoData: any): object {
    const bmi = this.calculateBMI(picasoData.Height, picasoData.Weight);
    
    return {
      height: picasoData.Height || null,
      weight: picasoData.Weight || null,
      bmi: bmi,
      unit: 'kg/m²',
      status: this.getBmiStatus(bmi),
    };
  }

  /**
   * Builds haemoglobin unit JSON
   */
  private buildHaemoglobinUnit(picasoData: any): object {
    return {
      value: picasoData.Haemoglobin || null,
      unit: 'g/dL',
      status: this.getHaemoglobinStatus(picasoData.Haemoglobin),
    };
  }

  /**
   * Builds random blood sugar unit JSON
   */
  private buildRandomBloodSugarUnit(picasoData: any): object {
    return {
      value: picasoData.RandomBloodSugar || null,
      unit: 'mg/dL',
      status: this.getBloodSugarStatus(picasoData.RandomBloodSugar),
    };
  }

  /**
   * Builds hearing unit JSON
   */
  private buildHearingUnit(picasoData: any): object {
    return {
      leftEar: picasoData.HearingLeftEar || null,
      rightEar: picasoData.HearingRightEar || null,
      unit: 'dB',
      status: this.getHearingStatus(picasoData.HearingLeftEar, picasoData.HearingRightEar),
    };
  }

  /**
   * Builds blood pressure unit JSON
   */
  private buildBloodPressureUnit(picasoData: any): object {
    return {
      systolic: picasoData.BPsystolic || null,
      diastolic: picasoData.BPdiastolic || null,
      unit: 'mmHg',
      status: this.getBloodPressureStatus(picasoData.BPsystolic, picasoData.BPdiastolic),
    };
  }

  /**
   * Builds ECG unit JSON
   */
  private buildEcgUnit(picasoData: any): object {
    return {
      result: picasoData.EcgResult || null,
      interpretation: picasoData.EcgInterpretation || null,
      status: this.getEcgStatus(picasoData.EcgResult),
    };
  }

  /**
   * Builds comprehensive health test JSON
   */
  private buildHealthTestJson(picasoData: any): object {
    return {
      bmi: this.buildBmiUnit(picasoData),
      bloodPressure: this.buildBloodPressureUnit(picasoData),
      haemoglobin: this.buildHaemoglobinUnit(picasoData),
      randomBloodSugar: this.buildRandomBloodSugarUnit(picasoData),
      hearing: this.buildHearingUnit(picasoData),
      ecg: this.buildEcgUnit(picasoData),
      pulseRate: {
        value: picasoData.PulseRate || null,
        unit: 'bpm',
        status: this.getPulseStatus(picasoData.PulseRate),
      },
      temperature: {
        value: picasoData.Temperature || null,
        unit: '°C',
        status: this.getTemperatureStatus(picasoData.Temperature),
      },
      spo2: {
        value: picasoData.SPO2 || null,
        unit: '%',
        status: this.getSpo2Status(picasoData.SPO2),
      },
    };
  }

  /**
   * Generates selected_test JSON based on available health data
   */
  private generateSelectedTestJson(healthData: {
    bpsystolic: number | null;
    bpdiastolic: number | null;
    pulseRate: number | null;
    spo2: number | null;
    temperature: number | null;
    height: number | null;
    weight: number | null;
    bmi: number | null;
  }): object {
    const selectedTest: any = {};

    // BMI Unit
    if (healthData.bmi !== null) {
      const bmiStatus = this.getBMIStatus(healthData.bmi);
      selectedTest.bmi_unit = {
        label: "BMI (Body Mass Index)",
        key: "bmi_unit",
        value: healthData.bmi.toFixed(2),
        standard_value: [18.5, 24.9],
        units: "kg/m2",
        height: healthData.height || 0,
        weight: healthData.weight || 0,
        status: bmiStatus,
        remark: this.getBMIRemark(bmiStatus)
      };
    }

    // Temperature Unit
    if (healthData.temperature !== null) {
      const tempStatus = this.getTemperatureStatus(healthData.temperature);
      selectedTest.temperature_unit = {
        label: "Temperature",
        key: "temperature_unit",
        value: healthData.temperature.toString(),
        standard_value: [97, 99],
        units: "F",
        status: tempStatus,
        remark: this.getTemperatureRemark(tempStatus)
      };
    }

    // SPO2 Unit
    if (healthData.spo2 !== null) {
      const spo2Status = this.getSpo2Status(healthData.spo2);
      selectedTest.spo2_unit = {
        label: "SPO2",
        key: "spo2_unit",
        value: healthData.spo2.toString(),
        standard_value: [95, 100],
        units: "%",
        status: spo2Status,
        remark: this.getSPO2Remark(spo2Status)
      };
    }

    // Pulse Unit
    if (healthData.pulseRate !== null) {
      const pulseStatus = this.getPulseStatus(healthData.pulseRate);
      selectedTest.pulse_unit = {
        label: "Pulse",
        key: "pulse_unit",
        value: healthData.pulseRate.toString(),
        standard_value: [60, 100],
        units: "bpm",
        status: pulseStatus,
        remark: this.getPulseRemark(pulseStatus)
      };
    }

    // Blood Pressure Unit
    if (healthData.bpsystolic !== null && healthData.bpdiastolic !== null) {
      const systolicStatus = this.getSystolicBPStatus(healthData.bpsystolic);
      const diastolicStatus = this.getDiastolicBPStatus(healthData.bpdiastolic);
      
      selectedTest.blood_pressure_unit = {
        systolic_bp_unit: {
          label: "BP Systolic",
          key: "systolic_bp_unit",
          value: healthData.bpsystolic.toString(),
          standard_value: [100, 120],
          units: "mm Hg",
          status: systolicStatus,
          remark: this.getSystolicBPRemark(systolicStatus)
        },
        diastolic_bp_unit: {
          label: "BP Diastolic",
          key: "diastolic_bp_unit",
          value: healthData.bpdiastolic.toString(),
          standard_value: [70, 80],
          units: "mm Hg",
          status: diastolicStatus,
          remark: this.getDiastolicBPRemark(diastolicStatus)
        }
      };
    }

    return selectedTest;
  }

  /**
   * Calculates BMI
   */
  private calculateBMI(height: number | null, weight: number | null): number | null {
    if (!height || !weight || height <= 0 || weight <= 0) {
      return null;
    }

    const heightInMeters = height / 100;
    return Math.round((weight / (heightInMeters * heightInMeters)) * 100) / 100;
  }

  /**
   * Gets BMI status
   */
  private getBmiStatus(bmi: number | null): string {
    if (!bmi) return 'UNKNOWN';
    if (bmi < 18.5) return 'UNDERWEIGHT';
    if (bmi < 25) return 'NORMAL';
    if (bmi < 30) return 'OVERWEIGHT';
    return 'OBESE';
  }

  /**
   * Gets haemoglobin status
   */
  private getHaemoglobinStatus(value: number | null): string {
    if (!value) return 'UNKNOWN';
    if (value < 12) return 'LOW';
    if (value > 16) return 'HIGH';
    return 'NORMAL';
  }

  /**
   * Gets blood sugar status
   */
  private getBloodSugarStatus(value: number | null): string {
    if (!value) return 'UNKNOWN';
    if (value > 200) return 'HIGH';
    if (value > 140) return 'BORDERLINE';
    return 'NORMAL';
  }

  /**
   * Gets hearing status
   */
  private getHearingStatus(leftEar: number | null, rightEar: number | null): string {
    if (!leftEar && !rightEar) return 'UNKNOWN';
    if ((leftEar && leftEar > 25) || (rightEar && rightEar > 25)) return 'IMPAIRED';
    return 'NORMAL';
  }

  /**
   * Gets blood pressure status
   */
  private getBloodPressureStatus(systolic: number | null, diastolic: number | null): string {
    if (!systolic || !diastolic) return 'UNKNOWN';
    if (systolic >= 140 || diastolic >= 90) return 'HIGH';
    if (systolic >= 120 || diastolic >= 80) return 'ELEVATED';
    return 'NORMAL';
  }

  /**
   * Gets ECG status
   */
  private getEcgStatus(result: string | null): string {
    if (!result) return 'UNKNOWN';
    const normalized = result.toLowerCase();
    if (normalized.includes('normal')) return 'NORMAL';
    if (normalized.includes('abnormal')) return 'ABNORMAL';
    return 'UNKNOWN';
  }

  /**
   * Gets pulse status
   */
  private getPulseStatus(value: number | null): string {
    if (!value) return 'error';
    if (value < 60) return 'danger';
    if (value > 100) return 'danger';
    return 'success';
  }

  /**
   * Gets temperature status
   */
  private getTemperatureStatus(value: number | null): string {
    if (!value) return 'error';
    if (value > 99) return 'danger';
    if (value < 97) return 'danger';
    return 'success';
  }

  /**
   * Gets SpO2 status
   */
  private getSpo2Status(value: number | null): string {
    if (!value) return 'error';
    if (value < 95) return 'danger';
    return 'success';
  }

  /**
   * Gets district name from district ID
   */
  private getDistrictName(districtId: number): string | null {
    if (!districtId) return null;
    // This would typically lookup from a district table
    return `District_${districtId}`;
  }

  /**
   * Gets state name from state ID
   */
  private getStateName(stateId: number): string | null {
    if (!stateId) return null;
    // This would typically lookup from a state table
    return `State_${stateId}`;
  }

  /**
   * Gets height status based on value
   */
  private getHeightStatus(height: number | null): string {
    if (!height) return 'NORMAL';
    if (height < 100) return 'LOW';
    if (height > 200) return 'HIGH';
    return 'NORMAL';
  }

  /**
   * Gets weight status based on value
   */
  private getWeightStatus(weight: number | null): string {
    if (!weight) return 'NORMAL';
    if (weight < 30) return 'LOW';
    if (weight > 120) return 'HIGH';
    return 'NORMAL';
  }

  /**
   * Gets BMI status based on value
   */
  private getBMIStatus(bmi: number | null): string {
    if (!bmi) return 'error';
    if (bmi < 18.5) return 'warning';
    if (bmi >= 18.5 && bmi < 25) return 'success';
    if (bmi >= 25 && bmi < 30) return 'warning';
    return 'danger';
  }

  /**
   * Gets BMIRemark based on status
   */
  private getBMIRemark(status: string): string {
    if (status === 'warning') return 'Counselling for Lifestyle Changes/Consultation Recommended';
    if (status === 'danger') return 'Consultation Recommended';
    return 'PASS';
  }

  /**
   * Gets TemperatureRemark based on status
   */
  private getTemperatureRemark(status: string): string {
    if (status === 'danger') return 'Consultation Recommended';
    return 'PASS';
  }

  /**
   * Gets SPO2Remark based on status
   */
  private getSPO2Remark(status: string): string {
    if (status === 'danger') return 'Consultation Recommended';
    return 'PASS';
  }

  /**
   * Gets PulseRemark based on status
   */
  private getPulseRemark(status: string): string {
    if (status === 'danger') return 'OUT OF RANGE';
    return 'PASS';
  }

  /**
   * Gets SystolicBPRemark based on status
   */
  private getSystolicBPRemark(status: string): string {
    if (status === 'danger') return 'Consultation Recommended';
    if (status === 'warning') return 'Take rest & Recheck/ Cosultation';
    return 'PASS';
  }

  /**
   * Gets DiastolicBPRemark based on status
   */
  private getDiastolicBPRemark(status: string): string {
    if (status === 'danger') return 'Consultation Recommended';
    if (status === 'warning') return 'Take rest & Recheck/ Cosultation';
    return 'PASS';
  }

  /**
   * Gets Systolic BP status
   */
  private getSystolicBPStatus(value: number | null): string {
    if (!value) return 'error';
    if (value >= 140) return 'danger';
    if (value >= 120) return 'warning';
    return 'success';
  }

  /**
   * Gets Diastolic BP status
   */
  private getDiastolicBPStatus(value: number | null): string {
    if (!value) return 'error';
    if (value >= 90) return 'danger';
    if (value >= 80) return 'warning';
    return 'success';
  }
} 