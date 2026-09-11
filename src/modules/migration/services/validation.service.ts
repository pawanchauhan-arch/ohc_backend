import { Injectable, Logger } from '@nestjs/common';
import { ValidationResult, RecordValidationResult } from '../types/migration.types';

/**
 * Validation Service
 * Provides methods for validating data from Picaso before copying to LMC
 */
@Injectable()
export class ValidationService {
  private readonly logger = new Logger(ValidationService.name);

  /**
   * Validates driver master data from Picaso
   */
  validateDriverData(picasoData: any): RecordValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields
    if (!picasoData.PatientID) {
      errors.push('Missing PatientID');
    }

    if (!picasoData.PatientName) {
      errors.push('Missing PatientName');
    }

    // Optional validations
    if (picasoData.Sex && ![1, 2, 3].includes(picasoData.Sex)) {
      warnings.push('Invalid Sex value (should be 1, 2, or 3)');
    }

    if (picasoData.DOB) {
      const date = new Date(picasoData.DOB);
      if (isNaN(date.getTime())) {
        warnings.push('Invalid DOB format');
      }
    }

    if (picasoData.BloodGroup && ![1, 2, 3, 4, 5, 6, 7, 8].includes(picasoData.BloodGroup)) {
      warnings.push('Invalid BloodGroup value');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validates health checkup data from Picaso
   */
  validateHealthCheckupData(picasoData: any): RecordValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields - these must exist
    if (!picasoData.ID) {
      errors.push('Missing ID');
    }
    if (!picasoData.PicasoID) {
      errors.push('Missing PicasoID');
    }
    if (!picasoData.ConsultingID) {
      errors.push('Missing ConsultingID');
    }

    // Optional validations with warnings
    if (!picasoData.PatientName) {
      warnings.push('Missing PatientName');
    }

    // Validate numeric fields that should be numbers
    if (picasoData.BPsystolic && isNaN(Number(picasoData.BPsystolic))) {
      warnings.push('Invalid BPsystolic value (not a number)');
    }
    if (picasoData.BPdiastolic && isNaN(Number(picasoData.BPdiastolic))) {
      warnings.push('Invalid BPdiastolic value (not a number)');
    }
    if (picasoData.PulseRate && isNaN(Number(picasoData.PulseRate))) {
      warnings.push('Invalid PulseRate value (not a number)');
    }
    if (picasoData.SPO2 && isNaN(Number(picasoData.SPO2))) {
      warnings.push('Invalid SPO2 value (not a number)');
    }
    if (picasoData.Temperature && isNaN(Number(picasoData.Temperature))) {
      warnings.push('Invalid Temperature value (not a number)');
    }
    if (picasoData.Height && isNaN(Number(picasoData.Height))) {
      warnings.push('Invalid Height value (not a number)');
    }
    if (picasoData.Weight && isNaN(Number(picasoData.Weight))) {
      warnings.push('Invalid Weight value (not a number)');
    }

    // Validate date
    if (picasoData.AddedDate && isNaN(new Date(picasoData.AddedDate).getTime())) {
      warnings.push('Invalid AddedDate format');
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Validates a date string
   */
  private validateDate(dateString: string): { isValid: boolean; error?: string } {
    if (!dateString) {
      return { isValid: false, error: 'Empty date' };
    }

    // Handle invalid dates like 1752
    if (dateString === '1752-01-01' || dateString === '1752-01-01T00:00:00.000Z') {
      return { isValid: false, error: 'Invalid date (1752)' };
    }

    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return { isValid: false, error: 'Invalid date format' };
    }

    // Check for reasonable date range (not too far in past or future)
    const currentYear = new Date().getFullYear();
    const dateYear = date.getFullYear();
    
    if (dateYear < 1900 || dateYear > currentYear + 1) {
      return { isValid: false, error: 'Date out of reasonable range' };
    }

    return { isValid: true };
  }

  /**
   * Validates phone number format
   */
  private validatePhoneNumber(phoneNumber: string): boolean {
    if (!phoneNumber) return false;
    
    // Remove all non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // Check if it's a valid Indian phone number (10-12 digits)
    return cleaned.length >= 10 && cleaned.length <= 12;
  }

  /**
   * Validates email format
   */
  private validateEmail(email: string): boolean {
    if (!email) return false;
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validates BMI calculation
   */
  validateBMI(height: number, weight: number): { isValid: boolean; bmi?: number; error?: string } {
    if (!height || !weight) {
      return { isValid: false, error: 'Missing height or weight' };
    }

    if (height <= 0 || weight <= 0) {
      return { isValid: false, error: 'Invalid height or weight values' };
    }

    const heightInMeters = height / 100;
    const bmi = weight / (heightInMeters * heightInMeters);

    if (bmi < 10 || bmi > 100) {
      return { isValid: false, error: 'BMI out of reasonable range' };
    }

    return { isValid: true, bmi };
  }

  /**
   * Validates blood pressure values
   */
  validateBloodPressure(systolic: number, diastolic: number): { isValid: boolean; error?: string } {
    if (systolic && (systolic < 70 || systolic > 300)) {
      return { isValid: false, error: 'Systolic pressure out of range' };
    }

    if (diastolic && (diastolic < 40 || diastolic > 200)) {
      return { isValid: false, error: 'Diastolic pressure out of range' };
    }

    if (systolic && diastolic && systolic < diastolic) {
      return { isValid: false, error: 'Systolic pressure cannot be less than diastolic' };
    }

    return { isValid: true };
  }
} 