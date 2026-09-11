export type VitalBand = 'normal' | 'borderline' | 'moderate' | 'high' | null;

interface FitnessStatusInput {
  selectedTest: Record<string, any> | null | undefined;
  referenceDate?: Date | string | null;
}

/** Raw readings used by fitness status and concern generation (excludes direct-unfit-only rules). */
export interface FitnessReadings {
  temperature: number | null;
  spo2: number | null;
  randomBloodSugar: number | null;
  pulse: number | null;
  pulmonaryFunction: number | null;
  hemoglobin: number | null;
  bmi: number | null;
  systolic: number | null;
  diastolic: number | null;
  alcohol: number | null;
  ecgValue: string | null;
  rombergValue: string | null;
  basicHearingValue: string | null;
  hivValue: string | null;
  sphericalLeft: number | null;
  sphericalRight: number | null;
  cylindricalLeft: number | null;
  cylindricalRight: number | null;
  leftEyeRatio: number | null;
  rightEyeRatio: number | null;
  isWearingSpecs: boolean | null;
  isColourBlindnessPositive: boolean;
}

export interface FitnessVitalAssessment {
  id: string;
  concernType: string;
  parameter: string;
  band: VitalBand;
  value: number | string;
  /** Present when band is moderate or high — matches fitness band definitions */
  thresholdLabel?: string;
}

const FITNESS_CONCERN_THRESHOLD_LABELS: Record<
  string,
  { moderate: string; high: string }
> = {
  temperature: {
    moderate: '100.1–102°F or <95.1°F',
    high: '>102.1°F',
  },
  spo2: {
    moderate: '91–94%',
    high: '<90%',
  },
  random_blood_sugar: {
    moderate: '55–70 or 200–349 mg/dL',
    high: '≥350 or <55 mg/dL',
  },
  pulse: {
    moderate: '40–50 or 120–140 bpm',
    high: '<40 or >140 bpm',
  },
  pulmonary_function: {
    moderate: '<249 L/min',
    high: 'N/A',
  },
  hemoglobin: {
    moderate: '8–9 g/dL',
    high: '≥18 or <8 g/dL',
  },
  bmi: {
    moderate: '14–15.99 or 30–40 kg/m²',
    high: '<14 or >40 kg/m²',
  },
  blood_pressure: {
    moderate:
      'Systolic 140–160 or 80–89; Diastolic 90–101 or 50–59 mmHg',
    high: 'Systolic >160 or <80; Diastolic >102 or <50 mmHg',
  },
  ecg: {
    moderate: 'ECG moderate / severe (mapped per fitness rules)',
    high: 'N/A',
  },
  romberg: {
    moderate: 'Positive Romberg',
    high: 'N/A',
  },
  basic_hearing: {
    moderate:
      'Moderate or severe hearing loss (severe is still a moderate-level concern only)',
    high: 'N/A',
  },
  spherical_left: {
    moderate: '|0.51|–|2.00| D',
    high: '>2.00 or <-2.00 D',
  },
  spherical_right: {
    moderate: '|0.51|–|2.00| D',
    high: '>2.00 or <-2.00 D',
  },
  cylindrical_left: {
    moderate: '|0.26|–|1.25| D',
    high: '>1.25 or <-1.25 D',
  },
  cylindrical_right: {
    moderate: '|0.26|–|1.25| D',
    high: '>1.25 or <-1.25 D',
  },
  alcohol: {
    moderate: 'N/A',
    high: '>30 (device units)',
  },
  eye_vision: {
    moderate: 'L- 6/9, R-6/9',
    high: 'L:- >6/9 , R:- >6/9',
  },
};

function thresholdLabelForConcern(id: string, band: 'moderate' | 'high'): string {
  const row = FITNESS_CONCERN_THRESHOLD_LABELS[id];
  if (!row) {
    return band === 'high' ? 'High band (fitness criteria)' : 'Moderate band (fitness criteria)';
  }
  return band === 'high' ? row.high : row.moderate;
}

const STATUS_FIT = 'FIT';
const STATUS_DOCTOR_CONSULTATION = 'DOCTOR CONSULTATION RECOMMENDED';
const STATUS_UNFIT = 'UNFIT AND REFERRED FOR HIGHER CENTER';
const IST_OFFSET_MINUTES = 330;

function parseNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : null;
}

function readValue(
  source: Record<string, any> | null | undefined,
  keys: string[],
): number | null {
  if (!source) {
    return null;
  }
  for (const key of keys) {
    const nestedValue = source[key];
    if (
      nestedValue &&
      typeof nestedValue === 'object' &&
      'value' in nestedValue
    ) {
      const parsedNestedValue = parseNumber(nestedValue.value);
      if (parsedNestedValue !== null) {
        return parsedNestedValue;
      }
    }
    const parsedValue = parseNumber(nestedValue);
    if (parsedValue !== null) {
      return parsedValue;
    }
  }
  return null;
}

function classifyTemperature(value: number | null): VitalBand {
  if (value === null) return null;
  if (value > 102.1) return 'high';
  if (value >= 100.1 && value <= 102) return 'moderate';
  if (value >= 99.1 && value <= 100) return 'borderline';
  if (value >= 97 && value <= 99) return 'normal';
  if (value >= 95.1 && value <= 96.9) return 'borderline';
  if (value < 95.1) return 'moderate';
  return null;
}

function classifySpo2(value: number | null): VitalBand {
  if (value === null) return null;
  if (value < 90) return 'high';
  if (value >= 91 && value <= 94) return 'moderate';
  if (value >= 94.1 && value <= 94.9) return 'borderline';
  if (value >= 95 && value <= 100) return 'normal';
  return null;
}

function classifyRbs(value: number | null): VitalBand {
  if (value === null) return null;
  if (value >= 350 || value < 55) return 'high';
  if ((value >= 200 && value <= 349) || (value >= 55 && value <= 70))
    return 'moderate';
  if ((value >= 141 && value <= 199) || (value >= 71 && value < 110))
    return 'borderline';
  if (value >= 110 && value <= 140) return 'normal';
  return null;
}

function classifyPulse(value: number | null): VitalBand {
  if (value === null) return null;
  if (value > 140 || value < 40) return 'high';
  if ((value >= 120 && value <= 140) || (value >= 40 && value <= 50))
    return 'moderate';
  if ((value >= 100 && value <= 119) || (value >= 51 && value <= 59))
    return 'borderline';
  if (value >= 60 && value <= 100) return 'normal';
  return null;
}

function classifyPulmonaryFunction(value: number | null): VitalBand {
  if (value === null) return null;
  if (value > 400) return 'normal';
  if (value >= 250 && value <= 399) return 'borderline';
  if (value < 249) return 'moderate';
  return null;
}

function classifyHemoglobin(value: number | null): VitalBand {
  if (value === null) return null;
  if (value >= 18 || value < 8) return 'high';
  if (value >= 8 && value <= 9) return 'moderate';
  if (value >= 9.1 && value <= 12.9) return 'borderline';
  if (value >= 13 && value <= 17) return 'normal';
  return null;
}

function classifyBmi(value: number | null): VitalBand {
  if (value === null) return null;
  if (value > 40 || value < 14) return 'high';
  if ((value >= 30 && value <= 40) || (value >= 14 && value <= 15.99))
    return 'moderate';
  if ((value >= 25 && value <= 29.9) || (value >= 16 && value <= 18.4))
    return 'borderline';
  if (value >= 18.5 && value <= 24.9) return 'normal';
  return null;
}

function classifyBpSystolic(value: number | null): VitalBand {
  if (value === null) return null;
  if (value > 160 || value < 80) return 'high';
  if ((value >= 140 && value <= 160) || (value >= 80 && value <= 89))
    return 'moderate';
  if ((value >= 121 && value <= 139) || (value >= 90 && value <= 99))
    return 'borderline';
  if (value >= 100 && value <= 120) return 'normal';
  return null;
}

function classifyBpDiastolic(value: number | null): VitalBand {
  if (value === null) return null;
  if (value > 102 || value < 50) return 'high';
  if ((value >= 90 && value <= 101) || (value >= 50 && value <= 59))
    return 'moderate';
  if ((value >= 81 && value <= 89) || (value >= 60 && value <= 69))
    return 'borderline';
  if (value >= 70 && value <= 80) return 'normal';
  return null;
}

const VITAL_BAND_PRIORITY: Record<Exclude<VitalBand, null>, number> = {
  high: 4,
  moderate: 3,
  borderline: 2,
  normal: 1,
};

function worstBand(a: VitalBand, b: VitalBand): VitalBand {
  if (a === null) return b;
  if (b === null) return a;
  return VITAL_BAND_PRIORITY[a] >= VITAL_BAND_PRIORITY[b] ? a : b;
}

function classifySpherical(value: number | null): VitalBand {
  if (value === null) return null;
  if (value > 2 || value < -2) return 'high';
  if ((value >= 0.51 && value <= 2) || (value >= -2 && value <= -0.51))
    return 'moderate';
  if ((value >= 0 && value <= 0.5) || (value > -0.51 && value < 0))
    return 'borderline';
  return null;
}

function classifyCylindrical(value: number | null): VitalBand {
  if (value === null) return null;
  if (value > 1.25 || value < -1.25) return 'high';
  if ((value >= 0.26 && value <= 1.25) || (value >= -1.25 && value <= -0.26)) {
    return 'moderate';
  }
  if ((value > 0 && value <= 0.25) || (value >= -0.25 && value < 0))
    return 'borderline';
  if (value === 0) return 'normal';
  return null;
}

function readStringValue(
  source: Record<string, any> | null | undefined,
  keys: string[],
): string | null {
  if (!source) {
    return null;
  }
  for (const key of keys) {
    const nestedValue = source[key];
    if (
      nestedValue &&
      typeof nestedValue === 'object' &&
      'value' in nestedValue &&
      nestedValue.value !== null &&
      nestedValue.value !== undefined
    ) {
      return String(nestedValue.value).trim();
    }
    if (
      nestedValue !== null &&
      nestedValue !== undefined &&
      nestedValue !== ''
    ) {
      return String(nestedValue).trim();
    }
  }
  return null;
}

function classifyEcg(value: string | null): VitalBand {
  if (!value) return null;
  const normalizedValue = value.toLowerCase();
  if (normalizedValue === 'normal') return 'normal';
  if (normalizedValue === 'moderate') return 'borderline';
  if (normalizedValue === 'severe') return 'moderate';
  return null;
}

function classifyRomberg(value: string | null): VitalBand {
  if (!value) return null;
  const normalizedValue = value.toLowerCase();
  if (normalizedValue === 'negative') return 'normal';
  if (normalizedValue === 'positive') return 'borderline';
  return null;
}

function classifyBasicHearing(value: string | null): VitalBand {
  if (!value) return null;
  const normalizedValue = value.toLowerCase();
  if (normalizedValue === 'positive') return 'normal';
  // if (normalizedValue === 'moderate') return 'moderate';
  /** Severe hearing: concern band is moderate only (no high for basic hearing). */
  if (normalizedValue === 'severe') return 'moderate';
  return null;
}

function classifyHiv(value: string | null): VitalBand {
  if (!value) return null;
  return 'normal';
}

function parseVisionFraction(value: unknown): number | null {
  if (typeof value !== 'string') {
    return null;
  }
  const normalizedValue = value.trim();
  const parts = normalizedValue.split('/');
  if (parts.length !== 2) {
    return null;
  }
  const numerator = parseNumber(parts[0]);
  const denominator = parseNumber(parts[1]);
  if (numerator === null || denominator === null || denominator === 0) {
    return null;
  }
  return numerator / denominator;
}

function resolveVisionAcuityString(value: unknown): string | null {
  if (value == null) {
    return null;
  }
  if (typeof value === 'string') {
    const t = value.trim();
    return t.length ? t : null;
  }
  if (typeof value === 'object' && 'value' in (value as object)) {
    return resolveVisionAcuityString((value as { value: unknown }).value);
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return null;
}

/** True when Snellen-style `a/b` is strictly worse than 6/9 (e.g. 6/12, 6/18). */
function isAcuityStrictlyWorseThan6Over9(value: unknown): boolean {
  const s = resolveVisionAcuityString(value);
  if (!s) {
    return false;
  }
  const parts = s.split('/');
  if (parts.length !== 2) {
    return false;
  }
  const num = parseNumber(parts[0]);
  const denom = parseNumber(parts[1]);
  if (num === null || denom === null || denom === 0) {
    return false;
  }
  return num * 9 < 6 * denom;
}

function parseBoolean(value: unknown): boolean | null {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    const normalizedValue = value.trim().toLowerCase();
    if (normalizedValue === 'true') return true;
    if (normalizedValue === 'false') return false;
  }
  return null;
}

function collectFitnessReadings(
  selectedTest: Record<string, any>,
): FitnessReadings {
  const temperature = readValue(selectedTest.temperature_unit, ['value']);
  const spo2 = readValue(selectedTest.spo2_unit, ['value']);
  const randomBloodSugar = readValue(selectedTest.random_blood_sugar_unit, [
    'value',
  ]);
  const pulse = readValue(selectedTest.pulse_unit, ['value']);
  const pulmonaryFunction = readValue(
    selectedTest.pulmonary_function_test_unit,
    ['value'],
  );
  const hemoglobin = readValue(selectedTest.haemoglobin_unit, ['value']);
  const bmi = readValue(selectedTest.bmi_unit, ['value']);
  const systolic =
    readValue(selectedTest.blood_pressure_unit, [
      'systolic_value',
      'systolic',
      'systolic_bp',
      'value',
    ]) ??
    readValue(selectedTest.blood_pressure_unit?.systolic_bp_unit, ['value']);
  const diastolic =
    readValue(selectedTest.blood_pressure_unit, [
      'diastolic_value',
      'diastolic',
      'diastolic_bp',
      'value',
    ]) ??
    readValue(selectedTest.blood_pressure_unit?.diastolic_bp_unit, ['value']);
  const alcohol =
    readValue(selectedTest.alchol_test_unit, ['value']) ??
    readValue(selectedTest.alcohol_unit, ['value']);
  const visionSource = selectedTest.vision_unit ?? selectedTest.eye_unit ?? {};
  const leftEyeVision =
    visionSource?.left_eye_value ?? visionSource?.left_eye?.value;
  const rightEyeVision =
    visionSource?.right_eye_value ?? visionSource?.right_eye?.value;
  const leftEyeRatio = parseVisionFraction(leftEyeVision);
  const rightEyeRatio = parseVisionFraction(rightEyeVision);
  const isWearingSpecs = parseBoolean(
    visionSource?.is_wearing_specs ?? visionSource?.isWearingSpecs,
  );
  const colourBlindnessRaw =
    selectedTest.eye_unit?.colour_blindness_unit?.value;
  const isColourBlindnessPositive =
    typeof colourBlindnessRaw === 'string' &&
    colourBlindnessRaw.trim().toLowerCase() === 'positive';
  const ecgValue = readStringValue(selectedTest.ecg_unit, ['value']);
  const rombergValue = readStringValue(selectedTest.romberg_unit, ['value']);
  const basicHearingValue = readStringValue(selectedTest.hearing_unit, [
    'value',
  ]);
  const hivValue = readStringValue(selectedTest.hiv_unit, ['value']);
  const sphericalLeft =
    readValue(selectedTest.eye_unit, ['spherical_left_eye']) ??
    readValue(selectedTest.eye_unit?.spherical_left_eye_unit, ['value']);
  const sphericalRight =
    readValue(selectedTest.eye_unit, ['spherical_right_eye']) ??
    readValue(selectedTest.eye_unit?.spherical_right_eye_unit, ['value']);
  const cylindricalLeft =
    readValue(selectedTest.eye_unit, ['cylindrical_left_eye']) ??
    readValue(selectedTest.eye_unit?.cylindrical_left_eye_unit, ['value']);
  const cylindricalRight =
    readValue(selectedTest.eye_unit, ['cylindrical_right_eye']) ??
    readValue(selectedTest.eye_unit?.cylindrical_right_eye_unit, ['value']);

  return {
    temperature,
    spo2,
    randomBloodSugar,
    pulse,
    pulmonaryFunction,
    hemoglobin,
    bmi,
    systolic,
    diastolic,
    alcohol,
    ecgValue,
    rombergValue,
    basicHearingValue,
    hivValue,
    sphericalLeft,
    sphericalRight,
    cylindricalLeft,
    cylindricalRight,
    leftEyeRatio,
    rightEyeRatio,
    isWearingSpecs,
    isColourBlindnessPositive,
  };
}

/**
 * Per-vital bands matching {@link calculateFitnessStatus} (same reads + classifiers),
 * plus extra rules: alcohol concern only when {@code >30}; EYE_VISION high when either
 * eye is strictly worse than 6/9 Snellen. Colour blindness remains direct-unfit only.
 */
export function getFitnessVitalAssessments(
  selectedTest: Record<string, any> | null | undefined,
): FitnessVitalAssessment[] {
  const r = collectFitnessReadings(selectedTest ?? {});
  const out: FitnessVitalAssessment[] = [];

  const pushNumeric = (
    id: string,
    concernType: string,
    parameter: string,
    value: number | null,
    classify: (v: number | null) => VitalBand,
  ) => {
    if (value === null) return;
    const band = classify(value);
    if (band === null) return;
    const assessment: FitnessVitalAssessment = {
      id,
      concernType,
      parameter,
      band,
      value,
    };
    if (band === 'moderate' || band === 'high') {
      assessment.thresholdLabel = thresholdLabelForConcern(
        id,
        band,
      );
    }
    out.push(assessment);
  };

  pushNumeric(
    'temperature',
    'TEMPERATURE',
    'Temperature',
    r.temperature,
    classifyTemperature,
  );
  pushNumeric('spo2', 'SPO2', 'SpO2', r.spo2, classifySpo2);
  pushNumeric(
    'random_blood_sugar',
    'BLOOD_SUGAR',
    'Random Blood Sugar',
    r.randomBloodSugar,
    classifyRbs,
  );
  pushNumeric('pulse', 'PULSE', 'Pulse Rate', r.pulse, classifyPulse);
  pushNumeric(
    'pulmonary_function',
    'PULMONARY_FUNCTION',
    'Pulmonary Function',
    r.pulmonaryFunction,
    classifyPulmonaryFunction,
  );
  pushNumeric(
    'hemoglobin',
    'HEMOGLOBIN',
    'Hemoglobin',
    r.hemoglobin,
    classifyHemoglobin,
  );
  pushNumeric('bmi', 'BMI', 'BMI', r.bmi, classifyBmi);

  if (r.systolic !== null && r.diastolic !== null) {
    const band = worstBand(
      classifyBpSystolic(r.systolic),
      classifyBpDiastolic(r.diastolic),
    );
    if (band !== null) {
      const assessment: FitnessVitalAssessment = {
        id: 'blood_pressure',
        concernType: 'BLOOD_PRESSURE',
        parameter: 'Blood Pressure',
        band,
        value: `${r.systolic}/${r.diastolic}`,
      };
      if (band === 'moderate' || band === 'high') {
        assessment.thresholdLabel = thresholdLabelForConcern(
          'blood_pressure',
          band,
        );
      }
      out.push(assessment);
    }
  }

  const pushString = (
    id: string,
    concernType: string,
    parameter: string,
    raw: string | null,
    classify: (v: string | null) => VitalBand,
  ) => {
    if (raw === null || raw === '') return;
    const band = classify(raw);
    if (band === null) return;
    const assessment: FitnessVitalAssessment = {
      id,
      concernType,
      parameter,
      band,
      value: raw,
    };
    if (band === 'moderate' || band === 'high') {
      assessment.thresholdLabel = thresholdLabelForConcern(id, band);
    }
    out.push(assessment);
  };

  pushString('ecg', 'ECG', 'ECG', r.ecgValue, classifyEcg);
  pushString('romberg', 'ROMBERG', 'Romberg', r.rombergValue, classifyRomberg);
  pushString(
    'basic_hearing',
    'BASIC_HEARING',
    'Basic Hearing',
    r.basicHearingValue,
    classifyBasicHearing,
  );

  pushNumeric(
    'spherical_left',
    'SPHERICAL_LEFT_EYE',
    'Spherical (Left Eye)',
    r.sphericalLeft,
    classifySpherical,
  );
  pushNumeric(
    'spherical_right',
    'SPHERICAL_RIGHT_EYE',
    'Spherical (Right Eye)',
    r.sphericalRight,
    classifySpherical,
  );
  pushNumeric(
    'cylindrical_left',
    'CYLINDRICAL_LEFT_EYE',
    'Cylindrical (Left Eye)',
    r.cylindricalLeft,
    classifyCylindrical,
  );
  pushNumeric(
    'cylindrical_right',
    'CYLINDRICAL_RIGHT_EYE',
    'Cylindrical (Right Eye)',
    r.cylindricalRight,
    classifyCylindrical,
  );

  if (r.alcohol !== null && r.alcohol > 30) {
    out.push({
      id: 'alcohol',
      concernType: 'ALCOHOL',
      parameter: 'Alcohol',
      band: 'high',
      value: r.alcohol,
      thresholdLabel: thresholdLabelForConcern('alcohol', 'high'),
    });
  }

  const visionSource = selectedTest.vision_unit ?? selectedTest.eye_unit ?? {};
  const leftEyeRaw =
    visionSource?.left_eye_value ?? visionSource?.left_eye?.value;
  const rightEyeRaw =
    visionSource?.right_eye_value ?? visionSource?.right_eye?.value;
  const hasEyeVisionHighConcern =
    isAcuityStrictlyWorseThan6Over9(leftEyeRaw) ||
    isAcuityStrictlyWorseThan6Over9(rightEyeRaw);
  if (hasEyeVisionHighConcern) {
    const leftDisp = resolveVisionAcuityString(leftEyeRaw) ?? '';
    const rightDisp = resolveVisionAcuityString(rightEyeRaw) ?? '';
    const parts = [
      leftDisp ? `L: ${leftDisp}` : '',
      rightDisp ? `R: ${rightDisp}` : '',
    ].filter(Boolean);
    const display = parts.length ? parts.join(', ') : 'Worse than 6/9';
    out.push({
      id: 'eye_vision',
      concernType: 'EYE_VISION',
      parameter: 'Vision',
      band: 'high',
      value: display,
      thresholdLabel: thresholdLabelForConcern('eye_vision', 'high'),
    });
  }

  return out;
}

function isDoctorUnavailable(referenceDate?: Date | string | null): boolean {
  const dateValue = referenceDate ? new Date(referenceDate) : new Date();
  if (Number.isNaN(dateValue.getTime())) {
    return false;
  }
  const utcMinutes = dateValue.getUTCHours() * 60 + dateValue.getUTCMinutes();
  const istMinutes = (utcMinutes + IST_OFFSET_MINUTES) % (24 * 60);
  return istMinutes >= 30 && istMinutes < 570;
}

function hasOnlyNormalOrBorderline(vitalBands: VitalBand[]): boolean {
  const presentBands = vitalBands.filter((band) => band !== null);
  if (!presentBands.length) {
    return false;
  }
  return presentBands.every(
    (band) => band === 'normal' || band === 'borderline',
  );
}

function hasModerateOrHigh(vitalBands: VitalBand[]): boolean {
  return vitalBands.some((band) => band === 'moderate' || band === 'high');
}

export function calculateFitnessStatus(input: FitnessStatusInput): string {
  const selectedTest = input.selectedTest ?? {};
  const r = collectFitnessReadings(selectedTest);
  const hasPoorVisionWithoutSpecs =
    (r.leftEyeRatio !== null && r.leftEyeRatio <= 0.5) ||
    (r.rightEyeRatio !== null && r.rightEyeRatio <= 0.5)
      ? r.isWearingSpecs === false
      : false;
  if (
    hasPoorVisionWithoutSpecs ||
    r.isColourBlindnessPositive ||
    (r.alcohol !== null && r.alcohol > 0)
  ) {
    return STATUS_UNFIT;
  }
  const vitalBands: VitalBand[] = [
    classifyTemperature(r.temperature),
    classifySpo2(r.spo2),
    classifyRbs(r.randomBloodSugar),
    classifyPulse(r.pulse),
    classifyPulmonaryFunction(r.pulmonaryFunction),
    classifyHemoglobin(r.hemoglobin),
    classifyBmi(r.bmi),
    classifyBpSystolic(r.systolic),
    classifyBpDiastolic(r.diastolic),
    classifyEcg(r.ecgValue),
    classifyRomberg(r.rombergValue),
    classifyBasicHearing(r.basicHearingValue),
    classifyHiv(r.hivValue),
    classifySpherical(r.sphericalLeft),
    classifySpherical(r.sphericalRight),
    classifyCylindrical(r.cylindricalLeft),
    classifyCylindrical(r.cylindricalRight),
  ];
  if (hasOnlyNormalOrBorderline(vitalBands)) {
    return STATUS_FIT;
  }
  if (!hasModerateOrHigh(vitalBands)) {
    return STATUS_DOCTOR_CONSULTATION;
  }
  if (!isDoctorUnavailable(input.referenceDate)) {
    return STATUS_DOCTOR_CONSULTATION;
  }
  const hasCriticalSugar =
    r.randomBloodSugar !== null && r.randomBloodSugar > 350;
  const hasCriticalBloodPressure =
    (r.systolic !== null &&
      r.diastolic !== null &&
      r.systolic > 180 &&
      r.diastolic > 120) ||
    (r.systolic !== null &&
      r.diastolic !== null &&
      r.systolic < 80 &&
      r.diastolic < 50);
  const hasCriticalHemoglobin =
    r.hemoglobin !== null && (r.hemoglobin < 8 || r.hemoglobin >= 18);
  if (hasCriticalSugar || hasCriticalBloodPressure || hasCriticalHemoglobin) {
    return STATUS_UNFIT;
  }
  return STATUS_DOCTOR_CONSULTATION;
}
