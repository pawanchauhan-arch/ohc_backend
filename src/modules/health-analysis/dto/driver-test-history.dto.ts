import { IsArray, IsNumber, IsString, IsNotEmpty, ArrayMinSize, IsOptional } from 'class-validator';

export class DriverTestHistoryDto {
  @IsArray()
  @IsNumber({}, { each: true })
  @ArrayMinSize(1)
  @IsNotEmpty()
  driverIds: number[];

  @IsString()
  @IsNotEmpty()
  testName: string;

  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  centerIds?: number[]; // Optional: Filter by Center IDs
}

export type DriverTestColorCategory = 'red' | 'amber' | 'yellow' | 'green';

export class DriverTestValueDto {
  value: any;
  date: string;
  colorCategory: DriverTestColorCategory;
}

export class DriverTestHistoryItemDto {
  driverId: number;
  driverName: string;
  driverContactNumber: string | null;
  healthCardNumber: string | null;
  firstRecord: DriverTestValueDto | null;
  lastRecord: DriverTestValueDto | null;
  cetName: string | null;
  centerName: string | null;
}

export class DriverTestHistoryResponseDto {
  success: boolean;
  testName: string;
  drivers: DriverTestHistoryItemDto[];
}
