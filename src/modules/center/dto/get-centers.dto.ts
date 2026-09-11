import { IsNumber, IsString, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class GetCentersDto {
  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  id: number;

  @IsString()
  @IsNotEmpty()
  roleType: string;
}

export class CenterResponseDto {
  id: number;
  project_name: string;
}

export class CentersListResponseDto {
  centers: CenterResponseDto[];
}