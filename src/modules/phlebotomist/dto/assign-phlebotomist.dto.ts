import { IsArray, IsNumber } from 'class-validator';

/**
 * DTO for assigning phlebotomists to a camp
 */
export class AssignPhlebotomistDto {
  @IsArray()
  @IsNumber({}, { each: true })
  phlebotomist_ids: number[];
}
