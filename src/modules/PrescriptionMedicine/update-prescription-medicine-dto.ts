import { IsUUID, IsString, IsArray, IsEnum, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdatePrescriptionMedicineDto {
  @IsUUID()
  @IsOptional()
  prescription_medicine_id?: string;

  @IsUUID()
  @IsOptional()
  prescription_id?: string;

  @IsString()
  @IsOptional()
  medicine_name?: string;

  @IsString()
  @IsOptional()
  medicine_type?: string;

  @IsString()
  @IsOptional()
  dosage?: string;

  @IsArray()
  @IsEnum(['Morning', 'Afternoon', 'Evening', 'Night', 'SOS','STAT'], { each: true })
  @IsOptional()
  frequency?: string[];

  @Transform(({ value }) => (value !== undefined && value !== null ? String(value) : value))
  @IsString()
  @IsOptional()
  duration?: string;

  @IsString()
  @IsOptional()
  instructions?: string;
}
