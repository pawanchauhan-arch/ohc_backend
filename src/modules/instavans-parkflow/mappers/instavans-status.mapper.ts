import {
  InstavansInternalStatus,
  InstavansStatus,
} from '../dto/push-fitness.dto';

export const CHECKUP_STATUS_FIT = 'FIT';
export const CHECKUP_STATUS_DOCTOR_CONSULTATION =
  'DOCTOR CONSULTATION RECOMMENDED';
export const CHECKUP_STATUS_UNFIT = 'UNFIT AND REFERRED FOR HIGHER CENTER';

export const PRESCRIPTION_STATUS_FIT = 'FIT';
export const PRESCRIPTION_STATUS_FIT_WITH_MEDICATION = 'FIT WITH MEDICATION';
export const PRESCRIPTION_STATUS_UNFIT = 'UNFIT AND REFERRED FOR HIGHER CENTER';

export const REMARK_DRIVER_FIT = 'Driver is fit';
export const REMARK_MEDICATION =
  'Medical advice has been provided to driver, proceed with DO and follow the prescribed medicine by the doctor.';
export const REMARK_UNFIT =
  'Driver is unfit to drive. Referred for higher medical centre or nearby hospital.';

export interface InstavansMappedStatus {
  readonly status: InstavansStatus;
  readonly internalStatus: InstavansInternalStatus;
  readonly baseRemark: string;
}

export interface CheckupMappingResult {
  readonly shouldPush: boolean;
  readonly mappedStatus?: InstavansMappedStatus;
}

export interface PrescriptionMappingResult {
  readonly shouldPush: boolean;
  readonly mappedStatus?: InstavansMappedStatus;
}

export function mapCheckupFitnessStatusToInstavans(
  checkupFitnessStatus: string | null | undefined,
): CheckupMappingResult {
  if (checkupFitnessStatus === CHECKUP_STATUS_FIT) {
    return {
      shouldPush: true,
      mappedStatus: {
        status: 'green',
        internalStatus: 'GREEN',
        baseRemark: REMARK_DRIVER_FIT,
      },
    };
  }
  if (checkupFitnessStatus === CHECKUP_STATUS_UNFIT) {
    return {
      shouldPush: true,
      mappedStatus: {
        status: 'red',
        internalStatus: 'RED',
        baseRemark: REMARK_UNFIT,
      },
    };
  }
  return { shouldPush: false };
}

export type InstavansPushSourceKind = 'checkup' | 'prescription' | 'skip';

export interface InstavansPushSourceAfterCheckupEdit {
  readonly kind: InstavansPushSourceKind;
}

export interface ResolveInstavansPushSourceAfterCheckupEditInput {
  readonly checkupFitnessStatus: string | null | undefined;
  readonly prescriptionFitnessStatus?: string | null;
}

/**
 * Chooses Instavans payload source after a health-record edit.
 * FIT/UNFIT use the checkup mapping; doctor consultation uses a mappable prescription.
 */
export function resolveInstavansPushSourceAfterCheckupEdit(
  input: ResolveInstavansPushSourceAfterCheckupEditInput,
): InstavansPushSourceAfterCheckupEdit {
  const checkupMapping = mapCheckupFitnessStatusToInstavans(
    input.checkupFitnessStatus,
  );
  if (checkupMapping.shouldPush) {
    return { kind: 'checkup' };
  }
  if (input.checkupFitnessStatus !== CHECKUP_STATUS_DOCTOR_CONSULTATION) {
    return { kind: 'skip' };
  }
  const prescriptionMapping = mapPrescriptionFitnessStatusToInstavans(
    input.prescriptionFitnessStatus,
  );
  if (prescriptionMapping.shouldPush) {
    return { kind: 'prescription' };
  }
  return { kind: 'skip' };
}

export function mapPrescriptionFitnessStatusToInstavans(
  prescriptionFitnessStatus: string | null | undefined,
): PrescriptionMappingResult {
  if (prescriptionFitnessStatus === PRESCRIPTION_STATUS_FIT) {
    return {
      shouldPush: true,
      mappedStatus: {
        status: 'green',
        internalStatus: 'GREEN',
        baseRemark: REMARK_DRIVER_FIT,
      },
    };
  }
  if (prescriptionFitnessStatus === PRESCRIPTION_STATUS_FIT_WITH_MEDICATION) {
    return {
      shouldPush: true,
      mappedStatus: {
        status: 'orange',
        internalStatus: 'ORANGE',
        baseRemark: REMARK_MEDICATION,
      },
    };
  }
  if (prescriptionFitnessStatus === PRESCRIPTION_STATUS_UNFIT) {
    return {
      shouldPush: true,
      mappedStatus: {
        status: 'red',
        internalStatus: 'RED',
        baseRemark: REMARK_UNFIT,
      },
    };
  }
  return { shouldPush: false };
}
