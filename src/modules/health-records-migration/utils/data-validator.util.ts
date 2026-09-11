import { Injectable, Logger } from '@nestjs/common';
import { ParsedTestData } from '../interfaces/migration.interface';

/**
 * Data validation utility for health records migration
 */
@Injectable()
export class DataValidatorUtil {
  private readonly logger = new Logger(DataValidatorUtil.name);

  /**
   * Validates parsed test data before insertion
   */
  validateParsedData(parsedData: ParsedTestData, healthCheckupId: number): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Validate SPO2
      if (parsedData.spo2) {
        this.validateSpo2Data(parsedData.spo2, errors, warnings);
      }

      // Validate Blood Pressure
      if (parsedData.bloodPressure) {
        this.validateBloodPressureData(parsedData.bloodPressure, errors, warnings);
      }

      // Validate Temperature
      if (parsedData.temperature) {
        this.validateTemperatureData(parsedData.temperature, errors, warnings);
      }

      // Validate Pulse
      if (parsedData.pulse) {
        this.validatePulseData(parsedData.pulse, errors, warnings);
      }

      // Validate BMI
      if (parsedData.bmi) {
        this.validateBmiData(parsedData.bmi, errors, warnings);
      }

      // Validate Random Blood Sugar
      if (parsedData.randomBloodSugar) {
        this.validateRandomBloodSugarData(parsedData.randomBloodSugar, errors, warnings);
      }

      // Validate Haemoglobin
      if (parsedData.haemoglobin) {
        this.validateHaemoglobinData(parsedData.haemoglobin, errors, warnings);
      }

      // Validate Alcohol
      if (parsedData.alcohol) {
        this.validateAlcoholData(parsedData.alcohol, errors, warnings);
      }

      // Validate ECG
      if (parsedData.ecg) {
        this.validateEcgData(parsedData.ecg, errors, warnings);
      }

      // Validate Vision
      if (parsedData.vision) {
        this.validateVisionData(parsedData.vision, errors, warnings);
      }

      // Validate Romberg
      if (parsedData.romberg) {
        this.validateRombergData(parsedData.romberg, errors, warnings);
      }

      // Validate Pulmonary Function
      if (parsedData.pulmonaryFunction) {
        this.validatePulmonaryFunctionData(parsedData.pulmonaryFunction, errors, warnings);
      }

      // Validate HIV
      if (parsedData.hiv) {
        this.validateHivData(parsedData.hiv, errors, warnings);
      }

      // Validate Eye
      if (parsedData.eye) {
        this.validateEyeData(parsedData.eye, errors, warnings);
      }

      // Check if at least one test is present
      const hasAnyTest = Object.keys(parsedData).length > 0;
      if (!hasAnyTest) {
        warnings.push(`No test data found for health checkup ${healthCheckupId}`);
      }

    } catch (error) {
      this.logger.error(`Validation error for health checkup ${healthCheckupId}:`, error);
      errors.push(`Validation failed: ${error.message}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate SPO2 data
   */
  private validateSpo2Data(data: any, errors: string[], warnings: string[]): void {
    if (data.value !== null) {
      if (data.value < 0 || data.value > 100) {
        warnings.push('SPO2 value is outside normal range (0-100)');
      }
    }
    if (data.units && !['%', 'percent'].includes(data.units.toLowerCase())) {
      warnings.push(`Unexpected SPO2 units: ${data.units}`);
    }
  }

  /**
   * Validate Blood Pressure data
   */
  private validateBloodPressureData(data: any, errors: string[], warnings: string[]): void {
    if (data.systolic_value !== null) {
      if (data.systolic_value < 50 || data.systolic_value > 300) {
        warnings.push('Systolic BP value is outside typical range (50-300)');
      }
    }
    if (data.diastolic_value !== null) {
      if (data.diastolic_value < 30 || data.diastolic_value > 200) {
        warnings.push('Diastolic BP value is outside typical range (30-200)');
      }
    }
    if (data.systolic_value && data.diastolic_value && data.systolic_value <= data.diastolic_value) {
      warnings.push('Systolic BP should be higher than diastolic BP');
    }
  }

  /**
   * Validate Temperature data
   */
  private validateTemperatureData(data: any, errors: string[], warnings: string[]): void {
    if (data.value !== null) {
      if (data.units === 'F' && (data.value < 90 || data.value > 110)) {
        warnings.push('Temperature value is outside typical range for Fahrenheit (90-110)');
      }
      if (data.units === 'C' && (data.value < 32 || data.value > 43)) {
        warnings.push('Temperature value is outside typical range for Celsius (32-43)');
      }
    }
  }

  /**
   * Validate Pulse data
   */
  private validatePulseData(data: any, errors: string[], warnings: string[]): void {
    if (data.value !== null) {
      if (data.value < 30 || data.value > 200) {
        warnings.push('Pulse value is outside typical range (30-200 bpm)');
      }
    }
  }

  /**
   * Validate BMI data
   */
  private validateBmiData(data: any, errors: string[], warnings: string[]): void {
    if (data.value !== null) {
      if (data.value < 10 || data.value > 60) {
        warnings.push('BMI value is outside typical range (10-60)');
      }
    }
    if (data.height_cm !== null && (data.height_cm < 100 || data.height_cm > 250)) {
      warnings.push('Height is outside typical range (100-250 cm)');
    }
    if (data.weight_kg !== null && (data.weight_kg < 30 || data.weight_kg > 300)) {
      warnings.push('Weight is outside typical range (30-300 kg)');
    }
  }

  /**
   * Validate Random Blood Sugar data
   */
  private validateRandomBloodSugarData(data: any, errors: string[], warnings: string[]): void {
    if (data.value !== null) {
      if (data.value < 50 || data.value > 600) {
        warnings.push('Blood sugar value is outside typical range (50-600 mg/dl)');
      }
    }
  }

  /**
   * Validate Haemoglobin data
   */
  private validateHaemoglobinData(data: any, errors: string[], warnings: string[]): void {
    if (data.value !== null) {
      if (data.value < 5 || data.value > 25) {
        warnings.push('Haemoglobin value is outside typical range (5-25 g/dl)');
      }
    }
  }

  /**
   * Validate Alcohol data
   */
  private validateAlcoholData(data: any, errors: string[], warnings: string[]): void {
    // Alcohol values are typically strings like "0", "00", "Negative"
    // No specific validation needed beyond presence
  }

  /**
   * Validate ECG data
   */
  private validateEcgData(data: any, errors: string[], warnings: string[]): void {
    if (!data.value && !data.doc_url) {
      warnings.push('ECG test has neither value nor document URL');
    }
  }

  /**
   * Validate Vision data
   */
  private validateVisionData(data: any, errors: string[], warnings: string[]): void {
    // Vision values are typically strings like "6/6", "6/9", etc.
    // No specific validation needed beyond presence
  }

  /**
   * Validate Romberg data
   */
  private validateRombergData(data: any, errors: string[], warnings: string[]): void {
    if (data.value && !['Positive', 'Negative'].includes(data.value)) {
      warnings.push(`Unexpected Romberg test value: ${data.value}`);
    }
  }

  /**
   * Validate Pulmonary Function data
   */
  private validatePulmonaryFunctionData(data: any, errors: string[], warnings: string[]): void {
    if (data.value !== null) {
      if (data.value < 100 || data.value > 1000) {
        warnings.push('Pulmonary function value is outside typical range (100-1000 L/min)');
      }
    }
  }

  /**
   * Validate HIV data
   */
  private validateHivData(data: any, errors: string[], warnings: string[]): void {
    if (data.value && !['Positive', 'Negative', 'Reactive', 'Non-Reactive'].includes(data.value)) {
      warnings.push(`Unexpected HIV test value: ${data.value}`);
    }
  }

  /**
   * Validate Eye data
   */
  private validateEyeData(data: any, errors: string[], warnings: string[]): void {
    // Validate spherical values
    if (data.spherical_right !== null && (data.spherical_right < -20 || data.spherical_right > 20)) {
      warnings.push('Right eye spherical value is outside typical range (-20 to +20 D)');
    }
    if (data.spherical_left !== null && (data.spherical_left < -20 || data.spherical_left > 20)) {
      warnings.push('Left eye spherical value is outside typical range (-20 to +20 D)');
    }

    // Validate cylindrical values
    if (data.cylindrical_right !== null && (data.cylindrical_right < -10 || data.cylindrical_right > 10)) {
      warnings.push('Right eye cylindrical value is outside typical range (-10 to +10 D)');
    }
    if (data.cylindrical_left !== null && (data.cylindrical_left < -10 || data.cylindrical_left > 10)) {
      warnings.push('Left eye cylindrical value is outside typical range (-10 to +10 D)');
    }
  }
}
