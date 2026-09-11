// export class FilterAttendanceDto {
//   date?: string;
//   status?: 'PRESENT' | 'ABSENT' | 'HALF_DAY';
//   userId?: number;
//   month?: number;
//   year?: number;
//   page?: number = 1;
//   limit?: number = 20;
// }
import { IsOptional, IsString } from 'class-validator';

export class FilterAttendanceDto {

  @IsOptional()
  @IsString()
  user?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  date?: string;

  @IsOptional()
  @IsString()
  month?: string;

  @IsOptional()
  @IsString()
  year?: string;
}