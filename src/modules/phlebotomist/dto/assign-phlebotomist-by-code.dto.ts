import { IsArray, IsString } from 'class-validator';

/**
 * DTO for assigning phlebotomists to a camp using employee codes
 */
export class AssignPhlebotomistByCodeDto {
  @IsArray()
  @IsString({ each: true })
  employee_codes: string[];
}
