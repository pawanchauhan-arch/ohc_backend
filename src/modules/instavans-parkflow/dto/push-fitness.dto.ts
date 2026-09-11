export type InstavansStatus = 'green' | 'orange' | 'red';

export type InstavansInternalStatus = 'GREEN' | 'ORANGE' | 'RED';

export interface PushFitnessDto {
  readonly license_number: string;
  readonly status: InstavansStatus;
  readonly remarks: string;
  readonly internal_status?: InstavansInternalStatus;
  readonly last_updated?: string;
}
