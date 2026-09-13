import { IsUUID, IsString, IsArray, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreatePrescriptionMedicineDto {
  @IsUUID()
  @IsOptional()
  prescription_medicine_id?: string;

  @IsUUID()
  prescription_id: string;

  @IsString()
  medicine_name: string;

  @IsString()
  medicine_type: string;

  @IsString()
  dosage: string;

  // @IsArray()
  // @IsEnum(['Morning', 'Afternoon', 'Evening', 'Night', 'SOS'], { each: true })
  // frequency: string[];
  @IsArray()
  @IsString({ each: true })
  frequency: string[];

  @Transform(({ value }) => (value !== undefined && value !== null ? String(value) : value))
  @IsString()
  duration: string;

  @IsString()
  @IsOptional()
  instructions?: string;
}
