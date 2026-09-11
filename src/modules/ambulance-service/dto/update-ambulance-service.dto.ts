import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsOptional } from 'class-validator';
import { ServiceStatus } from '../../../common/enum';
import { CreateAmbulanceServiceDto } from './create-ambulance-service.dto';

export class UpdateAmbulanceServiceDto extends PartialType(
  CreateAmbulanceServiceDto,
) {
  @IsOptional()
  @IsEnum(ServiceStatus)
  status?: ServiceStatus;
}
