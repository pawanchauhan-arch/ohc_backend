import { Injectable, Logger } from '@nestjs/common';
import { ParsedTestData } from '../interfaces/migration.interface';

/**
 * Utility service for parsing selected_test JSON data
 */
@Injectable()
export class TestDataParserUtil {
  private readonly logger = new Logger(TestDataParserUtil.name);

  /**
   * Parses the selected_test JSON and extracts individual test data
   */
  parseSelectedTestData(selectedTestJson: any, healthCheckupId: number): ParsedTestData {
    const results: ParsedTestData = {};

    try {
      // Parse SPO2
      if (selectedTestJson?.spo2_unit) {
        results.spo2 = this.parseSpo2Data(selectedTestJson.spo2_unit, healthCheckupId);
      }

      // Parse Blood Pressure
      if (selectedTestJson?.blood_pressure_unit) {
        results.bloodPressure = this.parseBloodPressureData(selectedTestJson.blood_pressure_unit, healthCheckupId);
      }

      // Parse Temperature
      if (selectedTestJson?.temperature_unit) {
        results.temperature = this.parseTemperatureData(selectedTestJson.temperature_unit, healthCheckupId);
      }

      // Parse Pulse
      if (selectedTestJson?.pulse_unit) {
        results.pulse = this.parsePulseData(selectedTestJson.pulse_unit, healthCheckupId);
      }

      // Parse BMI
      if (selectedTestJson?.bmi_unit) {
        results.bmi = this.parseBmiData(selectedTestJson.bmi_unit, healthCheckupId);
      }

      // Parse Random Blood Sugar
      if (selectedTestJson?.random_blood_sugar_unit) {
        results.randomBloodSugar = this.parseRandomBloodSugarData(selectedTestJson.random_blood_sugar_unit, healthCheckupId);
      }

      // Parse Haemoglobin
      if (selectedTestJson?.haemoglobin_unit) {
        results.haemoglobin = this.parseHaemoglobinData(selectedTestJson.haemoglobin_unit, healthCheckupId);
      }

      // Parse Alcohol Test (note: typo in original JSON key)
      if (selectedTestJson?.alchol_test_unit) {
        results.alcohol = this.parseAlcoholData(selectedTestJson.alchol_test_unit, healthCheckupId);
      }

      // Parse ECG
      if (selectedTestJson?.ecg_unit) {
        results.ecg = this.parseEcgData(selectedTestJson.ecg_unit, healthCheckupId);
      }

      // Parse Vision
      if (selectedTestJson?.vision_unit) {
        results.vision = this.parseVisionData(selectedTestJson.vision_unit, healthCheckupId);
      }

      // Parse Romberg
      if (selectedTestJson?.romberg_unit) {
        results.romberg = this.parseRombergData(selectedTestJson.romberg_unit, healthCheckupId);
      }

      // Parse Pulmonary Function Test
      if (selectedTestJson?.pulmonary_function_test_unit) {
        results.pulmonaryFunction = this.parsePulmonaryFunctionData(selectedTestJson.pulmonary_function_test_unit, healthCheckupId);
      }

      // Parse HIV
      if (selectedTestJson?.hiv_unit) {
        results.hiv = this.parseHivData(selectedTestJson.hiv_unit, healthCheckupId);
      }

      // Parse Eye Tests
      if (selectedTestJson?.eye_unit) {
        results.eye = this.parseEyeData(selectedTestJson.eye_unit, healthCheckupId);
      }

    } catch (error) {
      this.logger.error(`Error parsing test data for health checkup ${healthCheckupId}:`, error);
      throw error;
    }

    return results;
  }

  /**
   * Parse SPO2 data
   */
  private parseSpo2Data(spo2Unit: any, healthCheckupId: number) {
    return {
      health_checkup_id: healthCheckupId,
      value: this.parseNumericValue(spo2Unit.value),
      units: spo2Unit.units || '%',
      status: spo2Unit.status || null,
      remark: spo2Unit.remark || null,
    };
  }

  /**
   * Parse Blood Pressure data
   */
  private parseBloodPressureData(bloodPressureUnit: any, healthCheckupId: number) {
    return {
      health_checkup_id: healthCheckupId,
      systolic_value: this.parseIntegerValue(bloodPressureUnit.systolic_bp_unit?.value),
      diastolic_value: this.parseIntegerValue(bloodPressureUnit.diastolic_bp_unit?.value),
      units: bloodPressureUnit.systolic_bp_unit?.units || 'mm Hg',
      systolic_status: bloodPressureUnit.systolic_bp_unit?.status || null,
      diastolic_status: bloodPressureUnit.diastolic_bp_unit?.status || null,
      systolic_remark: bloodPressureUnit.systolic_bp_unit?.remark || null,
      diastolic_remark: bloodPressureUnit.diastolic_bp_unit?.remark || null,
    };
  }

  /**
   * Parse Temperature data
   */
  private parseTemperatureData(temperatureUnit: any, healthCheckupId: number) {
    return {
      health_checkup_id: healthCheckupId,
      value: this.parseNumericValue(temperatureUnit.value),
      units: temperatureUnit.units || 'F',
      status: temperatureUnit.status || null,
      remark: temperatureUnit.remark || null,
    };
  }

  /**
   * Parse Pulse data
   */
  private parsePulseData(pulseUnit: any, healthCheckupId: number) {
    return {
      health_checkup_id: healthCheckupId,
      value: this.parseIntegerValue(pulseUnit.value),
      units: pulseUnit.units || 'bpm',
      status: pulseUnit.status || null,
      remark: pulseUnit.remark || null,
    };
  }

  /**
   * Parse BMI data
   */
  private parseBmiData(bmiUnit: any, healthCheckupId: number) {
    return {
      health_checkup_id: healthCheckupId,
      value: this.parseNumericValue(bmiUnit.value),
      units: bmiUnit.units || 'kg/m2',
      status: bmiUnit.status || null,
      remark: bmiUnit.remark || null,
      height: this.parseNumericValue(bmiUnit.height),
      weight: this.parseNumericValue(bmiUnit.weight),
    };
  }

  /**
   * Parse Random Blood Sugar data
   */
  private parseRandomBloodSugarData(randomBloodSugarUnit: any, healthCheckupId: number) {
    return {
      health_checkup_id: healthCheckupId,
      value: this.parseIntegerValue(randomBloodSugarUnit.value),
      units: randomBloodSugarUnit.units || 'mg/dl',
      status: randomBloodSugarUnit.status || null,
      remark: randomBloodSugarUnit.remark || null,
    };
  }

  /**
   * Parse Haemoglobin data
   */
  private parseHaemoglobinData(haemoglobinUnit: any, healthCheckupId: number) {
    return {
      health_checkup_id: healthCheckupId,
      value: this.parseIntegerValue(haemoglobinUnit.value),
      units: haemoglobinUnit.units || 'g/dl',
      status: haemoglobinUnit.status || null,
      remark: haemoglobinUnit.remark || null,
    };
  }

  /**
   * Parse Alcohol data
   */
  private parseAlcoholData(alcoholUnit: any, healthCheckupId: number) {
    return {
      health_checkup_id: healthCheckupId,
      value: alcoholUnit.value?.toString() || null,
      units: alcoholUnit.units || 'mg/ml',
      status: alcoholUnit.status || null,
      remark: alcoholUnit.remark || null,
    };
  }

  /**
   * Parse ECG data
   */
  private parseEcgData(ecgUnit: any, healthCheckupId: number) {
    return {
      health_checkup_id: healthCheckupId,
      value: ecgUnit.value || null,
      status: ecgUnit.status || null,
      remark: ecgUnit.remark || null,
      doc_url: ecgUnit.doc || null,
    };
  }

  /**
   * Parse Vision data
   */
  private parseVisionData(visionUnit: any, healthCheckupId: number) {
    return {
      health_checkup_id: healthCheckupId,
      value: visionUnit.value || null,
      status: visionUnit.status || null,
      remark: visionUnit.remark || null,
    };
  }

  /**
   * Parse Romberg data
   */
  private parseRombergData(rombergUnit: any, healthCheckupId: number) {
    return {
      health_checkup_id: healthCheckupId,
      value: rombergUnit.value || null,
      status: rombergUnit.status || null,
      remark: rombergUnit.remark || null,
    };
  }

  /**
   * Parse Pulmonary Function data
   */
  private parsePulmonaryFunctionData(pulmonaryFunctionUnit: any, healthCheckupId: number) {
    return {
      health_checkup_id: healthCheckupId,
      value: this.parseIntegerValue(pulmonaryFunctionUnit.value),
      units: pulmonaryFunctionUnit.units || 'L/min',
      status: pulmonaryFunctionUnit.status || null,
      remark: pulmonaryFunctionUnit.remark || null,
    };
  }

  /**
   * Parse HIV data
   */
  private parseHivData(hivUnit: any, healthCheckupId: number) {
    return {
      health_checkup_id: healthCheckupId,
      value: hivUnit.value || null,
      status: hivUnit.status || null,
      remark: hivUnit.remark || null,
    };
  }

  /**
   * Parse Eye data
   */
  private parseEyeData(eyeUnit: any, healthCheckupId: number) {
    return {
      health_checkup_id: healthCheckupId,
      spherical_right_eye: this.parseNumericValue(eyeUnit.spherical_right_eye_unit?.value),
      spherical_left_eye: this.parseNumericValue(eyeUnit.spherical_left_eye_unit?.value),
      cylindrical_right_eye: this.parseNumericValue(eyeUnit.cylindrical_right_eye_unit?.value),
      cylindrical_left_eye: this.parseNumericValue(eyeUnit.cylindrical_left_eye_unit?.value),
      colour_blindness: eyeUnit.colour_blindness_unit?.value || null,
      units: eyeUnit.spherical_right_eye_unit?.units || 'D',
      spherical_right_status: eyeUnit.spherical_right_eye_unit?.status || null,
      spherical_left_status: eyeUnit.spherical_left_eye_unit?.status || null,
      cylindrical_right_status: eyeUnit.cylindrical_right_eye_unit?.status || null,
      cylindrical_left_status: eyeUnit.cylindrical_left_eye_unit?.status || null,
      colour_blindness_status: eyeUnit.colour_blindness_unit?.status || null,
      remark: null, // Add remark field
    };
  }

  /**
   * Safely parse numeric values
   */
  private parseNumericValue(value: any): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }
    const parsed = parseFloat(value);
    return isNaN(parsed) ? null : parsed;
  }

  /**
   * Safely parse integer values
   */
  private parseIntegerValue(value: any): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }
    const parsed = parseInt(value);
    return isNaN(parsed) ? null : parsed;
  }
}
