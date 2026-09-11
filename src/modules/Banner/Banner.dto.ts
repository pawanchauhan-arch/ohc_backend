import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PlaceHolderInApp, WorkforceType } from '../../models/Banner'; // Adjust path as needed

export class BannerDto {
  @IsOptional() // This means the field is optional
  @IsString()
  language?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsEnum(WorkforceType)
  workforce_type?: WorkforceType;

  @IsOptional()
  @IsString()
  disease?: string;

  @IsEnum(PlaceHolderInApp) // This makes the field mandatory and validates it against the enum
  place_holder_in_app: PlaceHolderInApp;
}