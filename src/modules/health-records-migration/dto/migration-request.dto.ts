import { IsOptional, IsNumber, IsBoolean, Min, Max } from 'class-validator';

/**
 * DTO for starting health records migration
 */
export class StartMigrationDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(1000)
  batchSize?: number = 100;

  @IsOptional()
  @IsBoolean()
  dryRun?: boolean = false;

  @IsOptional()
  @IsNumber()
  startFromId?: number;

  @IsOptional()
  @IsNumber()
  endAtId?: number;
}

/**
 * DTO for rollback migration request
 */
export class RollbackMigrationDto {
  @IsNumber()
  operationId: number;
}

/**
 * DTO for validation request
 */
export class ValidateMigrationDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  sampleSize?: number = 10;
}
