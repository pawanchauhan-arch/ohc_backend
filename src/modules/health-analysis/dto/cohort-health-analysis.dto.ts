import { IsString, IsNumber, IsNotEmpty, IsOptional, Min } from 'class-validator';

export class CohortHealthAnalysisDto {
  @IsString()
  @IsNotEmpty()
  monthWithYear: string; // "Jan 2026" or "January 2026"

  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  monthsBack: number; // Positive number

  @IsNumber()
  @IsNotEmpty()
  userId: number; // User ID for organization start date

  @IsNumber()
  @IsOptional()
  corporateId?: number; // Optional: Filter by Corporate (will fetch all center IDs)

  @IsNumber()
  @IsOptional()
  centerId?: number; // Optional: Filter by Center
}

export class CohortPatientCountDto {
  red: number;
  amber: number;
  yellow: number;
  green: number;
}

export class CohortPatientDriverIdsDto {
  red: number[];
  amber: number[];
  yellow: number[];
  green: number[];
}

export class CohortTestDataDto {
  testName: string;
  unit: string;
  cohort1: CohortPatientCountDto;
  cohort2: CohortPatientCountDto;
  cohort1DriverIds: CohortPatientDriverIdsDto;
  cohort2DriverIds: CohortPatientDriverIdsDto;
  /**
   * Number of drivers (from global commonDriversCount) that have this test
   * recorded in both cohorts (at least one record per cohort).
   */
  commonDriversCount: number;
}

export class CohortHealthAnalysisResponseDto {
  success: boolean;
  cohort1: {
    startDate: string;
    endDate: string;
    totalPatients: number;
  };
  cohort2: {
    startDate: string;
    endDate: string;
    totalPatients: number;
  };
  commonDriversCount: number;
  tests: CohortTestDataDto[];
}
