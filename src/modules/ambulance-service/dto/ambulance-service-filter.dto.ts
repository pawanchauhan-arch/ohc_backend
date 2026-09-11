import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { PatientType, ServiceStatus } from '../../../common/enum';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class AmbulanceServiceFilterDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID()
  ambulance_id?: string;

  @IsOptional()
  @IsString()
  patient_name?: string;

  @IsOptional()
  @IsString()
  patient_mobile?: string;

  @IsOptional()
  @IsEnum(PatientType)
  patient_type?: PatientType;

  @IsOptional()
  @IsEnum(ServiceStatus)
  status?: ServiceStatus;
}
