import {
    IsNotEmpty,
    IsString,
    IsOptional,
    IsNumber,
  } from 'class-validator';
  import { Type } from 'class-transformer';
  
  export class DownloadHealthRecordDto {
    @IsNotEmpty()
    @IsString()
    startDate: string;
  
    @IsNotEmpty()
    @IsString()
    endDate: string;
  
    @IsOptional()
    @IsNotEmpty()
    @Type(() => Number)
    @IsNumber()
    cet_id: number;
  
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    driver_ID?: number;
  
    @IsOptional()
    @IsString()
    vehicle_no?: string;
  
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    corporate_id?: number;
  }