import { IsEnum, IsOptional, IsNumber, IsBoolean, IsString, Min, Max } from 'class-validator';

/**
 * DTO for copy data operations
 * Validates input parameters for data copying operations
 */
export class CopyDataDto {
  @IsEnum(['DRIVER_MASTER', 'HEALTH_CHECKUP'])
  dataType: 'DRIVER_MASTER' | 'HEALTH_CHECKUP';

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(1000)
  batchSize?: number;

  @IsOptional()
  @IsBoolean()
  enableBackup?: boolean;

  @IsOptional()
  @IsBoolean()
  validateOnly?: boolean;

  @IsOptional()
  @IsString()
  operationId?: string;

  @IsOptional()
  @IsBoolean()
  skipValidation?: boolean;
} 