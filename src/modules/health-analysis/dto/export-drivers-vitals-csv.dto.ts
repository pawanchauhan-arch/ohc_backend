import { IsArray, IsNumber, ArrayMinSize, IsNotEmpty } from 'class-validator';

export class ExportDriversVitalsCsvDto {
  @IsArray()
  @IsNumber({}, { each: true })
  @ArrayMinSize(1)
  @IsNotEmpty()
  driverIds: number[];
}
