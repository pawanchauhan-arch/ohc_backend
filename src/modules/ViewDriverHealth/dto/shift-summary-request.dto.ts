import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';

/**
 * Request body for shift-wise health checkup summary.
 * - Default / no filter: pass operational_date (usually today).
 * - With RangePicker: pass startDate + endDate (same createdAt operational
 *   window as the health checkup report list).
 * - Shift A/B/C is based on date_time (entry time), not report_confirmed_at.
 */
export class ShiftSummaryRequestDto {
  @IsNotEmpty()
  center_id: string | number;

  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'operational_date must be in YYYY-MM-DD format',
  })
  operational_date?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'startDate must be in YYYY-MM-DD format',
  })
  startDate?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'endDate must be in YYYY-MM-DD format',
  })
  endDate?: string;
}
