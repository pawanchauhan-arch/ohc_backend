import { DRIVERMASTER } from '../models/DriverMaster';

const MIN_VALID_BIRTH_YEAR = 1900;
const MAX_VALID_AGE = 150;

/**
 * Parses a date-of-birth string in common formats (YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY, ISO).
 */
export function parseDateOfBirth(value: string): Date | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const ddMmYyyyMatch = trimmed.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
  if (ddMmYyyyMatch) {
    const day = Number.parseInt(ddMmYyyyMatch[1], 10);
    const month = Number.parseInt(ddMmYyyyMatch[2], 10);
    const year = Number.parseInt(ddMmYyyyMatch[3], 10);
    const date = new Date(year, month - 1, day);
    if (
      !Number.isNaN(date.getTime()) &&
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    ) {
      return date;
    }
    return null;
  }
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  const year = date.getFullYear();
  const currentYear = new Date().getFullYear();
  if (year < MIN_VALID_BIRTH_YEAR || year > currentYear) {
    return null;
  }
  return date;
}

/**
 * Calculates age in full years from a date of birth.
 */
export function calculateAgeFromDateOfBirth(dob: Date, referenceDate: Date = new Date()): number {
  let age = referenceDate.getFullYear() - dob.getFullYear();
  const monthDiff = referenceDate.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && referenceDate.getDate() < dob.getDate())) {
    age -= 1;
  }
  return age;
}

/**
 * Resolves numeric age from dateOfBirthOrAge (DOB string or plain numeric age).
 */
export function resolveAgeFromDateOfBirthOrAge(
  dateOfBirthOrAge: string | null | undefined,
  fallbackAge: number,
): number {
  const dobOrAge = dateOfBirthOrAge?.trim();
  if (!dobOrAge) {
    return fallbackAge;
  }
  const dob = parseDateOfBirth(dobOrAge);
  if (dob) {
    const age = calculateAgeFromDateOfBirth(dob);
    if (age >= 0 && age <= MAX_VALID_AGE) {
      return age;
    }
    return fallbackAge;
  }
  const isPlainNumber = /^\d{1,3}$/.test(dobOrAge);
  if (isPlainNumber) {
    const numericAge = Number.parseInt(dobOrAge, 10);
    if (numericAge > 0 && numericAge <= MAX_VALID_AGE) {
      return numericAge;
    }
  }
  return fallbackAge;
}

/**
 * Resolves patient age from stored age or dateOfBirthOrAge (DOB or numeric age).
 */
export function resolvePatientAge(patient: Pick<DRIVERMASTER, 'age' | 'dateOfBirthOrAge'>): string {
  if (patient.age != null && patient.age > 0) {
    return String(patient.age);
  }
  const resolvedAge = resolveAgeFromDateOfBirthOrAge(patient.dateOfBirthOrAge, -1);
  return resolvedAge >= 0 ? String(resolvedAge) : '-';
}
