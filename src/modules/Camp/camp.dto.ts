export interface CreateCampDto {
  center_id: number;
  scheduledOn: string; // YYYY-MM-DD
  locationText?: string;
}

export interface UpdateCampDto {
  scheduledOn?: string; // YYYY-MM-DD
  locationText?: string | null;
  isCompleted?: boolean;
}

export interface AddCampItemDto {
  center_id: number;
  driverId: number;
  remarks?: string;
}

export interface UpdateCampItemDto {
  center_id: number;
  isCompleted?: boolean;
  driverHealthCheckupId?: number | null;
  idProofImage?: string | null;
}

export interface ImportCampItemsCsvDto {
  // For future: additional metadata can be passed via query/body
}

export interface CreateBarcodeDto {
  center_id: number;
  code: string;
  comment?: string;
  imageUrl?: string;
  test_name?: 'Complete Blood Count(CBC)' | 'Kidney Function Test(KFT)' | 'Liver Function Test(LFT)' | 'Cholestrol-Total';
}



