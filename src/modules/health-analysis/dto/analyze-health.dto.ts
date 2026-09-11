import { IsNumber, IsNotEmpty, IsPositive } from 'class-validator';

export class AnalyzeHealthDto {
  @IsNumber()
  @IsNotEmpty()
  @IsPositive()
  healthCheckupId: number;
}
