import { IsArray, IsNumber, IsNotEmpty, IsOptional } from 'class-validator';

export class DriverFullTestHistoryDto {
  @IsNumber()
  @IsNotEmpty()
  driverId: number;

  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  centerIds?: number[];
}

export type DriverFullTestColorCategory = 'red' | 'amber' | 'yellow' | 'green';

export class DriverFullTestRecordDto {
  date: string;
  value: number | string;
  colorCategory: DriverFullTestColorCategory;
}

export type DriverFullTestTrend = 'improve' | 'decline' | 'consistent';

export class DriverFullTestItemDto {
  testName: string;
  unit: string;
  records: DriverFullTestRecordDto[];
  trend: DriverFullTestTrend;
  difference?: {
    beforeCount: number;
    afterCount: number;
    removedCount: number;
  };
}

export class DriverFullTestHistoryDriverDto {
  driverId: number;
  driverName: string;
  driverContactNumber: string | null;
}

export class DriverFullTestHistoryResponseDto {
  success: boolean;
  driver: DriverFullTestHistoryDriverDto;
  tests: DriverFullTestItemDto[];
}