/**
 * Helpers for freezing the first Ready timestamp used by shift-wise reports.
 */

export function isConfirmReportYes(value: unknown): boolean {
  return String(value ?? '')
    .trim()
    .toLowerCase() === 'yes';
}

export interface ResolveReportConfirmedAtParams {
  existingConfirmReport: unknown;
  existingReportConfirmedAt: Date | string | null | undefined;
  nextConfirmReport: unknown;
  now?: Date;
}

/**
 * Returns a timestamp only when confirm_report transitions to yes for the first time.
 * Never overwrites an already frozen report_confirmed_at.
 */
export function resolveReportConfirmedAtForUpdate(
  params: ResolveReportConfirmedAtParams,
): Date | undefined {
  if (params.existingReportConfirmedAt) {
    return undefined;
  }

  const becomingYes =
    isConfirmReportYes(params.nextConfirmReport) &&
    !isConfirmReportYes(params.existingConfirmReport);

  if (!becomingYes) {
    return undefined;
  }

  return params.now ?? new Date();
}
