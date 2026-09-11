const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(utc);
dayjs.extend(timezone);

const IST_TIMEZONE = 'Asia/Kolkata';
const OPERATIONAL_DAY_START_HOUR = 6;
const SHIFT_A_END_HOUR = 13;
const SHIFT_B_END_HOUR = 21;

export type ShiftCode = 'A' | 'B' | 'C';
export type ServiceCategory = 'basic' | 'advance' | 'counselling';

export interface OperationalDayWindow {
  startUtc: string;
  endUtc: string;
}

/**
 * Returns UTC bounds for one operational day (06:00 IST to next day 05:59:59.999 IST).
 */
export function getOperationalDayWindow(
  operationalDate: string,
): OperationalDayWindow {
  const startUtc = dayjs
    .tz(operationalDate, 'YYYY-MM-DD', IST_TIMEZONE)
    .hour(OPERATIONAL_DAY_START_HOUR)
    .minute(0)
    .second(0)
    .millisecond(0)
    .utc()
    .format();
  const endUtc = dayjs
    .tz(operationalDate, 'YYYY-MM-DD', IST_TIMEZONE)
    .add(1, 'day')
    .hour(5)
    .minute(59)
    .second(59)
    .millisecond(999)
    .utc()
    .format();
  return { startUtc, endUtc };
}

/**
 * Resolves an operational window from optional start/end dates.
 * Falls back to a single operational day (defaultDate or today IST).
 */
export function resolveOperationalWindow(
  startDate?: string,
  endDate?: string,
  defaultDate?: string,
): OperationalDayWindow {
  const today =
    defaultDate ?? dayjs().tz(IST_TIMEZONE).format('YYYY-MM-DD');
  const start = startDate?.trim();
  const end = endDate?.trim();
  if (!start || !end) {
    return getOperationalDayWindow(today);
  }
  if (start === end) {
    return getOperationalDayWindow(start);
  }
  return getOperationalDateRangeWindow(start, end);
}

/**
 * End bound for a range filter: endDate at 05:59:59.999 IST (as UTC).
 */
export function getOperationalRangeEndUtc(endDate: string): string {
  return dayjs
    .tz(endDate, 'YYYY-MM-DD', IST_TIMEZONE)
    .hour(5)
    .minute(59)
    .second(59)
    .millisecond(999)
    .utc()
    .format();
}

/**
 * Returns UTC bounds for a date-range filter.
 * Always: startDate 06:00 IST → endDate 05:59 IST.
 * Same calendar day (19–19) is one operational day: 19 06:00 → 20 05:59.
 */
export function getOperationalDateRangeWindow(
  startDate: string,
  endDate: string,
): OperationalDayWindow {
  const start = getOperationalDayWindow(startDate);
  if (startDate === endDate) {
    return start;
  }
  return {
    startUtc: start.startUtc,
    endUtc: getOperationalRangeEndUtc(endDate),
  };
}

/**
 * Maps an IST hour to operational shift A, B, or C.
 */
export function resolveShiftCode(istHour: number): ShiftCode {
  if (istHour >= 6 && istHour <= SHIFT_A_END_HOUR) {
    return 'A';
  }
  if (istHour >= 14 && istHour <= SHIFT_B_END_HOUR) {
    return 'B';
  }
  return 'C';
}

/**
 * Classifies a checkup into basic, advance, or counselling from package names.
 */
export function classifyServiceType(
  packageNames: string[] | null | undefined,
): ServiceCategory | null {
  if (!packageNames?.length) {
    return null;
  }
  const upperNames = packageNames.map((name) => name.toUpperCase());
  if (upperNames.some((name) => name.includes('COUNSELLING'))) {
    return 'counselling';
  }
  if (upperNames.some((name) => name.includes('BASIC'))) {
    return 'basic';
  }
  if (upperNames.some((name) => name.includes('ADVANCED'))) {
    return 'advance';
  }
  return null;
}
