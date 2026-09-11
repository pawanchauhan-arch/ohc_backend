/**
 * Health Parameter Classifier Utility
 * Classifies health test values into color categories based on medical thresholds
 */

export type ColorCategory = 'red' | 'amber' | 'yellow' | 'green';

interface ClassificationResult {
  category: ColorCategory;
  value: number | string;
}

/**
 * Classifies a health parameter value into color categories
 * @param testName - Name of the test parameter
 * @param value - The test value (can be number or string)
 * @param unit - Optional unit for the test
 * @returns Color category: 'red' | 'amber' | 'yellow' | 'green'
 */
export function classifyParameter(
  testName: string,
  value: any,
  unit?: string,
): ColorCategory {
  if (value === null || value === undefined || value === '') {
    return 'green';
  }

  const normalizedTestName = testName.toLowerCase().trim();

  // Handle numeric values
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  const isNumeric = !isNaN(numValue) && typeof numValue === 'number';

  // Handle string-based tests
  if (!isNumeric) {
    return classifyStringValue(normalizedTestName, String(value));
  }

  // Classify numeric values based on test type
  switch (normalizedTestName) {
    case 'temperature':
    case 'temperature_unit':
      return classifyTemperature(numValue);
    case 'spo2':
    case 'spo2_unit':
      return classifySpO2(numValue);
    case 'random blood sugar':
    case 'random_blood_sugar':
    case 'random_blood_sugar_unit':
      return classifyBloodSugar(numValue);
    case 'pulse':
    case 'pulse_unit':
      return classifyPulse(numValue);
    case 'pulmonary function test':
    case 'pulmonary_function_test':
      return classifyPulmonaryFunction(numValue);
    case 'hemoglobin':
    case 'haemoglobin':
    case 'haemoglobin_unit':
      return classifyHemoglobin(numValue);
    case 'bmi':
    case 'body mass index':
    case 'bmi_unit':
      return classifyBMI(numValue);
    case 'bp-systolic':
    case 'systolic':
    case 'systolic_bp':
    case 'systolic_bp_unit':
      return classifyBPSystolic(numValue);
    case 'bp-diastolic':
    case 'diastolic':
    case 'diastolic_bp':
    case 'diastolic_bp_unit':
      return classifyBPDiastolic(numValue);
    case 'alcohol test':
    case 'alcohol':
      return classifyAlcohol(numValue);
    case 'spherical':
    case 'spherical_right':
    case 'spherical_left':
      return classifySpherical(numValue);
    case 'cylindrical':
    case 'cylindrical_right':
    case 'cylindrical_left':
      return classifyCylindrical(numValue);
    case 'vision':
    case 'eye_unit':
      return classifyVision(String(value));
    default:
      return 'green';
  }
}

/**
 * Classifies Temperature values (Fahrenheit)
 * Normal: 97-99
 * High Concern (Higher): >102.1
 * Moderate (Higher): 100.1-102
 * Borderline (Higher): 99.1-100
 * High Concern (Lower): <95
 */
function classifyTemperature(value: number): ColorCategory {
  if (value > 102.1) return 'red';
  if (value >= 100.1 && value <= 102) return 'amber';
  if (value >= 99.1 && value <= 100) return 'yellow';
  if (value >= 97 && value <= 99) return 'green';
  if (value >= 95 && value < 97) return 'amber';
  if (value < 95) return 'red';
  return 'green';
}

/**
 * Classifies SpO2 values (%)
 * Normal: 95-100
 * Borderline (Lower): 94.1-94.9
 * Moderate (Lower): 91-94
 * High Concern (Lower): <90
 */
function classifySpO2(value: number): ColorCategory {
  if (value <= 90) return 'red';
  if (value >= 91 && value <= 94) return 'amber';
  if (value >= 94.1 && value <= 94.9) return 'yellow';
  if (value >= 95 && value <= 100) return 'green';
  return 'green';
}

/**
 * Classifies Random Blood Sugar values (mg/dL)
 * Normal: 110-140
 * High Concern (Higher): ≥350
 * Moderate (Higher): 200-349
 * Borderline (Higher): 141-199
 * High Concern (Lower): <55
 * Moderate (Lower): 55-70
 * Borderline (Lower): 71-110
 */
function classifyBloodSugar(value: number): ColorCategory {
  if (value >= 350) return 'red';
  if (value >= 200 && value <= 349) return 'amber';
  if (value >= 141 && value <= 199) return 'yellow';
  if (value >= 110 && value <= 140) return 'green';
  if (value < 55) return 'red';
  if (value >= 55 && value <= 70) return 'amber';
  if (value >= 71 && value <= 110) return 'yellow';
  return 'green';
}

/**
 * Classifies Pulse values (bpm)
 * Normal: 60-100
 * High Concern (Higher): >140
 * Moderate (Higher): 120-140
 * Borderline (Higher): 100-119
 * High Concern (Lower): <40
 * Moderate (Lower): 40-50
 * Borderline (Lower): 51-59
 */
function classifyPulse(value: number): ColorCategory {
  if (value > 140) return 'red';
  if (value >= 120 && value <= 140) return 'amber';
  if (value >= 100 && value <= 119) return 'yellow';
  if (value >= 60 && value <= 100) return 'green';
  if (value < 40) return 'red';
  if (value >= 40 && value <= 50) return 'amber';
  if (value >= 51 && value <= 59) return 'yellow';
  return 'green';
}

/**
 * Classifies Pulmonary Function Test values (L/min)
 * Normal: >400
 * Borderline (Lower): 250-399
 * Moderate (Lower): <249
 */
function classifyPulmonaryFunction(value: number): ColorCategory {
  if (value > 400) return 'green';
  if (value >= 250 && value <= 399) return 'yellow';
  if (value < 249) return 'amber';
  return 'green';
}

/**
 * Classifies Hemoglobin values (g/dL)
 * Normal: 13-17
 * High Concern (Higher): >18-20
 * High Concern (Lower): <8
 * Moderate (Lower): 8-9
 * Borderline (Lower): 9.1-12.9
 */
function classifyHemoglobin(value: number): ColorCategory {
  if (value > 20) return 'red';
  if (value >= 18 && value <= 20) return 'red';
  if (value >= 13 && value <= 17) return 'green';
  if (value >= 9.1 && value <= 12.9) return 'yellow';
  if (value >= 8 && value <= 9) return 'amber';
  if (value < 8) return 'red';
  return 'green';
}

/**
 * Classifies BMI values (kg/m²)
 * Normal: 18.5-24.9
 * High Concern (Higher): >40
 * Moderate (Higher): 30-40
 * Borderline (Higher): 25-29.9
 * High Concern (Lower): <14
 * Moderate (Lower): 14-15.99
 * Borderline (Lower): 16-18.4
 */
function classifyBMI(value: number): ColorCategory {
  if (value > 40) return 'red';
  if (value >= 30 && value <= 40) return 'amber';
  if (value >= 25 && value <= 29.9) return 'yellow';
  if (value >= 18.5 && value <= 24.9) return 'green';
  if (value < 14) return 'red';
  if (value >= 14 && value <= 15.99) return 'amber';
  if (value >= 16 && value <= 18.4) return 'yellow';
  return 'green';
}

/**
 * Classifies BP-Systolic values (mm Hg)
 * Normal: 100-120
 * High Concern (Higher): >160
 * Moderate (Higher): 140-160
 * Borderline (Higher): 121-139
 * High Concern (Lower): <80
 * Moderate (Lower): 80-89
 * Borderline (Lower): 90-99
 */
function classifyBPSystolic(value: number): ColorCategory {
  if (value > 160) return 'red';
  if (value >= 140 && value <= 160) return 'amber';
  if (value >= 121 && value <= 139) return 'yellow';
  if (value >= 100 && value <= 120) return 'green';
  if (value < 80) return 'red';
  if (value >= 80 && value <= 89) return 'amber';
  if (value >= 90 && value <= 99) return 'yellow';
  return 'green';
}

/**
 * Classifies BP-Diastolic values (mm Hg)
 * Normal: 70-80
 * High Concern (Higher): >102
 * Moderate (Higher): 90-101
 * Borderline (Higher): 81-89
 * High Concern (Lower): <50
 * Moderate (Lower): 50-59
 * Borderline (Lower): 60-69
 */
function classifyBPDiastolic(value: number): ColorCategory {
  if (value > 102) return 'red';
  if (value >= 90 && value <= 101) return 'amber';
  if (value >= 81 && value <= 89) return 'yellow';
  if (value >= 70 && value <= 80) return 'green';
  if (value < 50) return 'red';
  if (value >= 50 && value <= 59) return 'amber';
  if (value >= 60 && value <= 69) return 'yellow';
  return 'green';
}

/**
 * Classifies Alcohol Test values (mg/100mL)
 * Normal: 0
 * High Concern (Higher): >30
 */
function classifyAlcohol(value: number): ColorCategory {
  if (value > 30) return 'red';
  if (value === 0) return 'green';
  return 'yellow';
}

/**
 * Classifies Spherical values (Diopter)
 * Normal: N/A (treated as 0)
 * High Concern (Higher): >+2.00
 * Moderate (Higher): +0.50 to +2.00
 * Borderline (Higher): +0.5
 * High Concern (Lower): <-2.00
 * Moderate (Lower): -0.50 to -2.00
 * Borderline (Lower): >-0.5
 */
function classifySpherical(value: number): ColorCategory {
  if (value > 2.0) return 'red';
  if (value >= 0.51 && value <= 2.0) return 'amber';
  if (value > 0 && value <= 0.5) return 'yellow';
  if (value === 0) return 'green';
  if (value < -2.0) return 'red';
  if (value >= -2.0 && value <= -0.51) return 'amber';
  if (value >= -0.5 && value < 0) return 'yellow';
  return 'green';
}

/**
 * Classifies Cylindrical values (Diopter)
 * Normal: N/A (treated as 0)
 * High Concern (Higher): >+1.25
 * Moderate (Higher): +0.25 to +1.25
 * Borderline (Higher): +0.25
 * High Concern (Lower): <-1.25
 * Moderate (Lower): -0.25 to -1.25
 * Borderline (Lower): >-0.25
 */
function classifyCylindrical(value: number): ColorCategory {
  if (value > 1.25) return 'red';
  if (value >= 0.26 && value <= 1.25) return 'amber';
  if (value > 0 && value <= 0.25) return 'yellow';
  if (value === 0) return 'green';
  if (value < -1.25) return 'red';
  if (value >= -1.25 && value <= -0.26) return 'amber';
  if (value >= -0.25 && value < 0) return 'yellow';
  return 'green';
}

/**
 * Classifies Vision values
 * Normal: 6/6
 * Borderline (Higher): 6/9
 * High Concern (Higher): >6/9 (worse than 6/9)
 */
function classifyVision(value: string): ColorCategory {
  const normalized = String(value).trim().toLowerCase();
  if (normalized === '6/6') return 'green';
  if (normalized === '6/9') return 'yellow';
  if (normalized.includes('6/') || normalized.includes('/')) {
    const parts = normalized.split('/');
    if (parts.length === 2) {
      const numerator = parseFloat(parts[0]);
      const denominator = parseFloat(parts[1]);
      if (!isNaN(numerator) && !isNaN(denominator)) {
        const ratio = numerator / denominator;
        if (ratio < 0.67) return 'red';
        if (ratio < 0.89) return 'amber';
      }
    }
  }
  return 'green';
}

/**
 * Classifies string-based test values
 */
function classifyStringValue(testName: string, value: string): ColorCategory {
  const normalizedValue = value.toLowerCase().trim();
  const normalizedTestName = testName.toLowerCase().trim();

  // Colour Blindness
  if (normalizedTestName.includes('colour') || normalizedTestName.includes('color')) {
    if (normalizedValue === 'positive') return 'yellow';
    if (normalizedValue === 'negative') return 'green';
  }

  // HIV Test
  if (normalizedTestName.includes('hiv')) {
    return 'green';
  }

  // ECG Test
  if (normalizedTestName.includes('ecg')) {
    if (normalizedValue === 'severe') return 'amber';
    if (normalizedValue === 'moderate') return 'yellow';
    if (normalizedValue === 'normal') return 'green';
  }

  // Romberg Test
  if (normalizedTestName.includes('romberg')) {
    if (normalizedValue === 'positive') return 'yellow';
    if (normalizedValue === 'negative') return 'green';
  }

  // Basic Hearing
  if (normalizedTestName.includes('hearing')) {
    if (normalizedValue === 'severe') return 'amber';
    if (normalizedValue === 'moderate') return 'yellow';
    if (normalizedValue === 'positive' || normalizedValue === 'normal') return 'green';
  }

  return 'green';
}