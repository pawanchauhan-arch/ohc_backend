import { IsString, IsNumber, IsNotEmpty, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO for a single lab test setting item
 */
export class LabTestSettingItemDto {
  @IsOptional()
  @IsNumber()
  id?: number;

  @IsString()
  @IsNotEmpty()
  test_profile: string;

  @IsString()
  @IsNotEmpty()
  column_name: string;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsNumber()
  min_range?: number;

  @IsOptional()
  @IsNumber()
  max_range?: number;
}

/**
 * DTO for syncing lab test settings
 * Accepts either a single object or an array of objects
 */
export class SyncLabTestSettingDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => LabTestSettingItemDto)
  item?: LabTestSettingItemDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LabTestSettingItemDto)
  items?: LabTestSettingItemDto[];
}

