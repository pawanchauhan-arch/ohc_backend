export interface BmiMeasurements {
  height: number;
  weight: number;
}

/**
 * Parses selected_test JSON from a health checkup record.
 */
export function parseSelectedTest(selectedTest: unknown): Record<string, unknown> | null {
  if (!selectedTest) {
    return null;
  }
  if (typeof selectedTest === 'string') {
    try {
      return JSON.parse(selectedTest) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
  if (typeof selectedTest === 'object') {
    return selectedTest as Record<string, unknown>;
  }
  return null;
}

/**
 * Extracts height (cm) and weight (kg) from a health checkup's BMI test data.
 */
export function extractBmiMeasurements(selectedTest: unknown): BmiMeasurements | null {
  const parsed = parseSelectedTest(selectedTest);
  const bmiUnit = parsed?.bmi_unit as Record<string, unknown> | undefined;
  if (!bmiUnit) {
    return null;
  }
  const height = Number(bmiUnit.height);
  const weight = Number(bmiUnit.weight);
  if (!Number.isFinite(height) || !Number.isFinite(weight) || height <= 0 || weight <= 0) {
    return null;
  }
  return { height, weight };
}
