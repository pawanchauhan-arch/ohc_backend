import { IsNotEmpty, IsNumber, IsOptional, IsString, IsDateString } from 'class-validator';

export class CorporateHistoryDto {
  @IsNumber()
  @IsNotEmpty()
  corporate_id: number;

  @IsOptional()
  @IsDateString()
  start_date?: string;

  @IsOptional()
  @IsDateString()
  end_date?: string;
}

// Inherits everything above and adds center_id
export class SpecificCenterHistoryDto extends CorporateHistoryDto {
  @IsNumber()
  @IsNotEmpty()
  center_id: number;
}

export class GetCorporateDriversDto {
  @IsNumber()
  @IsNotEmpty()
  corporate_id: number;
}