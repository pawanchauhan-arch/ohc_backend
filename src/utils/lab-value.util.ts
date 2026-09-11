export type LabValueBound = 'lower' | 'upper' | null;

export type LabTestStatus = 'success' | 'warning' | 'danger';

export interface ParsedLabValue {
  raw: string | number | null;
  numericValue: number | null;
  bound: LabValueBound;
}

export interface LabTestEvaluation {
  status: LabTestStatus;
  remark: string;
}

const BOUNDED_VALUE_PATTERN = /^([<>])\s*(-?\d+(?:\.\d+)?)$/;

/**
 * Parses MobiLab values such as `>13`, `<3`, or plain numerics.
 * Bound prefixes mean the true value is outside the instrument's measurable range.
 */
export function parseBoundedLabValue(
  value: string | number | null | undefined,
): ParsedLabValue {
  if (value === null || value === undefined || value === '') {
    return { raw: value ?? null, numericValue: null, bound: null };
  }

  if (typeof value === 'number') {
    return Number.isFinite(value)
      ? { raw: value, numericValue: value, bound: null }
      : { raw: value, numericValue: null, bound: null };
  }

  const trimmed = String(value).trim();
  const boundMatch = trimmed.match(BOUNDED_VALUE_PATTERN);
  if (boundMatch) {
    const numericValue = parseFloat(boundMatch[2]);
    return {
      raw: trimmed,
      numericValue: Number.isNaN(numericValue) ? null : numericValue,
      bound: boundMatch[1] === '<' ? 'lower' : 'upper',
    };
  }

  const cleaned = trimmed.replace(/[^0-9.-]/g, '');
  const numericValue = parseFloat(cleaned);
  return {
    raw: trimmed,
    numericValue: Number.isNaN(numericValue) ? null : numericValue,
    bound: null,
  };
}

export function parseStandardRange(
  standardValue: unknown,
): { min: number | null; max: number | null } {
  if (!Array.isArray(standardValue) || standardValue.length < 2) {
    return { min: null, max: null };
  }

  const min = parseFloat(String(standardValue[0]));
  const max = parseFloat(String(standardValue[1]));

  return {
    min: Number.isNaN(min) ? null : min,
    max: Number.isNaN(max) ? null : max,
  };
}

/**
 * Evaluates remark/status for a lab test using MobiLab value + configured range.
 * Mirrors the frontend `processTest` logic, with support for bounded values.
 */
export function evaluateLabTestStatus(
  rawValue: string | number | null | undefined,
  standardValue: unknown,
): LabTestEvaluation {
  const parsed = parseBoundedLabValue(rawValue);

  // Instrument out-of-range values from MobiLab do not depend on configured range.
  if (parsed.bound === 'upper') {
    return { status: 'danger', remark: 'Consultation Recommended' };
  }

  if (parsed.bound === 'lower') {
    return { status: 'warning', remark: 'Consultation Recommended' };
  }

  const { min, max } = parseStandardRange(standardValue);

  if (min === null || max === null) {
    return { status: 'success', remark: 'PASS' };
  }

  const value = parsed.numericValue;
  if (value === null || Number.isNaN(value)) {
    return { status: 'success', remark: 'PASS' };
  }

  if (value >= min && value <= max) {
    return { status: 'success', remark: 'PASS' };
  }

  if (value < min) {
    return { status: 'warning', remark: 'Consultation Recommended' };
  }

  return { status: 'danger', remark: 'Consultation Recommended' };
}

export function isBoundedMobilabValue(
  value: string | number | null | undefined,
): boolean {
  return parseBoundedLabValue(value).bound !== null;
}

export function enrichMobilabTestUnit(
  unit: Record<string, unknown> | null | undefined,
): Record<string, unknown> | null | undefined {
  if (!unit || typeof unit !== 'object' || Array.isArray(unit)) {
    return unit;
  }

  if (unit.value === undefined || unit.value === null || unit.value === '') {
    return unit;
  }

  // Only adjust bounded MobiLab values; leave all other stored remarks/status as-is.
  if (!isBoundedMobilabValue(unit.value as string | number)) {
    return unit;
  }

  const { status, remark } = evaluateLabTestStatus(
    unit.value as string | number,
    unit.standard_value,
  );

  return {
    ...unit,
    status,
    remark,
  };
}

/** Recomputes remark/status for every leaf test under `selected_test.mobilab_tests`. */
export function enrichMobilabTests(
  mobilabTests: unknown,
): Record<string, unknown> | null | undefined {
  if (
    !mobilabTests ||
    typeof mobilabTests !== 'object' ||
    Array.isArray(mobilabTests)
  ) {
    return mobilabTests as Record<string, unknown> | null | undefined;
  }

  const enriched: Record<string, unknown> = {};

  for (const [profileKey, profileTests] of Object.entries(
    mobilabTests as Record<string, unknown>,
  )) {
    if (
      !profileTests ||
      typeof profileTests !== 'object' ||
      Array.isArray(profileTests)
    ) {
      enriched[profileKey] = profileTests;
      continue;
    }

    const enrichedProfile: Record<string, unknown> = {};
    for (const [testKey, testUnit] of Object.entries(
      profileTests as Record<string, unknown>,
    )) {
      if (testUnit && typeof testUnit === 'object' && !Array.isArray(testUnit)) {
        enrichedProfile[testKey] = enrichMobilabTestUnit(
          testUnit as Record<string, unknown>,
        );
      } else {
        enrichedProfile[testKey] = testUnit;
      }
    }

    enriched[profileKey] = enrichedProfile;
  }

  return enriched;
}
