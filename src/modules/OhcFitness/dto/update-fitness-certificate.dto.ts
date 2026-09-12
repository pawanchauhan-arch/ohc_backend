import { PartialType } from '@nestjs/mapped-types';
import { CreateFitnessCertificateDto } from './create-fitness-certificate.dto';

export class UpdateFitnessCertificateDto extends PartialType(
  CreateFitnessCertificateDto,
) {}
