import { IsDateString, IsNumber, IsOptional, IsNotEmpty } from 'class-validator';

export class FilterHealthAnalysisDto {
  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @IsDateString()
  @IsNotEmpty()
  endDate: string;

  @IsNumber()
  @IsOptional()
  corporateId?: number;

  @IsNumber()
  @IsOptional()
  centerId?: number;
}

export class TestDataPointDto {
  date: string;
  value: number | string;
  colorCategory: 'red' | 'amber' | 'yellow' | 'green';
}

export class DriverCategoryDataDto {
  driverId: number;
  driverName: string;
  externalId: string;
  data: TestDataPointDto[];
  average: number | null;
}

export class ColorCategoryGroupDto {
  drivers: DriverCategoryDataDto[];
}

export class ColorCategoryAveragesDto {
  red: number;
  amber: number;
  yellow: number;
  green: number;
}

export class ColorCategoriesDto {
  red: ColorCategoryGroupDto;
  amber: ColorCategoryGroupDto;
  yellow: ColorCategoryGroupDto;
  green: ColorCategoryGroupDto;
}

export class TestGroupDto {
  testName: string;
  unit: string;
  colorCategoryAverages: ColorCategoryAveragesDto;
  colorCategories: ColorCategoriesDto;
}

export class FilterHealthAnalysisResponseDto {
  success: boolean;
  tests: TestGroupDto[];
  totalRecords: number;
}