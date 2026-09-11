import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

const trimValue = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreateDiseaseDto {
  @Transform(trimValue)
  @IsString()
  @IsNotEmpty({ message: 'Disease name is required' })
  @MaxLength(255, { message: 'Disease name cannot exceed 255 characters' })
  name: string;

  @Transform(trimValue)
  @IsString()
  @IsNotEmpty({ message: 'Disease code is required' })
  @MaxLength(255, { message: 'Disease code cannot exceed 255 characters' })
  code: string;

  @Transform(trimValue)
  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'Disease category cannot exceed 255 characters' })
  category?: string;

  @Transform(trimValue)
  @IsOptional()
  @IsString()
  description?: string;
}