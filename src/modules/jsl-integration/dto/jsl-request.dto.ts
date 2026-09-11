import { IsNotEmpty, IsString } from 'class-validator';

export class JslRequestDto {
  @IsString()
  @IsNotEmpty()
  Serno!: string;
}


