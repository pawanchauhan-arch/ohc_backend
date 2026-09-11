import { IsUUID, IsString, IsArray, IsEnum, IsOptional } from 'class-validator';

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

  @IsString()
  duration: string;

  @IsString()
  @IsOptional()
  instructions?: string;
}
