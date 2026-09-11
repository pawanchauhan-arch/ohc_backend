import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';

/**
 * DTO for barcode upload request
 */
export class BarcodeUploadDto {
  @IsString()
  @IsNotEmpty()
  camp_list_item_id: string;

  @IsString()
  @IsNotEmpty()
  barcode_number: string;

  @IsEnum(['SST', 'EDTA', 'Sodium Fluoride'])
  @IsNotEmpty()
  barcode_name: 'SST' | 'EDTA' | 'Sodium Fluoride';

  @IsString()
  @IsOptional()
  comment?: string;
}

/**
 * Response DTO for barcode upload
 */
export class BarcodeUploadResponseDto {
  success: boolean;
  message: string;
  data: {
    camp_list_item_id: number;
    barcode_id: number;
    barcode_number: string;
    barcode_name: string;
    image_url: string;
    comment?: string;
  };
}
