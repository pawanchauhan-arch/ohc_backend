import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsOptional } from 'class-validator';
import { AmbulanceStatus } from '../../../common/enum';
import { CreateAmbulanceDto } from './create-ambulance.dto';

export class UpdateAmbulanceDto extends PartialType(CreateAmbulanceDto) {
  @IsOptional()
  @IsEnum(AmbulanceStatus)
  status?: AmbulanceStatus;
}
